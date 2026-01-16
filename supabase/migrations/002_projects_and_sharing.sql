-- Create projects table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  forms jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create project_shares table for sharing functionality
create table if not exists project_shares (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  shared_with_email text not null,
  shared_with_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists projects_owner_idx on projects(owner_id);
create index if not exists project_shares_project_idx on project_shares(project_id);
create index if not exists project_shares_shared_with_email_idx on project_shares(shared_with_email);
create index if not exists project_shares_shared_with_id_idx on project_shares(shared_with_id);

-- Enable RLS
alter table projects enable row level security;
alter table project_shares enable row level security;

-- Projects policies

-- Owners can do everything with their projects
create policy "Owners can view their projects"
  on projects for select
  using (auth.uid() = owner_id);

create policy "Owners can create projects"
  on projects for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their projects"
  on projects for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their projects"
  on projects for delete
  using (auth.uid() = owner_id);

-- Shared users can view projects shared with them (accepted only)
create policy "Shared users can view shared projects"
  on projects for select
  using (
    exists (
      select 1 from project_shares
      where project_shares.project_id = projects.id
        and project_shares.shared_with_id = auth.uid()
        and project_shares.status = 'accepted'
    )
  );

-- Editors can update shared projects
create policy "Editors can update shared projects"
  on projects for update
  using (
    exists (
      select 1 from project_shares
      where project_shares.project_id = projects.id
        and project_shares.shared_with_id = auth.uid()
        and project_shares.role = 'editor'
        and project_shares.status = 'accepted'
    )
  );

-- Project shares policies

-- Owners can manage shares for their projects
create policy "Owners can view shares for their projects"
  on project_shares for select
  using (auth.uid() = owner_id);

create policy "Owners can create shares for their projects"
  on project_shares for insert
  with check (auth.uid() = owner_id);

create policy "Owners can delete shares for their projects"
  on project_shares for delete
  using (auth.uid() = owner_id);

-- Users can view invitations sent to them (by email or id)
create policy "Users can view their invitations"
  on project_shares for select
  using (
    shared_with_id = auth.uid() or
    shared_with_email = (select email from auth.users where id = auth.uid())
  );

-- Users can update their own invitation status (accept/decline)
create policy "Users can update their invitation status"
  on project_shares for update
  using (
    shared_with_id = auth.uid() or
    shared_with_email = (select email from auth.users where id = auth.uid())
  );

-- Function to get user email (for checking invitations by email)
create or replace function get_user_email()
returns text
language sql
security definer
as $$
  select email from auth.users where id = auth.uid();
$$;

-- Function to update shared_with_id when user accepts invitation
create or replace function accept_project_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update project_shares
  set
    status = 'accepted',
    shared_with_id = auth.uid()
  where id = invitation_id
    and (shared_with_id = auth.uid() or shared_with_email = get_user_email())
    and status = 'pending';
end;
$$;

-- Function to decline invitation
create or replace function decline_project_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update project_shares
  set status = 'declined'
  where id = invitation_id
    and (shared_with_id = auth.uid() or shared_with_email = get_user_email())
    and status = 'pending';
end;
$$;
