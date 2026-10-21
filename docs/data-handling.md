# Data handling

This guide describes what the current application stores and sends. It does not define a legally sufficient privacy notice or retention policy; the operator must decide those for the deployed service before entering real candidate data.

## Data categories

| Data | Examples | Current location |
| --- | --- | --- |
| Account data | Email, display name, role, organization | Supabase Auth and `profiles`; invitations in `user_invitations` until accepted. |
| Recruiting data | Job details, candidate name/contact/profile, application stage, event history | Supabase Postgres tables. |
| Candidate documents | Optional PDF or Word CV | Private Supabase Storage bucket `candidate-cvs`, under an organization/candidate path. |
| AI review | Summary, evidence, missing information, interview questions | `cv_reviews.result` in Postgres, associated with an application and reviewer. |
| Local demo data | Fictional profiles, candidates, jobs, and interactions | Browser local/session storage. |

Candidate email, phone, LinkedIn URL, CV text, and recruiting notes can be personal or confidential information. The SQL demo seed contains fictional names and sample details; do not replace those with real records in a shared demo environment.

## Access and transfer

- Supabase Auth provides identity. Database RLS scopes customer users to their organization; platform administrators can access all organizations.
- Uploaded CVs are private by bucket configuration and access policies. The app creates a signed URL that expires after five minutes for viewing a file.
- The AI assistant sends pasted CV text, candidate name/current role, and the associated job title/description to the configured OpenAI endpoint after the UI consent checkbox is selected. The Edge Function asks the API not to store the response (`store: false`). Review provider settings and terms; this flag is not a statement about every form of provider-side retention or processing.
- Local demo mode uses fictional records and persists changes in the browser. Do not put real candidate data in demo mode.

## Retention and deletion

The current code does not define an automatic retention period or a candidate erasure workflow. Database relationships cascade some organization/application records, but Storage objects do not automatically disappear when related database rows are deleted. Before production use, define retention periods, implement coordinated deletion of database rows and CV objects, and document backup retention and restore behavior.

## Operational handling

- Collect only information needed for the recruitment workflow.
- Limit access to authorized users and review platform-admin membership regularly.
- Avoid putting candidate data in logs, support tickets, screenshots, or development fixtures.
- Decide who handles access/deletion requests and security incidents for the deployed service.
- Review [Security](security.md) and [AI CV review](ai-cv-review.md) before enabling AI or using real candidate information.
