-- Migración: sincronizar email de auth.users con el correo real guardado en profiles
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
-- Esto actualiza el email de autenticación de todos los usuarios que aún usan
-- el formato interno "username@bloodapp.com" para que usen su correo real.
-- Después de esto, resetPasswordForEmail(correoReal) funcionará correctamente.

UPDATE auth.users u
SET
  email                = p.email,
  email_confirmed_at   = COALESCE(u.email_confirmed_at, now()),
  -- Actualizar también el campo de email en raw_user_meta_data si existe
  raw_user_meta_data   = u.raw_user_meta_data || jsonb_build_object('email', p.email)
FROM public.profiles p
WHERE
  u.id             = p.id
  AND u.email      LIKE '%@bloodapp.com'   -- solo los que usan el email interno
  AND p.email      IS NOT NULL             -- solo si tienen correo real registrado
  AND p.email      <> ''
  AND p.email      NOT LIKE '%@bloodapp.com';  -- no sobreescribir con otro email falso

-- Verificar resultado (opcional, puedes correr esto después para confirmar)
-- SELECT u.id, u.email AS auth_email, p.email AS real_email
-- FROM auth.users u
-- JOIN public.profiles p ON u.id = p.id
-- ORDER BY u.created_at DESC;
