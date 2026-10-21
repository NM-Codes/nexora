# AI CV review

## Purpose and limits

The optional assistant is a drafting aid for a recruiter. It returns a neutral summary, role-related evidence, information to clarify, and suggested interview questions. It is not a suitability score, ranking, recommendation, or hiring decision. A human must verify every statement against the source material.

## Current flow

1. An authorized user opens a candidate profile and pastes CV text.
2. The UI displays a consent checkbox. The user must select it to start the review.
3. The browser sends the candidate ID and pasted text to the Supabase `assess-cv` Edge Function with the user's Supabase session.
4. The function verifies the JWT and retrieves the candidate and linked job under the caller's RLS permissions.
5. It sends the CV text and candidate/job context to the configured OpenAI Responses API, with `store: false` and a structured output schema.
6. It saves the structured result to `cv_reviews`; the raw CV text is not intentionally saved by the function.

The configured model defaults to `gpt-4.1-mini`. The feature remains unavailable until the Edge Function and `OPENAI_API_KEY` are configured.

## Safeguards in the current code

- Requires a signed-in Supabase user and an accessible candidate/application/job.
- Rejects missing CV text and text longer than 40,000 characters.
- Uses a structured response schema and a system prompt that prohibits inferring protected attributes, ranking/scoring candidates, or recommending hiring outcomes.
- Requests `store: false` and asks the model not to reproduce CV text in the result.
- Stores only the advisory response in the application's review history.

These are useful safeguards but do not guarantee accurate, unbiased, complete, or compliant output. Prompt instructions are not technical enforcement of model behavior.

## Important current gap

Consent is checked only by the browser UI. No consent record or flag is sent with the request, and the Edge Function does not enforce or record consent. Before processing real CVs, implement server-side consent capture and validation, record only the necessary audit metadata, define how consent can be withdrawn, and explain the external transfer to the user.

## Before enabling for real data

- Restrict function CORS to deployed app origins.
- Decide whether this feature is appropriate for the intended recruitment process and get the necessary privacy/legal review.
- Review current OpenAI terms, account data controls, and retention behavior; `store: false` is not a universal no-retention guarantee.
- Add server-side consent verification and appropriate auditability.
- Add safeguards and human review for prompt injection in untrusted CV text; treat the CV as data, never as instructions.
- Consider fairness testing, output quality monitoring, and a clear user-facing explanation of limitations.
- Ensure review results are covered by retention/deletion and access-control procedures.
