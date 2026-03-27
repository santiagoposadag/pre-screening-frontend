# Authentication Integration Guide — Frontend Changes

The backend now enforces JWT authentication on all admin-facing endpoints. This document describes every change the frontend needs to implement: replacing the hardcoded auth with real JWT login, attaching tokens to API requests, and handling auth errors globally.

---

## Table of Contents

1. [What Changed in the Backend](#1-what-changed-in-the-backend)
2. [Auth API Endpoints](#2-auth-api-endpoints)
3. [Token Management](#3-token-management)
4. [Axios Interceptor Setup](#4-axios-interceptor-setup)
5. [Auth Service Rewrite](#5-auth-service-rewrite)
6. [Route Protection Update](#6-route-protection-update)
7. [Login Page Update](#7-login-page-update)
8. [Endpoint Protection Map](#8-endpoint-protection-map)
9. [Error Handling](#9-error-handling)
10. [Registration (Optional)](#10-registration-optional)

---

## 1. What Changed in the Backend

All admin endpoints now require a valid JWT token in the `Authorization` header. Without it, they return:

```json
HTTP 401
{ "detail": "Not authenticated" }
```

**Public endpoints (no token needed):**
- `POST /api/v1/auth/register` — create account
- `POST /api/v1/auth/login` — get JWT token
- `GET /api/v1/questions/interview?vacancy_id=X` — candidate gets interview questions
- `POST /api/v1/applications/` — candidate submits application
- `GET /health`

**Everything else requires `Authorization: Bearer <token>`.**

---

## 2. Auth API Endpoints

### 2.1 Login

```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request body (form-encoded, NOT JSON):**
```
username=admin@sofka.com&password=admin123
```

| Field | Type | Note |
|-------|------|------|
| `username` | string | The user's **email** (OAuth2 spec uses "username") |
| `password` | string | Plain-text password |

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- `401` — `{"detail": "Invalid credentials"}` (wrong email or password)
- `401` — `{"detail": "User is inactive"}` (account deactivated)

**Important:** This endpoint expects `application/x-www-form-urlencoded`, not JSON. Use `URLSearchParams` or a `FormData` object in the request.

### 2.2 Get Current User

```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "admin@sofka.com",
  "full_name": "Admin User",
  "is_active": true,
  "created_at": "2026-03-27T17:13:30.001704"
}
```

**Errors:**
- `401` — Token missing, expired, or invalid

### 2.3 Register

```
POST /api/v1/auth/register
Content-Type: application/json
```

**Request:**
```json
{
  "email": "admin@sofka.com",
  "full_name": "Admin User",
  "password": "securepassword"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | yes | Valid email format, must be unique |
| `full_name` | string | yes | Non-empty |
| `password` | string | yes | Non-empty |

**Response (201):** Same shape as `GET /auth/me`.

**Errors:**
- `400` — `{"detail": "Email already registered"}` (duplicate email)
- `422` — Validation error (invalid email format, missing fields)

---

## 3. Token Management

### Where to Store

Replace the current `sessionStorage.setItem('admin_auth', 'true')` with storing the actual JWT token:

```javascript
// Store
sessionStorage.setItem('access_token', token)

// Retrieve
sessionStorage.getItem('access_token')

// Clear
sessionStorage.removeItem('access_token')
```

`sessionStorage` is fine — it clears on browser/tab close, which is appropriate for admin sessions.

### Token Lifetime

- Tokens expire after **60 minutes** (server-configured)
- When a token expires, API calls will return `401`
- On any `401`, redirect to login and clear stored token

### Token Format

Standard JWT with payload:
```json
{
  "sub": "admin@sofka.com",
  "exp": 1711562010
}
```

You don't need to decode it client-side — just store and attach it.

---

## 4. Axios Interceptor Setup

Update `src/services/api.js` to automatically attach the token and handle auth errors:

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('access_token')
      // Only redirect if we're on an admin page (don't break candidate flow)
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

With this interceptor, **no other service files need to change** — the token is added automatically to every request made through the `api` instance.

---

## 5. Auth Service Rewrite

Replace the hardcoded auth in `src/services/auth.js`:

```javascript
import api from './api'

const authService = {
  async login(email, password) {
    // Backend expects form-encoded data (OAuth2 spec)
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    sessionStorage.setItem('access_token', response.data.access_token)
    return response.data
  },

  logout() {
    sessionStorage.removeItem('access_token')
  },

  isAuthenticated() {
    return !!sessionStorage.getItem('access_token')
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export default authService
```

### Key Differences from Current Implementation

| Current (hardcoded) | New (JWT) |
|---------------------|-----------|
| `username === 'admin'` check | Real `POST /auth/login` call |
| `sessionStorage.setItem('admin_auth', 'true')` | `sessionStorage.setItem('access_token', jwt)` |
| Synchronous `login()` | Async `login()` — returns a Promise |
| No network call | Network call that can fail (wrong credentials, server down) |

---

## 6. Route Protection Update

Update `src/components/AdminLayout/AdminLayout.jsx` to handle async auth verification:

The simplest approach (check if token exists — the interceptor handles expired tokens):

```javascript
import authService from '../../services/auth'

// In the component:
if (!authService.isAuthenticated()) {
  return <Navigate to="/admin/login" replace />
}
```

This is the same pattern as before — just with the updated `isAuthenticated()` that checks for a token instead of `'admin_auth'`.

For a more robust approach, call `GET /auth/me` on mount to verify the token is still valid, and redirect to login if it's expired.

---

## 7. Login Page Update

Update `src/pages/Admin/Login/Login.jsx`:

```javascript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState(null)
const [loading, setLoading] = useState(false)

const handleLogin = async (e) => {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    await authService.login(email, password)
    navigate('/admin')
  } catch (err) {
    setError(err.response?.data?.detail || 'Error al iniciar sesión')
  } finally {
    setLoading(false)
  }
}
```

### Key Changes
- Rename "username" field to "email" (label and placeholder) — the backend authenticates by email
- Make `handleLogin` async with try/catch
- Add loading state to disable button during login
- Display server error messages (`"Invalid credentials"`, `"User is inactive"`)

---

## 8. Endpoint Protection Map

Complete reference of which endpoints require the token and which don't.

### Public Endpoints (no `Authorization` header)

| Method | Endpoint | Used By |
|--------|----------|---------|
| `POST` | `/api/v1/auth/login` | Login page |
| `POST` | `/api/v1/auth/register` | Registration (if implemented) |
| `GET` | `/api/v1/questions/interview?vacancy_id=X` | Candidate — StepTwo |
| `POST` | `/api/v1/applications/` | Candidate — submit application |
| `GET` | `/health` | Health check |

### Protected Endpoints (require `Authorization: Bearer <token>`)

**Auth:**
| Method | Endpoint | Used By |
|--------|----------|---------|
| `GET` | `/api/v1/auth/me` | Verify session, get user info |

**Vacancies (all protected):**
| Method | Endpoint | Used By |
|--------|----------|---------|
| `GET` | `/api/v1/vacancies/` | Admin — vacancy list |
| `POST` | `/api/v1/vacancies/` | Admin — create vacancy |
| `PUT` | `/api/v1/vacancies/{id}` | Admin — edit vacancy |
| `DELETE` | `/api/v1/vacancies/{id}` | Admin — delete vacancy |
| `POST` | `/api/v1/vacancies/generate` | Admin — AI generation |
| `POST` | `/api/v1/vacancies/generate/{thread_id}/regenerate` | Admin — regenerate parts |
| `POST` | `/api/v1/vacancies/generate/{thread_id}/approve` | Admin — approve draft |

**Questions (admin operations protected):**
| Method | Endpoint | Used By |
|--------|----------|---------|
| `GET` | `/api/v1/questions/` | Admin — question list |
| `POST` | `/api/v1/questions/` | Admin — create question |
| `PUT` | `/api/v1/questions/{id}` | Admin — edit question |
| `DELETE` | `/api/v1/questions/{id}` | Admin — delete question |

**Applications (admin operations protected):**
| Method | Endpoint | Used By |
|--------|----------|---------|
| `GET` | `/api/v1/applications/` | Admin — application list |
| `DELETE` | `/api/v1/applications/` | Admin — bulk delete |
| `GET` | `/api/v1/applications/{id}/video` | Admin — view video |
| `GET` | `/api/v1/applications/{id}/answers/{qid}/video` | Admin — view answer video |

**Evaluations (all protected):**
| Method | Endpoint | Used By |
|--------|----------|---------|
| `GET` | `/api/v1/applications/{id}/evaluation` | Admin — view evaluation |
| `POST` | `/api/v1/applications/{id}/evaluate` | Admin — run AI evaluation |
| `GET` | `/api/v1/applications/{id}/transcript` | Admin — download transcript |

---

## 9. Error Handling

### Auth-Specific Errors

| HTTP Code | `detail` | When | Frontend Action |
|-----------|----------|------|-----------------|
| `401` | `"Not authenticated"` | No token or expired token | Redirect to `/admin/login` |
| `401` | `"Invalid token"` | Malformed or tampered token | Clear token, redirect to login |
| `401` | `"User not found"` | User deleted or deactivated after token issued | Clear token, redirect to login |
| `401` | `"Invalid credentials"` | Wrong email/password on login | Show error on login form |
| `401` | `"User is inactive"` | Deactivated account tried to login | Show error on login form |
| `400` | `"Email already registered"` | Duplicate registration | Show error on register form |

### Global 401 Handling

The axios response interceptor (Section 4) handles all 401s globally. This means:
- Individual pages **don't** need to check for 401
- If a token expires mid-session, the next API call auto-redirects to login
- The candidate flow (`/`, `/apply/*`) is unaffected — the interceptor only redirects when on `/admin/*` paths

### Token Expiry UX

When a token expires (after 60 minutes):
1. Admin makes an API call → gets 401
2. Interceptor clears token and redirects to `/admin/login`
3. Admin logs in again → gets a fresh 60-minute token
4. Admin is back to `/admin` dashboard

No special "session expired" modal is needed — the redirect is sufficient.

---

## 10. Registration (Optional)

If you want to add an admin registration page:

**Route:** `/admin/register`

**Form fields:**
- Email (required, valid email)
- Full name (required)
- Password (required)

**Service call:**
```javascript
async register(email, fullName, password) {
  const response = await api.post('/auth/register', {
    email,
    full_name: fullName,
    password,
  })
  return response.data
}
```

**After registration:** Redirect to login page (registration does NOT return a token — the user must log in separately).

**Note:** Currently there is no role system — any registered user can access all admin endpoints. If you need to restrict who can register, that should be a backend change (e.g., invite-only registration, admin approval).

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `src/services/api.js` | Add request interceptor (attach token) + response interceptor (handle 401) |
| `src/services/auth.js` | Replace hardcoded auth with real JWT login/logout/isAuthenticated |
| `src/pages/Admin/Login/Login.jsx` | Make login async, use email field, handle API errors |
| `src/components/AdminLayout/AdminLayout.jsx` | Update `isAuthenticated()` check (minimal change) |

No changes needed in:
- `src/services/vacancies.js` — token attached automatically by interceptor
- `src/services/questions.js` — same
- `src/services/applications.js` — same
- Any admin page components — they already use the service layer
- Candidate flow pages (`StepOne`, `StepTwo`, `ThankYou`) — their endpoints are public
