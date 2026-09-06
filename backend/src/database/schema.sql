-- AquaPay — Aldea Sibaná
-- Ejecutar en Neon SQL Editor (o: psql "$DATABASE_URL" -f schema.sql)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE rol_sistema AS ENUM ('administrador', 'tesorero');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  dpi VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_sistema NOT NULL,
  mfa_secreto TEXT,
  mfa_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(80) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por UUID REFERENCES perfiles(id)
);

INSERT INTO configuracion (clave, valor)
VALUES ('tarifa_anual', '120')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO configuracion (clave, valor)
VALUES ('lugar_pago', 'Aldea Sibaná, El Asintal, Retalhuleu')
ON CONFLICT (clave) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios_comunidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo VARCHAR(200) NOT NULL,
  dpi VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS viviendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_comunidad(id) ON DELETE RESTRICT,
  direccion VARCHAR(300) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  anio_inicio_cobro INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chorros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE RESTRICT,
  precio_compra NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_instalacion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recibos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_recibo VARCHAR(20) NOT NULL,
  anio_recibo INTEGER NOT NULL,
  secuencia INTEGER NOT NULL,
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE RESTRICT,
  tipo_cobro VARCHAR(30) NOT NULL CHECK (tipo_cobro IN ('tarifa_anual', 'compra_chorro')),
  total_pagado NUMERIC(12, 2) NOT NULL CHECK (total_pagado >= 0),
  cantidad_en_letras TEXT NOT NULL,
  descripcion_pago TEXT NOT NULL,
  lugar_pago VARCHAR(200) NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  creado_por UUID NOT NULL REFERENCES perfiles(id),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (anio_recibo, secuencia),
  UNIQUE (numero_recibo)
);

CREATE TABLE IF NOT EXISTS pagos_anuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recibo_id UUID NOT NULL REFERENCES recibos(id) ON DELETE CASCADE,
  chorro_id UUID NOT NULL REFERENCES chorros(id) ON DELETE RESTRICT,
  anio INTEGER NOT NULL,
  monto_pagado NUMERIC(12, 2) NOT NULL,
  UNIQUE (chorro_id, anio)
);

CREATE TABLE IF NOT EXISTS pagos_compra_chorro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recibo_id UUID NOT NULL REFERENCES recibos(id) ON DELETE CASCADE,
  chorro_id UUID NOT NULL REFERENCES chorros(id) ON DELETE RESTRICT,
  monto_pagado NUMERIC(12, 2) NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS recibos_pdf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recibo_id UUID NOT NULL UNIQUE REFERENCES recibos(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_storage TEXT NOT NULL,
  url_publica TEXT,
  tamano_bytes INTEGER NOT NULL DEFAULT 0,
  tipo_mime VARCHAR(80) NOT NULL DEFAULT 'application/pdf',
  fecha_subida TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_dpi ON usuarios_comunidad (dpi);
CREATE INDEX IF NOT EXISTS idx_viviendas_usuario ON viviendas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_chorros_vivienda ON chorros (vivienda_id);
CREATE INDEX IF NOT EXISTS idx_recibos_vivienda ON recibos (vivienda_id);
CREATE INDEX IF NOT EXISTS idx_recibos_fecha ON recibos (fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_anuales_anio ON pagos_anuales (anio);
CREATE INDEX IF NOT EXISTS idx_perfiles_dpi ON perfiles (dpi);
