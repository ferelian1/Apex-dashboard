# Apex Dashboard

A production-grade, enterprise-ready **Collaborative Kanban Task Management Dashboard** built with Next.js 14+, TypeScript, Tailwind CSS, Clerk Auth, Supabase, and Prisma. Inspired by Jira and Trello.

> **Live Demo** — [apex-dashboard.vercel.app](https://apex-dashboard-olive.vercel.app/) · Click **"Log In as Recruiter Guest"** for instant access — no account needed.

---

## Features

- **Kanban boards** — drag-and-drop columns and tasks with optimistic UI (< 100ms feedback)
- **Real-time collaboration** — changes from other users appear instantly via Supabase Realtime
- **Multi-workspace** — organize boards into workspaces with role-based member access (OWNER / ADMIN / MEMBER)
- **Rich task details** — priority levels, assignees, due dates, labels, and comments
- **One-click guest demo** — pre-seeded recruiter account with a fully populated board
- **Dark mode** — full light/dark theme with a green primary palette
- **Fully responsive** — works from 375px mobile to 1920px desktop
- **Vercel-optimized** — serverless-ready with PgBouncer connection pooling and dynamic imports

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Shadcn/ui |
| Auth | Clerk |
| Database | Supabase Postgres |
| ORM | Prisma 5 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Real-time | Supabase Realtime (Postgres Changes) |
| Validation | Zod |
| Testing | Vitest + fast-check |
| Deployment | Vercel Serverless |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/sign-in / sign-up       # Clerk auth pages + guest login
│   ├── (dashboard)/                   # Protected dashboard shell
│   │   ├── page.tsx                   # Workspace list
│   │   ├── workspace/[slug]/          # Board list
│   │   └── workspace/[slug]/board/[id]# Kanban board page
│   └── api/
│       ├── webhooks/clerk/            # Clerk user sync webhook
│       └── realtime/token/            # Supabase Realtime auth token
├── components/
│   ├── kanban/                        # BoardView, ColumnCard, TaskCard, etc.
│   └── shared/                        # Navbar, Sidebar, DemoModeBanner, etc.
├── hooks/                             # useRealtime, useDragAndDrop
├── lib/
│   ├── actions/                       # Server Actions (task, column, workspace)
│   ├── db/                            # Prisma singleton + query helpers
│   ├── services/                      # Clerk helpers, Supabase client
│   └── utils/                         # Position utilities, Zod schemas
├── types/                             # TypeScript interfaces and re-exports
prisma/
├── schema.prisma                      # Database schema
└── seed.ts                            # Demo data seed script
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/apex-dashboard.git
cd apex-dashboard
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` — see [Environment Variables](#environment-variables) below.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

First create the guest Clerk account manually in the Clerk dashboard (email: `guest@apex-demo.com`), then:

```bash
GUEST_CLERK_ID=user_xxxx npx prisma db seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PgBouncer URL (port 6543, append `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct URL (port 5432, for migrations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret (Svix) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |
| `GUEST_USER_PASSWORD` | Password for `guest@apex-demo.com` Clerk account |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/apex-dashboard.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your repo — Vercel auto-detects Next.js
3. Add all environment variables from the table above
4. Click **Deploy**

### 3. Configure Clerk webhook

After the first deploy:

1. Clerk dashboard → **Webhooks → Add endpoint**
2. URL: `https://your-app.vercel.app/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`
4. Copy the signing secret → add as `CLERK_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy to pick up the new variable

### 4. Run production migration

```bash
DIRECT_URL="your-production-direct-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" DIRECT_URL="your-production-direct-url" \
  GUEST_CLERK_ID=user_xxxx npx prisma db seed
```

Every subsequent `git push` to `main` triggers an automatic Vercel deployment.

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Run Vitest (single pass)
npm run test:watch   # Run Vitest in watch mode
npx prisma studio    # Open Prisma database GUI
npx prisma db seed   # Re-seed the database
```

---

## Architecture Highlights

**Server Actions over REST** — all mutations use Next.js Server Actions for type-safe, co-located data mutations without a separate API layer.

**Optimistic UI** — `useOptimistic` applies drag-and-drop state changes within 100ms of drag start, reverting automatically if the server action fails.

**Gap-based position ordering** — columns and tasks use integer positions with 1000-unit gaps to minimize database writes during reordering. Full renumbering only triggers when gaps are exhausted.

**Singleton Prisma client** — stored on `globalThis` in development to survive Next.js hot-reloads without creating multiple connection pool instances.

**Dynamic imports** — `BoardView` is loaded with `dynamic(..., { ssr: false })` to prevent hydration errors from dnd-kit's browser-only pointer APIs.

---

## Database Schema

```
User ──< WorkspaceMember >── Workspace ──< Board ──< Column ──< Task ──< Comment
                                                                  │
                                                              assignee (User, nullable)
```

All cascade deletes are enforced at the database level via Prisma `onDelete: Cascade` and `onDelete: SetNull`.

---

## License

MIT
