-- BUG-007: columna legacy cuota_mensual NOT NULL rompe INSERT vía TypeORM
-- (la entidad actual no la mapea; el producto no usa cuota mensual)

ALTER TABLE chorros
  DROP COLUMN IF EXISTS cuota_mensual;
