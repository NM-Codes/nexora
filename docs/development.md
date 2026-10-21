# Development guide

## Requirements

- Node.js compatible with the Vite version in `package.json` and npm.
- A Supabase project is optional for UI development; the fictional local demo can run without one.

## Start locally

```sh
npm install
npm run dev
```

Without Supabase environment variables, Nexora uses browser-local demo data. `namn@admin.se` opens the platform administrator view and `namn@kund.se` opens the customer view. Demo mode accepts any password and must never contain real candidate data. To explicitly use demo mode:

```sh
npm run dev:demo
```

To develop against Supabase, copy `.env.example` to `.env.local` and set the project URL and public anon/publishable key. Never put a service-role key or provider secret in browser configuration. Follow the root README to apply the migration and seed demo records.

## Repository map

- `src/App.tsx` — workspace screens, navigation, and user interactions.
- `src/components/layout/` — application shell and shared layout components.
- `src/lib/supabase.ts` — browser-side Supabase Auth, REST, Storage, and Edge Function requests.
- `supabase/migrations/` — schema, invitation trigger, RLS, and private CV bucket policies.
- `supabase/functions/assess-cv/` — optional server-side AI review.
- `supabase/bootstrap-demo.sql` — fictional starter organization, records, and pending invitations.
- `docs/` — product and engineering documentation.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run dev:demo` | Force local demo mode. |
| `npm run build` | Run TypeScript project builds and create production assets in `dist/`. |
| `npm run preview` | Preview the built frontend locally. |

There are currently no dedicated test or lint scripts in `package.json`. When changing data access or roles, review the migration policies and test behavior using separate Supabase users for different organizations.

## Change guidance

- Treat RLS as the tenant security boundary; UI filters are for presentation only.
- When adding a table or Storage bucket, add explicit RLS/Storage policies and document the data classification.
- Keep secrets on the server. Only public Supabase configuration belongs in the browser bundle.
- Update the product, security, data-handling, and deployment docs when behavior or trust boundaries change.
- Use synthetic records in local/demo environments.
