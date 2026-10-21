# Nexora — Better talent. Faster.

Nexora is a Swedish-language mini ATS for recruiting teams. It includes a customer workspace, a platform administrator view, job and candidate management, a five-stage candidate board, private CV storage, and an optional advisory CV review.

## Run the demo

```sh
npm install
npm run dev
```

Without Supabase settings, Nexora runs in a browser-local demo mode with one platform administrator and one customer workspace. Sign in as `namn@admin.se` for the administrator view or `namn@kund.se` for the customer view. The demo accepts any password and stores demo changes in that browser only. Do not use demo mode for real candidate data.

To open the local demo explicitly even when `.env.local` contains Supabase settings, run `npm run dev:demo`. Use `npm run dev` for the connected Supabase app.

The sample customer is **Nexora**, the fictional recruiting company used by this demo. Candidate profiles, job records, and work histories are sample data; work histories do not name real employers. The `.se` addresses above are local demo identities. For a connected Supabase project, use email addresses whose inboxes you control so account confirmation and password recovery can reach the users.

## Connect Supabase

1. Create a Supabase project and copy its Project URL and Publishable (anon) key into `.env.local`, using [.env.example](.env.example) as the template.
2. In the Supabase SQL Editor, run [the migration](supabase/migrations/202610210001_initial_ats.sql) once to create tables, access policies, and the private CV bucket.
3. For the two-role demo workspace, run [bootstrap-demo.sql](supabase/bootstrap-demo.sql). It creates the fictional Nexora organization, three sample jobs, six fictional candidates and applications, plus pending administrator/customer invitations. Replace the sample email addresses with inboxes you control before using Supabase email confirmation.
4. Open Nexora, select **Skapa konto**, and register each invited email with a password chosen by that user. If email confirmation is enabled, follow the confirmation link before signing in.
5. Administrators can add more customer organizations and invite customer or admin accounts from **Administration**. The auth trigger accepts only addresses with an administrator-created invitation.
6. Set the Supabase Auth Site URL and redirect URLs to the deployed Nexora origin and `/inloggning`.

The browser uses only the public key. Row Level Security scopes customer records by the trusted `profiles` row. Administrator invitations are consumed by a database trigger; roles never come from user-editable metadata. CVs live in a private `candidate-cvs` bucket, with paths scoped to the organization.

## Optional CV assistant

The CV assistant creates an advisory summary, evidence points, missing information, and interview questions. It does not score or rank candidates, or recommend a hiring decision. A user must check the consent box before sending pasted CV text to OpenAI. The text is processed by the Supabase Edge Function and is not saved in the review record; only the result is saved.

Deploy and configure the function:

```sh
supabase functions deploy assess-cv
supabase secrets set OPENAI_API_KEY=your-key
```

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`. The assistant stays unavailable until its Edge Function and API key are configured.

## Product scope and assumptions

- An admin is a platform-wide operator. A customer is scoped to one organization by database policy.
- One candidate is connected to one job in the current interface. Applications are stored separately so the data model can support multiple job applications later.
- New customer organizations start empty. The Nexora demo workspace has synthetic starter records for walkthroughs; do not treat them as real candidates.
- Candidate CV files are limited to 5 MB and PDF or Word format. AI review currently uses text the user pastes from a CV, so the UI can make the processing explicit.
- The review is assistive only. A person must verify every statement and make all hiring decisions.

## Build

```sh
npm run build
```
