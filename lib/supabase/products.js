import { getSupabaseClient } from './client';

export async function getProductsFromSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, image, alt, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  return {
    data: data.map(({ sort_order, ...product }) => product),
    error: null
  };
}
