-- Enable pgvector extension
create extension if not exists vector;

-- Create table for storing segment embeddings
create table if not exists segment_embeddings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  project_id text not null,
  form_id text not null,
  form_name text not null,
  segment_text text not null,
  segment_type text not null,
  page_number int not null,
  is_pii boolean default false,
  embedding vector(1536),  -- OpenAI ada-002 uses 1536 dimensions
  created_at timestamp with time zone default now()
);

-- Create index for fast similarity search
create index if not exists segment_embeddings_embedding_idx
  on segment_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create index for filtering by project
create index if not exists segment_embeddings_project_idx
  on segment_embeddings(project_id);

-- Create index for filtering by user
create index if not exists segment_embeddings_user_idx
  on segment_embeddings(user_id);

-- Function to search for similar segments
create or replace function search_segments(
  query_embedding vector(1536),
  match_project_id text,
  match_user_id uuid,
  match_count int default 30
)
returns table (
  id uuid,
  form_name text,
  segment_text text,
  segment_type text,
  page_number int,
  is_pii boolean,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    se.id,
    se.form_name,
    se.segment_text,
    se.segment_type,
    se.page_number,
    se.is_pii,
    1 - (se.embedding <=> query_embedding) as similarity
  from segment_embeddings se
  where se.project_id = match_project_id
    and se.user_id = match_user_id
  order by se.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS policies
alter table segment_embeddings enable row level security;

create policy "Users can view their own embeddings"
  on segment_embeddings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own embeddings"
  on segment_embeddings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own embeddings"
  on segment_embeddings for delete
  using (auth.uid() = user_id);
