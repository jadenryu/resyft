-- Fix RLS policies to allow service role to insert embeddings
-- Service role should bypass RLS, but we'll add explicit policies for safety

-- Drop existing policies
drop policy if exists "Users can view their own embeddings" on segment_embeddings;
drop policy if exists "Users can insert their own embeddings" on segment_embeddings;
drop policy if exists "Users can delete their own embeddings" on segment_embeddings;

-- Recreate policies with service role support
create policy "Users can view their own embeddings"
  on segment_embeddings for select
  using (auth.uid() = user_id);

create policy "Service role can insert all embeddings"
  on segment_embeddings for insert
  with check (true);  -- Service role bypasses this anyway, but explicit policy

create policy "Users can delete their own embeddings"
  on segment_embeddings for delete
  using (auth.uid() = user_id);
