-- Ejecutar en Supabase → SQL Editor
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS anio_fiscal INTEGER;
