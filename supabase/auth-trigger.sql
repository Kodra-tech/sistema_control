-- ============================================================
-- Ejecutar en Supabase → SQL Editor
-- Trigger para crear perfil automáticamente al registrar usuario
-- ============================================================

-- Función: crea un perfil en public.perfiles al registrar usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'   -- primer usuario = admin; cambiar a 'empleado' si es un empleado adicional
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS: acceso básico para usuarios autenticados
-- (refinar por rol en Sprint S5)
-- ============================================================

ALTER TABLE perfiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario    ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Perfil: cada usuario gestiona el suyo
DROP POLICY IF EXISTS "perfil_select"  ON perfiles;
DROP POLICY IF EXISTS "perfil_insert"  ON perfiles;
DROP POLICY IF EXISTS "perfil_update"  ON perfiles;

CREATE POLICY "perfil_select" ON perfiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "perfil_insert" ON perfiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "perfil_update" ON perfiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Resto de tablas: acceso total para usuarios autenticados
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clientes','servicios','citas','ventas',
    'gastos','inventario','compras','configuracion'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "auth_all" ON %I;
       CREATE POLICY "auth_all" ON %I
         FOR ALL TO authenticated
         USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;
