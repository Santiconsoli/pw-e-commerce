# Conectar Supabase a 525hp

## 1. Variables de entorno
1. En Supabase, abrí tu proyecto.
2. Andá a `Project Settings` -> `API`.
3. Copiá:
   - `Project URL`
   - `publishable key`
4. Creá un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
```

Compatibilidad:
- si tu panel todavía te muestra `anon public key`, también funciona
- el proyecto acepta `NEXT_PUBLIC_SUPABASE_ANON_KEY` como fallback

## 2. Crear las tablas del e-commerce
1. En Supabase, abrí `SQL Editor`.
2. Pegá el contenido de `supabase/ecommerce_schema.sql`.
3. Ejecutalo.
4. Si ya tenías la tabla vieja `products`, pegá y ejecutá `supabase/fix_525hp_catalog.sql` para cargar el catálogo real en `productos`.

## 3. Probar la conexión
1. Corré `npm run dev`.
2. Abrí la home.
3. Si las variables están bien cargadas, el catálogo se leerá desde Supabase.
4. Si todavía no están, el proyecto seguirá usando `data/products.js` como respaldo.

## 4. Limpieza opcional
Si la web deployed ya lee correctamente desde `productos`, podés borrar la tabla vieja `products` ejecutando `supabase/drop_legacy_products.sql`.
