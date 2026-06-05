import { getSupabaseClient } from './client';

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const nombre = parts.shift() || '';
  const apellido = parts.join(' ');

  return { nombre, apellido };
}

async function ensureProductRow(supabase, item) {
  const { data: existingProduct, error: selectError } = await supabase
    .from('productos')
    .select('id')
    .eq('nombre', item.name)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingProduct?.id) {
    return existingProduct.id;
  }

  throw new Error(`El producto "${item.name}" no esta disponible para compra en este momento.`);
}

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

  const { nombre, apellido } = splitFullName(formState.fullName);

  const { error: profileError } = await supabase
    .from('usuarios')
    .upsert(
      {
        id: user.id,
        email: formState.email || user.email,
        nombre,
        apellido,
        direccion: [formState.address, formState.province].filter(Boolean).join(', '),
        telefono: formState.phone
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    throw profileError;
  }

  const { data: order, error: orderError } = await supabase
    .from('ordenes')
    .insert({
      usuario_id: user.id,
      total: totalPrice,
      estado: 'pendiente',
      metodo_pago: 'a coordinar',
      referencia_pago: `525-${Date.now().toString().slice(-6)}`
    })
    .select('id, referencia_pago')
    .single();

  if (orderError) {
    throw orderError;
  }

  const details = [];

  for (const item of cartItems) {
    const productoId = await ensureProductRow(supabase, item);

    details.push({
      orden_id: order.id,
      producto_id: productoId,
      cantidad: item.quantity,
      precio_unitario: item.price
    });
  }

  const { error: detailsError } = await supabase
    .from('detalles_orden')
    .insert(details);

  if (detailsError) {
    throw detailsError;
  }

  return order;
}
