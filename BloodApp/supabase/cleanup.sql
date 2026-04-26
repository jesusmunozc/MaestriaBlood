-- ============================================================
--  !Blood — Limpieza de usuarios de prueba
--  Ejecutar en: Supabase Dashboard > SQL Editor
--  Después de esto, ejecuta: node seed.mjs
-- ============================================================

-- Borrar todo lo relacionado con los usuarios de prueba (por email, cubre cualquier ID)
DO $$
DECLARE
  carlos_id UUID;
  sofia_id  UUID;
BEGIN
  SELECT id INTO carlos_id FROM auth.users WHERE email = 'carlos_test@bloodapp.com';
  SELECT id INTO sofia_id  FROM auth.users WHERE email = 'dra_sofia@bloodapp.com';

  -- Eliminar tokens y sesiones
  DELETE FROM auth.refresh_tokens WHERE user_id IN (carlos_id, sofia_id);
  DELETE FROM auth.sessions       WHERE user_id IN (carlos_id, sofia_id);
  DELETE FROM auth.mfa_factors    WHERE user_id IN (carlos_id, sofia_id);
  DELETE FROM auth.identities     WHERE user_id IN (carlos_id, sofia_id);

  -- Eliminar perfil (cascade elimina datos relacionados)
  DELETE FROM profiles WHERE id IN (carlos_id, sofia_id);

  -- Eliminar usuario de auth (debe ser último)
  DELETE FROM auth.users WHERE id IN (carlos_id, sofia_id);

  RAISE NOTICE 'Usuarios eliminados correctamente. Ahora ejecuta: node seed.mjs';
END $$;

-- También limpiar cualquier usuario con esos emails
DELETE FROM auth.users
WHERE email IN (
  'carlos_test@bloodapp.com',
  'dra_sofia@bloodapp.com'
);

-- Verificar que quedó limpio
SELECT COUNT(*) AS usuarios_auth_restantes
FROM auth.users
WHERE email LIKE '%bloodapp.com';
