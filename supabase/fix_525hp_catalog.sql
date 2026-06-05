-- Arreglo puntual del catalogo 525hp.
-- Ejecutar una vez desde Supabase SQL Editor.

-- 1. Eliminar productos de prueba que no pertenecen a 525hp.
delete from public.productos
where nombre in ('Remera', 'Pantalón', 'Zapatos', 'Gorra');

-- 2. Evitar productos duplicados por nombre.
create unique index if not exists idx_productos_nombre_unique
on public.productos (nombre);

-- 3. Cargar o actualizar los productos reales de la tienda.
insert into public.productos (nombre, descripcion, precio, stock, imagen_url, categoria)
values
  ('Mesa BMW', 'Mesa BMW', 452000.00, 10, '/assets/productos/mesa-bmw.png', '525hp'),
  ('Reloj McLaren', 'Reloj McLaren', 150000.00, 10, '/assets/productos/reloj-mclaren.png', '525hp'),
  ('Porta Cepillos V10', 'Porta Cepillos V10', 50500.00, 10, '/assets/productos/porta-cepillos-v10.png', '525hp'),
  ('Lámpara Cigüeñal', 'Lampara Ciguenal', 68000.00, 10, '/assets/productos/lampara-ciguenal.png', '525hp')
on conflict (nombre) do update
set
  descripcion = excluded.descripcion,
  precio = excluded.precio,
  stock = excluded.stock,
  imagen_url = excluded.imagen_url,
  categoria = excluded.categoria,
  actualizado_en = now();

-- 4. Asegurar lectura publica del catalogo y escritura solo para admins.
alter table public.productos enable row level security;

drop policy if exists "Publico lee productos" on public.productos;
create policy "Publico lee productos"
on public.productos
for select
to anon, authenticated
using (true);

drop policy if exists "Admins crean productos" on public.productos;
create policy "Admins crean productos"
on public.productos
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "Admins actualizan productos" on public.productos;
create policy "Admins actualizan productos"
on public.productos
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "Admins eliminan productos" on public.productos;
create policy "Admins eliminan productos"
on public.productos
for delete
to authenticated
using (public.es_admin());
