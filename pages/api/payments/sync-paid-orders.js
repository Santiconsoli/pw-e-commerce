import { getSupabaseAdminClient } from '../../../lib/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo no permitido.' });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return res.status(501).json({ error: 'Supabase no esta configurado en el servidor.' });
  }

  const { data: paidOrders, error: ordersError } = await supabase
    .from('ordenes')
    .select('id, total, mercadopago_payment_id, mercadopago_preference_id, mercadopago_status')
    .eq('estado', 'pagada')
    .not('mercadopago_payment_id', 'is', null);

  if (ordersError) {
    return res.status(500).json({ error: 'No pudimos leer las ordenes pagadas.' });
  }

  const updates = await Promise.all(
    (paidOrders || []).map((order) =>
      supabase
        .from('pagos')
        .update({
          payment_id: order.mercadopago_payment_id,
          preference_id: order.mercadopago_preference_id,
          estado: order.mercadopago_status || 'approved',
          monto: Number(order.total || 0)
        })
        .eq('orden_id', order.id)
        .select('id')
    )
  );

  const updatedCount = updates.reduce((sum, update) => sum + (update.data?.length || 0), 0);

  return res.status(200).json({
    received: true,
    paidOrders: paidOrders?.length || 0,
    updatedPayments: updatedCount
  });
}
