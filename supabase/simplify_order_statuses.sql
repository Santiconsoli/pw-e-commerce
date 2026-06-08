-- Simplifica los estados de orden removiendo "confirmada".
-- Ejecutar desde Supabase SQL Editor si queres limpiar tambien la base real.
--
-- Flujo final recomendado:
-- pendiente -> pagada -> enviada -> entregada
-- cancelada puede aplicarse cuando la compra se anula.

begin;

-- Estas politicas dependen de ordenes.estado, por eso hay que quitarlas
-- temporalmente antes de cambiar el tipo ENUM de esa columna.
drop policy if exists "Clientes crean detalles de sus ordenes" on public.detalles_orden;
drop policy if exists "Clientes crean sus ordenes" on public.ordenes;

update public.ordenes
set estado = 'pagada'
where estado = 'confirmada';

alter type public.estado_orden rename to estado_orden_old;

create type public.estado_orden as enum (
  'pendiente',
  'pagada',
  'enviada',
  'entregada',
  'cancelada'
);

alter table public.ordenes
alter column estado drop default;

alter table public.ordenes
alter column estado type public.estado_orden
using estado::text::public.estado_orden;

alter table public.ordenes
alter column estado set default 'pendiente';

drop type public.estado_orden_old;

create policy "Clientes crean sus ordenes"
on public.ordenes
for insert
to authenticated
with check (
  auth.uid() = usuario_id
  and estado = 'pendiente'
  and pagado_en is null
);

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

commit;
