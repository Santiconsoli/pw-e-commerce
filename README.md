# 525hp

E-commerce full-stack de muebles y objetos de lujo inspirados en piezas automotrices. El proyecto usa Next.js, Supabase y Mercado Pago para cubrir catálogo, autenticación, carrito, checkout, administración, pagos y control de stock.

## Stack

- Next.js Pages Router
- React
- CSS puro responsive
- Supabase Auth, PostgreSQL y RLS
- Mercado Pago Checkout Pro y webhook
- Vercel para deploy
- GitHub Actions para validar build en PR y `main`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
```

## Variables

Copiá `.env.example` como `.env.local` y completá:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

`MERCADOPAGO_WEBHOOK_SECRET` es opcional, pero recomendable si se configura firma de webhook.

## Rutas Principales

- `/`: landing, catálogo destacado, carrito y reseñas.
- `/catalogo`: catálogo navegable con búsqueda, ordenamiento y carrito.
- `/checkout`: formulario validado y creación de orden.
- `/pago`: resultado de Mercado Pago para éxito, pendiente, rechazo o error.
- `/login`: registro, ingreso, datos de cuenta e historial de pedidos.
- `/admin`: panel privado para productos, órdenes, usuarios, pagos, stock y órdenes manuales.
- `/nosotros`: presentación institucional.

## Supabase

Ejecutar los SQL desde Supabase SQL Editor en este orden recomendado:

1. `supabase/ecommerce_schema.sql`
2. `supabase/fix_525hp_catalog.sql`
3. `supabase/payments_and_checkout.sql`
4. `supabase/order_stock_management.sql`
5. `supabase/configure_admin_and_harden_rls.sql`

Si ya existe una base configurada, ejecutar solo los scripts incrementales necesarios. Más detalle en `SUPABASE_SETUP.md`.

## Deploy

El deploy recomendado es Vercel conectado al repositorio de GitHub. Cada push a `main` dispara build y publicación. El workflow `.github/workflows/ci.yml` valida `npm run build` en push y Pull Requests.

## Checklist Final

- Build local: `npm run build`.
- Variables cargadas en Vercel.
- Usuario admin configurado en `public.usuarios`.
- Webhook de Mercado Pago apuntando a `/api/payments/webhook`.
- Productos visibles desde `public.productos`.
- Compra de prueba realizada con usuario comprador de Mercado Pago.
- Panel admin puede editar precios, stock, estados, órdenes manuales y cantidades por orden.
