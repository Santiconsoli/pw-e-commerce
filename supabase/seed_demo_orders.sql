-- Simula compras anteriores para probar la seccion "Mi cuenta".
-- Ejecutar desde Supabase SQL Editor.
--
-- Por defecto usa el usuario mas reciente de public.usuarios.
-- Si queres apuntar a un email especifico, cambia esta linea:
-- target_email varchar := null;
-- por:
-- target_email varchar := 'cliente@email.com';

do $$
declare
  target_email varchar := null;
  target_user_id uuid;
  order_one_id bigint;
  order_two_id bigint;
  mesa_id bigint;
  reloj_id bigint;
  lampara_id bigint;
  mesa_price decimal(10, 2);
  reloj_price decimal(10, 2);
  lampara_price decimal(10, 2);
begin
  select u.id
  into target_user_id
  from public.usuarios u
  where target_email is null or u.email = target_email
  order by u.creado_en desc
  limit 1;

  if target_user_id is null then
    raise exception 'No se encontro ningun usuario en public.usuarios. Crea o inicia sesion primero.';
  end if;

  select id, precio into mesa_id, mesa_price
  from public.productos
  where nombre = 'Mesa BMW'
  limit 1;

  select id, precio into reloj_id, reloj_price
  from public.productos
  where nombre = 'Reloj McLaren'
  limit 1;

  select id, precio into lampara_id, lampara_price
  from public.productos
  where nombre = 'Lámpara Cigüeñal'
  limit 1;

  if mesa_id is null or reloj_id is null or lampara_id is null then
    raise exception 'Faltan productos reales de 525hp en public.productos.';
  end if;

  -- Limpia demos previas para que el script sea repetible.
  delete from public.ordenes
  where usuario_id = target_user_id
    and referencia_pago like 'DEMO-525-%';

  insert into public.ordenes (
    usuario_id,
    total,
    estado,
    metodo_pago,
    referencia_pago,
    pagado_en,
    creado_en
  )
  values (
    target_user_id,
    mesa_price + lampara_price,
    'entregada',
    'transferencia',
    'DEMO-525-001',
    now() - interval '18 days',
    now() - interval '20 days'
  )
  returning id into order_one_id;

  insert into public.detalles_orden (
    orden_id,
    producto_id,
    cantidad,
    precio_unitario
  )
  values
    (order_one_id, mesa_id, 1, mesa_price),
    (order_one_id, lampara_id, 1, lampara_price);

  insert into public.ordenes (
    usuario_id,
    total,
    estado,
    metodo_pago,
    referencia_pago,
    pagado_en,
    creado_en
  )
  values (
    target_user_id,
    reloj_price,
    'confirmada',
    'tarjeta',
    'DEMO-525-002',
    now() - interval '4 days',
    now() - interval '5 days'
  )
  returning id into order_two_id;

  insert into public.detalles_orden (
    orden_id,
    producto_id,
    cantidad,
    precio_unitario
  )
  values
    (order_two_id, reloj_id, 1, reloj_price);

  raise notice 'Pedidos demo creados para el usuario %', target_user_id;
end $$;
