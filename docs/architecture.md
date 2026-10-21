# Nexora architecture

## Product

Nexora is a multi-tenant applicant tracking system for customer teams and platform administrators. The product is in Swedish and follows the supplied Nexora reference: a calm white workspace, navy accents, compact cards, subtle borders, and a left navigation rail.

## Current implementation

- `src/App.tsx` contains the existing workspace screens and interactions: login and registration, candidates, Kanban/list views, profiles, job management, and administration.
- `src/components/layout` owns the Nexora icon set and the role-aware application shell.
- `src/lib/supabase.ts` contains the browser auth, PostgREST, Storage, and Edge Function calls. It uses fetch and requires only the public Supabase URL/key in the browser.
- `supabase/migrations` defines the multi-tenant schema and RLS policies.
- `supabase/functions/assess-cv` runs the optional CV review on the server side.

## Roles and tenant boundary

Supabase Auth identifies a user. `profiles` supplies the trusted role and organization. Administrators have no fixed organization and can work in every customer workspace; customer profiles belong to one organization. Customer access to organizations, jobs, candidates, applications, events, and CV files is checked by RLS. The organization selector is a presentation control; it is not a security boundary.

New accounts require a matching row in `user_invitations`. An administrator creates the row; a database trigger consumes it when the invited person signs up and creates the trusted profile. Client-provided user metadata cannot set a role or organization. The first administrator is bootstrapped through the SQL instructions in the README.

## Domain model

```text
Organization 1 ── * Profile
Organization 1 ── * Job
Organization 1 ── * Candidate
Job           1 ── * Application * ── 1 Candidate
Application   1 ── * ApplicationEvent
Application   1 ── * CvReview
```

Composite foreign keys ensure the candidate and job on an application belong to the same organization. CV files are stored in a private bucket under `<organization_id>/<candidate_id>/...`.

## AI review

The optional assistant summarizes text supplied by the user, identifies role-related evidence and missing information, and proposes interview questions. It must not infer protected attributes, rank candidates, or recommend hiring decisions. The UI asks the user to confirm before sending pasted CV text to the configured OpenAI model, but the Edge Function currently neither validates nor records that consent. Raw CV text is not intentionally persisted by the function; the advisory result is stored with its application for later review. See [AI CV review](ai-cv-review.md) and [Security](security.md) for current safeguards and production gaps.

## Local mode

If Supabase environment variables are absent, the frontend runs from fictional Nexora demo data in browser local storage. `namn@admin.se` opens the platform administrator view; `namn@kund.se` opens the customer view for the Nexora workspace. Demo authentication accepts any password, is not suitable for real data, and is disabled automatically once Supabase is configured. The Supabase bootstrap script seeds the fictional Nexora workspace and creates two pending role invitations; users choose their own passwords through sign-up.
