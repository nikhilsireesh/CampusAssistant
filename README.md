# MIC Campus Assistant

An AI-powered campus support platform built for **DVR & Dr. HS MIC College of Technology**. Students ask questions in natural language, get answers grounded in an official knowledge base, and — when a question needs real action — the assistant automatically opens a support ticket that goes straight to the college administration. There is no staff layer in between: every request is a direct line between a student and admin, who gets real-time analytics on what's happening across campus.

> Built as a college project. Prioritizes working end-to-end functionality, a clean architecture, and free-tier-friendly infrastructure over completeness of every conceivable feature.

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Folder structure](#folder-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Neon (database) setup](#neon-database-setup)
- [Gemini (AI) setup](#gemini-ai-setup)
- [Database seeding](#database-seeding)
- [Development commands](#development-commands)
- [Deploying to Render](#deploying-to-render)
- [Demo credentials](#demo-credentials)
- [AI architecture](#ai-architecture)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

## Overview

A university's administrative offices field thousands of repetitive student questions every semester — attendance, fees, exams, hostel issues, scholarships, certificates. MIC Campus Assistant gives students one place to ask, get grounded answers, and file a request when a human needs to act — routed straight to admin, with nothing lost in a staff hand-off.

## Features

- **AI Campus Assistant** — natural-language chat, grounded in the college's own knowledge base, with conversation history.
- **Automatic ticket creation** — when a question needs real action, the assistant classifies it (category, department tag, priority) and opens a ticket that goes directly to admin.
- **Full ticket lifecycle** — Open → admin **Accepts** it → admin **Resolves** it with a note → the student **Closes** it to confirm, or **Reopens** it if the issue isn't actually fixed. Every step is timestamped on the ticket's timeline.
- **Admin dashboard** — live stats, a "new requests awaiting review" queue, category/department/status charts, a 30-day trend, and an AI-generated (or rule-based) insight.
- **Knowledge base** — searchable articles across a dozen categories; admins can create/edit/publish/unpublish.
- **Announcements** — admin-authored, audience-targeted (student/admin/all), with publish/expiry dates.
- **Notifications** — in-app, database-backed, for every ticket state change on both sides.
- **Role-based access control** — only two roles, student and admin, enforced in middleware **and** on every server component/API route (not just hidden UI).
- **Graceful AI fallback** — if `GEMINI_API_KEY` is missing or Gemini is unreachable, the app keeps working: knowledge-base search + rule-based classification take over silently.

## Architecture

```
Student message
      │
      ▼
Rate limit + validation (Zod)
      │
      ▼
Intent & category classification ── Gemini (JSON, Zod-validated) ──┐
      │                                                            │ fails/unavailable
      ▼                                                            ▼
Knowledge base retrieval (Postgres full-text search)      Rule-based keyword classifier
      │
      ▼
Grounded answer generation ── Gemini ──► fails/unavailable ──► return top KB match directly
      │
      ▼
requiresTicket? ──yes──► createTicket() (deterministic backend function, not the model)
      │                        │
      ▼                        ▼
Persist chat + ai_interactions   Ticket created "Open", admin notified directly — no staff hand-off
```

Key principle: **the model classifies and drafts prose; the backend decides and executes.** Ticket numbers, department tags, statuses, and permissions are all deterministic backend logic — the AI's structured output is validated with Zod before anything is written to the database, and it can never write to the database directly.

## Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS v4, shadcn/ui (Base UI primitives), Lucide icons, Recharts, Framer Motion |
| Database | Neon PostgreSQL (serverless driver) |
| ORM | Drizzle ORM + drizzle-kit migrations |
| AI | Google Gemini via `@google/genai` |
| Auth | Custom credential auth — bcrypt password hashing, JWT session cookies (`jose`), edge middleware for route protection |
| Validation | Zod, React Hook Form |

## Folder structure

```
app/                     Routes (App Router)
  student/ admin/         Role-scoped dashboards (each has its own layout + guard)
  api/                    Route handlers (REST-style JSON API)
  login/                  Login page
components/
  ui/                     shadcn/ui primitives
  layout/                 Dashboard shell, sidebar nav, user menu
  assistant/              Chat window, messages, suggestions
  tickets/                Ticket cards, timeline, badges, detail view
  knowledge/ announcements/ notifications/ analytics/ dashboard/ auth/ profile/
lib/
  db/                     Drizzle schema + client
  ai/                     Gemini service, types, category mapping, rate limiting
  services/               Business logic (tickets, knowledge, analytics, chat, users...)
  auth/                   Session, password hashing, route guards
  validation/             Zod schemas shared by client forms and API routes
drizzle/                  Generated SQL migrations
scripts/                  migrate.ts, seed.ts
```

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL / GEMINI_API_KEY / AUTH_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in with one of the [demo accounts](#demo-credentials).

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string (pooled). |
| `GEMINI_API_KEY` | No | Without it, the app runs in fallback mode (see [AI architecture](#ai-architecture)). |
| `GEMINI_MODEL` | No | Defaults to a current Flash model if unset. |
| `AUTH_SECRET` | Yes | Random secret for signing session cookies. |

Never commit `.env.local` — it's already covered by `.gitignore` (`.env*`).

## Neon (database) setup

This project was provisioned with the Neon CLI:

```bash
npm i -g neon@latest && neon login      # opens a browser for auth
neon skills -y
neon mcp -y
neon link --project-id ancient-fire-62650377 --branch production -y
neon config init
neon deploy
```

`neon link` writes `DATABASE_URL` (and a few related variables) straight into `.env.local` for you. `neon.ts` holds the project's Neon configuration (`defineConfig({})`) and `neon deploy` applies it. If you're setting this up against your **own** Neon project instead, just run `neon link --project-id <your-project-id> --branch <branch> -y` and everything downstream (migrate/seed) works unchanged.

## Gemini (AI) setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.
2. Put it in `.env.local` as `GEMINI_API_KEY=...`.
3. (Optional) Set `GEMINI_MODEL` to pin a specific model; otherwise a current low-cost Flash model is used.

The app never sends the key to the browser — all Gemini calls happen in server-only modules (`lib/ai/gemini.ts`). If the key is missing, invalid, rate-limited, or the API is briefly down, the assistant automatically falls back to knowledge-base search + rule-based classification and tells the student AI-enhanced responses are temporarily unavailable — it never crashes the request.

## Database seeding

```bash
npm run db:seed
```

Seeds departments (kept as an organizational tag on tickets — there's no staff role), demo accounts (one admin + five students), a full knowledge base, sample tickets across the whole lifecycle (Open, In Progress, Resolved, Waiting for Student, Closed), announcements, and sample AI chat history so every dashboard is populated on first run. **Seeding truncates and rewrites all application tables** — safe to re-run any time you want a clean demo state.

## Development commands

```bash
npm run dev          # start the dev server
npm run build         # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run db:generate   # generate a new Drizzle migration from schema changes
npm run db:migrate    # apply migrations to DATABASE_URL
npm run db:seed       # reset + reseed demo data
```

## Deploying to Render

The repo includes a [`render.yaml`](render.yaml) Blueprint that provisions the web
service for you — the database itself stays on Neon (it already has the seeded
demo data; Render's free Postgres plan is deleted after 30 days, which isn't a
good fit for a database you want to keep).

1. Push the repo to GitHub (already done if you're reading this from there).
2. In the [Render dashboard](https://dashboard.render.com), click **New → Blueprint** and select this repo. Render reads `render.yaml` and sets up the web service automatically.
3. Fill in the two prompted secrets:
   - `DATABASE_URL` — your Neon **pooled** connection string (Neon project → Connect).
   - `GEMINI_API_KEY` — optional; leave blank to run in rule-based fallback mode.
   - `AUTH_SECRET` is generated for you automatically — no action needed.
4. Click **Apply**. First deploy takes a few minutes (`npm ci && npm run build`, then `npm start`).

The free plan spins the service down after 15 minutes of inactivity and takes
~30-60s to wake back up on the next request — fine for a demo, upgrade to a
paid plan for an always-on instance.

## Demo credentials

> ⚠️ **These are demo accounts only** — do not reuse these passwords in a real deployment. Passwords are bcrypt-hashed in the database either way.

| Role | Email | Password |
|---|---|---|
| Student | `student@mictech.edu.in` | `Student@123` |
| Admin | `admin@mictech.edu.in` | `Admin@123` |

Suggested walkthrough: sign in as the student → **AI Assistant** → ask *"What is the minimum attendance requirement?"* (grounded KB answer) → ask *"I paid my semester fee yesterday but it is still showing unpaid."* (auto-creates a Fees ticket, sent straight to admin) → sign out → sign in as admin → open the new ticket, click **Accept request** (moves it to In Progress), then **Resolve** with a note → sign out → sign in as the student, open the ticket, and click **Close ticket** to confirm it's fixed (or **Reopen** if it isn't) → sign back in as admin and watch the dashboard numbers reflect it.

## AI architecture

See the [Architecture](#architecture) diagram above. In short:

- **Classification** (`classifyCampusQuery`) asks Gemini for strict JSON — `intent`, `category`, `priority`, `requiresTicket`, `confidence`, optional clarification — validated with Zod. The **department** is never taken from the model; it's looked up from a fixed `CATEGORY_TO_DEPARTMENT` map on the backend so the AI can't invent a department name.
- **Retrieval** (`searchKnowledgeBase`) uses Postgres full-text search (weighted `tsvector` over title/keywords/content) with an OR-joined query builder — tuned so a full sentence question still surfaces the right article — plus an `ILIKE` fallback for very short or unusual queries. No vector database required.
- **Generation** (`generateCampusResponse`) sends Gemini only the top 1–3 retrieved knowledge chunks plus recent conversation context — never the whole knowledge base, and never unrelated student data — with a system prompt that forbids inventing policies, dates, fees, or departments.
- **Ticket creation** happens in a plain backend function (`createTicket`) once `requiresTicket` is true; the model's classification is advisory input, not something with direct write access. Every ticket goes straight to admin — there is no intermediate staff role or department hand-off.
- **Fallback mode**: if `GEMINI_API_KEY` is unset or any Gemini call throws (missing key, invalid key, rate limit, network/service error, empty response), classification falls back to a keyword-based classifier and the answer falls back to the top knowledge-base match — the student is told AI-enhanced responses are temporarily unavailable, but nothing breaks and a ticket can still be filed.
- **Rate limiting**: a small in-memory limiter (`lib/ai/rate-limit.ts`) caps AI requests per user per minute and blocks rapid duplicate submissions, to protect the free Gemini quota during a demo.

## Security notes

- Passwords are hashed with bcrypt; sessions are signed JWTs in an `httpOnly`, `sameSite=lax` cookie (`secure` in production).
- **Every** protected route is checked twice: edge middleware (`proxy.ts`) redirects unauthenticated/wrong-role requests before the page renders, and every server component/API route independently re-checks the session (`requireRole` / `requireApiRole`) — UI hiding is never the only guard.
- API routes validate all input with Zod and never trust client-supplied IDs for authorization (e.g. a student can only ever see and act on their own tickets, and only close/reopen a resolved one; only admin can accept/resolve/manage anything, or touch knowledge base/announcements/analytics).
- `GEMINI_API_KEY` and `DATABASE_URL` are read only in server-only modules (`import "server-only"`) and are never sent to the browser.
- Only the minimum context needed is sent to Gemini for a given question — not raw student records, not the full knowledge base, not other students' data.

## Troubleshooting

**"DATABASE_URL is not set" / queries fail** — copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, or re-run `neon link` if you have the Neon CLI configured.

**AI answers say "temporarily unavailable"** — this is the designed fallback path. Either `GEMINI_API_KEY` is unset, the key is invalid, or Gemini's free tier is rate-limited. The rest of the app (knowledge search, ticketing, dashboards) keeps working regardless.

**Login fails with correct demo credentials** — make sure you've run `npm run db:seed` against the same `DATABASE_URL` your dev server is using.

**Migrations fail with "relation already exists"** — you likely already have the schema from a previous `db:migrate` run; this is safe to ignore, or run `npm run db:seed` which truncates and reseeds all tables without touching the schema.
