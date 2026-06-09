-- ============================================================
-- salon-control — Schema inicial
-- Pegar y ejecutar en Supabase → SQL Editor
-- ============================================================

-- ─── Extensiones ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── Función updated_at (se reutiliza en todos los triggers) ─────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ─── 1. perfiles ─────────────────────────────────────────────────────────────
-- Extiende auth.users; el id es el mismo UUID de Supabase Auth
CREATE TABLE IF NOT EXISTS perfiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  rol         TEXT        NOT NULL DEFAULT 'empleado'
                          CHECK (rol IN ('dueno', 'empleado')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 2. clientes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  telefono    TEXT,
  email       TEXT,
  notas       TEXT,
  activo      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);

CREATE OR REPLACE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 3. servicios ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            TEXT        NOT NULL,
  descripcion       TEXT,
  precio            NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  duracion_minutos  INTEGER     NOT NULL   CHECK (duracion_minutos > 0),
  -- categoria válidas: corte | tinte | peinado | manicure | pedicure | tratamiento | otro
  categoria         TEXT,
  activo            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);

CREATE OR REPLACE TRIGGER trg_servicios_updated_at
  BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 4. configuracion ────────────────────────────────────────────────────────
-- Registro singleton (un solo registro por instalación)
CREATE TABLE IF NOT EXISTS configuracion (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_salon  TEXT        NOT NULL,
  telefono      TEXT,
  email         TEXT,
  direccion     TEXT,
  moneda        TEXT        NOT NULL DEFAULT 'MXN',
  zona_horaria  TEXT        NOT NULL DEFAULT 'America/Mexico_City',
  hora_apertura TIME,
  hora_cierre   TIME,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 5. gastos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gastos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto      TEXT          NOT NULL,
  monto         NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  -- categoria válidas: renta | salario | insumos | servicios | publicidad | mantenimiento | otro
  categoria     TEXT          NOT NULL,
  fecha         DATE          NOT NULL,
  -- comprobante: URL de archivo en Supabase Storage
  comprobante   TEXT,
  notas         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha      ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria  ON gastos(categoria);

CREATE OR REPLACE TRIGGER trg_gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 6. inventario ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT          NOT NULL,
  descripcion     TEXT,
  -- categoria válidas: tinte | shampoo | acondicionador | tratamiento | herramienta | accesorio | otro
  categoria       TEXT          NOT NULL,
  -- unidad válidas: pieza | litro | mililitro | gramo | kilogramo
  unidad          TEXT          NOT NULL DEFAULT 'pieza',
  stock_actual    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_activo ON inventario(activo);

CREATE OR REPLACE TRIGGER trg_inventario_updated_at
  BEFORE UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 7. ventas ───────────────────────────────────────────────────────────────
-- cita_id: FK circular con citas; se agrega con ALTER TABLE después de crear citas
CREATE TABLE IF NOT EXISTS ventas (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID          NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  cita_id     UUID          UNIQUE,   -- FK a citas se agrega abajo
  subtotal    NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  descuento   NUMERIC(10,2) NOT NULL DEFAULT 0
                            CHECK (descuento >= 0 AND descuento <= subtotal),
  total       NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  -- utilidad: columna GENERATED. Fórmula actual = total (ingresos brutos).
  -- Ajustar cuando se modele costo_servicios: GENERATED ALWAYS AS (total - costo_servicios) STORED
  utilidad    NUMERIC(10,2) GENERATED ALWAYS AS (total) STORED,
  -- metodo_pago válidos: efectivo | tarjeta | transferencia | otro
  metodo_pago TEXT          NOT NULL
                            CHECK (metodo_pago IN ('efectivo','tarjeta','transferencia','otro')),
  fecha       DATE          NOT NULL,
  notas       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha   ON ventas(fecha);

CREATE OR REPLACE TRIGGER trg_ventas_updated_at
  BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 8. citas ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID        NOT NULL REFERENCES clientes(id)  ON DELETE RESTRICT,
  servicio_id UUID        NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
  -- venta_id: se llena al cobrar la cita (FK a ventas ya creada)
  venta_id    UUID        UNIQUE REFERENCES ventas(id) ON DELETE SET NULL,
  fecha       DATE        NOT NULL,
  hora_inicio TIME        NOT NULL,
  hora_fin    TIME,
  -- estado válidos: pendiente | confirmada | completada | cancelada | no_asistio
  estado      TEXT        NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','confirmada','completada','cancelada','no_asistio')),
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citas_cliente   ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_servicio  ON citas(servicio_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha     ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado    ON citas(estado);

CREATE OR REPLACE TRIGGER trg_citas_updated_at
  BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── 9. FK circular ventas.cita_id → citas ───────────────────────────────────
ALTER TABLE ventas
  ADD CONSTRAINT ventas_cita_fk
  FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;


-- ─── 10. compras ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compras (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id     UUID          NOT NULL REFERENCES inventario(id) ON DELETE RESTRICT,
  cantidad        NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  total           NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  proveedor       TEXT,
  fecha           DATE          NOT NULL,
  notas           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_producto ON compras(producto_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha    ON compras(fecha);

CREATE OR REPLACE TRIGGER trg_compras_updated_at
  BEFORE UPDATE ON compras
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── Vista resumen_mensual ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW resumen_mensual AS
SELECT
  COALESCE(v.anio,  g.anio)         AS anio,
  COALESCE(v.mes,   g.mes)          AS mes,
  COALESCE(v.total_ventas, 0)       AS total_ventas,
  COALESCE(v.num_ventas,   0)       AS num_ventas,
  COALESCE(g.total_gastos, 0)       AS total_gastos,
  COALESCE(g.num_gastos,   0)       AS num_gastos,
  COALESCE(v.total_ventas, 0) - COALESCE(g.total_gastos, 0) AS utilidad_neta
FROM (
  SELECT
    EXTRACT(YEAR  FROM fecha)::INT AS anio,
    EXTRACT(MONTH FROM fecha)::INT AS mes,
    SUM(total)                     AS total_ventas,
    COUNT(*)                       AS num_ventas
  FROM ventas
  GROUP BY 1, 2
) v
FULL OUTER JOIN (
  SELECT
    EXTRACT(YEAR  FROM fecha)::INT AS anio,
    EXTRACT(MONTH FROM fecha)::INT AS mes,
    SUM(monto)                     AS total_gastos,
    COUNT(*)                       AS num_gastos
  FROM gastos
  GROUP BY 1, 2
) g ON v.anio = g.anio AND v.mes = g.mes;


-- ─── Trigger: crear perfil automáticamente al registrar usuario ───────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    'dueno'  -- primer usuario = dueño; cambiar rol manualmente si se agrega empleado
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE perfiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario    ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- perfiles: cada usuario ve y edita solo su propio perfil
CREATE POLICY "perfil_select" ON perfiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "perfil_insert" ON perfiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "perfil_update" ON perfiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Resto de tablas: acceso total para usuarios autenticados
-- (refinar por rol dueno/empleado en Sprint S5)
CREATE POLICY "auth_all" ON clientes
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON servicios
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON citas
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON ventas
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON gastos
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON inventario
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON compras
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "auth_all" ON configuracion
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
