# Security

This document describes the controls present in the repository and the remaining work before Nexora is used with real candidate data. It is a code-level overview, not a security audit or a claim that a deployed environment has been configured securely.

## Security boundaries

- Supabase Auth authenticates users. The `profiles` table supplies the trusted role and organization; client-provided signup metadata cannot grant a role or tenant.
- An administrator creates an invitation. The `consume_user_invitation` trigger matches the authenticated email to a pending invitation and creates the profile from that invitation.
- `is_platform_admin()` and `can_access_org()` are security-definer functions with a fixed `search_path`. Row Level Security (RLS) is enabled for organizations, profiles, invitations, jobs, candidates, applications, events, and CV reviews.
- Customer records are scoped to their organization by RLS. Administrators are platform-wide and can access every organization. The organization selector in the UI is not an authorization check.
- Composite foreign keys bind each application to a job and candidate in the same organization.
- CVs are stored in the private `candidate-cvs` bucket. The migration sets a 5 MiB limit and allows PDF and Word MIME types. Storage policies check organization access from the first path segment. The browser requests signed links with a five-minute expiry.
- The `assess-cv` Edge Function requires a JWT, validates the caller with Supabase Auth, and reads candidate/application/job data using the caller's token, so the caller's RLS rules apply.

## Secrets and sessions

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are browser configuration. The anon/publishable key is public by design; RLS is what limits database access.
- Never place a Supabase service-role key or `OPENAI_API_KEY` in a `VITE_*` variable, frontend source, checked-in file, or client bundle. Configure the OpenAI key as a Supabase Edge Function secret.
- Supabase sessions are stored in `localStorage` when “remember me” is selected and otherwise in `sessionStorage`. JavaScript running on the same origin can access these tokens. Keep dependencies controlled, prevent script injection, and consider an HttpOnly server-side session architecture if the threat model requires stronger token isolation.
- `.env*` files are ignored except `.env.example` and `.env.demo`. Check `git status` before committing configuration files.

## AI and CV data

The optional assistant sends pasted CV text, candidate name/current role, and the linked job title/description to the configured OpenAI model. The request sets `store: false`; the Edge Function does not intentionally persist the raw CV text. It stores the structured advisory result in `cv_reviews`. `store: false` alone is not a guarantee about all provider-side processing or retention; review the provider's current terms and account settings before enabling the feature for real data.

The consent checkbox is currently enforced only in the browser UI. The request to the Edge Function contains no consent evidence, and the function does not check or record consent. Therefore the current implementation does **not** provide server-enforced or auditable consent. Do not treat the UI checkbox as a production consent record. Add a server-side consent capture/validation flow before using the assistant with real CVs.

The prompt instructs the model not to infer protected characteristics, score, rank, or recommend hiring outcomes. These are model instructions, not enforceable guarantees. Outputs require human review and must not be used as the sole basis for a hiring decision.

## Production gaps to resolve

1. **Fail closed when Supabase is missing.** The app falls back to local demo behavior when Supabase configuration is absent; this is useful locally but a production build without the required variables must be blocked by deployment checks.
2. **Enforce AI consent on the server.** Capture the user's affirmative consent and its scope before transmitting CV text, validate it in the Edge Function, and retain a minimal audit record. Decide the provider and retention settings before enabling this feature.
3. **Restrict Edge Function CORS.** The function currently returns `Access-Control-Allow-Origin: *`. Set an explicit allowlist of deployed application origins and keep JWT validation enabled.
4. **Define retention and deletion.** There is no candidate retention/deletion workflow. Removing a database row does not automatically remove an object from Supabase Storage; implement and verify coordinated deletion and backup retention behavior.
5. **Harden file intake.** The browser's file picker filter is only a convenience, and the bucket MIME allowlist plus size limit do not validate file contents or scan for malware. Add malware scanning or an equivalent controlled review process before opening uploaded CV files, and consider validating file signatures.
6. **Set invitation expiry.** Pending invitations have no expiry timestamp. Define an expiry period and make expired invitations unusable, while retaining a clear administrator revoke flow.
7. **Harden administrator access.** Require strong account credentials and enable MFA for platform administrators in Supabase Auth. Keep the number of platform-wide admin accounts small and review access regularly.
8. **Validate the deployed policies.** Test cross-organization read/write denial for every table and storage operation, invitation role assignment, inactive profiles, and admin access using separate real Supabase users before launch. Review grants and policies whenever the schema changes.
9. **Review operational settings.** Configure exact Auth redirect URLs, email confirmation and password policies, production secrets, backups, logging/alerting, and a process for reporting and responding to incidents.

## Safe-use checklist

- Use synthetic data in local/demo mode; it accepts any password and is not suitable for personal data.
- Before using production candidate data, verify the deployed schema and RLS policies, confirm the app is using the correct Supabase project, and complete the production gaps above.
- Treat candidate notes and uploaded documents as confidential. Grant admin access only to people who need platform-wide access.
- Do not copy access tokens, service-role keys, OpenAI keys, or real CV text into issues, logs, screenshots, or source control.
