-- Columna activo en perfiles (requerida por la entidad Perfil)
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
