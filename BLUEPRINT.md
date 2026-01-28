# 📄 BLUEPRINT: RR-ONDA (News Automation Dashboard)

**Estado:** V1.0 - Fuente de Verdad Absoluta
**Lead Architect:** Antigravity (Senior Software Architect / Google Product Specialist)

---

## 1. Stack Tecnológico (The Tech Sovereign)

Hemos seleccionado herramientas que maximizan la velocidad de entrega sin comprometer la escalabilidad a largo plazo.

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
  - _Justificación:_ Renderizado híbrido (SSR/ISR) para SEO dinámico y Server Actions para manejar API Keys de forma 100% segura en el servidor.
- **Estilizado:** [Tailwind CSS v4](https://tailwindcss.com/)
  - _Justificación:_ Motor de alto rendimiento, configuración basada en variables CSS y diseño "Utility-First" que garantiza una UI premium y coherente.
- **Gestión de Estado:** [Zustand](https://github.com/pmndrs/zustand)
  - _Justificación:_ Minimalista, atómico y mucho más rápido de implementar que Redux para estados globales de noticias y filtros.
- **IA Engine:** [Ollama (Local AI)](https://ollama.com/)
  - _Justificación:_ Privacidad de datos absoluta, costo operativo cero por inferencia y latencia reducida al procesar en local.
- **Validación:** [Zod](https://zod.dev/)
  - _Justificación:_ Tipado fuerte en runtime. Si los datos de la API de noticias cambian, el sistema falla de forma controlada y predecible.

---

## 2. Estructura de Carpetas (Scalable Domain Pattern)

Seguimos un patrón de **Diseño Orientado al Dominio (DDD)** simplificado para Next.js.

```text
/root
  ├── /app               # Routing y Server Components (Next.js App Router)
  │   ├── /api           # API Routes para integraciones externas
  │   ├── /actions       # Server Actions (Lógica de Negocio Lado Servidor)
  │   └── /local, /news  # Dominios específicos de la aplicación
  ├── /components        # Componentes de UI puramente funcionales
  │   ├── /ui            # Atómicos (Buttons, Inputs, Globe) - Shadcn Style
  │   ├── /layout        # Sidebar, Header, Footer
  │   └── /dashboard     # Componentes complejos de la página principal
  ├── /lib               # Configuración de herramientas (api-clients, db)
  ├── /store             # Estados globales de Zustand
  ├── /hooks             # Lógica de React reutilizable (useDebounce, useAuth)
  ├── /types             # Definiciones de TypeScript e interfaces
  └── /public            # Assets estáticos (Images, SVGs)
```

---

## 3. Flujo de Onboarding y Sesiones (The Gold Path)

### A. Experiencia del "Primer Usuario" (Cold Start)

1.  **Landing / Auth:** El usuario es recibido por una pantalla de login minimalista (Auth.js). No hay acceso al Dashboard sin sesión activa.
2.  **Config Wizard (Crítico):** Al entrar por primera vez, el sistema verifica las variables `.env`. Si faltan API Keys de noticias o Ollama no está detectado, se muestra un _Setup Wizard_ amigable.
3.  **Tutorial de 3 Pasos:**
    - _Step 1:_ "Escaneando el mundo": Animación del globo 3D mientras se fetchean las primeras noticias.
    - _Step 2:_ "Tu IA Local": Explicación de cómo Ollama analizará la viralidad.
    - _Step 3:_ "Publicación lista": Guía de cómo adaptar una noticia para redes.

### B. Gestión de Sesión y Rutas Protegidas

- **Persistencia:** Usamos Cookies cifradas (`httpOnly`) para almacenar el token de sesión.
- **Middleware:** Un archivo `middleware.ts` intercepta cada petición. Si la sesión no es válida, redirige al `/login` antes de que el cliente descargue el código de la página.

### C. Flujo de Seguridad "Deep Shell"

- **Identificación:** El sistema usa `NextAuth (v5)` con estrategia JWT y persistencia en SQLite (`Drizzle`).
- **Interceptación:** El `middleware.ts` valida cada señal. Si un analista no está autenticado, la "Onda" lo redirige automáticamente al `/login`.
- **Auto-Provisión:** Para facilitar el despliegue local, el sistema crea automáticamente un perfil `Admin` si se usa la contraseña maestra `onda2026` en el primer acceso.

---

## 4. Estrategia de Documentación (The Knowledge Base)

- **DEV_LOG.md:** Registro obligatorio de cada sesión. Contiene: `Fecha | Tarea | Bloqueos | Decisión Técnica`.
- **Implementation Plan:** Documento dinámico que marca el progreso por hitos.

---

## 5. Guía de Estilo y Voz (UX Strategy)

- **Voz:** "El Analista Visionario". Tono profesional, directo, experto pero accesible. Evitamos tecnicismos innecesarios en la UI.
- **UX Writing:**
  - _Mal:_ "Ocurrió un error al cargar la información".
  - _Bien (Voz RR-ONDA):_ "Perdimos contacto con la fuente de noticias. Reintentando conexión..."
- **SEO Keywords Críticos:** News Automation, AI Dashboard Colombia, Viral News Tracking, Real-time Analysis, Ollama Integration.

---

## 6. Estándares de Calidad (The Law)

1.  **TypeScript:** Prohibido el uso de `any`. Toda interfaz de API debe estar documentada en `/types`.
2.  **Clean Code:** funciones de más de 40 líneas deben ser refactorizadas. Lógica de red siempre en `lib/api` o `actions`.
3.  **Performance:** Toda imagen debe usar `next/image`. Las fuentes deben ser locales o vía Google Fonts optimizado.
4.  **Linting:** ESLint estricto con Prettier para formateo automático al guardar (Configuración compartida).

---

_Este documento es la ley. Todo agente debe consultarlo antes de realizar cambios estructurales._
