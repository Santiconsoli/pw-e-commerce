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

## 4. Configurar autenticación
Para que el comprador cree una cuenta y quede logueado sin confirmar por email:

1. En Supabase, entrá a `Authentication` -> `Providers`.
2. Abrí el provider `Email`.
3. Dejá habilitado el login por email.
4. Desactivá `Confirm email`.
5. Guardá los cambios.

Para evitar links a localhost si en algún momento volvés a activar confirmación:

1. En Supabase, entrá a `Authentication` -> `URL Configuration`.
2. En `Site URL`, poné la URL de producción de Vercel.
3. En `Redirect URLs`, agregá:

```txt
https://tu-dominio-de-vercel.vercel.app/**
http://localhost:3000/**
```

En Vercel, agregá también:

```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio-de-vercel.vercel.app
```

## 5. Limpieza opcional
Si la web deployed ya lee correctamente desde `productos`, podés borrar la tabla vieja `products` ejecutando `supabase/drop_legacy_products.sql`.

## 6. Configurar administrador
Para convertir el usuario registrado en administrador y reforzar las reglas RLS, ejecutá `supabase/configure_admin_and_harden_rls.sql` desde Supabase SQL Editor.

Si hay un solo usuario en `public.usuarios`, el script lo convierte automáticamente en admin. Si hay más de uno, editá `target_admin_email` dentro del script antes de ejecutarlo.
