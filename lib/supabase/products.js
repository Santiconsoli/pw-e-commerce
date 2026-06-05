import { getSupabaseClient } from './client';

export async function getProductsFromSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, imagen_url, descripcion, categoria')
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
      image: product.imagen_url,
      alt: product.descripcion || product.nombre
    })),
    error: null
  };
}
