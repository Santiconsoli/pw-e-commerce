-- Preparacion para transacciones de checkout y Mercado Pago.
-- Ejecutar desde Supabase SQL Editor.

-- 1. Columnas de seguimiento de pago en ordenes.
alter table public.ordenes
add column if not exists mercadopago_preference_id varchar(255),
add column if not exists mercadopago_payment_id varchar(255),
add column if not exists mercadopago_status varchar(80),
add column if not exists mercadopago_checkout_url text;

create index if not exists idx_ordenes_mp_preference
on public.ordenes (mercadopago_preference_id);

create index if not exists idx_ordenes_mp_payment
on public.ordenes (mercadopago_payment_id);

-- 2. Tabla de pagos/transacciones.
create table if not exists public.pagos (
  id bigint primary key generated always as identity,
  orden_id bigint not null references public.ordenes(id) on delete cascade,
  proveedor varchar(50) not null default 'mercadopago',
  preference_id varchar(255),
  payment_id varchar(255),
  estado varchar(80) not null default 'pendiente',
  monto decimal(10, 2) not null default 0 check (monto >= 0),
  raw_payload jsonb,
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create index if not exists idx_pagos_orden_id
on public.pagos (orden_id);

create unique index if not exists idx_pagos_payment_id_unique
on public.pagos (payment_id)
where payment_id is not null;

drop trigger if exists trg_pagos_actualizado_en on public.pagos;
create trigger trg_pagos_actualizado_en
before update on public.pagos
for each row
execute function public.set_actualizado_en();

alter table public.pagos enable row level security;

-- Clientes ven solo pagos de sus propias ordenes.
drop policy if exists "Clientes ven pagos propios" on public.pagos;
create policy "Clientes ven pagos propios"
on public.pagos
for select
to authenticated
using (
  exists (
    select 1
    from public.ordenes o
    where o.id = pagos.orden_id
      and o.usuario_id = auth.uid()
  )
);

-- Admins ven y gestionan todos los pagos.
drop policy if exists "Admins gestionan pagos" on public.pagos;
create policy "Admins gestionan pagos"
on public.pagos
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

-- 3. Funcion transaccional para crear orden y detalles con precios reales de la base.
drop function if exists public.crear_orden_checkout(text, text, text, text, text, text, jsonb);

create or replace function public.crear_orden_checkout(
  p_full_name text,
  p_email text,
  p_phone text,
  p_province text,
  p_address text,
  p_notes text,
  p_items jsonb
)
returns table (
  orden_id bigint,
  referencia_pago varchar,
  total decimal(10, 2)
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name_parts text[];
  v_nombre varchar(120);
  v_apellido varchar(120);
  v_order_id bigint;
  v_reference varchar(255);
  v_total decimal(10, 2) := 0;
  v_item jsonb;
  v_product_id bigint;
  v_product_nombre text;
  v_product_price decimal(10, 2);
  v_quantity int;
begin
  if v_user_id is null then
    raise exception 'Necesitas iniciar sesion para finalizar tu pedido.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu Garage esta vacio.';
  end if;

  v_name_parts := regexp_split_to_array(trim(coalesce(p_full_name, '')), '\s+');
  v_nombre := coalesce(v_name_parts[1], '');
  v_apellido := trim(regexp_replace(trim(coalesce(p_full_name, '')), '^\S+\s*', ''));

  insert into public.usuarios (
    id,
    email,
    nombre,
    apellido,
    direccion,
    telefono
  )
  values (
    v_user_id,
    p_email,
    v_nombre,
    v_apellido,
    concat_ws(', ', nullif(trim(coalesce(p_address, '')), ''), nullif(trim(coalesce(p_province, '')), '')),
    p_phone
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nombre = excluded.nombre,
    apellido = excluded.apellido,
    direccion = excluded.direccion,
    telefono = excluded.telefono;

  v_reference := '525-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into public.ordenes (
    usuario_id,
    total,
    estado,
    metodo_pago,
    referencia_pago
  )
  values (
    v_user_id,
    0,
    'pendiente',
    'mercadopago',
    v_reference
  )
  returning public.ordenes.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    v_product_id := null;
    v_product_nombre := null;
    v_product_price := null;

    if coalesce(v_item->>'id', '') ~ '^\d+$' then
      select p.id, p.nombre, p.precio
      into v_product_id, v_product_nombre, v_product_price
      from public.productos p
      where p.id = (v_item->>'id')::bigint;
    end if;

    if v_product_id is null and coalesce(v_item->>'name', '') <> '' then
      select p.id, p.nombre, p.precio
      into v_product_id, v_product_nombre, v_product_price
      from public.productos p
      where p.nombre = v_item->>'name';
    end if;

    if v_product_id is null then
      raise exception 'Uno de los productos ya no esta disponible.';
    end if;

    insert into public.detalles_orden (
      orden_id,
      producto_id,
      cantidad,
      precio_unitario
    )
    values (
      v_order_id,
      v_product_id,
      v_quantity,
      v_product_price
    );

    v_total := v_total + (v_product_price * v_quantity);
  end loop;

  update public.ordenes
  set total = v_total
  where public.ordenes.id = v_order_id;

  return query
  select v_order_id, v_reference, v_total;
end;
$$;

grant execute on function public.crear_orden_checkout(text, text, text, text, text, text, jsonb) to authenticated;
