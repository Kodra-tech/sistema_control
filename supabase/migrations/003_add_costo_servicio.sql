-- Ejecutar en Supabase → SQL Editor
ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS costo NUMERIC(10,2);
