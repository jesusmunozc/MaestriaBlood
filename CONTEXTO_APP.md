# !Blood — Contexto General de la Aplicación

> Versión actualizada: Marzo 2026

---

## 1. Visión general

**!Blood** es una aplicación móvil de origen colombiano cuyo propósito es **conectar de forma segura y solidaria a personas que necesitan sangre con donantes voluntarios**, y facilitar la organización de campañas de donación por parte de profesionales de la salud. La plataforma opera bajo un principio de donación **voluntaria, altruista y sin fines lucrativos**, promoviendo comunidad y confianza entre sus usuarios.

**Tagline:** _Dona vida, recibe vida_

---

## 2. Objetivo principal

Reducir la brecha entre la oferta y demanda de sangre en Colombia, ofreciendo:

- Una red de donantes voluntarios verificados.
- Un canal seguro para publicar y gestionar solicitudes urgentes de sangre.
- Un espacio organizado para campañas de donación masiva.
- Un sistema de reputación y compromiso que incentive la seriedad en las donaciones.

---

## 3. Perfiles de usuario

### 3.1 Ciudadano

Puede actuar como **donante** y/o **solicitante** de sangre. Tiene acceso a:

- Ver solicitudes de sangre compatibles cercanas.
- Publicar solicitudes de sangre (para sí mismo o para un familiar).
- Aceptar donaciones y comprometerse con el proceso.
- Participar en campañas de donación.
- Ver su historial de donaciones y solicitudes.

### 3.2 Profesional de salud

Usuario verificado con credenciales de salud. Adicional a las funciones de ciudadano, puede:

- Crear y gestionar campañas de donación (jornadas en centros de salud, universidades, etc.).
- Visualizar el estado de cupos y participantes de sus campañas.

---

## 4. Flujo general de la aplicación

```
Splash → Login / Registro → Home
         ├── Crear solicitud de sangre
         ├── Explorar solicitudes (dona sangre)
         │    └── Detalle de solicitud → Quiero Donar → Confirmar → Calificación
         ├── Campañas de donación
         │    └── Crear campaña (solo profesionales)
         ├── Notificaciones
         └── Perfil
```

> **Nota:** El módulo de chat fue eliminado. La coordinación se realiza directamente con el centro de salud indicado en la solicitud.

---

## 5. Pantallas y mockups

### 5.1 Splash Screen

- Logo con gota de sangre animada (`!Blood`).
- Botones: "Iniciar Sesión" y "Registrarme".
- Tagline: _Juntos creamos una comunidad que salva vidas_.

---

### 5.2 Login

- Campo: usuario o nombre de usuario.
- Campo: contraseña (con opción de mostrar/ocultar).
- Link: "¿Olvidaste tu contraseña?".
- Link: "¿No tienes cuenta? Regístrate".

> Sin campo de correo electrónico en el login principal (se usa el nombre de usuario como identificador).

---

### 5.3 Registro — Paso 1: Datos Personales

**Tipo de usuario:** Ciudadano | Profesional de salud.

**Campos:**

- Nombre completo.
- Fecha de nacimiento.
- Tipo de sangre (selector: A+, A-, B+, B-, AB+, AB-, O+, O-).
- **Tipo de identificación** (selector): `TI` (Tarjeta de Identidad), `CC` (Cédula de Ciudadanía), `CE` (Cédula de Extranjería), `PA` (Pasaporte), `NIT`.
- Número de identificación.

> ❌ **Eliminado:** Teléfono y correo electrónico ya no son datos de registro ni forman parte del perfil de ningún tipo de usuario.

---

### 5.4 Registro — Paso 2: Verificación

**1. Cédula / Documento (cara frontal)**

- Placeholder: "Cara frontal del documento".
- El usuario debe fotografiar o subir la cara frontal del documento.

**2. Cédula / Documento (cara posterior)**

- Placeholder: "Cara posterior del documento".
- El usuario debe fotografiar o subir la cara posterior del documento.

**3. Foto de perfil (cámara)**

- La foto de perfil **se toma directamente desde la cámara** del celular en el momento del registro.
- No se permite subir una imagen de la galería.
- Esta foto **no se cruza con el documento de identidad**. Su propósito es **evitar que una misma persona abra dos cuentas simultáneas** mediante reconocimiento facial básico.
- Instrucción visible: _"Toca para abrir la cámara y tomarte una foto. Fondo claro, rostro visible."_

**4. Ciudad**

- Campo de texto.

**5. Dirección**

- Campo de texto con opción de usar ubicación GPS.

---

### 5.5 Registro — Paso 3: Cuenta

- Nombre de usuario (identificador único).
- Contraseña + confirmación.
- Indicador de seguridad de contraseña.
- Checkboxes:
  - Acepto los Términos y condiciones y la Política de privacidad.
  - Acepto el compromiso de donación solidaria sin fines de lucro.

> Al presionar "Crear cuenta", el sistema lleva al usuario a la **encuesta de aptitud para donación**.

---

### 5.6 Registro — Encuesta de aptitud para donar sangre

**Contexto:** Esta encuesta aplica únicamente a usuarios que se registren como ciudadanos. Su objetivo es evaluar si el usuario podría ser un donante viable. Las respuestas **no bloquean el registro** pero quedan almacenadas y permiten al sistema orientar al usuario sobre su aptitud como donante.

**Título en pantalla:** _"¿Eres apto para donar sangre?"_

**Preguntas (respuesta Sí / No):**

1. ¿Tienes entre 18 y 65 años?
2. ¿Pesas más de 50 kg?
3. ¿Has donado sangre en los últimos 3 meses?
4. ¿Has tenido alguna enfermedad infecciosa recientemente (hepatitis, VIH, sífilis u otras de transmisión sanguínea)?
5. ¿Estás tomando algún medicamento actualmente?
6. ¿Has recibido alguna vacuna en los últimos 4 semanas?
7. ¿Has realizado alguna conducta de riesgo en los últimos 12 meses (tatuajes, piercings, transfusiones)?
8. ¿Estás en buen estado de salud general hoy?

**Al final** se muestra un mensaje:

- Si el usuario tiene alta aptitud: _"¡Perfecto! Parece que podrías ser un donante. Cuando veas una solicitud compatible, anímate a ayudar."_
- Si hay factores de riesgo: _"Gracias por responder. Algunos de tus datos sugieren que por ahora no podrías donar, pero puedes participar de otras formas en la comunidad."_

> Esta encuesta se puede volver a responder desde el perfil.

---

### 5.7 Home

**Header:**

- Avatar del usuario (foto tomada con cámara).
- Nombre del usuario.
- Botón de notificaciones con badge.

**Tarjeta de tipo de sangre:**

- Tipo de sangre del usuario.
- Estadísticas: donaciones realizadas / vidas ayudadas.

**Acciones rápidas:**

- Solicitar sangre.
- Ver solicitudes.
- Campañas.
- _(Mensajes/Chat: eliminado)_.

**Solicitudes cercanas** y **Campañas próximas**.

**Barra de navegación inferior:**

- Inicio | Explorar | ➕ (crear) | Perfil.
- _(Chat eliminado)_.

---

### 5.8 Crear solicitud de sangre

**Campos:**

- Tipo de sangre necesario (selector radial).
- Unidades necesarias (selector +/-).
- **Nivel de urgencia**: Bajo | Medio | **Urgente**.
- Centro de salud.
- Mensaje para donantes (opcional, 200 caracteres).

#### ⚠️ Advertencia de nivel "Urgente"

Cuando el usuario selecciona "Urgente", aparece un **modal de advertencia** antes de continuar:

> _"¿Confirmas que la situación es realmente urgente?_
> _Si marcas urgente y luego rectificas que no lo era, se aplicará una **penalización temporal**: no podrás crear nuevas solicitudes en la app durante un tiempo definido."_
>
> Botones: **"Sí, es urgente"** | **"Cambiar a urgencia media"**

- Si confirma "Urgente": La solicitud se publica con prioridad máxima.
- Si cambia de urgencia ya publicada: Se aplica la penalización y se muestra un aviso claro al usuario.

---

### 5.9 Solicitud publicada — Pantalla de éxito

- Ícono animado de gota de sangre (`!Blood`) pulsando.
- Mensaje: _"¡Solicitud publicada!"_
- Info: número de donantes notificados, aviso de notificaciones.

---

### 5.10 Lista de solicitudes (Explorar)

- Barra de búsqueda.
- Filtros: Todas | Urgentes | Compatible | Cercanas.
- Tarjetas de solicitud con: nombre, tipo de sangre, urgencia, hospital, distancia.

---

### 5.11 Detalle de solicitud _(actualizado)_

**Estructura actualizada de la pantalla (de arriba a abajo):**

1. Hero con tipo de sangre + nivel de urgencia.
2. Unidades necesarias.
3. **Botón "Quiero donar"** — _(ahora visible inmediatamente, justo debajo de unidades necesarias)_.
4. Aviso de compatibilidad.
5. Información del solicitante.
6. Mensaje del solicitante.
7. Centro de salud + distancia + botón mapa.
8. Información de tiempo y donantes aceptados.

> El botón "Quiero donar" debe ser visible **sin necesidad de hacer scroll** para maximizar la tasa de donaciones aceptadas.

> ❌ **Eliminado:** Nota sobre "coordinar a través del chat interno". Ahora dice: _"La donación se realiza en el centro de salud indicado. Preséntate con tu documento de identidad."_

---

### 5.12 Confirmar donación _(actualizado)_

- Resumen: solicitante, tipo de sangre, centro de salud.
- Sección de compromiso:
  - Acudiré al centro de salud indicado.
  - Esta donación es voluntaria y sin fines de lucro.
- Checklist de salud básico (pre-encuesta rápida):
  - No he donado sangre en los últimos 3 meses.
  - No tengo enfermedad infectocontagiosa activa.
  - Tengo entre 18 y 65 años.
  - Peso más de 50 kg.

#### ⚠️ Advertencia de cancelación (antes de confirmar)

**Bloque visible antes del botón de confirmación:**

> _"⚠️ Compromiso serio: Una vez confirmes tu donación, si decides cancelar, **no podrás aceptar donaciones con ningún otro usuario durante 30 días**. Puede estar en juego una vida. ¿Confirmas tu compromiso?"_

- **Botón principal:** "Confirmar mi donación"
- **Botón secundario (pequeño):** "Cancelar" → lleva a aviso de penalización.

---

### 5.13 Donación confirmada _(actualizado)_

- Ícono animado de corazón / gota de sangre.
- Mensaje: _"¡Gracias por comprometerte!"_
- Instrucciones: _"Preséntate en [nombre del centro] con tu documento de identidad. La donación es totalmente voluntaria y confidencial."_
- Botón: "Volver al inicio".
- _(Eliminado: botón "Ir al chat")_.

---

### 5.14 Cancelación de donación aceptada

Si el donante ya confirmó y desea cancelar desde "Mis donaciones":

**Modal de advertencia:**

> _"⚠️ ¿Seguro que deseas cancelar esta donación?_
>
> _Esta acción tendrá consecuencias:_
> _— No podrás aceptar nuevas solicitudes de donación durante **30 días**._
> _— La persona que solicitó sangre será notificada._
>
> _Recuerda: esta persona puede estar dependiendo de ti. Si tienes un impedimento de salud, comunícate directamente con el centro de salud._"
>
> Botones: **"Mantener mi compromiso"** (primario) | **"Cancelar de todas formas"** (secundario, color rojo).

---

### 5.15 Sistema de calificación mutua

**Contexto:** Después de que se marca una donación como completada (o no asistida), tanto el donante como el receptor pueden calificarse mutuamente.

#### Pantalla de calificación

**Título:** _"Califica tu experiencia"_

- Sistema de **1 a 5 estrellas** (interactivo).
- Campo de comentario opcional (150 caracteres).

**Aviso de imparcialidad (visible siempre antes de calificar):**

> _"🌎 Recuerda: la sangre no tiene color, género, religión ni orientación. La calificación debe basarse **únicamente** en el comportamiento, puntualidad y actitud de la persona. Cualquier calificación discriminatoria puede resultar en la suspensión de tu cuenta."_

- Botón: "Enviar calificación".
- Opción: "Omitir".

**Las estrellas acumuladas** se muestran en el perfil del usuario como indicador de reputación en la comunidad.

---

### 5.16 Campañas de donación

#### Lista de campañas

- Filtros: Cercanas | Esta semana | Este mes.
- Tarjetas con: nombre, institución, fecha/hora, cupos disponibles, distancia.

#### Detalle de campaña

- Nombre, organizador (verificado), descripción.
- Ubicación + botón mapa.
- Horario.
- Tipos de sangre necesarios.
- Requisitos para donar.
- Disponibilidad de cupos (barra de progreso).
- Botón: "Reservar mi cupo".

---

### 5.17 Crear campaña (Profesional de salud) _(actualizado)_

**Campos:**

- Nombre de la campaña.
- Centro de salud / Institución.
- Dirección del evento (+ GPS).
- Fecha, hora inicio, hora fin.
- Cupos disponibles.
- Tipos de sangre necesarios.
- Descripción de la campaña.
- Requisitos para donar.

#### 💬 Mensaje motivacional al profesional de la salud

**Bloque visible al final del formulario, antes del botón "Publicar campaña":**

> _"💛 Recuerda: cada donante que atiendes hoy puede convertirse en un donante de por vida. Un trato amable, agradecido y sin juicios es la mejor forma de que regresen. ¡Gracias por ser parte del cambio!"_

> ❌ **Eliminado:** Campo de "Contacto para información" (teléfono).

---

### 5.18 Campaña publicada — Pantalla de éxito

- Ícono animado de gota de sangre / campaña.
- Mensaje: "¡Campaña publicada!"
- Información: usuarios notificados, fecha, lugar.

---

### 5.19 Perfil de usuario _(actualizado)_

**Header:**

- Avatar (foto tomada con cámara en el registro).
- Nombre completo.
- Nombre de usuario (@handle).
- Badges: Verificado, Donante activo.

**Tarjeta de estadísticas:**

- Tipo de sangre.
- Donaciones realizadas.
- Vidas ayudadas.
- Solicitudes publicadas.
- **Calificación promedio** (estrellas).

**Mi información:**

- Tipo y número de identificación.
- Ciudad.
- Fecha de registro.
- _(Eliminado: correo electrónico y teléfono)_.

**Opciones:**

- Editar perfil.
- Notificaciones.
- Privacidad.
- Encuesta de donante (volver a responder).
- Ayuda.
- Cerrar sesión.

---

### 5.20 Notificaciones _(actualizado)_

Tipos de notificaciones:

- Nueva solicitud urgente cercana.
- Donante aceptó tu solicitud.
- Donación confirmada / registrada.
- Recordatorio de campaña próxima.
- Sistema: medallas, logros.
- _(Eliminado: notificaciones de mensajes/chat)_.

---

## 6. Elemento visual interactivo — Gota de Sangre

La gota del logo `!Blood` actúa como **elemento visual celebratorio** que se anima en las siguientes acciones clave:

| Acción                            | Comportamiento de la gota                    |
| --------------------------------- | -------------------------------------------- |
| Publicar una solicitud de sangre  | Gota pulsa y rebota (efecto heartbeat)       |
| Aceptar / confirmar una donación  | Gota rellena de rojo con efecto de llenado   |
| Registrar una donación completada | Gota hace efecto de explosión suave + brillo |
| Publicar una campaña de donación  | Gota se multiplica en pequeñas gotas         |
| Registro exitoso de usuario       | Gota cae desde arriba con efecto de splash   |

La animación dura entre 1.5 y 3 segundos y **no bloquea la interfaz**.

---

## 7. Sistema de penalizaciones

| Conducta                                    | Penalización                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| Marcar urgencia como "Urgente" y rectificar | Bloqueo temporal de creación de solicitudes (tiempo configurable por admin) |
| Cancelar una donación ya aceptada           | No puede aceptar donaciones durante **30 días**                             |
| Calificación discriminatoria comprobada     | Suspensión de cuenta                                                        |
| No asistir a la donación sin cancelar       | El receptor puede calificar con 1 a 5 estrellas                             |

---

## 8. Arquitectura y atributos de calidad

### 8.1 Disponibilidad

**Tácticas aplicadas:**

- **Heartbeat**: monitoreo periódico de servicios críticos (notificaciones, backend, base de datos). Si un componente falla, se detecta en segundos.
- **Degradation**: ante fallos parciales, el sistema mantiene las funciones esenciales (registro, solicitudes, campañas) aunque suspenda temporalmente otras (estadísticas, historial avanzado).

**Escenario crítico:** El servidor de notificaciones falla durante una solicitud urgente → el sistema sigue operando; la solicitud permanece visible y activa.

---

### 8.2 Modificabilidad

**Tácticas aplicadas:**

- **Dividir módulo**: cada funcionalidad es independiente (registro, solicitudes, campañas, notificaciones, perfil). Esto permitió eliminar el módulo de chat sin afectar otros módulos.
- **Encapsular**: los módulos se comunican solo a través de interfaces definidas (APIs internas). El módulo de chat fue encapsulado y puede retirarse sin propagar cambios.

**Escenario real:** El chat fue eliminado de la app porque algunos usuarios lo utilizaban de forma inapropiada (compartir datos, comercialización de sangre). Al estar encapsulado, se retiró sin afectar registro, solicitudes, campañas ni perfil.

---

### 8.3 Usabilidad

**Tácticas aplicadas:**

- **Mantener modelo del sistema**: indicadores visuales de estado en todo momento (progreso de registro, donantes confirmados, cupos de campaña, estado de solicitud).
- **Mantener modelo de tarea**: la interfaz se adapta al tipo de acción que el usuario está realizando (donante ≠ solicitante ≠ profesional de salud).

**Ejemplos:**

- El botón "Quiero donar" aparece visible sin scroll en el detalle de solicitud.
- La advertencia de cancelación está clara antes de confirmar una donación.
- La encuesta de aptitud orienta al usuario sobre su viabilidad como donante.

---

## 9. Principios de diseño de la comunidad

1. **Solidaridad sin lucro:** ninguna transacción económica dentro de la plataforma.
2. **Inclusión y respeto:** las calificaciones no pueden cargarse de prejuicios. Aviso explícito en la pantalla de calificación.
3. **Compromiso real:** las penalizaciones buscan proteger vidas, no sancionar sin razón.
4. **Privacidad:** los datos de identidad no se comparten con otros usuarios. El tipo y número de ID solo se usan para verificación interna.
5. **Trato digno:** el profesional de salud recibe un recordatorio de tratar bien a los donantes para fomentar la fidelización.

---

## 10. Datos que maneja la app (por usuario)

| Dato                                 | Ciudadano | Profesional |
| ------------------------------------ | --------- | ----------- |
| Nombre completo                      | ✅        | ✅          |
| Fecha de nacimiento                  | ✅        | ✅          |
| Tipo de sangre                       | ✅        | ✅          |
| Tipo de identificación               | ✅        | ✅          |
| Número de identificación             | ✅        | ✅          |
| Foto de perfil (cámara)              | ✅        | ✅          |
| Foto documento (frontal + posterior) | ✅        | ✅          |
| Ciudad                               | ✅        | ✅          |
| Dirección                            | ✅        | ✅          |
| Nombre de usuario                    | ✅        | ✅          |
| Contraseña                           | ✅        | ✅          |
| Correo electrónico                   | ❌        | ❌          |
| Teléfono                             | ❌        | ❌          |
| Encuesta de aptitud donante          | ✅        | Opcional    |
| Historial de donaciones              | ✅        | ✅          |
| Calificación promedio                | ✅        | ✅          |

---

## 11. Glosario rápido

| Término               | Significado                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| Ciudadano             | Usuario que puede donar y/o solicitar sangre                              |
| Profesional de salud  | Usuario verificado que puede crear campañas                               |
| Solicitud             | Pedido de sangre publicado por un ciudadano                               |
| Campaña               | Jornada organizada por un profesional de salud                            |
| Donación              | Acto de aceptar y completar una solicitud de sangre                       |
| Aptitud para donación | Resultado de la encuesta de elegibilidad del donante                      |
| Penalización          | Restricción temporal por conductas irresponsables dentro de la plataforma |
