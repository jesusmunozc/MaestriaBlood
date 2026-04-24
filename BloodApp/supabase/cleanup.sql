-- ============================================================
--  !Blood — Limpieza de usuarios corruptos
--  Ejecutar PRIMERO en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Borrar identidades corruptas
DELETE FROM auth.identities
WHERE user_id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

-- Borrar sessions relacionadas
DELETE FROM auth.sessions
WHERE user_id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

-- Borrar refresh tokens
DELETE FROM auth.refresh_tokens
WHERE user_id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

-- Borrar perfiles (cascade safe)
DELETE FROM profiles
WHERE id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

-- Borrar los usuarios corruptos
DELETE FROM auth.users
WHERE id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

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
