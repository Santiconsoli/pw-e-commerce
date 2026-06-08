-- Permite crear ordenes manuales para clientes sin cuenta.
-- Ejecutar desde Supabase SQL Editor antes de usar la carga manual sin usuario.

alter table public.ordenes
alter column usuario_id drop not null;

alter table public.ordenes
add column if not exists cliente_nombre varchar(180),
add column if not exists cliente_email varchar(255);

create index if not exists idx_ordenes_cliente_email
on public.ordenes (cliente_email);
