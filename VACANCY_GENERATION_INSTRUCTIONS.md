# AI-Powered Vacancy Generation — Frontend Integration Guide

This document describes how to build the frontend UI for the interactive AI vacancy generation feature. The backend exposes a stateful, multi-step workflow where an admin provides a job description, the AI generates a complete vacancy draft (title, interview questions, evaluation prompt), the admin can selectively regenerate parts with feedback, and finally approve to persist everything to the database.

---

## Table of Contents

1. [User Flow Overview](#1-user-flow-overview)
2. [API Endpoints](#2-api-endpoints)
3. [Service Layer](#3-service-layer)
4. [Routing](#4-routing)
5. [Page & Component Structure](#5-page--component-structure)
6. [State Management](#6-state-management)
7. [UI Specifications](#7-ui-specifications)
8. [Error Handling](#8-error-handling)
9. [UX Considerations](#9-ux-considerations)

---

## 1. User Flow Overview

```
┌─────────────────────────────────────────────────────┐
│  Step 1: INPUT                                      │
│  Admin writes/pastes a job description              │
│  Optionally adjusts num_questions (5-20, default 12)│
│  and questions_per_interview (3-10, default 5)      │
│  Clicks "Generar con IA"                            │
└──────────────────────┬──────────────────────────────┘
                       │ POST /vacancies/generate
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 2: REVIEW DRAFT                               │
│  Three sections displayed:                          │
│    - Title (editable label + regenerate button)     │
│    - Questions list (regenerate button)             │
│    - Evaluation prompt (collapsible + regenerate)   │
│                                                     │
│  Each section has a "Regenerar" button              │
│  Optional feedback textarea for regeneration        │
│  "Aprobar y crear vacante" button at the bottom     │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
           │ regenerate           │ approve
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────┐
│  POST /regenerate│   │  POST /approve               │
│  Updates only    │   │  Persists vacancy + questions │
│  selected parts  │   │  Redirects to /admin/vacantes│
│  Returns to      │   └──────────────────────────────┘
│  REVIEW step     │
└──────────────────┘
```

---

## 2. API Endpoints

Base URL: `/api/v1/vacancies`

### 2.1 Generate Vacancy Draft

```
POST /api/v1/vacancies/generate
```

**Request:**
```json
{
  "job_description": "string (required, min 50 chars)",
  "num_questions": 12,
  "questions_per_interview": 5
}
```

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `job_description` | string | yes | — | min 50 characters |
| `num_questions` | integer | no | 12 | range 5–20 |
| `questions_per_interview` | integer | no | 5 | range 3–10 |

**Response (200):**
```json
{
  "thread_id": "e40ae9e3-9c95-4124-b01f-a5fd06bc192a",
  "title": "Desarrollador Backend Senior Python",
  "job_description": "...(echoed from request)",
  "questions": [
    "Cuéntame sobre tu experiencia...",
    "Describe una situación donde..."
  ],
  "evaluation_prompt": "Eres un experto en recursos humanos...",
  "questions_per_interview": 5
}
```

**Errors:**
- `422` — Validation error (job_description too short, num_questions out of range, etc.)
- `500` — AI generation failure

**Note:** This call can take 10–30 seconds. Show a loading state with a message like "Generando vacante con IA... esto puede tardar unos segundos."

---

### 2.2 Regenerate Specific Parts

```
POST /api/v1/vacancies/generate/{thread_id}/regenerate
```

**Request:**
```json
{
  "parts": ["title", "questions"],
  "feedback": "Hazlo más técnico y enfocado en Python"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `parts` | string[] | yes | min 1 item. Valid values: `"title"`, `"questions"`, `"evaluation_prompt"` |
| `feedback` | string | no | Free-text instructions for the AI |

**Response (200):** Same shape as generate (`VacancyGenerateResponse`). Only the requested parts change; the rest are preserved from the previous state.

**Errors:**
- `404` — `{"detail": "Generation draft {thread_id} not found"}` (session expired or server restarted)
- `422` — Validation error (empty parts array)
- `500` — AI generation failure

---

### 2.3 Approve and Persist

```
POST /api/v1/vacancies/generate/{thread_id}/approve
```

**Request:** Empty body (no payload needed).

**Response (201):**
```json
{
  "id": 1,
  "name": "Desarrollador Backend Senior Python",
  "description": "...(original job description)",
  "evaluation_prompt": "...",
  "questions_per_interview": 5,
  "created_at": "2026-03-27T16:15:54",
  "questions": [
    {
      "id": 1,
      "text": "Cuéntame sobre tu experiencia...",
      "vacancy_id": 1,
      "order": 1,
      "created_at": "2026-03-27T16:15:54"
    }
  ]
}
```

**Errors:**
- `404` — Draft not found (session expired)
- `500` — Database save failure

**On success:** Redirect to `/admin/vacantes`. The new vacancy will appear in the list.

---

## 3. Service Layer

Add these functions to `src/services/vacancies.js`, following the existing pattern:

```javascript
// --- AI Generation ---

export async function generateVacancy(data) {
  const response = await api.post('/vacancies/generate', data)
  return response.data
}

export async function regenerateVacancyParts(threadId, data) {
  const response = await api.post(`/vacancies/generate/${threadId}/regenerate`, data)
  return response.data
}

export async function approveVacancy(threadId) {
  const response = await api.post(`/vacancies/generate/${threadId}/approve`)
  return response.data
}
```

These follow the same `api.post()` → `response.data` pattern used by `create()`, `update()`, etc.

---

## 4. Routing

Add a new route in `src/App.jsx` inside the admin routes:

```jsx
<Route path="/admin/vacantes/generar" element={<GenerateVacancy />} />
```

Place it **before** the `/admin/vacantes` route so React Router matches it first.

**Entry point:** Add a button on the existing Vacancies page (`/admin/vacantes`) that navigates to this new route. Place it next to the existing "Nueva Vacante" button:

```
[+ Nueva Vacante]  [✦ Generar con IA]
```

---

## 5. Page & Component Structure

Create a new page at `src/pages/Admin/Vacancies/GenerateVacancy.jsx` with its CSS Module `GenerateVacancy.module.css`.

The page has two phases:

### Phase 1: Input Form
- **Job description** — `<textarea>` with character count, min 50 chars
- **Number of questions** — `<input type="number">` (5–20, default 12)
- **Questions per interview** — `<input type="number">` (3–10, default 5)
- **Submit button** — "Generar con IA" (disabled while loading)

### Phase 2: Draft Review (shown after generation succeeds)
Three review sections, each as a card:

**Title Card:**
- Display the generated title in a heading
- "Regenerar título" button

**Questions Card:**
- Numbered list of all generated questions
- Badge showing `{questions.length} preguntas generadas, {questions_per_interview} por entrevista`
- "Regenerar preguntas" button

**Evaluation Prompt Card:**
- Collapsible/expandable section (long text)
- Show first ~200 chars with "Ver más" toggle
- "Regenerar prompt de evaluación" button

**Feedback Input (shared):**
- A textarea that appears when any "Regenerar" button is clicked
- Placeholder: "Instrucciones opcionales para la IA (ej: hazlo más técnico, enfoca en liderazgo...)"
- "Enviar" button to submit regeneration

**Action Bar (bottom):**
- "Aprobar y crear vacante" primary button
- "Volver a empezar" secondary/ghost button (resets to Phase 1)
- "Cancelar" link back to `/admin/vacantes`

---

## 6. State Management

Use React `useState` hooks (consistent with existing pages). No context needed since this is a single-page flow.

```javascript
// Phase tracking
const [phase, setPhase] = useState('input') // 'input' | 'review'

// Input form
const [formData, setFormData] = useState({
  job_description: '',
  num_questions: 12,
  questions_per_interview: 5,
})

// Draft state (from API response)
const [draft, setDraft] = useState(null)
// draft = { thread_id, title, job_description, questions, evaluation_prompt, questions_per_interview }

// Regeneration
const [regenerating, setRegenerating] = useState(null) // null | 'title' | 'questions' | 'evaluation_prompt'
const [feedback, setFeedback] = useState('')

// Loading & errors
const [generating, setGenerating] = useState(false)
const [approving, setApproving] = useState(false)
const [error, setError] = useState(null)
```

### thread_id Lifecycle
- Created server-side on `POST /generate`, returned in the response
- Stored in `draft.thread_id`
- Passed to `/regenerate` and `/approve` endpoints
- **Do not persist** to localStorage — it's only valid during the current server session
- If 404 on regenerate/approve → show error "La sesión de generación expiró. Por favor, genera de nuevo."

---

## 7. UI Specifications

### 7.1 Input Form Phase

```
┌──────────────────────────────────────────────────┐
│  Generar Vacante con IA                          │
│                                                  │
│  Descripción del puesto *                        │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │  (textarea, 6-8 rows)                    │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│  23/50 caracteres mínimos                        │
│                                                  │
│  Número de preguntas        Preguntas por        │
│  ┌─────────┐                entrevista           │
│  │ 12      │                ┌─────────┐          │
│  └─────────┘                │ 5       │          │
│  (5-20)                     └─────────┘          │
│                             (3-10)               │
│                                                  │
│  [Cancelar]              [✦ Generar con IA]      │
└──────────────────────────────────────────────────┘
```

### 7.2 Draft Review Phase

```
┌──────────────────────────────────────────────────┐
│  ← Volver                                       │
│                                                  │
│  Borrador de Vacante                             │
│                                                  │
│  ┌─ Título ──────────────────────────────────┐   │
│  │  Desarrollador Backend Senior Python      │   │
│  │                            [Regenerar ↻]  │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Preguntas (8 generadas, 4 por entrevista) ┐  │
│  │  1. Cuéntame sobre tu experiencia...       │  │
│  │  2. Describe una situación donde...        │  │
│  │  3. Al diseñar APIs RESTful...             │  │
│  │  ...                                       │  │
│  │                            [Regenerar ↻]   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Prompt de Evaluación ────────────────────┐   │
│  │  Eres un experto en recursos humanos...   │   │
│  │  [Ver más]                                │   │
│  │                            [Regenerar ↻]  │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Feedback (visible when regenerating) ────┐   │
│  │  ┌──────────────────────────────────────┐ │   │
│  │  │ Instrucciones opcionales para la IA  │ │   │
│  │  └──────────────────────────────────────┘ │   │
│  │              [Cancelar]  [Enviar feedback] │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  [Volver a empezar]    [Aprobar y crear vacante] │
└──────────────────────────────────────────────────┘
```

### 7.3 CSS Module Guidelines

Follow the existing pattern from `Vacancies.module.css`:
- Use `.container`, `.header`, `.card`, `.actions` class naming
- Reuse button patterns: `.btnPrimary`, `.btnCancel`, `.btnDelete` (for destructive actions)
- Form fields: `.formGroup`, `.label`, `.input`, `.textarea`
- Error states: `.errorBanner`, `.formError`
- Loading text: `.statusText`

---

## 8. Error Handling

Follow the existing pattern from `Vacancies.jsx`:

```javascript
try {
  const result = await generateVacancy(formData)
  setDraft(result)
  setPhase('review')
} catch (err) {
  setError(err.response?.data?.detail || 'Error al generar la vacante. Intenta de nuevo.')
}
```

### Specific Error Scenarios

| Scenario | HTTP Code | User Message |
|----------|-----------|--------------|
| Job description too short | 422 | "La descripción debe tener al menos 50 caracteres." |
| AI generation fails | 500 | "Error al generar con IA. Por favor, intenta de nuevo." |
| Draft expired (regenerate/approve) | 404 | "La sesión de generación expiró. Por favor, genera de nuevo." → Reset to Phase 1 |
| Approve fails | 500 | "Error al guardar la vacante. Intenta de nuevo." |

On 404 errors during regenerate/approve, automatically reset to Phase 1 (`setPhase('input')`, `setDraft(null)`).

---

## 9. UX Considerations

### Loading States
- **Generation (10–30s):** Disable form, show spinner + "Generando vacante con IA... esto puede tardar unos segundos."
- **Regeneration (5–15s):** Disable the specific "Regenerar" button, show spinner on that card only. Keep the rest of the draft visible and interactive.
- **Approval (<2s):** Disable "Aprobar" button, show "Guardando..."

### Animations
- Smooth transition from Phase 1 to Phase 2 (simple fade or slide)
- Highlight the regenerated section briefly after update (subtle background flash)

### Responsive
- Stack the two number inputs vertically on small screens
- Questions list should scroll if very long (max-height with overflow)

### Accessibility
- `aria-busy="true"` on sections being regenerated
- Descriptive button labels: "Regenerar título", "Regenerar preguntas", "Regenerar prompt de evaluación"
- Character count announced via `aria-live="polite"`

### Navigation Guard
- If the user has a draft and tries to navigate away, show a confirmation dialog: "Tienes un borrador sin aprobar. ¿Estás seguro de que quieres salir?"

---

## Quick Reference: Data Flow

```
formData ──POST /generate──→ draft (with thread_id)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              [title]    [questions]  [eval_prompt]
                    │           │           │
                    └───────────┼───────────┘
                                │
              feedback ──POST /regenerate──→ updated draft
                                │
                     POST /approve──→ saved vacancy (with id)
                                │
                        redirect to /admin/vacantes
```
