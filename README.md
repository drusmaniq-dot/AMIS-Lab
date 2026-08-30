# AMIS Lab Website

Public website and role-based admin system for the AMIS Lab research group (Advanced Materials, Innovation & Sustainability).

Stack: Next.js 16 (App Router) · TypeScript · Prisma 7 + PostgreSQL · NextAuth v4 (Credentials/JWT) · Tailwind CSS + shadcn/ui.

## Roles

- **Public** — browses all content read-only.
- **Member** — signs up (pending admin approval), then manages their own People profile and submits Projects/Publications (also pending admin approval before they go live).
- **Admin** — approves sign-ups and pending content, has direct CRUD over every section, manages users, and edits sitewide settings (Home intro, Director's Message, footer social links, Home media, contact info).

## Getting started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a local or hosted PostgreSQL database) and `NEXTAUTH_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npx prisma generate
   ```
3. Apply the schema to your database:
   ```bash
   npx prisma migrate dev
   ```
4. Seed demo data (creates an admin account from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`, plus sample People/Projects/Publications/etc.):
   ```bash
   npx prisma db seed
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## File uploads

Controlled by `STORAGE_DRIVER` in `.env`:
- `local` (default) — writes to `public/uploads/`. Fine for local dev or a persistent-filesystem host; **does not work on Vercel** (ephemeral/read-only filesystem).
- `s3` — any S3-compatible bucket (AWS S3, Cloudflare R2, Supabase Storage). Requires the `S3_*` variables in `.env.example`. Use this if deploying to Vercel.

## Project structure

- `app/(public)/` — public site (Home, People, Projects, Publications, Digital Tools, Services, Equipment, Contact, login/register).
- `app/dashboard/` — logged-in Member area (own profile, own Projects/Publications).
- `app/admin/` — Admin-only area (approvals, full content CRUD, site settings, user management).
- `prisma/schema.prisma` — data model. `prisma/seed.ts` — demo data.
- `lib/auth.ts`, `lib/permissions.ts` — auth config and role/ownership checks used by every Server Action.
- `lib/storage.ts` — pluggable file upload driver (local/S3).
- `proxy.ts` — coarse-grained route protection for `/admin` and `/dashboard` (Next.js 16 renamed `middleware.ts` to `proxy.ts`).

## Known limitations (documented, not accidental)

- Editing an already-published Person/Project/Publication as its owning Member sends it back to `PENDING` review, temporarily hiding it from the public site until an admin re-approves. A versioned/"keep old version live" workflow would need a separate revision table.
- Suspending a user doesn't invalidate their existing session immediately (JWT sessions are stateless) — it blocks their *next* login.
- Branding colors in `app/globals.css` are approximated from the AMIS Lab logo pack, not an official style guide.
