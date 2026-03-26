# CLAUDE.md — Frontend

## Development Commands

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # production build to dist/
```

## Architecture

React 19 + Vite + CSS Modules frontend for a prescreening platform.

```
services/ → hooks/ → components/ → pages/ → App.jsx
```

| Layer | Does | Does NOT |
|-------|------|----------|
| `services/*.js` | Axios HTTP calls via shared `api.js` instance | State, rendering |
| `hooks/*.js` | State management, calls services | Render JSX |
| `components/` | Reusable UI, receives props | API calls, business logic |
| `pages/` | Page-level layout, composes components + hooks | Direct API calls |

**API client**: `src/services/api.js` — Axios instance with `baseURL` from `VITE_API_BASE_URL` or `/api/v1` (proxied by Vite in dev).

**Routing**: All routes defined in `App.jsx`. Admin pages wrapped in `AdminLayout`. Candidate flow uses `ApplyProvider` context for multi-step form state.

**Styling**: CSS Modules only (`.module.css` per component). No global CSS classes, no Tailwind, no CSS-in-JS.

## User Flows

- **Candidate flow** (public): multi-step application form (`/` → `/apply/step2` → `/apply/thanks`)
- **Admin flow**: dashboard to manage vacancies, questions, applications, and evaluations (`/admin/*`)

## Key Environment Variables (`.env`)

- `VITE_API_BASE_URL` — backend API URL (default: proxied via Vite to `http://localhost:8000`)

## Conventions

- PascalCase for components/pages (`.jsx`)
- camelCase with `use` prefix for hooks
- camelCase for services
- API versioned under `/api/v1/`
- Error format: `{"detail": "<message>"}`
