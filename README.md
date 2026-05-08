# Digital Kakeibo

A full-stack personal finance journaling app inspired by the Japanese Kakeibo method (mindful budgeting through intentional reflection).

This repository is a monorepo with:
- `frontend` - Next.js App Router UI
- `backend` - Express + MongoDB API

---

## Table of contents

- [Tech stack](#tech-stack)
- [Core features](#core-features)
- [Monorepo structure](#monorepo-structure)
- [Environment variables](#environment-variables)
- [Run locally](#run-locally)
- [API overview](#api-overview)
- [Deploy (recommended)](#deploy-recommended)
- [Production checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Tech stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- TanStack Query
- Framer Motion

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT auth (access + refresh)
- Cookie-based session refresh
- Node Cron (weekly reminder job)

### Integrations
- Gemini API (AI insights)
- Resend (email)

---

## Core features

- User signup/login/logout with refresh token flow
- Guided onboarding (locale, base currency, weekly reminder day)
- Expense entry management:
  - Add/edit/delete entries
  - Category tracking (`needs`, `wants`, `culture`, `unexpected`)
  - Typed notes + handwritten notes
  - Multi-currency entry support
- Weekly dashboard:
  - Category chart
  - Recent entries
  - AI weekly insight
  - Currency-aware weekly summary (no mixed-currency totals)
- Reflections:
  - Weekly reflection prompts
  - Typed + handwritten reflection support
  - Reflection history
- Monthly close ritual:
  - Guided 4-question close
  - Monthly archive
  - Share card + public share link
- Light and dark theme support

---

## Monorepo structure

```text
Digital Kakeibo/
  backend/
    src/
      config/
      controllers/
      jobs/
      models/
      routes/
      services/
      utils/
  frontend/
    app/
    components/
    lib/
  .env.example
  package.json
```

### Why there is a root `node_modules`
Root has scripts/dev-dependencies (e.g. `concurrently`) to run frontend and backend together, so `npm install` at root creates `node_modules` there.

---

## Environment variables

Copy `.env.example` to `.env` for local development.

### Backend vars

- `PORT` - API server port (default `4000`)
- `MONGODB_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - access token signing secret
- `JWT_REFRESH_SECRET` - refresh token signing secret
- `ACCESS_TOKEN_TTL` - e.g. `15m`
- `REFRESH_TOKEN_TTL` - e.g. `7d`
- `CLIENT_URL` - frontend origin (for CORS/cookies)
- `COOKIE_SECURE` - `false` locally, `true` in production
- `ENABLE_WEEKLY_REMINDER_JOB` - `true/false`
- `RESEND_API_KEY` - optional email integration
- `RESEND_FROM_EMAIL` - sender identity
- `GEMINI_API_KEY` - optional AI insights

### Frontend vars

- `NEXT_PUBLIC_API_BASE_URL` - e.g. `http://localhost:4000/api`

---

## Run locally

### 1) Install dependencies

From repo root:

```bash
npm install
```

### 2) Configure env

Create `.env` at repo root from `.env.example`.

### 3) Start both apps

```bash
npm run dev
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

### Useful scripts

From root:

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run lint
```

---

## API overview

Base URL: `/api`

- Health:
  - `GET /health`
- Auth:
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`
  - `PATCH /auth/onboarding`
- Entries:
  - `GET /entries`
  - `GET /entries/:id`
  - `POST /entries`
  - `PATCH /entries/:id`
  - `DELETE /entries/:id`
- Weekly summary:
  - `GET /summary/week`
- Reflections:
  - `GET /reflections/weekly/current`
  - `POST /reflections/weekly`
  - `GET /reflections`
  - `PATCH /reflections/:id`
- Monthly:
  - `GET /monthly/status`
  - `POST /monthly/skip`
  - `POST /monthly/close`
  - `GET /monthly/archive`
  - `GET /monthly/:monthYear`
- Share cards:
  - `POST /share-cards`
  - `GET /share-cards/:cardId`
- AI:
  - `POST /ai/weekly-insights`

---

## Deploy (recommended)

### Frontend (Vercel)

- Project root: `frontend`
- Build command: `npm run build`
- Env:
  - `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>/api`

### Backend (Render/Railway)

- Project root: `backend`
- Build command:
  - `npm run build` (no-op build script exists intentionally)
- Start command:
  - `npm start`
- Env: set all backend variables listed above

### Database (MongoDB Atlas)

- Provide `MONGODB_URI`
- Allow backend network/IP access

---

## Production checklist

- `CLIENT_URL` points to deployed frontend domain
- `NEXT_PUBLIC_API_BASE_URL` points to deployed backend `/api`
- `COOKIE_SECURE=true` in production
- JWT secrets are strong and unique
- Atlas IP/network access configured
- Deploy from correct branch/project binding

---

## Troubleshooting

### Frontend build fails with duplicate key in `auth.tsx`
If error says `baseCurrency is specified more than once`, ensure onboarding payload object does not define the same key twice.

### Backend deploy fails: `Missing script: "build"`
Expected for plain Express projects if host runs `npm run build`. This repo includes a backend no-op build script.

### Monthly period shows previous month (e.g. April in May)
This is intentional: monthly close targets the previous month.

### Mixed currencies looked incorrectly summed
Weekly summary now groups by currency and lets the UI switch between currency totals.

### Handwritten reflection showed placeholder text
History rendering now prefers showing handwritten image when available.

### PNG export and `oklab` parser errors
PNG download flow was removed from monthly page; share link flow remains.

---

## Notes

- `frontend/README.md` is the default Next.js template.
- Use this root `README.md` as the main project documentation.

