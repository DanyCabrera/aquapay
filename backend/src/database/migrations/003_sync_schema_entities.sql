-- Sincroniza columnas faltantes entre el esquema legacy y las entidades TypeORM actuales

ALTER TABLE usuarios_comunidad
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE viviendas
  ADD COLUMN IF NOT EXISTS anio_inicio_cobro INTEGER;

UPDATE viviendas
SET anio_inicio_cobro = EXTRACT(YEAR FROM COALESCE(fecha_registro, NOW()))::INTEGER
WHERE anio_inicio_cobro IS NULL;

ALTER TABLE viviendas
  ALTER COLUMN anio_inicio_cobro SET DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER;

ALTER TABLE viviendas
  ALTER COLUMN anio_inicio_cobro SET NOT NULL;

ALTER TABLE chorros
  ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE recibos
  ADD COLUMN IF NOT EXISTS anio_recibo INTEGER;

ALTER TABLE recibos
  ADD COLUMN IF NOT EXISTS secuencia INTEGER;

ALTER TABLE recibos
  ADD COLUMN IF NOT EXISTS tipo_cobro VARCHAR(30);

UPDATE recibos
SET anio_recibo = EXTRACT(YEAR FROM COALESCE(fecha_pago, CURRENT_DATE))::INTEGER
WHERE anio_recibo IS NULL;

UPDATE recibos
SET tipo_cobro = 'tarifa_anual'
WHERE tipo_cobro IS NULL;

UPDATE recibos
SET secuencia = CASE
  WHEN TRIM(numero_recibo::text) ~ '^\d+$' THEN TRIM(numero_recibo::text)::INTEGER
  ELSE NULL
END
WHERE secuencia IS NULL;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY anio_recibo
      ORDER BY fecha_creacion NULLS LAST, id
    ) AS rn
  FROM recibos
  WHERE secuencia IS NULL
)
UPDATE recibos r
SET secuencia = ranked.rn
FROM ranked
WHERE r.id = ranked.id;

ALTER TABLE recibos
  ALTER COLUMN anio_recibo SET NOT NULL;

ALTER TABLE recibos
  ALTER COLUMN secuencia SET NOT NULL;

ALTER TABLE recibos
  ALTER COLUMN tipo_cobro SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE recibos
    ADD CONSTRAINT recibos_tipo_cobro_check
    CHECK (tipo_cobro IN ('tarifa_anual', 'compra_chorro'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO configuracion (clave, valor)
VALUES ('tarifa_anual', '120')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO configuracion (clave, valor)
VALUES ('lugar_pago', 'Aldea Sibaná, El Asintal, Retalhuleu')
ON CONFLICT (clave) DO NOTHING;
