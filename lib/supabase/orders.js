import { getSupabaseClient } from './client';

export async function createCheckoutOrder({ cartItems, formState, totalPrice }) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('El sistema de pedidos no esta disponible por el momento.');
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('Necesitas iniciar sesion para finalizar tu pedido.');
  }

  const { data: order, error: orderError } = await supabase
    .rpc('crear_orden_checkout', {
      p_full_name: formState.fullName,
      p_email: formState.email || user.email,
      p_phone: formState.phone,
      p_province: formState.province,
      p_address: formState.address,
      p_notes: formState.notes || '',
      p_items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
      }))
    })
    .single();

  if (orderError) {
    throw orderError;
  }

  return {
    ...order,
    id: order.orden_id || order.id,
    total: Number(order.total || totalPrice)
  };
}
