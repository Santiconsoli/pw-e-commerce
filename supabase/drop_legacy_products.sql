-- Limpieza opcional: elimina la tabla vieja del catalogo.
-- Ejecutar solo despues de confirmar que la web ya lee desde public.productos.

drop table if exists public.products;
