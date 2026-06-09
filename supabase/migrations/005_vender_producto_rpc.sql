-- ============================================================
-- RPC: vender_producto
-- Descuenta stock de inventario atómicamente con bloqueo de fila.
-- Lanza excepción si no hay stock suficiente.
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION vender_producto(
  p_inventario_id UUID,
  p_cantidad      NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock NUMERIC;
BEGIN
  -- Bloquear la fila para evitar condición de carrera
  SELECT stock_actual INTO v_stock
  FROM inventario
  WHERE id = p_inventario_id
  FOR UPDATE;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_inventario_id;
  END IF;

  IF v_stock < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Requerido: %', v_stock, p_cantidad;
  END IF;

  UPDATE inventario
  SET    stock_actual = stock_actual - p_cantidad
  WHERE  id = p_inventario_id;

  RETURN v_stock - p_cantidad;
END;
$$;

-- Dar permisos al rol anon y authenticated (para que lo llame el cliente Supabase)
GRANT EXECUTE ON FUNCTION vender_producto(UUID, NUMERIC) TO anon, authenticated;
