import { getSupabaseAdminClient } from '../../../lib/supabase/server';
import crypto from 'crypto';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

function getPaymentId(req) {
  return (
    req.query['data.id'] ||
    req.query.id ||
    req.body?.data?.id ||
    req.body?.id ||
    null
  );
}

function mapOrderStatus(paymentStatus) {
  if (paymentStatus === 'approved') {
    return 'pagada';
  }

  if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(paymentStatus)) {
    return 'cancelada';
  }

  return 'pendiente';
}

function parseSignature(signatureHeader = '') {
  return signatureHeader.split(',').reduce((parts, part) => {
    const [key, value] = part.split('=');

    if (key && value) {
      parts[key.trim()] = value.trim();
    }

    return parts;
  }, {});
}

function isValidMercadoPagoSignature(req, paymentId) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const signatureHeader = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  const { ts, v1 } = parseSignature(signatureHeader);

  if (!paymentId || !requestId || !ts || !v1) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const receivedBuffer = Buffer.from(v1, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(req.method)) {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Metodo no permitido.' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const supabase = getSupabaseAdminClient();

  if (!accessToken || !supabase) {
    return res.status(501).json({ error: 'Pagos no configurados.' });
  }

  const paymentId = getPaymentId(req);

  if (!paymentId) {
    return res.status(200).json({ received: true });
  }

  if (!isValidMercadoPagoSignature(req, paymentId)) {
    return res.status(401).json({ error: 'Firma de webhook invalida.' });
  }

  const paymentResponse = await fetch(`${MERCADO_PAGO_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payment = await paymentResponse.json();

  if (!paymentResponse.ok) {
    return res.status(502).json({ error: 'No pudimos consultar el pago.' });
  }

  const orderId = payment.external_reference || payment.metadata?.order_id;

  if (!orderId) {
    return res.status(200).json({ received: true, ignored: 'Sin orden asociada.' });
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

  return res.status(200).json({ received: true });
}
