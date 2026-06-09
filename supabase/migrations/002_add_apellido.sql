-- Ejecutar en Supabase → SQL Editor
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS apellido TEXT;
