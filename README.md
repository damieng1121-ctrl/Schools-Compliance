# Schools Compliance

A standalone, multi-tenant dashboard for schools to self-assess and track their
readiness against the DfE's ["Meeting digital and technology
standards"](https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges)
framework.

Each school signs up as its own tenant, works through the standards checklist,
ticks off items as they're met, attaches evidence/notes, sets review dates,
and can email themselves a plain-text progress report at any time to keep for
their records.

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL via Prisma
- Auth.js (NextAuth v5) with email/password credentials, JWT sessions
- Tailwind CSS
- Outbound email via SMTP (nodemailer) — falls back to console logging in dev

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (and DIRECT_URL if pooled) at minimum
npm run db:push        # create tables from prisma/schema.prisma
npm run db:seed        # seed the DfE standards catalogue
npm run dev
```

Any Postgres works, including [Neon](https://neon.tech)'s free tier — grab
the pooled connection string for `DATABASE_URL` and the direct one for
`DIRECT_URL` from the Neon console.

Visit `/signup` to create your school's account (this creates a `Tenant` and
its first `ADMIN` user), or `/login` to sign in.

To also seed a demo tenant (`admin@demo-school.example` / `password123`), set
`SEED_DEMO_TENANT=true` before running `npm run db:seed`.

## Data model

- **Tenant** — one school. Every tenant-scoped table carries a `tenantId` and
  must be queried through `requireSession()` (`src/lib/session.ts`), never a
  client-supplied tenant id.
- **User** — belongs to exactly one tenant, with role `ADMIN` (manages team +
  settings) or `MEMBER` (views/edits the checklist).
- **ComplianceStandard** / **ComplianceItem** — a shared, global catalogue of
  the DfE standards (seeded from `prisma/seed.ts`), not tenant-scoped.
- **ComplianceAssessment** — one row per tenant per item: status, evidence,
  next review date. This is what a school actually edits.
- **AuditLog** — records privileged actions (assessment changes, report
  emails, team invites) for accountability.

## Linking from your school website

This app is a separate, standalone product — link to it from your school
website (e.g. "Check our digital standards compliance" → your deployed URL)
rather than embedding it. Each school's data stays isolated by tenant
regardless of how many sites link to it.

## Notes

- The DfE standards content in `prisma/seed.ts` reflects the shape and spirit
  of the published standards, not a verbatim copy — confirm current
  wording/thresholds on GOV.UK before using this for an official return.
- Team invites and the "email me this report" feature both go through the
  SMTP provider configured via `SMTP_*` env vars; unset in production, they
  fail silently (logged server-side) rather than breaking the request they're
  attached to.
