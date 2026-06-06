const MERCADO_PAGO_API = 'https://api.mercadopago.com';

export function mapOrderStatus(paymentStatus) {
  if (paymentStatus === 'approved') {
    return 'pagada';
  }

  if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(paymentStatus)) {
    return 'cancelada';
  }

  return 'pendiente';
}

async function fetchMercadoPagoJson(path, accessToken) {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'No pudimos consultar Mercado Pago.');
  }

  return data;
}

export async function getMercadoPagoPayment(accessToken, paymentId) {
  return fetchMercadoPagoJson(`/v1/payments/${paymentId}`, accessToken);
}

export async function getPaymentFromMerchantOrder(accessToken, merchantOrderId) {
  const merchantOrder = await fetchMercadoPagoJson(`/merchant_orders/${merchantOrderId}`, accessToken);
  const paymentSummary = merchantOrder.payments?.find((payment) => payment.status === 'approved') ||
    merchantOrder.payments?.[0];

  if (!paymentSummary?.id) {
    return {
      payment: null,
      fallbackOrderId: merchantOrder.external_reference || null
    };
  }

  return {
    payment: await getMercadoPagoPayment(accessToken, paymentSummary.id),
    fallbackOrderId: merchantOrder.external_reference || null
  };
}

export async function getPaymentFromPreference(accessToken, preferenceId) {
  const searchParams = new URLSearchParams({ preference_id: preferenceId });
  const searchResult = await fetchMercadoPagoJson(`/merchant_orders/search?${searchParams}`, accessToken);
  const merchantOrder = searchResult.elements?.[0];

  if (!merchantOrder?.id) {
    return {
      payment: null,
      fallbackOrderId: null
    };
  }

  return getPaymentFromMerchantOrder(accessToken, merchantOrder.id);
}

export async function updateSupabasePayment({ supabase, payment, fallbackOrderId }) {
  const orderId = payment.external_reference || payment.metadata?.order_id || fallbackOrderId;

  if (!orderId) {
    return {
      orderId: null,
      orderStatus: null,
      paymentStatus: null
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

  const paymentPayload = {
    orden_id: Number(orderId),
    proveedor: 'mercadopago',
    preference_id: payment.preference_id || null,
    payment_id: String(payment.id),
    estado: paymentStatus,
    monto: Number(payment.transaction_amount || 0),
    raw_payload: payment
  };

  const { data: updatedRows } = await supabase
    .from('pagos')
    .update(paymentPayload)
    .eq('orden_id', Number(orderId))
    .select('id');

  if (!updatedRows?.length) {
    await supabase
      .from('pagos')
      .upsert(paymentPayload, { onConflict: 'payment_id' });
  }

  return {
    orderId: Number(orderId),
    orderStatus,
    paymentStatus
  };
}
