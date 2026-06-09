-- ============================================================
-- Vista resumen_mensual
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

CREATE OR REPLACE VIEW resumen_mensual AS
SELECT
  COALESCE(v.anio, g.anio)::INT             AS anio,
  COALESCE(v.mes,  g.mes)::INT              AS mes,
  COALESCE(v.ventas_totales, 0)             AS ventas_totales,
  COALESCE(v.costos_total,   0)             AS costos_total,
  COALESCE(v.utilidad_bruta, 0)             AS utilidad_bruta,
  COALESCE(g.gastos_totales, 0)             AS gastos_totales,
  COALESCE(v.utilidad_bruta, 0) - COALESCE(g.gastos_totales, 0) AS utilidad_neta
FROM (
  SELECT
    EXTRACT(YEAR  FROM fecha)::INT    AS anio,
    EXTRACT(MONTH FROM fecha)::INT    AS mes,
    SUM(total)                        AS ventas_totales,
    SUM(
      CASE
        WHEN precio_unitario IS NOT NULL AND costo_unitario IS NOT NULL
        THEN (precio_unitario - costo_unitario) * cantidad
        ELSE 0
      END
    )                                 AS utilidad_bruta,
    SUM(
      CASE
        WHEN costo_unitario IS NOT NULL
        THEN costo_unitario * cantidad
        ELSE 0
      END
    )                                 AS costos_total
  FROM ventas
  GROUP BY 1, 2
) v
FULL OUTER JOIN (
  SELECT
    EXTRACT(YEAR  FROM fecha)::INT    AS anio,
    EXTRACT(MONTH FROM fecha)::INT    AS mes,
    SUM(monto)                        AS gastos_totales
  FROM gastos
  GROUP BY 1, 2
) g ON v.anio = g.anio AND v.mes = g.mes;
