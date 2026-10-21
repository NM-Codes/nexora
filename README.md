# Nexora — Better talent. Faster.

Nexora is a Swedish-language mini applicant tracking system (ATS) for a fictional recruiting company. It has separate customer and platform-administrator roles, a candidate Kanban, job management, private CV storage, and an optional AI assistant for CV review.

All people, work histories, jobs, and employer names in the demo are fictional. The Nexora workspace represents the sample customer and should not be treated as a real recruiting organization.

## What is included

- **Two roles:** administrators can manage customer organizations and invite administrator or customer accounts; customers work within their own organization.
- **Supabase authentication:** invited users register with their own email address and password. Roles are assigned from the administrator-created invitation.
- **Jobs and candidates:** create jobs, add candidate profiles and LinkedIn URLs, and attach a private PDF or Word CV (up to 5 MB).
- **Recruitment pipeline:** compact five-stage Kanban and list views, candidate name and job filters, candidate profiles, and stage updates.
- **Tenant isolation:** Supabase Row Level Security scopes customer data and private CV files by organization.
- **Optional CV assistant:** the UI asks the user to confirm before sending pasted CV text for an advisory summary, evidence, questions to clarify, and interview prompts. The current consent check is client-side only; see [Security](docs/security.md) before using the assistant with real CVs. It does not score, rank, or recommend hiring decisions.

The frontend and Supabase Edge Function are implemented in this repository. A public production deployment is not configured here. Live Supabase accounts need to register from an inbox they control, and the optional CV assistant needs an OpenAI API key and a deployed Edge Function.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Without Supabase environment variables, the app uses browser-local demo data. Sign in with:

- **Administrator:** admin
- **Customer:** kund
- **Password for both:** demo

Customer: kund

Password for both: demo

Changes stay in that browser. Do not use this mode for real candidate data.

To force local demo mode even when .env.local contains Supabase settings:

```sh
npm run dev:demo
```

For Supabase accounts, use an invited email address and the password chosen during registration. The demo email addresses are not real accounts.

## Connect Supabase

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and public anon/publishable key. Never put a service-role key in the browser.
2. Run [`supabase/migrations/202610210001_initial_ats.sql`](supabase/migrations/202610210001_initial_ats.sql) once in the Supabase SQL Editor. It creates the schema, access policies, signup trigger, and private CV bucket.
3. Run [`supabase/bootstrap-demo.sql`](supabase/bootstrap-demo.sql) to create the fictional Nexora workspace, sample jobs and candidates, and pending admin/customer invitations. Change the sample emails to addresses whose inboxes you control before using email confirmation.
4. Open the app, choose **Skapa konto**, and register each invited user with a password they choose. If email confirmation is enabled, follow the confirmation link before signing in.
5. In Supabase Auth settings, set the Site URL and redirect URLs to the deployed app origin and `/inloggning`.

For the schema and trust boundaries, see [`docs/architecture.md`](docs/architecture.md).

## Optional CV assistant

The UI requires the user to check a consent box before starting a review. This is not currently enforced or recorded by the Edge Function, so do not treat it as a production consent record. The function sends pasted CV text to OpenAI, does not intentionally store the raw text, and saves the generated advisory result with the candidate's application. A person must verify every statement and make all hiring decisions. See [AI CV review](docs/ai-cv-review.md) and [Security](docs/security.md).

Deploy and configure the Supabase Edge Function:

```sh
supabase functions deploy assess-cv
supabase secrets set OPENAI_API_KEY=your-key
```

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`. The assistant remains unavailable until the function and secret are configured.

## Build

```sh
npm run build
```

Vite writes the production assets to `dist/`. A hosting provider must serve that directory and rewrite client-side routes to `index.html`.

## Documentation

- [Documentation index](docs/README.md)
- [Product requirements and user stories](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
- [Data handling](docs/data-handling.md)
- [AI CV review](docs/ai-cv-review.md)
- [Development guide](docs/development.md)
- [Deployment guide](docs/deployment.md)
