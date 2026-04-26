-- ============================================================
--  !Blood — Seed de datos de prueba
--  Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================
-- Cuentas creadas:
--   ciudadano    → usuario: carlos_test  | contraseña: Test1234!
--   profesional  → usuario: dra_sofia    | contraseña: Test1234!
-- ============================================================

-- Extensión para hash bcrypt (ya incluida en Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. USUARIOS EN AUTH ─────────────────────────────────────────────────────

-- Borramos si ya existen (idempotente)
DELETE FROM auth.users WHERE id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_confirm_status,
  is_sso_user,
  is_anonymous,
  deleted_at
) VALUES
(
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'carlos_test@bloodapp.com',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Carlos Ramírez","username":"carlos_test"}',
  NOW() - INTERVAL '6 months',
  NOW(),
  '',
  '',
  0,
  FALSE,
  FALSE,
  NULL
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dra_sofia@bloodapp.com',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dra. Sofía Mendoza","username":"dra_sofia"}',
  NOW() - INTERVAL '7 months',
  NOW(),
  '',
  '',
  0,
  FALSE,
  FALSE,
  NULL
);

-- ─── 2. IDENTIDADES (necesario para login con email+password) ─────────────────

DELETE FROM auth.identities WHERE user_id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
) VALUES
(
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '{"sub":"13fbf1b6-9cbf-41ae-92f1-ca9affe9a879","email":"carlos_test@bloodapp.com"}',
  'email',
  NOW(),
  NOW(),
  NOW(),
  'carlos_test@bloodapp.com'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  '{"sub":"7f993570-9b4b-40de-9520-8b3ef60453bc","email":"dra_sofia@bloodapp.com"}',
  'email',
  NOW(),
  NOW(),
  NOW(),
  'dra_sofia@bloodapp.com'
);

-- ─── 3. PERFILES ─────────────────────────────────────────────────────────────

DELETE FROM profiles WHERE id IN (
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  '7f993570-9b4b-40de-9520-8b3ef60453bc'
);

INSERT INTO profiles (
  id, username, full_name, email, blood_type, user_type,
  id_type, city, address, avg_rating, total_donations,
  survey_done, aptitude_eligible, created_at
) VALUES
(
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  'carlos_test',
  'Carlos Ramírez',
  'carlos_test@bloodapp.com',
  'O+',
  'donor',
  'CC',
  'Bogotá',
  'Cra 7 # 45-12, Chapinero',
  4.8,
  5,
  TRUE,
  TRUE,
  NOW() - INTERVAL '6 months'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'dra_sofia',
  'Dra. Sofía Mendoza',
  'dra_sofia@bloodapp.com',
  'A+',
  'professional',
  'CC',
  'Medellín',
  'Hospital Pablo Tobón Uribe, Calle 78B # 69-240',
  4.9,
  0,
  FALSE,
  TRUE,
  NOW() - INTERVAL '7 months'
);

-- ─── 4. SOLICITUDES DE SANGRE ────────────────────────────────────────────────

INSERT INTO blood_requests (
  requester_id, blood_type, units_needed, donors_needed,
  donors_accepted, urgency, health_center, address, message, status, created_at
) VALUES
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'O-', 3, 3, 1, 'urgent',
  'Hospital Pablo Tobón Uribe',
  'Calle 78B # 69-240, Medellín',
  'Paciente en cirugía de emergencia. Necesitamos O- con urgencia. Por favor acudir al banco de sangre.',
  'open',
  NOW() - INTERVAL '2 hours'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'A+', 2, 2, 0, 'medium',
  'Clínica Las Américas',
  'Diagonal 75B # 2A-80, Medellín',
  'Paciente con anemia severa que requiere transfusiones periódicas. Tipo A+ compatible.',
  'open',
  NOW() - INTERVAL '1 day'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'AB-', 1, 1, 0, 'urgent',
  'Clínica El Rosario',
  'Calle 12 Sur # 43-52, Medellín',
  'Recién nacido requiere transfusión de emergencia. AB- es el tipo más escaso, cualquier ayuda es vital.',
  'open',
  NOW() - INTERVAL '4 hours'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'B+', 1, 1, 1, 'low',
  'Hospital General de Medellín',
  'Calle 24 # 48-22, Medellín',
  'Seguimiento post-quirúrgico. Requiere donante B+ para reserva.',
  'completed',
  NOW() - INTERVAL '7 days'
),
(
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  'O+', 2, 2, 2, 'urgent',
  'Hospital San Ignacio',
  'Cra 7 # 40-62, Bogotá',
  'Mi hermana necesita transfusión urgente. Accidente de tránsito. Tipo O+ o O-.',
  'completed',
  NOW() - INTERVAL '14 days'
);

-- ─── 5. DONACIONES DE CARLOS ─────────────────────────────────────────────────

-- Donación a la solicitud urgente abierta de Sofía (O-)
INSERT INTO donations (donor_id, request_id, status, confirmed_at, created_at)
SELECT
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  id,
  'confirmed',
  NOW(),
  NOW()
FROM blood_requests
WHERE requester_id = '7f993570-9b4b-40de-9520-8b3ef60453bc'
  AND blood_type = 'O-'
  AND status = 'open'
LIMIT 1
ON CONFLICT (donor_id, request_id) DO NOTHING;

-- Donación completada en la solicitud de Carlos
INSERT INTO donations (donor_id, request_id, status, confirmed_at, created_at)
SELECT
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  id,
  'completed',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
FROM blood_requests
WHERE requester_id = '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879'
  AND status = 'completed'
LIMIT 1
ON CONFLICT (donor_id, request_id) DO NOTHING;

-- ─── 6. CAMPAÑAS DE DONACIÓN ─────────────────────────────────────────────────

INSERT INTO campaigns (
  organizer_id, name, description, location, date,
  start_time, end_time, total_slots, registered_slots,
  blood_types_needed, requirements, status, created_at
) VALUES
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'Jornada de Donación Hospital Tobón Uribe',
  'Gran jornada de donación voluntaria de sangre. Abierta para todos los grupos sanguíneos. Refrigerios incluidos para los donantes.',
  'Hospital Pablo Tobón Uribe — Auditorio Principal, Medellín',
  CURRENT_DATE + INTERVAL '5 days',
  '08:00', '16:00', 50, 18,
  ARRAY['O-','O+','A-','B-'],
  'Descanso previo de 8 horas. No consumir alcohol 24h antes. Traer documento de identidad. Peso mínimo 50kg.',
  'upcoming',
  NOW() - INTERVAL '3 days'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'Banco de Sangre Clínica Medellín',
  'Campaña mensual de reposición del banco de sangre. Especialmente necesitamos donantes de grupos negativos.',
  'Clínica Medellín — Sede El Poblado, Medellín',
  CURRENT_DATE + INTERVAL '12 days',
  '09:00', '14:00', 30, 7,
  ARRAY['A-','B-','AB-','O-'],
  'Ayuno de 4 horas. No haber donado en los últimos 3 meses. Cita previa recomendada.',
  'upcoming',
  NOW() - INTERVAL '1 day'
),
(
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  'Donación Solidaria — Liga contra el Cáncer',
  'Campaña especial para pacientes oncológicos del Instituto Nacional de Cancerología. Los pacientes de quimioterapia requieren constantemente plaquetas y glóbulos rojos.',
  'Instituto Nacional de Cancerología, Bogotá',
  CURRENT_DATE - INTERVAL '3 days',
  '07:00', '13:00', 40, 40,
  ARRAY['O-','O+','A+','B+','AB+'],
  'Donante apto según encuesta de aptitud.',
  'completed',
  NOW() - INTERVAL '10 days'
);

-- ─── 7. REGISTRO DE CARLOS EN LA PRIMERA CAMPAÑA ────────────────────────────

INSERT INTO campaign_registrations (user_id, campaign_id, status, registered_at)
SELECT
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  id,
  'registered',
  NOW()
FROM campaigns
WHERE organizer_id = '7f993570-9b4b-40de-9520-8b3ef60453bc'
  AND name = 'Jornada de Donación Hospital Tobón Uribe'
LIMIT 1
ON CONFLICT (user_id, campaign_id) DO NOTHING;

-- ─── 8. NOTIFICACIONES ───────────────────────────────────────────────────────

INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES
-- Para Carlos
('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879', 'donation_confirmed',
 '¡Tu donación fue confirmada! Gracias por salvar vidas 🩸', FALSE, NOW() - INTERVAL '30 minutes'),
('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879', 'campaign_reminder',
 'La campaña "Jornada de Donación Hospital Tobón Uribe" es en 5 días. ¡No olvides asistir!', FALSE, NOW() - INTERVAL '2 hours'),
('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879', 'new_request',
 'Nueva solicitud urgente de sangre O- cerca de ti en Medellín', TRUE, NOW() - INTERVAL '3 hours'),
('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879', 'rating_received',
 'Dra. Sofía Mendoza te valoró con 5 estrellas ⭐ por tu donación', TRUE, NOW() - INTERVAL '14 days'),
-- Para Sofía
('7f993570-9b4b-40de-9520-8b3ef60453bc', 'donation_received',
 'Carlos Ramírez confirmó su donación para tu solicitud de O- 🩸', FALSE, NOW() - INTERVAL '25 minutes'),
('7f993570-9b4b-40de-9520-8b3ef60453bc', 'campaign_update',
 'Tu campaña "Jornada de Donación" ya tiene 18 registrados de 50 cupos', TRUE, NOW() - INTERVAL '5 hours');

-- ─── 9. RATING — Sofía valora a Carlos (5 ⭐) ───────────────────────────────

INSERT INTO ratings (rater_id, rated_id, donation_id, stars, comment, created_at)
SELECT
  '7f993570-9b4b-40de-9520-8b3ef60453bc',
  '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879',
  d.id,
  5,
  'Carlos fue muy puntual y responsable. Donación completada sin inconvenientes. ¡Gracias!',
  NOW() - INTERVAL '13 days'
FROM donations d
WHERE d.donor_id = '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879'
  AND d.status = 'completed'
LIMIT 1
ON CONFLICT (rater_id, donation_id) DO NOTHING;

-- Actualizar avg_rating de Carlos
UPDATE profiles
SET avg_rating = (SELECT COALESCE(AVG(stars), 0) FROM ratings WHERE rated_id = '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879')
WHERE id = '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879';

-- ─── VERIFICACIÓN ────────────────────────────────────────────────────────────
SELECT 'profiles'       AS tabla, COUNT(*) AS registros FROM profiles WHERE id IN ('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879','7f993570-9b4b-40de-9520-8b3ef60453bc')
UNION ALL
SELECT 'blood_requests', COUNT(*) FROM blood_requests WHERE requester_id IN ('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879','7f993570-9b4b-40de-9520-8b3ef60453bc')
UNION ALL
SELECT 'donations',      COUNT(*) FROM donations WHERE donor_id = '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879'
UNION ALL
SELECT 'campaigns',      COUNT(*) FROM campaigns WHERE organizer_id = '7f993570-9b4b-40de-9520-8b3ef60453bc'
UNION ALL
SELECT 'notifications',  COUNT(*) FROM notifications WHERE user_id IN ('13fbf1b6-9cbf-41ae-92f1-ca9affe9a879','7f993570-9b4b-40de-9520-8b3ef60453bc')
UNION ALL
SELECT 'ratings',        COUNT(*) FROM ratings WHERE rated_id = '13fbf1b6-9cbf-41ae-92f1-ca9affe9a879';
