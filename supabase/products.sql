create table if not exists public.products (
  id text primary key,
  name text not null,
  price integer not null,
  image text not null,
  alt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products
for select
to anon, authenticated
using (true);

insert into public.products (id, name, price, image, alt, sort_order)
values
  ('mesa-bmw', 'Mesa BMW', 452000, '/assets/productos/mesa-bmw.png', 'Mesa BMW', 1),
  ('reloj-mclaren', 'Reloj McLaren', 150000, '/assets/productos/reloj-mclaren.png', 'Reloj McLaren', 2),
  ('porta-cepillos-v10', 'Porta Cepillos V10', 50500, '/assets/productos/porta-cepillos-v10.png', 'Porta Cepillos V10', 3),
  ('lampara-ciguenal', 'Lámpara Cigüeñal', 68000, '/assets/productos/lampara-ciguenal.png', 'Lámpara Cigüeñal', 4)
on conflict (id) do update
set
  name = excluded.name,
  price = excluded.price,
  image = excluded.image,
  alt = excluded.alt,
  sort_order = excluded.sort_order;
