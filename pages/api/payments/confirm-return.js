import { getSupabaseAdminClient } from '../../../lib/supabase/server';
import {
  getMercadoPagoPayment,
  getPaymentFromMerchantOrder,
  getPaymentFromPreference,
  updateSupabasePayment
} from '../../../lib/mercadopago/payments';

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

  const { orderId, paymentId, merchantOrderId, preferenceId } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: 'Falta el ID de la orden.' });
  }

  if ((!paymentId || paymentId === 'null') && !merchantOrderId && !preferenceId) {
    return res.status(200).json({
      received: true,
      orderStatus: 'pendiente',
      paymentStatus: 'waiting_webhook'
    });
  }

  try {
    let paymentResult = {
      payment: null,
      fallbackOrderId: orderId
    };

    if (paymentId && paymentId !== 'null') {
      paymentResult.payment = await getMercadoPagoPayment(accessToken, paymentId);
    } else if (merchantOrderId) {
      paymentResult = await getPaymentFromMerchantOrder(accessToken, merchantOrderId);
    } else if (preferenceId) {
      paymentResult = await getPaymentFromPreference(accessToken, preferenceId);
    }

    if (!paymentResult.payment) {
      return res.status(200).json({
        received: true,
        orderStatus: 'pendiente',
        paymentStatus: 'waiting_webhook'
      });
    }

    const updatedPayment = await updateSupabasePayment({
      supabase,
      payment: paymentResult.payment,
      fallbackOrderId: paymentResult.fallbackOrderId || orderId
    });

    return res.status(200).json({
      received: true,
      ...updatedPayment
    });
  } catch (error) {
    console.error('Mercado Pago return sync failed:', error);
    return res.status(502).json({ error: 'No pudimos sincronizar el pago.' });
  }
}
