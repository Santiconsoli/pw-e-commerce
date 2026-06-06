import { getSupabaseAdminClient } from '../../../lib/supabase/server';
import crypto from 'crypto';
import {
  getMercadoPagoPayment,
  getPaymentFromMerchantOrder,
  updateSupabasePayment
} from '../../../lib/mercadopago/payments';

function getPaymentId(req) {
  const notificationType = req.query.topic || req.query.type || req.body?.type;

  if (notificationType === 'merchant_order') {
    return null;
  }

  return (
    req.query['data.id'] ||
    req.query.id ||
    req.body?.data?.id ||
    req.body?.id ||
    null
  );
}

function getMerchantOrderId(req) {
  const notificationType = req.query.topic || req.query.type || req.body?.type;

  if (notificationType === 'merchant_order') {
    return req.query.id || req.body?.data?.id || req.body?.id || null;
  }

  return (
    req.query.merchant_order_id ||
    req.body?.merchant_order_id ||
    null
  );
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
  const merchantOrderId = getMerchantOrderId(req);

  if (!paymentId && !merchantOrderId) {
    return res.status(200).json({ received: true });
  }

  if (paymentId && !isValidMercadoPagoSignature(req, paymentId)) {
    return res.status(401).json({ error: 'Firma de webhook invalida.' });
  }

  try {
    const paymentResult = paymentId
      ? {
          payment: await getMercadoPagoPayment(accessToken, paymentId),
          fallbackOrderId: null
        }
      : await getPaymentFromMerchantOrder(accessToken, merchantOrderId);

    if (!paymentResult.payment) {
      return res.status(200).json({ received: true, ignored: 'Orden de Mercado Pago sin pago asociado todavia.' });
    }

    const updatedPayment = await updateSupabasePayment({
      supabase,
      payment: paymentResult.payment,
      fallbackOrderId: paymentResult.fallbackOrderId
    });

    return res.status(200).json({ received: true, ...updatedPayment });
  } catch (error) {
    console.error('Mercado Pago webhook sync failed:', error);
    return res.status(502).json({ error: 'No pudimos sincronizar el pago.' });
  }
}
