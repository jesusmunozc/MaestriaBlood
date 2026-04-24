# Arquitectura de !Blood

## Explicación técnica

### Stack tecnológico

| Capa          | Tecnología            | Rol                                      |
| ------------- | --------------------- | ---------------------------------------- |
| UI            | React 18 + TypeScript | Interfaces reactivas, tipadas            |
| Estilos       | Tailwind CSS 3        | Utilidades de diseño, tema personalizado |
| Build         | Vite 5                | Bundler ultra-rápido, PWA plugin         |
| Routing       | React Router DOM v6   | Navegación SPA                           |
| Estado global | React Context API     | Estado de sesión y notificaciones        |
| Base de datos | Supabase (PostgreSQL) | Auth + DB + Storage + RLS                |
| Mobile        | Capacitor 8           | Wrapper nativo Android/iOS               |
| Iconos        | Lucide React          | SVG icons                                |
| Fechas        | date-fns (es)         | Formateo en español                      |

### Estructura de capas

```
┌────────────────────────────────────────────────────────────────┐
│                       Android / iOS (Capacitor)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     React SPA (Vite)                     │  │
│  │                                                          │  │
│  │   Pages          Components         Context              │  │
│  │   ────────       ──────────         ───────              │  │
│  │   Home           BottomNav          AppContext           │  │
│  │   Explore        BloodTypeBadge     (authUser, profile,  │  │
│  │   RequestDetail  UrgencyBadge        notifications)      │  │
│  │   Profile        Modal                                   │  │
│  │   ...            Button                                  │  │
│  │                  FormFields                              │  │
│  │                                                          │  │
│  │   Services (src/lib/)                                    │  │
│  │   ──────────────────────────────────────────────────     │  │
│  │   auth.ts  →  blood-requests.ts  →  donations.ts        │  │
│  │   campaigns.ts  →  notifications.ts  →  ratings.ts      │  │
│  │   profiles.ts  →  utils.ts                              │  │
│  │                      │                                   │  │
│  │              supabase client                             │  │
│  └──────────────────────│─────────────────────────────────-┘  │
└─────────────────────────│──────────────────────────────────────┘
                          │ HTTPS (REST + Realtime)
                ┌─────────▼──────────────┐
                │      Supabase Cloud    │
                │  ┌──────────────────┐  │
                │  │   PostgreSQL DB  │  │
                │  │   + Row Security │  │
                │  ├──────────────────┤  │
                │  │  Auth (JWT)      │  │
                │  ├──────────────────┤  │
                │  │  Storage         │  │
                │  │  (profile pics,  │  │
                │  │   doc images)    │  │
                │  └──────────────────┘  │
                └────────────────────────┘
```

### Modelo de datos (tablas principales)

```
profiles          blood_requests        donations
────────          ──────────────        ─────────
id (PK)           id (PK)               id (PK)
full_name         requester_id (FK)     donor_id (FK)
username          blood_type            request_id (FK)
blood_type        units_needed          status
user_type         urgency               confirmed_at
penalty_until     health_center
avg_rating        status

campaigns         notifications         ratings
─────────         ─────────────         ───────
id (PK)           id (PK)               id (PK)
organizer_id (FK) user_id (FK)          rater_id (FK)
name              type                  rated_id (FK)
date              message               stars
total_slots       is_read               comment
registered_slots
```

### Flujo de autenticación

```
Usuario escribe username/password
         │
         ▼
auth.ts: signIn()
  ├─ Si es email: signInWithPassword directamente
  └─ Si es username: llama RPC get_email_by_user_id → obtiene email → signInWithPassword
         │
         ▼
Supabase devuelve session JWT
         │
         ▼
AppContext: watchAuthState() detecta cambio
         │
         ▼
profile cargado desde tabla profiles
         │
         ▼
authUser almacenado en localStorage (blood_auth_user)
         │
         ▼
Usuario ve Home
```

### Seguridad (Row Level Security)

Cada tabla de Supabase tiene RLS activado. Ejemplos clave:

- `profiles`: cualquiera puede leer, solo el dueño puede modificar
- `blood_requests`: cualquier autenticado puede leer, solo el creador puede modificar/cancelar
- `donations`: solo el donante y el solicitante de la petición pueden ver sus donaciones
- `notifications`: solo el usuario propietario puede leer y marcar sus notificaciones

### Flujo de donación

```
Explore → RequestDetail → ConfirmDonation
                                │
                      ┌─────────┴──────────┐
                      │                    │
              [Confirmar]            [Cancelar]
                      │                    │
           DonationConfirmed      donations.cancelDonation()
                                           │
                                  penalty_until = +30 días
                                           │
                                  DonationCancelled
```

---

## Explicación no técnica (para presentación / stakeholders)

### ¿Qué es !Blood?

**!Blood** es una aplicación móvil que conecta personas que necesitan sangre urgentemente con donantes voluntarios en Colombia. Funciona como un directorio social de donación: cualquier persona puede publicar que necesita sangre e indicar dónde ir a donarla, y los donantes pueden ver esas solicitudes y confirmar que irán.

### ¿Qué tecnologías usa y por qué?

- **Aplicación móvil nativa** (Android primero, iOS a futuro): La app se instala en el celular como cualquier otra aplicación. Está construida usando tecnología web moderna que luego se empaqueta para funcionar nativo en Android, lo que permite publicarla en Play Store.

- **Base de datos en la nube (Supabase)**: Toda la información (usuarios, solicitudes, campañas) se guarda de forma segura en una base de datos en la nube. Cada usuario solo puede ver y modificar sus propios datos.

- **Autenticación segura**: Los usuarios inician sesión con su nombre de usuario y contraseña. Las contraseñas nunca se guardan en texto plano — siempre encriptadas.

### Módulos de la app

| Módulo                    | ¿Qué hace?                                                                        |
| ------------------------- | --------------------------------------------------------------------------------- |
| **Solicitudes de sangre** | Publicar y visualizar solicitudes de donantes por tipo de sangre y urgencia       |
| **Donaciones**            | Confirmar intención de donar, con sistema de penalización si se cancela (30 días) |
| **Campañas**              | Profesionales de salud organizan eventos masivos de donación                      |
| **Notificaciones**        | Alertas en tiempo real cuando alguien confirma o cancela                          |
| **Calificaciones**        | Después de cada donación, ambas partes pueden calificarse                         |
| **Perfil verificado**     | Los profesionales de salud tienen insignia especial                               |

### ¿Por qué el sistema de penalización?

Si alguien confirma donar y cancela sin causa, la persona que necesitaba sangre queda en incertidumbre. La penalización de 30 días evita compromisos irresponsables y protege a los pacientes que dependen de esta información.

### Escalabilidad

La arquitectura separa claramente la interfaz, los servicios y la base de datos. Esto significa que en el futuro se puede:

- Agregar nuevas funcionalidades sin romper las existentes
- Cambiar el proveedor de base de datos si se necesita
- Lanzar en iOS con mínimos cambios (ya preparado con Capacitor)
- Agregar notificaciones push nativas
