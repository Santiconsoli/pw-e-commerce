-- Corrige visibilidad de ordenes para el panel admin.
-- Ejecutar desde Supabase SQL Editor.
--
-- Sintoma que corrige:
-- El admin solo ve sus propias ordenes, pero no las de otros usuarios
-- ni las ordenes manuales sin usuario_id.

alter table public.ordenes enable row level security;
alter table public.detalles_orden enable row level security;
alter table public.pagos enable row level security;

-- ORDENES
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

drop policy if exists "Admins eliminan cualquier orden" on public.ordenes;
create policy "Admins eliminan cualquier orden"
on public.ordenes
for delete
to authenticated
using (public.es_admin());

-- DETALLES DE ORDEN
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

drop policy if exists "Admins eliminan cualquier detalle" on public.detalles_orden;
create policy "Admins eliminan cualquier detalle"
on public.detalles_orden
for delete
to authenticated
using (public.es_admin());

-- PAGOS
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

drop policy if exists "Admins gestionan pagos" on public.pagos;
create policy "Admins gestionan pagos"
on public.pagos
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());
