# Screening Automation — Frontend

Aplicación web para gestión de procesos de prescreening de candidatos. Construida con React 19, Vite y React Router v6.

## Stack Tecnológico

- **Framework UI:** React 19.0.0
- **Build Tool:** Vite 6.0.5
- **Enrutamiento:** React Router DOM 6.28.0
- **HTTP Client:** Axios 1.7.9
- **Estilos:** CSS Modules

## Requisitos

- Node.js 18+

## Setup

```bash
npm install
cp .env.example .env            # editar si es necesario
npm run dev                     # http://localhost:5173
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Preview del build de producción |

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de la API del backend | `/api/v1` |

## Conexión con el backend

En desarrollo, Vite proxea las peticiones `/api/*` al backend en `http://localhost:8000` (configurado en `vite.config.js`).

Para producción, configurar `VITE_API_BASE_URL` con la URL del backend desplegado.

## Estructura del proyecto

```
├── index.html
├── vite.config.js
├── package.json
├── .env.example
├── CLAUDE.md
└── src/
    ├── main.jsx             # Entry point
    ├── App.jsx              # Rutas y layout principal
    ├── services/            # Llamadas HTTP (Axios)
    ├── hooks/               # Custom hooks (estado)
    ├── context/             # React context (formulario multi-step)
    ├── components/          # Componentes reutilizables
    └── pages/               # Páginas (componen hooks + componentes)
```

## Rutas

### Admin
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login con JWT |
| `/admin` | Dashboard |
| `/admin/vacantes` | Listado de vacantes (con modal de detalle: preguntas, prompt, badge) |
| `/admin/vacantes/generar` | Generación de vacante con IA (refinamiento iterativo) |
| `/admin/aplicaciones` | Listado de aplicaciones |
| `/admin/aplicaciones/:id` | Detalle de aplicación |

### Candidato (público, sin autenticación)
| Ruta | Descripción |
|------|-------------|
| `/` | Paso 1: selección de vacante (`GET /vacancies/public`) |
| `/apply/step2` | Paso 2: grabación de respuestas (`GET /questions/interview`) |
| `/apply/thanks` | Confirmación de envío |

## Flujos de usuario

- **Candidato** (público): Formulario multi-step de postulación (`/` → `/apply/step2` → `/apply/thanks`)
- **Admin**: Dashboard para gestionar vacantes, postulaciones y evaluaciones (`/admin/*`)

## Arquitectura

### Autenticación
1. Admin inicia sesión via `POST /api/v1/auth/login` (form-encoded)
2. Backend retorna JWT token
3. Token se almacena en `sessionStorage`
4. Cada petición incluye `Authorization: Bearer {token}` (interceptor Axios)
5. Si token expira (401), se limpia y redirige a `/admin/login`

### Capas
- **services/**: Llamadas HTTP via Axios (`api.js` base + servicios por módulo)
- **hooks/**: Custom hooks con estado (useAuth, useCandidates, etc.)
- **components/**: UI reutilizable, recibe props
- **pages/**: Layout de página, compone hooks + componentes

### Estilos
CSS Modules (`.module.css` por componente). Sin CSS global, Tailwind ni CSS-in-JS.

## Backend

Este frontend está diseñado para funcionar con el backend en un repositorio separado. En desarrollo usa el proxy de Vite; en producción configurar `VITE_API_BASE_URL`.
