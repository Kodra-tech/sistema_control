-- Habilitar Realtime en la tabla citas
-- Ejecutar en Supabase SQL Editor

ALTER TABLE citas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE citas;
