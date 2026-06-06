-- Configura el usuario administrador y refuerza RLS.
-- Ejecutar desde Supabase SQL Editor.
--
-- Si tenes mas de un usuario, completa el email del admin:
-- target_admin_email varchar := 'admin@email.com';

do $$
declare
  target_admin_email varchar := null;
  target_admin_id uuid;
  users_count int;
begin
  select count(*)
  into users_count
  from public.usuarios;

  if users_count = 0 then
    raise exception 'No hay usuarios en public.usuarios. Crea una cuenta primero.';
  end if;

  if target_admin_email is null then
    if users_count > 1 then
      raise exception 'Hay mas de un usuario. Completa target_admin_email con el email del admin.';
    end if;

    select id
    into target_admin_id
    from public.usuarios
    limit 1;
  else
    select id
    into target_admin_id
    from public.usuarios
    where email = target_admin_email
    limit 1;
  end if;

  if target_admin_id is null then
    raise exception 'No se encontro el usuario admin indicado.';
  end if;

  update public.usuarios
  set rol = 'cliente'
  where id <> target_admin_id;

  update public.usuarios
  set rol = 'admin'
  where id = target_admin_id;

  raise notice 'Usuario % configurado como admin.', target_admin_id;
end $$;

-- ORDENES: clientes solo pueden crear ordenes propias en estado pendiente.
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

-- DETALLES: clientes solo pueden agregar detalles a ordenes propias pendientes.
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
