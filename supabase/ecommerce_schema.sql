-- Script unificado para e-commerce en Supabase / PostgreSQL.
-- Ejecutar desde Supabase SQL Editor.

-- 1. Tipo ENUM para estados de orden
do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_orden') then
    create type public.estado_orden as enum (
      'pendiente',
      'pagada',
      'enviada',
      'entregada',
      'cancelada'
    );
  end if;
end $$;

-- 2. Tabla productos
create table if not exists public.productos (
  id bigint primary key generated always as identity,
  nombre varchar(255) not null,
  descripcion text,
  precio decimal(10, 2) not null check (precio >= 0),
  stock int default 0 check (stock >= 0),
  imagen_url varchar(500),
  categoria varchar(100),
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create index if not exists idx_productos_categoria
on public.productos (categoria);

create unique index if not exists idx_productos_nombre_unique
on public.productos (nombre);

-- Mantiene actualizado el campo actualizado_en.
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_productos_actualizado_en on public.productos;
create trigger trg_productos_actualizado_en
before update on public.productos
for each row
execute function public.set_actualizado_en();

insert into public.productos (nombre, descripcion, precio, stock, imagen_url, categoria)
select nombre, descripcion, precio, stock, imagen_url, categoria
from (
  values
    ('Mesa BMW', 'Mesa BMW', 452000.00, 10, '/assets/productos/mesa-bmw.png', '525hp'),
    ('Reloj McLaren', 'Reloj McLaren', 150000.00, 10, '/assets/productos/reloj-mclaren.png', '525hp'),
    ('Porta Cepillos V10', 'Porta Cepillos V10', 50500.00, 10, '/assets/productos/porta-cepillos-v10.png', '525hp'),
    ('Lámpara Cigüeñal', 'Lampara Ciguenal', 68000.00, 10, '/assets/productos/lampara-ciguenal.png', '525hp')
) as nuevos_productos(nombre, descripcion, precio, stock, imagen_url, categoria)
where not exists (
  select 1
  from public.productos p
  where p.nombre = nuevos_productos.nombre
);

-- 3. Tabla usuarios vinculada a Supabase Auth
create table if not exists public.usuarios (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  email varchar(255),
  nombre varchar(120),
  apellido varchar(120),
  direccion text,
  telefono varchar(50),
  rol varchar(50) not null default 'cliente',
  creado_en timestamp not null default now(),
  constraint usuarios_rol_check check (rol in ('cliente', 'admin'))
);

create index if not exists idx_usuarios_rol
on public.usuarios (rol);

-- Funcion helper para politicas de administrador.
-- SECURITY DEFINER evita problemas de recursion al consultar usuarios desde RLS.
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
      and rol = 'admin'
  );
$$;

-- Evita que un cliente se asigne rol admin desde el frontend.
create or replace function public.proteger_rol_usuario()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.rol is distinct from 'cliente' and not public.es_admin() then
      raise exception 'No tenes permisos para asignar este rol.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.rol is distinct from old.rol and not public.es_admin() then
      raise exception 'No tenes permisos para modificar el rol.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_rol_usuario on public.usuarios;
create trigger trg_proteger_rol_usuario
before insert or update on public.usuarios
for each row
execute function public.proteger_rol_usuario();

-- 4. Tabla carrito
create table if not exists public.carrito (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  producto_id bigint not null references public.productos(id) on delete cascade,
  cantidad int not null default 1 check (cantidad > 0),
  creado_en timestamp not null default now(),
  constraint carrito_usuario_producto_unique unique (usuario_id, producto_id)
);

create index if not exists idx_carrito_usuario_id
on public.carrito (usuario_id);

create index if not exists idx_carrito_producto_id
on public.carrito (producto_id);

-- 5. Tabla ordenes
create table if not exists public.ordenes (
  id bigint primary key generated always as identity,
  usuario_id uuid references auth.users(id) on delete cascade,
  cliente_nombre varchar(180),
  cliente_email varchar(255),
  total decimal(10, 2) not null default 0 check (total >= 0),
  estado public.estado_orden not null default 'pendiente',
  metodo_pago varchar(50),
  referencia_pago varchar(255),
  pagado_en timestamp,
  stock_descontado boolean not null default false,
  creado_en timestamp not null default now()
);

create index if not exists idx_ordenes_usuario_id
on public.ordenes (usuario_id);

create index if not exists idx_ordenes_cliente_email
on public.ordenes (cliente_email);

create index if not exists idx_ordenes_estado
on public.ordenes (estado);

create index if not exists idx_ordenes_creado_en
on public.ordenes (creado_en);

-- Detalle de orden: necesario para relacionar ordenes con productos comprados.
create table if not exists public.detalles_orden (
  id bigint primary key generated always as identity,
  orden_id bigint not null references public.ordenes(id) on delete cascade,
  producto_id bigint not null references public.productos(id) on delete restrict,
  cantidad int not null check (cantidad > 0),
  precio_unitario decimal(10, 2) not null check (precio_unitario >= 0),
  subtotal decimal(10, 2) generated always as (cantidad * precio_unitario) stored,
  creado_en timestamp not null default now()
);

create index if not exists idx_detalles_orden_orden_id
on public.detalles_orden (orden_id);

create index if not exists idx_detalles_orden_producto_id
on public.detalles_orden (producto_id);

-- Gestion automatica de stock por orden.
create or replace function public.descontar_stock_orden(p_orden_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_has_details boolean;
  v_missing record;
begin
  select id, estado, stock_descontado
  into v_order
  from public.ordenes
  where id = p_orden_id
  for update;

  if not found
    or v_order.stock_descontado
    or v_order.estado::text not in ('pagada', 'enviada', 'entregada') then
    return;
  end if;

  select exists (
    select 1
    from public.detalles_orden
    where orden_id = p_orden_id
  )
  into v_has_details;

  if not v_has_details then
    return;
  end if;

  select p.nombre, p.stock, sum(d.cantidad)::int as cantidad_requerida
  into v_missing
  from public.detalles_orden d
  join public.productos p on p.id = d.producto_id
  where d.orden_id = p_orden_id
  group by p.id, p.nombre, p.stock
  having p.stock < sum(d.cantidad)
  limit 1;

  if found then
    raise exception 'Stock insuficiente para %. Stock actual: %, requerido: %.',
      v_missing.nombre,
      v_missing.stock,
      v_missing.cantidad_requerida;
  end if;

  update public.productos p
  set stock = p.stock - items.cantidad
  from (
    select producto_id, sum(cantidad)::int as cantidad
    from public.detalles_orden
    where orden_id = p_orden_id
    group by producto_id
  ) items
  where p.id = items.producto_id;

  update public.ordenes
  set stock_descontado = true
  where id = p_orden_id;
end;
$$;

create or replace function public.reponer_stock_orden(p_orden_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_descontado boolean;
begin
  select stock_descontado
  into v_stock_descontado
  from public.ordenes
  where id = p_orden_id
  for update;

  if not found or not v_stock_descontado then
    return;
  end if;

  update public.productos p
  set stock = p.stock + items.cantidad
  from (
    select producto_id, sum(cantidad)::int as cantidad
    from public.detalles_orden
    where orden_id = p_orden_id
    group by producto_id
  ) items
  where p.id = items.producto_id;

  update public.ordenes
  set stock_descontado = false
  where id = p_orden_id;
end;
$$;

create or replace function public.gestionar_stock_por_estado_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.estado::text in ('pagada', 'enviada', 'entregada') then
      perform public.descontar_stock_orden(new.id);
    end if;

    return new;
  end if;

  if old.stock_descontado and new.estado::text not in ('pagada', 'enviada', 'entregada') then
    perform public.reponer_stock_orden(new.id);
  end if;

  if not old.stock_descontado and new.estado::text in ('pagada', 'enviada', 'entregada') then
    perform public.descontar_stock_orden(new.id);
  end if;

  return new;
end;
$$;

create or replace function public.gestionar_stock_por_detalle_orden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden_id bigint := coalesce(new.orden_id, old.orden_id);
  v_estado text;
  v_stock_descontado boolean;
begin
  select estado::text, stock_descontado
  into v_estado, v_stock_descontado
  from public.ordenes
  where id = v_orden_id;

  if v_estado not in ('pagada', 'enviada', 'entregada') then
    return null;
  end if;

  if v_stock_descontado then
    perform public.reponer_stock_orden(v_orden_id);
  end if;

  perform public.descontar_stock_orden(v_orden_id);

  return null;
end;
$$;

drop trigger if exists trg_ordenes_gestionar_stock on public.ordenes;
create trigger trg_ordenes_gestionar_stock
after insert or update of estado
on public.ordenes
for each row
execute function public.gestionar_stock_por_estado_orden();

drop trigger if exists trg_detalles_orden_gestionar_stock on public.detalles_orden;
create trigger trg_detalles_orden_gestionar_stock
after insert or update or delete
on public.detalles_orden
for each row
execute function public.gestionar_stock_por_detalle_orden();

-- 6. Habilitar Row Level Security
alter table public.productos enable row level security;
alter table public.usuarios enable row level security;
alter table public.carrito enable row level security;
alter table public.ordenes enable row level security;
alter table public.detalles_orden enable row level security;

-- 7. Politicas RLS

-- PRODUCTOS: el catalogo se puede leer publicamente, pero solo admins lo modifican.
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

-- USUARIOS: cada usuario ve y actualiza solo su perfil.
drop policy if exists "Usuarios ven su propio perfil" on public.usuarios;
create policy "Usuarios ven su propio perfil"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Usuarios crean su propio perfil" on public.usuarios;
create policy "Usuarios crean su propio perfil"
on public.usuarios
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Usuarios actualizan su propio perfil" on public.usuarios;
create policy "Usuarios actualizan su propio perfil"
on public.usuarios
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admin sobre usuarios: permite consultar y administrar perfiles.
drop policy if exists "Admins gestionan usuarios" on public.usuarios;
create policy "Admins gestionan usuarios"
on public.usuarios
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

-- CARRITO: cada usuario gestiona solo su carrito.
drop policy if exists "Usuarios ven su carrito" on public.carrito;
create policy "Usuarios ven su carrito"
on public.carrito
for select
to authenticated
using (auth.uid() = usuario_id);

drop policy if exists "Usuarios agregan a su carrito" on public.carrito;
create policy "Usuarios agregan a su carrito"
on public.carrito
for insert
to authenticated
with check (auth.uid() = usuario_id);

drop policy if exists "Usuarios actualizan su carrito" on public.carrito;
create policy "Usuarios actualizan su carrito"
on public.carrito
for update
to authenticated
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);

drop policy if exists "Usuarios eliminan de su carrito" on public.carrito;
create policy "Usuarios eliminan de su carrito"
on public.carrito
for delete
to authenticated
using (auth.uid() = usuario_id);

-- ORDENES: clientes ven/crean sus ordenes; admins gestionan todas.
drop policy if exists "Clientes ven sus ordenes" on public.ordenes;
create policy "Clientes ven sus ordenes"
on public.ordenes
for select
to authenticated
using (auth.uid() = usuario_id);

drop policy if exists "Clientes crean sus ordenes" on public.ordenes;
create policy "Clientes crean sus ordenes"
on public.ordenes
for insert
to authenticated
with check (
  auth.uid() = usuario_id
  and estado = 'pendiente'
  and pagado_en is null
);

drop policy if exists "Admins ven todas las ordenes" on public.ordenes;
create policy "Admins ven todas las ordenes"
on public.ordenes
for select
to authenticated
using (public.es_admin());

drop policy if exists "Admins crean cualquier orden" on public.ordenes;
create policy "Admins crean cualquier orden"
on public.ordenes
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "Admins actualizan cualquier orden" on public.ordenes;
create policy "Admins actualizan cualquier orden"
on public.ordenes
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

-- DETALLES DE ORDEN: clientes ven/crean detalles de sus ordenes; admins gestionan todos.
drop policy if exists "Clientes ven detalles de sus ordenes" on public.detalles_orden;
create policy "Clientes ven detalles de sus ordenes"
on public.detalles_orden
for select
to authenticated
using (
  exists (
    select 1
    from public.ordenes o
    where o.id = detalles_orden.orden_id
      and o.usuario_id = auth.uid()
  )
);

drop policy if exists "Clientes crean detalles de sus ordenes" on public.detalles_orden;
create policy "Clientes crean detalles de sus ordenes"
on public.detalles_orden
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ordenes o
    where o.id = detalles_orden.orden_id
      and o.usuario_id = auth.uid()
      and o.estado = 'pendiente'
  )
);

drop policy if exists "Admins ven todos los detalles" on public.detalles_orden;
create policy "Admins ven todos los detalles"
on public.detalles_orden
for select
to authenticated
using (public.es_admin());

drop policy if exists "Admins crean cualquier detalle" on public.detalles_orden;
create policy "Admins crean cualquier detalle"
on public.detalles_orden
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "Admins actualizan cualquier detalle" on public.detalles_orden;
create policy "Admins actualizan cualquier detalle"
on public.detalles_orden
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());
