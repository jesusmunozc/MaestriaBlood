# Principios SOLID en !Blood

## Resumen ejecutivo

El proyecto !Blood aplica los cinco principios SOLID para lograr un código mantenible, extensible y testeable.

---

## S — Single Responsibility Principle (SRP)

> _"Cada módulo debe tener una sola razón para cambiar."_

### Implementación

Cada archivo en `src/lib/` tiene responsabilidad única:

| Archivo             | Responsabilidad                                                    |
| ------------------- | ------------------------------------------------------------------ |
| `auth.ts`           | Autenticación y gestión de sesión                                  |
| `blood-requests.ts` | CRUD de solicitudes de sangre                                      |
| `donations.ts`      | Confirmación/cancelación de donaciones y penalizaciones            |
| `campaigns.ts`      | Gestión de campañas y registros                                    |
| `notifications.ts`  | Lectura y marcado de notificaciones                                |
| `ratings.ts`        | Envío y consulta de calificaciones                                 |
| `profiles.ts`       | Edición de perfil y carga de imágenes                              |
| `utils.ts`          | Utilidades puras (formateo, compatibilidad de sangre, contraseñas) |

**Ejemplo:** `donations.ts` contiene únicamente lógica relacionada a donaciones. La penalización de 30 días vive dentro de `cancelDonation()` porque es una regla de negocio intrínseca de la cancelación.

```ts
// ✅ SRP: cancelDonation tiene UNA razón para cambiar:
// si cambia la política de cancelación de donaciones.
export async function cancelDonation(donationId: string, donorId: string) {
  const penaltyUntil = addDays(new Date(), 30);
  await supabase
    .from("profiles")
    .update({ penalty_until: penaltyUntil })
    .eq("id", donorId);
  return supabase
    .from("donations")
    .update({ status: "cancelled" })
    .eq("id", donationId);
}
```

---

## O — Open/Closed Principle (OCP)

> _"Abierto para extensión, cerrado para modificación."_

### Implementación

**Componente `Button`** acepta variantes sin modificar el componente base:

```tsx
// Extender Button con nueva variante sin tocar el componente existente:
// Solo se agrega al mapa de variantes
const variants = {
  primary: "gradient-blood text-white ...",
  secondary: "...",
  danger: "...",
  // + agregar 'success' sin modificar la lógica interna
};
```

**Sistema de tipos de sangre:** `BLOOD_TYPES` y `BLOOD_COMPATIBILITY` en `types/index.ts` permiten agregar nuevos tipos sin cambiar los componentes que los consumen — solo se extiende la constante.

**Filtros en `getBloodRequests(filters?)`:** Se pasa un objeto opcional de filtros, permitiendo nuevos criterios de búsqueda sin modificar la firma.

```ts
// OCP: La función acepta nuevos filtros sin cambiar la implementación base
export async function getBloodRequests(filters?: {
  bloodType?: BloodType;
  urgency?: Urgency;
  status?: string;
  // + nuevos filtros sin cambiar el núcleo
}) { ... }
```

---

## L — Liskov Substitution Principle (LSP)

> _"Los subtipos deben ser sustituibles por sus tipos base."_

### Implementación

**Tipo `Profile`** define el contrato común. `donor` y `professional` son subtipos:

```ts
// Cualquier Profile es válido donde se espera Profile.
// El campo user_type actúa como discriminador sin romper la interfaz.
type Profile = {
  user_type: "donor" | "professional";
  // Todos los campos son accesibles para ambos subtipos
};
```

**Componentes reutilizables** (`Card`, `Button`, `Modal`) funcionan igual independientemente del contexto donde se usen — mantienen contratos de props consistentes.

---

## I — Interface Segregation Principle (ISP)

> _"Los clientes no deben depender de interfaces que no usan."_

### Implementación

Los tipos en `types/index.ts` están segmentados por responsabilidad:

```ts
// ❌ Sin ISP: una interfaz gigante
type User = {
  id, name, blood_type, health_license, hospital, ...; // todos los campos
}

// ✅ Con ISP: tipos específicos
type Profile = { id, full_name, blood_type, user_type, ... };
type AptitudeSurveyAnswers = { q1, q2, q3, ... }; // único al formulario
type RegisterStep1Data = { full_name, blood_type, ... }; // único al registro
type RegisterStep2Data = { city, address, images... };
type RegisterStep3Data = { username, password... };
```

Cada página solo importa los tipos que necesita, sin depender de una interfaz monolítica.

---

## D — Dependency Inversion Principle (DIP)

> _"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."_

### Implementación

**`AppContext.tsx`** es el módulo de alto nivel que consume los servicios a través de la abstracción que proveen sus módulos:

```tsx
// AppContext depende de las abstracciones (funciones exportadas), no de Supabase directamente
import { watchAuthState, signOut as authSignOut } from "../lib/auth";
import { getUnreadCount } from "../lib/notifications";

// Las páginas dependen del contexto (abstracción), no de Supabase
const { authUser, profile } = useApp();
// Jamás: const { data } = await supabase.from("profiles").select()...
```

**Capas de abstracción:**

```
Páginas (UI)
    ↓ usan
AppContext / hooks
    ↓ usan
lib/services (auth, blood-requests, donations, ...)
    ↓ usan
supabase client
```

Cada capa solo conoce la capa inmediatamente inferior. Cambiar Supabase por otro backend solo requeriría modificar los archivos en `src/lib/`.

---

## Resumen visual

```
                 ┌─────────────────────────────────────────┐
                 │              BloodApp                   │
                 │                                         │
  SRP ──────────→│  Un archivo = Una responsabilidad       │
  OCP ──────────→│  Componentes extensibles por props      │
  LSP ──────────→│  Tipos compatibles e intercambiables    │
  ISP ──────────→│  Tipos pequeños y específicos           │
  DIP ──────────→│  UI → Context → Services → Supabase     │
                 └─────────────────────────────────────────┘
```
