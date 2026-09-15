# Deploying to Google Cloud Run

This builds the app into a Docker image (see `Dockerfile`) and deploys it as
a Cloud Run service. Cloud Run is serverless — no VMs to manage, scales to
zero when idle, and TLS/HTTPS is handled for you.

## Prerequisites

- `gcloud` CLI installed and authenticated (`gcloud auth login`), pointed at
  your work GCP project: `gcloud config set project YOUR_PROJECT_ID`
- The Cloud Run and Artifact Registry APIs enabled:
  ```bash
  gcloud services enable run.googleapis.com artifactregistry.googleapis.com
  ```
- Your Neon Postgres connection strings (pooled + direct — see README).
- A generated `AUTH_SECRET`: `npx auth secret` (or `openssl rand -base64 32`)
  prints one. Use a fresh one for production — don't reuse the local dev
  value from `.env.example`.

## 1. Create an Artifact Registry repo (one-off)

```bash
gcloud artifacts repositories create schools-compliance \
  --repository-format=docker \
  --location=europe-west2 \
  --description="Schools Compliance container images"
```

Pick a `--location` close to your Neon database region to minimize latency
(the Neon project set up earlier is in `eu-west-2` / London, so
`europe-west2` is a good match).

## 2. Build and push the image

```bash
gcloud builds submit \
  --tag europe-west2-docker.pkg.dev/YOUR_PROJECT_ID/schools-compliance/app:latest
```

This uses Cloud Build (no local Docker daemon needed) — it reads the
`Dockerfile` in this repo and pushes the built image straight to Artifact
Registry.

## 3. Store secrets in Secret Manager (recommended over --set-env-vars)

```bash
gcloud services enable secretmanager.googleapis.com

echo -n "postgresql://...-pooler...?sslmode=require&channel_binding=require" | \
  gcloud secrets create DATABASE_URL --data-file=-
echo -n "postgresql://...(no -pooler)...?sslmode=require&channel_binding=require" | \
  gcloud secrets create DIRECT_URL --data-file=-
echo -n "$(npx auth secret --raw 2>/dev/null || openssl rand -base64 32)" | \
  gcloud secrets create AUTH_SECRET --data-file=-
```

(Repeat for `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` if you're wiring up email —
otherwise team invites and "email me this report" just log to the server
console instead of sending, which is harmless but not useful in
production. See "Gmail SMTP" below for where `SMTP_USER`/`SMTP_PASS` come
from if you're sending via a Google Workspace mailbox.)

Cloud Run's default service account needs permission to read these secrets
— grant it once (project-wide is simplest for a project this size):

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 4. Deploy

```bash
gcloud run deploy schools-compliance \
  --image europe-west2-docker.pkg.dev/YOUR_PROJECT_ID/schools-compliance/app:latest \
  --region europe-west2 \
  --allow-unauthenticated \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,AUTH_SECRET=AUTH_SECRET:latest \
  --set-env-vars NEXTAUTH_URL=https://PLACEHOLDER,SEED_DEMO_TENANT=false
```

The first deploy prints a `*.run.app` URL. **Redeploy once more** with
`NEXTAUTH_URL` set to that real URL (Auth.js needs to know its own public
URL for callbacks/cookies to work correctly):

```bash
gcloud run deploy schools-compliance \
  --image europe-west2-docker.pkg.dev/YOUR_PROJECT_ID/schools-compliance/app:latest \
  --region europe-west2 \
  --update-env-vars NEXTAUTH_URL=https://schools-compliance-xxxxx.a.run.app
```

If you attach a custom domain later (`gcloud run domain-mappings create`),
update `NEXTAUTH_URL` to that domain the same way.

## 5. Push schema + seed data to the database

Run these once, from anywhere with network access to your Neon DB (your own
machine is easiest — this sandbox's network is blocked from reaching
neon.tech directly):

```bash
npm run db:push   # creates tables from prisma/schema.prisma
npm run db:seed   # seeds the DfE standards catalogue
```

Set `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` in your local `.env` before
seeding if you want a platform super admin created at the same time.

## Optional: Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
   **APIs & Services → OAuth consent screen** — set it up for "Internal" (if
   this is a Google Workspace org) or "External" with your domain(s) as
   authorized. App name/logo don't matter functionally.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type "Web application".
   - **Authorized redirect URI**: `https://YOUR_RUN_APP_URL/api/auth/callback/google`
     (use the real Cloud Run URL from step 4 above — add it again after a
     custom domain if you attach one).
3. Copy the generated Client ID and Client Secret:
   ```bash
   echo -n "your-client-id.apps.googleusercontent.com" | gcloud secrets create AUTH_GOOGLE_ID --data-file=-
   echo -n "your-client-secret" | gcloud secrets create AUTH_GOOGLE_SECRET --data-file=-
   ```
4. Redeploy with the new secrets plus the allowed-domains env var:
   ```bash
   gcloud run deploy schools-compliance \
     --image europe-west2-docker.pkg.dev/YOUR_PROJECT_ID/schools-compliance/app:latest \
     --region europe-west2 \
     --update-secrets AUTH_GOOGLE_ID=AUTH_GOOGLE_ID:latest,AUTH_GOOGLE_SECRET=AUTH_GOOGLE_SECRET:latest \
     --update-env-vars GOOGLE_SSO_ALLOWED_DOMAINS=education-lincs.com
   ```

Google sign-in never auto-creates accounts — see README for how the domain
allowlist + existing-account check work together.

## Gmail SMTP (sending as a Google Workspace mailbox)

1. Sign in to the sending mailbox (e.g. `helpdesk@education-lincs.com`) at
   [myaccount.google.com](https://myaccount.google.com).
2. **Security → 2-Step Verification** — must be on first.
3. **Security → App passwords** ([myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
   — create one, copy the 16-character password.
4. That's `SMTP_PASS`; `SMTP_USER` is the mailbox address. Use
   `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`.

If "App passwords" is missing/greyed out, your Workspace admin has disabled
them org-wide — ask them to either enable app passwords for this account or
allowlist Cloud Run's egress via Workspace's SMTP relay service instead
(`smtp-relay.gmail.com`, no per-account password, but needs an IP
allowlist).

## Redeploying after a code change

```bash
gcloud builds submit --tag europe-west2-docker.pkg.dev/YOUR_PROJECT_ID/schools-compliance/app:latest
gcloud run deploy schools-compliance --image europe-west2-docker.pkg.dev/YOUR_PROJECT_ID/schools-compliance/app:latest --region europe-west2
```

A schema change also needs `npm run db:push` run again against the target
database before the new code that depends on it goes live.
