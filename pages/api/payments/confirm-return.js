import { getSupabaseAdminClient } from '../../../lib/supabase/server';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

function mapOrderStatus(paymentStatus) {
  if (paymentStatus === 'approved') {
    return 'pagada';
  }

  if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(paymentStatus)) {
    return 'cancelada';
  }

  return 'pendiente';
}

async function updatePaymentFromMercadoPago({ accessToken, supabase, paymentId, fallbackOrderId }) {
  const paymentResponse = await fetch(`${MERCADO_PAGO_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payment = await paymentResponse.json();

  if (!paymentResponse.ok) {
    return {
      ok: false,
      status: 502,
      body: { error: 'No pudimos consultar el pago en Mercado Pago.' }
    };
  }

  const orderId = payment.external_reference || payment.metadata?.order_id || fallbackOrderId;

  if (!orderId) {
    return {
      ok: false,
      status: 400,
      body: { error: 'Mercado Pago no devolvió una orden asociada.' }
    };
  }

  const orderStatus = mapOrderStatus(payment.status);
  const paymentStatus = payment.status_detail || payment.status || 'unknown';
  const approvedAt = payment.status === 'approved' ? new Date().toISOString() : null;

  await supabase
    .from('ordenes')
    .update({
      estado: orderStatus,
      mercadopago_payment_id: String(payment.id),
      mercadopago_status: paymentStatus,
      pagado_en: approvedAt
    })
    .eq('id', orderId);

  await supabase
    .from('pagos')
    .upsert(
      {
        orden_id: Number(orderId),
        proveedor: 'mercadopago',
        preference_id: payment.preference_id || null,
        payment_id: String(payment.id),
        estado: paymentStatus,
        monto: Number(payment.transaction_amount || 0),
        raw_payload: payment
      },
      { onConflict: 'payment_id' }
    );

  return {
    ok: true,
    status: 200,
    body: {
      received: true,
      orderId: Number(orderId),
      orderStatus,
      paymentStatus
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo no permitido.' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const supabase = getSupabaseAdminClient();

  if (!accessToken || !supabase) {
    return res.status(501).json({ error: 'Pagos no configurados.' });
  }

  const { orderId, paymentId } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: 'Falta el ID de la orden.' });
  }

  if (!paymentId || paymentId === 'null') {
    return res.status(200).json({
      received: true,
      orderStatus: 'pendiente',
      paymentStatus: 'waiting_webhook'
    });
  }

  const result = await updatePaymentFromMercadoPago({
    accessToken,
    supabase,
    paymentId,
    fallbackOrderId: orderId
  });

  return res.status(result.status).json(result.body);
}
