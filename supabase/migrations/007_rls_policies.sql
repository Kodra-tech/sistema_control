-- ============================================================
-- RLS Policies — salon-control
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Helper: obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: verificar si el usuario está activo
CREATE OR REPLACE FUNCTION is_user_active()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(activo, true) FROM public.perfiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 1. perfiles ─────────────────────────────────────────────────────────────
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfiles_select" ON perfiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "perfiles_insert" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_update" ON perfiles FOR UPDATE USING (
  auth.uid() = id OR get_user_rol() = 'dueno'
);

-- ─── 2. clientes ─────────────────────────────────────────────────────────────
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select" ON clientes FOR SELECT USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "clientes_insert" ON clientes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "clientes_update" ON clientes FOR UPDATE USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "clientes_delete" ON clientes FOR DELETE USING (get_user_rol() = 'dueno');

-- ─── 3. servicios ────────────────────────────────────────────────────────────
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicios_select" ON servicios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "servicios_insert" ON servicios FOR INSERT WITH CHECK (get_user_rol() = 'dueno');
CREATE POLICY "servicios_update" ON servicios FOR UPDATE USING (get_user_rol() = 'dueno');
CREATE POLICY "servicios_delete" ON servicios FOR DELETE USING (get_user_rol() = 'dueno');

-- ─── 4. citas ────────────────────────────────────────────────────────────────
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "citas_select" ON citas FOR SELECT USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "citas_insert" ON citas FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "citas_update" ON citas FOR UPDATE USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "citas_delete" ON citas FOR DELETE USING (
  auth.role() = 'authenticated' AND is_user_active()
);

-- ─── 5. ventas ───────────────────────────────────────────────────────────────
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_select" ON ventas FOR SELECT USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "ventas_insert" ON ventas FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "ventas_update" ON ventas FOR UPDATE USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "ventas_delete" ON ventas FOR DELETE USING (get_user_rol() = 'dueno');

-- ─── 6. gastos ───────────────────────────────────────────────────────────────
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gastos_select" ON gastos FOR SELECT USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "gastos_insert" ON gastos FOR INSERT WITH CHECK (get_user_rol() = 'dueno');
CREATE POLICY "gastos_update" ON gastos FOR UPDATE USING (get_user_rol() = 'dueno');
CREATE POLICY "gastos_delete" ON gastos FOR DELETE USING (get_user_rol() = 'dueno');

-- ─── 7. inventario ───────────────────────────────────────────────────────────
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_select" ON inventario FOR SELECT USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "inventario_insert" ON inventario FOR INSERT WITH CHECK (get_user_rol() = 'dueno');
CREATE POLICY "inventario_update" ON inventario FOR UPDATE USING (auth.role() = 'authenticated' AND is_user_active());
CREATE POLICY "inventario_delete" ON inventario FOR DELETE USING (get_user_rol() = 'dueno');

-- ─── 8. compras ──────────────────────────────────────────────────────────────
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compras_select" ON compras FOR SELECT USING (get_user_rol() = 'dueno');
CREATE POLICY "compras_insert" ON compras FOR INSERT WITH CHECK (get_user_rol() = 'dueno');
CREATE POLICY "compras_delete" ON compras FOR DELETE USING (get_user_rol() = 'dueno');

-- ─── 9. configuracion ────────────────────────────────────────────────────────
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_select" ON configuracion FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "configuracion_insert" ON configuracion FOR INSERT WITH CHECK (get_user_rol() = 'dueno');
CREATE POLICY "configuracion_update" ON configuracion FOR UPDATE USING (get_user_rol() = 'dueno');

-- ─── Trigger: auto-crear perfil al registrarse ───────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'empleado')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
