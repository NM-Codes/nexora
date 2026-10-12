# Nexora architecture

## Product and visual direction

Nexora is a multi-tenant applicant tracking system for customer teams and a platform administrator. The supplied product references define a bright, compact workspace with a persistent left rail, subtle borders, navy accents, candidate cards, and separate customer and administrator experiences.

Brand colors from the supplied identity reference:

- Navy: `#1A2433`
- Slate: `#7C8CA3`
- Mist: `#E8EEF5`
- Cloud: `#F7F9FC`

The user owns frontend implementation and will decide sprint scope and screen details. Backend implementation is explicitly deferred until the user says the frontend is ready.

## Planned application layers

- `src/app` will own routing, role-specific layouts, and shared navigation.
- `src/features/auth` will contain sign-in flows for customers and administrators.
- `src/features/candidates` will contain the candidate board, profile, and add-candidate flow.
- `src/features/jobs` will contain the job overview and job creation form.
- `src/features/admin` will contain customer and account management.
- `src/components` will contain reusable UI such as form controls, tables, dialogs, and candidate cards.
- `src/lib` will contain integrations once backend work begins.
- `src/types` will hold shared product contracts agreed between frontend and backend.

Keep feature folders independent so screens can be built in the order chosen for each sprint. This repository has a clean React, TypeScript, and Vite scaffold plus these architecture notes. No backend implementation has been created.

## Frontend reference flows

1. **Candidates · Kanban:** filters for job and candidate name; columns for New, Screening, Interview, Offer, and Rejected; compact cards link to a candidate profile.
2. **Jobs:** active and closed job lists, with a create-job panel for title, location, work arrangement, employment type, description, and hiring criteria.
3. **Candidate profile:** contact details, linked job and stage, CV preview, and an optional AI-assisted CV review area.
4. **Add candidate:** profile form, optional CV upload, job association, and save-as-draft flow.
5. **Administration:** customer/workspace selector, customer list, accounts, roles, and account provisioning.
6. **Sign-in:** shared entry point with customer and administrator access handled by role after authentication.

## Domain model

```text
Organization 1 ── * Profile
Organization 1 ── * Job
Organization 1 ── * Candidate
Job           1 ── * Application * ── 1 Candidate
Candidate     1 ── * CandidateFile
Application   1 ── * Review (optional)
```

- A candidate is a reusable profile within one organization.
- An application joins one candidate to one job and owns the hiring stage.
- The job and candidate on an application must belong to the same organization.
- Initial application stages are `new`, `screening`, `interview`, `offer`, and `rejected`.
- Admin profiles are global; customer profiles belong to one organization.
- A CV file belongs to a candidate and must be stored privately.
- Any AI-assisted review is tied to a specific application and remains advisory; it does not make hiring decisions.

These are design-level contracts only. No database tables, migrations, or backend services have been created.

## Planned security boundaries

- Supabase Auth identifies a user; a trusted profile supplies the role and organization association.
- Customer data access will be constrained by database row-level security. Client-side organization filters are only for presentation.
- Customer CVs will use private object storage with tenant-scoped access.
- Admin provisioning and AI review will be server-side operations. Privileged service credentials will never be sent to the browser.
- Do not implement these backend controls until the user asks to begin the backend phase.

## Sprint workflow

For each sprint, agree on the frontend screen or behavior, reference image, and acceptance criteria first. Keep API and data needs as typed mock data or a short contract while the frontend is under construction. Defer persistence, authentication wiring, storage, and server functions.

When the user declares the frontend ready, turn the agreed contracts into migrations and backend work. Verify tenant isolation across at least two organizations before exposing customer data.

## Next steps

1. The user builds the frontend screens in their chosen sprint order.
2. Refine frontend data contracts as screens are implemented.
3. Wait for the user's explicit signal that frontend work is ready.
4. Then implement Supabase Auth, schema, tenant-scoped RLS, private CV storage, and protected admin functions.
5. Connect jobs, candidates, applications, and optional CV review to the finished UI.
