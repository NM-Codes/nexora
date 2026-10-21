# Deployment guide

The repository contains the frontend and Supabase setup, but no public production deployment is configured here. Deploying the code does not by itself configure or verify a Supabase project.

## Supabase setup

1. Create or select the intended Supabase project and confirm its region, access, and backup settings.
2. Run [`supabase/migrations/202610210001_initial_ats.sql`](../supabase/migrations/202610210001_initial_ats.sql) once in the SQL Editor or through the Supabase CLI migration workflow.
3. For a demo only, run [`supabase/bootstrap-demo.sql`](../supabase/bootstrap-demo.sql). Replace `namn@admin.se` and `namn@kund.se` with inboxes you control before using email confirmation. The seed adds fictional sample records and pending invitations.
4. Register invited users in the app. The signup trigger assigns the invitation's role and organization.
5. In Supabase Auth, configure the exact deployed Site URL and redirect URLs, email confirmation, appropriate password rules, and MFA for platform administrators.
6. Configure production secrets outside the frontend. The optional CV assistant needs `OPENAI_API_KEY` as an Edge Function secret. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.
7. Deploy the function if enabling AI:

   ```sh
   supabase functions deploy assess-cv
   supabase secrets set OPENAI_API_KEY=your-key
   ```

   `supabase/config.toml` enables JWT verification for this function. Review and replace the function's wildcard CORS origin with the production app origin before enabling it.

## Frontend setup

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the build environment. These values are included in the browser bundle and must be the public URL/key only.
2. Run `npm run build`; publish the generated `dist/` directory.
3. Configure the host to serve the SPA and rewrite application routes to `index.html`.
4. Ensure production builds fail if Supabase variables are missing. Without them the app enters local demo behavior, which accepts any password and stores data in the browser.
5. Use HTTPS and the exact application origin in Supabase Auth and Edge Function CORS configuration.

## Before launch

- Complete the outstanding actions in [Security](security.md), including server-side AI consent, data retention/deletion, CORS restriction, and file safety.
- Verify RLS and Storage isolation using users from at least two organizations and an administrator account.
- Verify invitation/signup behavior, email confirmation, password recovery, sign-out, and inactive profile handling.
- Confirm that no real candidate information is present in the demo seed or browser local storage.
- Review provider terms and account settings for AI processing before sending CV content.
- Document the production owner, rollback procedure, backup restore procedure, and incident contact.
