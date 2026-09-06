-- Auth local (Neon): password_hash en perfiles, sin dependencia de auth.users

ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Si venía de Supabase con FK a auth.users, intentar soltarla (ignorar si no existe)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
   AND tc.table_schema = ccu.table_schema
  WHERE tc.table_name = 'perfiles'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE perfiles DROP CONSTRAINT %I', fk_name);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ALTER TABLE perfiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
