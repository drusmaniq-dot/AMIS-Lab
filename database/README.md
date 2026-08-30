# Database snapshot

Git only tracks code — the actual database content (people, projects,
publications, equipment, etc.) lives in Postgres and never gets pushed on its
own. This folder is a point-in-time export of that content, so a freshly
migrated (but empty) database — e.g. one just provisioned on Replit — can be
restored to match the site as it existed here.

## What's in `data/`

One JSON file per table: `users`, `people`, `profileLinks`, `projects`,
`publications` (712 records), `digitalTools`, `services`, `equipment`,
`socialLinks`, `homeMedia`, `siteSettings`. Row shapes match the Prisma models
in `prisma/schema.prisma` exactly — this is a direct export via Prisma Client,
not a hand-written seed.

`users` includes the real admin account (`asmahafzal@gmail.com`) and its
bcrypt password hash, so the same login keeps working after a restore. Three
throwaway QA accounts created during development (`verify-test-*@example.com`)
were deliberately excluded — they're the only rows in the entire database that
weren't carried over.

## Restoring onto a new/empty database

```bash
# 1. Point DATABASE_URL at the target database, then apply the schema:
npx prisma migrate deploy

# 2. Load the data:
npx tsx database/seed.ts
```

Safe to re-run — every insert uses `skipDuplicates` (or `upsert` for the
singleton `SiteSettings` row) keyed on the original record ids, so running it
twice against the same database just no-ops the second time.

This was tested end-to-end against a genuinely empty local database before
being committed: `prisma migrate deploy` + `database/seed.ts` reproduced every
row, with all relations (e.g. `ProfileLink → Person`) and `DateTime` fields
intact.

## Regenerating this snapshot

If the live database changes and you want to refresh this export, write a
one-off script that queries each Prisma model and writes
`database/data/<table>.json` — that's exactly how these files were produced.
