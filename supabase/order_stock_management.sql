-- Gestion automatica de stock por orden.
-- Ejecutar desde Supabase SQL Editor.
--
-- Criterio:
-- - No descuenta stock cuando la orden esta "pendiente".
-- - Descuenta una sola vez cuando la orden pasa a "pagada", "enviada" o "entregada".
-- - Repone stock si una orden ya descontada pasa a "cancelada" o vuelve a un estado no pagado.
-- - Evita stock negativo con una excepcion clara.
-- - Si se edita una linea de una orden ya descontada, ajusta stock por diferencia.
-- - Si una orden pagada quedo vieja con stock_descontado = false, la reconcilia al editarla.

alter table public.ordenes
add column if not exists stock_descontado boolean not null default false;

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
  v_delta int;
  v_available_stock int;
  v_product_name text;
begin
  select estado::text, stock_descontado
  into v_estado, v_stock_descontado
  from public.ordenes
  where id = v_orden_id;

  if v_estado not in ('pagada', 'enviada', 'entregada') then
    return null;
  end if;

  if not v_stock_descontado then
    perform public.descontar_stock_orden(v_orden_id);
    return null;
  end if;

  if tg_op = 'INSERT' then
    select stock, nombre
    into v_available_stock, v_product_name
    from public.productos
    where id = new.producto_id
    for update;

    if v_available_stock < new.cantidad then
      raise exception 'Stock insuficiente para %. Stock actual: %, requerido: %.',
        v_product_name,
        v_available_stock,
        new.cantidad;
    end if;

    update public.productos
    set stock = stock - new.cantidad
    where id = new.producto_id;

    return null;
  end if;

  if tg_op = 'DELETE' then
    update public.productos
    set stock = stock + old.cantidad
    where id = old.producto_id;

    return null;
  end if;

  if old.producto_id = new.producto_id then
    v_delta := new.cantidad - old.cantidad;

    if v_delta > 0 then
      select stock, nombre
      into v_available_stock, v_product_name
      from public.productos
      where id = new.producto_id
      for update;

      if v_available_stock < v_delta then
        raise exception 'Stock insuficiente para %. Stock actual: %, requerido adicional: %.',
          v_product_name,
          v_available_stock,
          v_delta;
      end if;

      update public.productos
      set stock = stock - v_delta
      where id = new.producto_id;
    elsif v_delta < 0 then
      update public.productos
      set stock = stock + abs(v_delta)
      where id = new.producto_id;
    end if;

    return null;
  end if;

  update public.productos
  set stock = stock + old.cantidad
  where id = old.producto_id;

  select stock, nombre
  into v_available_stock, v_product_name
  from public.productos
  where id = new.producto_id
  for update;

  if v_available_stock < new.cantidad then
    raise exception 'Stock insuficiente para %. Stock actual: %, requerido: %.',
      v_product_name,
      v_available_stock,
      new.cantidad;
  end if;

  update public.productos
  set stock = stock - new.cantidad
  where id = new.producto_id;

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
