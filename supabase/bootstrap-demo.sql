-- Optional setup for the fictional Nexora demo workspace.
-- Run after applying the initial ATS migration. This seeds fictional workspace
-- records and pending role invitations; each user chooses their own password.

insert into public.organizations (id, name, industry, city, active)
values (
  '4f9d600a-1c71-4bb2-8846-02cfb606e7f0',
  'Nexora',
  'Rekrytering & talent',
  'Stockholm',
  true
)
on conflict (id) do nothing;

-- Synthetic starter data gives the first signed-in customer a populated Kanban.
-- These names, contacts and histories are fictional demo records.
insert into public.jobs (id, organization_id, title, city, work_arrangement, employment_type, department, description, status, created_at)
values
  ('10000000-0000-4000-8000-000000000001', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Frontendutvecklare', 'Stockholm', 'Hybrid', 'Heltid', 'Produkt & utveckling', 'Bygg tillgängliga webbupplevelser tillsammans med ett litet, tvärfunktionellt team.', 'active', now() - interval '20 days'),
  ('10000000-0000-4000-8000-000000000002', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'UX-designer', 'Göteborg', 'Hybrid', 'Heltid', 'Design', 'Gör komplexa arbetsflöden enkla genom research, prototyper och nära samarbete.', 'active', now() - interval '16 days'),
  ('10000000-0000-4000-8000-000000000003', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Kundansvarig', 'Malmö', 'På plats', 'Heltid', 'Kundteam', 'Hjälp kunder att komma vidare med omtanke, tydlig kommunikation och struktur.', 'active', now() - interval '11 days')
on conflict (id) do nothing;

insert into public.candidates (id, organization_id, name, email, phone, city, role_title, linkedin, summary, skills, experience, education, created_at)
values
  ('20000000-0000-4000-8000-000000000001', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Elin Andersson', 'elin.andersson@exempel.se', '070-000 00 01', 'Göteborg', 'Frontendutvecklare', 'https://www.linkedin.com/in/demo-elin-andersson', 'Bygger tydliga, snabba gränssnitt och tycker om att förbättra detaljer tillsammans med produkt och design.', array['React', 'TypeScript', 'Tillgänglighet'], array['2022–2026 · Frontend i ett produktteam', '2019–2022 · Webbutveckling'], 'Kandidatexamen · Göteborgs universitet', now() - interval '9 days'),
  ('20000000-0000-4000-8000-000000000002', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Hugo Berg', 'hugo.berg@exempel.se', '070-000 00 02', 'Stockholm', 'Frontendutvecklare', 'https://www.linkedin.com/in/demo-hugo-berg', 'Nyfiken utvecklare med fokus på designsystem, komponenter och tillgängliga gränssnitt.', array['React', 'CSS', 'Designsystem'], array['2021–2026 · Produktutveckling', '2018–2021 · Digitala tjänster'], 'Systemvetenskap · Stockholms universitet', now() - interval '7 days'),
  ('20000000-0000-4000-8000-000000000003', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Sofia Ek', 'sofia.ek@exempel.se', '070-000 00 03', 'Göteborg', 'UX-designer', 'https://www.linkedin.com/in/demo-sofia-ek', 'Kombinerar användarintervjuer med prototyper för att göra digitala produkter begripliga.', array['UX research', 'Figma', 'Prototyping'], array['2022–2026 · UX och research', '2019–2022 · Tjänstedesign'], 'Interaktionsdesign · Chalmers', now() - interval '8 days'),
  ('20000000-0000-4000-8000-000000000004', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Maja Borg', 'maja.borg@exempel.se', '070-000 00 04', 'Stockholm', 'UX-designer', 'https://www.linkedin.com/in/demo-maja-borg', 'Designer som gillar att testa idéer tidigt och hjälpa team att enas om rätt problem.', array['Figma', 'Research', 'Prototyping'], array['2020–2026 · Produktdesign', '2017–2020 · Visuell design'], 'Digital design · Malmö universitet', now() - interval '5 days'),
  ('20000000-0000-4000-8000-000000000005', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Noah Holm', 'noah.holm@exempel.se', '070-000 00 05', 'Malmö', 'Kundansvarig', 'https://www.linkedin.com/in/demo-noah-holm', 'Relationsbyggare som skapar struktur i kunddialoger och tycker om att lösa problem.', array['Kundrelationer', 'Kommunikation', 'Onboarding'], array['2022–2026 · Kundteam', '2019–2022 · Support och rådgivning'], 'Företagsekonomi · Lunds universitet', now() - interval '6 days'),
  ('20000000-0000-4000-8000-000000000006', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', 'Nora Hall', 'nora.hall@exempel.se', '070-000 00 06', 'Stockholm', 'Kundansvarig', 'https://www.linkedin.com/in/demo-nora-hall', 'Lugn och tydlig kontaktperson som uppskattar långsiktiga samarbeten.', array['Kundvård', 'Planering', 'Kommunikation'], array['2021–2026 · Kundansvar', '2018–2021 · Service'], 'Kommunikation · Uppsala universitet', now() - interval '4 days')
on conflict (id) do nothing;

insert into public.applications (id, organization_id, candidate_id, job_id, status, created_at)
values
  ('30000000-0000-4000-8000-000000000001', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'new', now() - interval '9 days'),
  ('30000000-0000-4000-8000-000000000002', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'screening', now() - interval '7 days'),
  ('30000000-0000-4000-8000-000000000003', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'interview', now() - interval '8 days'),
  ('30000000-0000-4000-8000-000000000004', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', '20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'offer', now() - interval '5 days'),
  ('30000000-0000-4000-8000-000000000005', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', '20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'screening', now() - interval '6 days'),
  ('30000000-0000-4000-8000-000000000006', '4f9d600a-1c71-4bb2-8846-02cfb606e7f0', '20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'new', now() - interval '4 days')
on conflict (id) do nothing;

with demo_invites(email, full_name, role, organization_id) as (
  values
    ('namn@admin.se', 'Admin Nexora', 'admin'::public.app_role, null::uuid),
    ('namn@kund.se', 'Kund Nexora', 'customer'::public.app_role, '4f9d600a-1c71-4bb2-8846-02cfb606e7f0'::uuid)
)
insert into public.user_invitations (email, full_name, role, organization_id)
select demo_invites.email, demo_invites.full_name, demo_invites.role, demo_invites.organization_id
from demo_invites
where not exists (
  select 1 from public.profiles
  where lower(profiles.email) = lower(demo_invites.email)
)
and not exists (
  select 1 from public.user_invitations
  where lower(user_invitations.email) = lower(demo_invites.email)
    and user_invitations.accepted_at is null
)
on conflict (lower(email)) where accepted_at is null do nothing;
