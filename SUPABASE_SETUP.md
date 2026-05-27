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

## 2. Crear la tabla de productos
1. En Supabase, abrí `SQL Editor`.
2. Pegá el contenido de `supabase/products.sql`.
3. Ejecutalo.

## 3. Probar la conexión
1. Corré `npm run dev`.
2. Abrí la home.
3. Si las variables están bien cargadas, el catálogo se leerá desde Supabase.
4. Si todavía no están, el proyecto seguirá usando `data/products.js` como respaldo.

## 4. Próximo paso recomendado
- Mover también pedidos / checkout a Supabase
- Agregar autenticación si más adelante querés panel admin
- Crear una tabla `orders` para guardar compras
