import { getSupabaseClient } from './client';

export async function getProductsFromSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, imagen_url, descripcion, categoria')
    .eq('categoria', '525hp')
    .order('id', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  return {
    data: data.map((product) => ({
      id: product.id,
      name: product.nombre,
      price: Number(product.precio),
      stock: Number(product.stock || 0),
      image: product.imagen_url,
      alt: product.descripcion || product.nombre
    })),
    error: null
  };
}

export async function syncCartItemsWithSupabase(cartItems) {
  if (!cartItems.length) {
    return { data: cartItems, error: null };
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: cartItems, error: null };
  }

  const names = [...new Set(cartItems.map((item) => item.name))];

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, imagen_url, descripcion')
    .in('nombre', names);

  if (error) {
    return { data: cartItems, error };
  }

  const productsByName = new Map(data.map((product) => [product.nombre, product]));

  return {
    data: cartItems.map((item) => {
      const latestProduct = productsByName.get(item.name);

      if (!latestProduct) {
        return item;
      }

      return {
        ...item,
        id: latestProduct.id,
        price: Number(latestProduct.precio),
        stock: Number(latestProduct.stock || 0),
        image: latestProduct.imagen_url || item.image,
        alt: latestProduct.descripcion || item.alt
      };
    }),
    error: null
  };
}
