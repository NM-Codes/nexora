create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'customer');
create type public.application_status as enum ('new', 'screening', 'interview', 'offer', 'rejected');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  industry text not null default '',
  city text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_role_organization_check check (
    (role = 'admin' and organization_id is null) or
    (role = 'customer' and organization_id is not null)
  )
);
create unique index profiles_email_lower_unique on public.profiles (lower(email));
create index profiles_organization_id_idx on public.profiles (organization_id);

create table public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  role public.app_role not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint invitations_role_organization_check check (
    (role = 'admin' and organization_id is null) or
    (role = 'customer' and organization_id is not null)
  )
);
create unique index pending_invitation_email_lower_unique
  on public.user_invitations (lower(email)) where accepted_at is null;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) between 2 and 180),
  city text not null default '',
  work_arrangement text not null default 'Hybrid',
  employment_type text not null default 'Heltid',
  department text not null default '',
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index jobs_organization_created_idx on public.jobs (organization_id, created_at desc);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 180),
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  role_title text not null default '',
  linkedin text not null default '',
  summary text not null default '',
  skills text[] not null default '{}',
  experience text[] not null default '{}',
  education text not null default '',
  cv_name text,
  cv_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index candidates_organization_created_idx on public.candidates (organization_id, created_at desc);
create index candidates_name_lower_idx on public.candidates (lower(name));

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  candidate_id uuid not null,
  job_id uuid not null,
  status public.application_status not null default 'new',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (candidate_id, job_id),
  unique (id, organization_id),
  foreign key (candidate_id, organization_id)
    references public.candidates(id, organization_id) on delete cascade,
  foreign key (job_id, organization_id)
    references public.jobs(id, organization_id) on delete cascade
);
create index applications_organization_status_idx on public.applications (organization_id, status, created_at desc);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  application_id uuid not null,
  label text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (application_id, organization_id)
    references public.applications(id, organization_id) on delete cascade
);

create table public.cv_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  application_id uuid not null,
  result jsonb not null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (application_id, organization_id)
    references public.applications(id, organization_id) on delete cascade
);

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active
  );
$$;

create or replace function public.can_access_org(_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and organization_id = _organization_id
      and role = 'customer'
      and active
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.can_access_org(uuid) to authenticated;

create or replace function public.consume_user_invitation()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  invitation public.user_invitations%rowtype;
begin
  select * into invitation
  from public.user_invitations
  where lower(email) = lower(new.email)
    and accepted_at is null
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'This email address has not been invited by a Nexora administrator.';
  end if;

  insert into public.profiles (id, email, full_name, role, organization_id)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), invitation.full_name),
    invitation.role,
    invitation.organization_id
  );

  update public.user_invitations set accepted_at = now() where id = invitation.id;
  return new;
end;
$$;

create trigger on_auth_user_created_consume_invitation
  after insert on auth.users
  for each row execute function public.consume_user_invitation();

create or replace function public.log_application_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  event_label text;
begin
  if tg_op = 'INSERT' then
    event_label := 'Kandidaten lades till';
  elsif old.status is distinct from new.status then
    event_label := 'Status ändrad till ' || case new.status
      when 'new' then 'Ny'
      when 'screening' then 'Granskning'
      when 'interview' then 'Intervju'
      when 'offer' then 'Erbjudande'
      else 'Avböjd'
    end;
  else
    return new;
  end if;

  insert into public.application_events (organization_id, application_id, label, created_by)
  values (new.organization_id, new.id, event_label, coalesce((select auth.uid()), new.created_by));
  return new;
end;
$$;

create trigger applications_log_changes
  after insert or update of status on public.applications
  for each row execute function public.log_application_change();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_invitations enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.cv_reviews enable row level security;

create policy organizations_read_scope on public.organizations
  for select to authenticated using (public.can_access_org(id));
create policy organizations_admin_write on public.organizations
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy profiles_read_self_or_admin on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_platform_admin());
create policy profiles_admin_update on public.profiles
  for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy invitations_admin_access on public.user_invitations
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy jobs_read_scope on public.jobs
  for select to authenticated using (public.can_access_org(organization_id));
create policy jobs_write_scope on public.jobs
  for all to authenticated using (public.can_access_org(organization_id)) with check (public.can_access_org(organization_id));

create policy candidates_read_scope on public.candidates
  for select to authenticated using (public.can_access_org(organization_id));
create policy candidates_write_scope on public.candidates
  for all to authenticated using (public.can_access_org(organization_id)) with check (public.can_access_org(organization_id));

create policy applications_read_scope on public.applications
  for select to authenticated using (public.can_access_org(organization_id));
create policy applications_write_scope on public.applications
  for all to authenticated using (public.can_access_org(organization_id)) with check (public.can_access_org(organization_id));

create policy application_events_read_scope on public.application_events
  for select to authenticated using (public.can_access_org(organization_id));
create policy application_events_write_scope on public.application_events
  for insert to authenticated with check (
    public.can_access_org(organization_id)
    and created_by = (select auth.uid())
  );

create policy cv_reviews_read_scope on public.cv_reviews
  for select to authenticated using (public.can_access_org(organization_id));
create policy cv_reviews_insert_scope on public.cv_reviews
  for insert to authenticated with check (
    public.can_access_org(organization_id)
    and reviewed_by = (select auth.uid())
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-cvs',
  'candidate-cvs',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy candidate_cv_read_scope on storage.objects
  for select to authenticated using (
    bucket_id = 'candidate-cvs'
    and public.can_access_org(((storage.foldername(name))[1])::uuid)
  );
create policy candidate_cv_insert_scope on storage.objects
  for insert to authenticated with check (
    bucket_id = 'candidate-cvs'
    and public.can_access_org(((storage.foldername(name))[1])::uuid)
  );
create policy candidate_cv_delete_scope on storage.objects
  for delete to authenticated using (
    bucket_id = 'candidate-cvs'
    and public.can_access_org(((storage.foldername(name))[1])::uuid)
  );
