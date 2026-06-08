import { getSupabaseAdminClient } from '../../../lib/supabase/server';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

function getSiteUrl(req) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;

  return `${protocol}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo no permitido.' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const supabase = getSupabaseAdminClient();

  if (!accessToken || !supabase) {
    return res.status(501).json({
      error: 'Mercado Pago todavia no esta configurado en el servidor.'
    });
  }

  const { orderId } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: 'Falta el ID de la orden.' });
  }

  const { data: order, error: orderError } = await supabase
    .from('ordenes')
    .select(`
      id,
      total,
      estado,
      referencia_pago,
      detalles_orden (
        cantidad,
        precio_unitario,
        productos (
          id,
          nombre,
          descripcion,
          imagen_url,
          stock
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'No encontramos la orden.' });
  }

  if (order.estado !== 'pendiente') {
    return res.status(409).json({ error: 'La orden ya no esta pendiente de pago.' });
  }

  const unavailableItem = order.detalles_orden.find((detail) =>
    Number(detail.productos?.stock || 0) < Number(detail.cantidad || 0)
  );

  if (unavailableItem) {
    return res.status(409).json({
      error: `No hay stock suficiente para ${unavailableItem.productos?.nombre || 'uno de los productos'}.`
    });
  }

  const siteUrl = getSiteUrl(req);
  const items = order.detalles_orden.map((detail) => ({
    title: detail.productos?.nombre || 'Producto 525hp',
    description: detail.productos?.descripcion || 'Pieza 525hp',
    quantity: detail.cantidad,
    currency_id: 'ARS',
    unit_price: Number(detail.precio_unitario)
  }));

  const preferencePayload = {
    items,
    external_reference: String(order.id),
    metadata: {
      order_id: order.id,
      referencia_pago: order.referencia_pago
    },
    back_urls: {
      success: `${siteUrl}/checkout?payment=success&order=${order.id}`,
      failure: `${siteUrl}/checkout?payment=failure&order=${order.id}`,
      pending: `${siteUrl}/checkout?payment=pending&order=${order.id}`
    },
    notification_url: `${siteUrl}/api/payments/webhook?source_news=webhooks`,
    auto_return: 'approved'
  };

  let preferenceResponse;

  try {
    preferenceResponse = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferencePayload)
    });
  } catch (error) {
    console.error('Mercado Pago preference request failed:', error);

    return res.status(502).json({
      error: 'No pudimos conectar con Mercado Pago. Revisá el Access Token y volvé a intentar.'
    });
  }

  const preference = await preferenceResponse.json();

  if (!preferenceResponse.ok) {
    console.error('Mercado Pago preference error:', preference);

    return res.status(502).json({
      error: 'No pudimos crear la preferencia de pago.',
      detail: preference.message || preference.error || null
    });
  }

  const checkoutUrl = accessToken.startsWith('TEST-')
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point || preference.sandbox_init_point;

  if (!checkoutUrl) {
    console.error('Mercado Pago preference without checkout URL:', preference);

    return res.status(502).json({
      error: 'Mercado Pago creó la preferencia, pero no devolvió una URL de pago.'
    });
  }

  await supabase
    .from('ordenes')
    .update({
      mercadopago_preference_id: preference.id,
      mercadopago_checkout_url: checkoutUrl,
      mercadopago_status: 'preference_created'
    })
    .eq('id', order.id);

  await supabase
    .from('pagos')
    .insert({
      orden_id: order.id,
      preference_id: preference.id,
      estado: 'preference_created',
      monto: Number(order.total),
      raw_payload: preference
    });

  return res.status(200).json({
    preferenceId: preference.id,
    checkoutUrl
  });
}
