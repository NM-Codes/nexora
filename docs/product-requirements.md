# Product requirements

## Product goal

Nexora is a Swedish-language, multi-tenant applicant tracking system (ATS) for a fictional recruiting team. The first version focuses on account roles, jobs, candidate profiles, and a compact recruitment pipeline. Demo organizations, people, and employers are fictional.

## Roles

- **Platform administrator (`admin`):** can manage organizations and invitations, and work in customer workspaces on their behalf.
- **Customer (`customer`):** belongs to one organization and manages that organization's jobs, candidates, and applications.

Roles and organization membership are assigned from administrator-created invitations and trusted profile records, not from signup form fields.

## Core user stories and acceptance criteria

### Account and access

**US-01 — Invite an administrator**

As a platform administrator, I want to invite an administrator account so another authorized person can manage the platform.

- The invitation has a name and email address and the `admin` role.
- The invitee can register only with the invited email address.
- The resulting profile has the administrator role and no customer organization.
- A user cannot grant themselves the role by changing signup metadata.

**US-02 — Invite a customer**

As a platform administrator, I want to invite a customer account into an organization so its team can use Nexora.

- The invitation has a name, email address, `customer` role, and one organization.
- Signup with the invited email creates a customer profile linked to that organization.
- A customer cannot access another organization's records by changing a URL, filter, or request.

**US-03 — Sign in and sign out**

As an invited user, I want to sign in with my email and password and end my session when I am done.

- Only a valid Supabase Auth session with an active profile opens the workspace.
- The role controls the navigation and available workspace actions.
- Signing out clears the stored session from the browser.

### Jobs and candidates

**US-04 — Manage job openings**

As a customer, I want to create and update jobs so that I can organize recruiting work.

- A job includes a title and can include location, work arrangement, employment type, department, and description.
- Jobs belong to exactly one organization and can be active or closed.
- Customers see and change jobs only in their organization; platform administrators can act for a selected customer workspace.

**US-05 — Add a candidate profile**

As a customer, I want to add a candidate and contact/profile information so the hiring team can consider them for relevant roles.

- A candidate has a name and can include email, phone, city, current role, LinkedIn URL, summary, skills, experience, education, and an optional CV file.
- The candidate is stored in the current organization.
- CV files are private and limited to 5 MiB in the configured Supabase bucket.
- The UI explains that contact information and CVs are personal data.

**US-06 — Link a candidate to a job**

As a customer, I want to track a candidate's application to a job so the pipeline reflects a specific recruitment process.

- An application links one candidate and one job in the same organization.
- The application has one of the defined stages: new, screening, interview, offer, or rejected.
- A stage change is reflected in the Kanban and application history.

### Candidate pipeline

**US-07 — View the Kanban**

As a customer, I want a compact Kanban view of my candidates so I can understand the pipeline at a glance.

- Applications are grouped by stage and show the candidate and associated job.
- The customer sees only applications in their organization.
- The candidate profile provides more detail and allows an authorized user to update stage.

**US-08 — Filter candidates**

As a customer, I want to filter by job and candidate name so I can focus on a specific hiring process or person.

- The job filter narrows visible applications to the selected job.
- Name search narrows visible applications by candidate name.
- Filters can be cleared to restore the full authorized view.

### Platform administration

**US-09 — Work on behalf of a customer**

As a platform administrator, I want to perform customer workflows in an organization so I can support its recruiting activity.

- The administrator can select an organization and manage its jobs, candidates, applications, and pipeline.
- The database still applies the role-based policies; UI selection alone does not grant access.

## Additional feature: AI CV review

**US-10 — Request an advisory CV review**

As an authorized workspace user, I want an optional summary of CV evidence against a job so I can prepare follow-up questions.

- The feature is opt-in and sends pasted CV text plus relevant candidate/job context to the configured model.
- The output is a neutral summary, evidence, information to clarify, and interview questions.
- It must not score, rank, recommend hiring/rejection, or infer protected characteristics.
- A human verifies output and makes all decisions.
- Before real use, server-side consent enforcement, a documented retention/provider configuration, and access-controlled result history are required; see [AI CV review](ai-cv-review.md) and [Security](security.md).

## Non-functional requirements

- **Tenant isolation:** enforce customer isolation in Supabase RLS, including Storage.
- **Authentication:** use Supabase Auth; do not trust role or organization data sent by the browser.
- **Privacy:** store only information needed for recruiting workflows, keep CV storage private, and define retention/deletion before production use.
- **Accessibility and usability:** keep the Swedish UI understandable, compact, and usable across common screen sizes.
- **Operational readiness:** a real deployment must configure Supabase, Auth redirects, secrets, and SPA route fallback; local demo mode is not a production environment.

## Assumptions and scope

- Nexora and all demo organizations, job postings, and candidate records are fictional.
- A customer account belongs to one organization. Platform administrators have cross-organization access.
- The current version is a prototype and does not include candidate self-service, interview scheduling, email notifications, automated CV parsing, retention automation, or a production deployment.
- Delivery activities such as demo recording and email handoff are outside the product scope.
