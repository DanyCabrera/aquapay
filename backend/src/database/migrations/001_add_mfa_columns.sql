-- Añade columnas MFA a perfiles si faltan (tabla creada antes de MFA)
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS mfa_secreto TEXT,
  ADD COLUMN IF NOT EXISTS mfa_habilitado BOOLEAN NOT NULL DEFAULT FALSE;
