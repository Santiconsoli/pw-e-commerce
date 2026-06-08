-- Gestion automatica de stock por orden.
-- Ejecutar desde Supabase SQL Editor.
--
-- Criterio:
-- - No descuenta stock cuando la orden esta "pendiente".
-- - Descuenta una sola vez cuando la orden pasa a "pagada", "enviada" o "entregada".
-- - Repone stock si una orden ya descontada pasa a "cancelada" o vuelve a un estado no pagado.
-- - Evita stock negativo con una excepcion clara.

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
