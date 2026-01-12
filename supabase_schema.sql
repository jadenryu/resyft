-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth)

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    research_argument TEXT,
    extraction_preferences JSONB DEFAULT '{"favor_statistical": false, "favor_qualitative": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Papers table
CREATE TABLE papers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[],
    url TEXT,
    pdf_url TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extracted data table
CREATE TABLE extracted_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
    methods TEXT,
    sample_size INTEGER,
    key_statistics JSONB,
    conclusions TEXT,
    important_quotes TEXT[],
    numerical_data JSONB,
    reliability_score NUMERIC(3,2),
    relevance_score NUMERIC(3,2),
    support_score NUMERIC(3,2),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_papers_project_id ON papers(project_id);
CREATE INDEX idx_papers_user_id ON papers(user_id);
CREATE INDEX idx_extracted_data_paper_id ON extracted_data(paper_id);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for papers
CREATE POLICY "Users can view their own papers" ON papers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own papers" ON papers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers" ON papers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers" ON papers
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for extracted_data
CREATE POLICY "Users can view extracted data for their papers" ON extracted_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM papers 
            WHERE papers.id = extracted_data.paper_id 
            AND papers.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();