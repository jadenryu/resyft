-- Resyft School Productivity Platform - Database Schema v2.0
-- Transformed for class-based document management with vector database integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth)

-- Academic institutions table (optional for multi-institution support)
CREATE TABLE institutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE, -- e.g., "university.edu"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes/Courses table (replaces projects)
CREATE TABLE classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,

    -- Class details
    name TEXT NOT NULL, -- e.g., "CS 101 - Introduction to Computer Science"
    course_code TEXT, -- e.g., "CS101"
    description TEXT,
    semester TEXT, -- e.g., "Fall 2024"
    instructor TEXT,

    -- Vector database configuration
    qdrant_collection_name TEXT UNIQUE NOT NULL, -- Unique collection name in Qdrant
    embedding_model TEXT DEFAULT 'BAAI/bge-small-en-v1.5',

    -- Settings
    is_archived BOOLEAN DEFAULT FALSE,
    color_theme TEXT DEFAULT '#3B82F6', -- For UI organization

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (replaces papers)
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Document metadata
    title TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT, -- pdf, docx, txt, md, etc.
    file_size INTEGER, -- in bytes
    file_url TEXT, -- Storage URL (Supabase Storage)

    -- Content and processing
    content_text TEXT, -- Extracted text content
    content_preview TEXT, -- First 500 chars for preview
    chunk_count INTEGER DEFAULT 0, -- Number of chunks created

    -- Vector database integration
    qdrant_point_ids UUID[], -- Array of Qdrant point IDs for this document
    embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
    embedding_error TEXT,

    -- Document categorization
    document_type TEXT DEFAULT 'lecture_notes' CHECK (
        document_type IN ('lecture_notes', 'syllabus', 'assignment', 'textbook', 'research_paper', 'slides', 'handout', 'other')
    ),

    -- Processing timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks table (for vector storage tracking)
CREATE TABLE document_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,

    -- Chunk content
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL, -- Position in original document
    start_position INTEGER, -- Character position in original text
    end_position INTEGER,

    -- Vector database reference
    qdrant_point_id UUID NOT NULL, -- Unique ID in Qdrant
    embedding_vector_size INTEGER DEFAULT 384,

    -- Metadata for retrieval
    metadata JSONB DEFAULT '{}', -- Page numbers, section titles, etc.

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study sessions table (for tracking learning progress)
CREATE TABLE study_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,

    -- Session details
    session_name TEXT,
    query_count INTEGER DEFAULT 0,
    documents_accessed UUID[], -- Documents referenced during session

    -- Session timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query history table (for analytics and improvement)
CREATE TABLE query_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,

    -- Query details
    query_text TEXT NOT NULL,
    query_type TEXT DEFAULT 'semantic_search' CHECK (
        query_type IN ('semantic_search', 'keyword_search', 'qa', 'summarization')
    ),

    -- Results and performance
    results_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    relevance_scores NUMERIC[],

    -- Feedback (optional)
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class sharing table (for collaborative study groups)
CREATE TABLE class_sharing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sharing permissions
    permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'contribute', 'admin')),
    can_upload_documents BOOLEAN DEFAULT FALSE,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_classes_qdrant_collection ON classes(qdrant_collection_name);
CREATE INDEX idx_documents_class_id ON documents(class_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_embedding_status ON documents(embedding_status);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_qdrant_point ON document_chunks(qdrant_point_id);
CREATE INDEX idx_query_history_class_id ON query_history(class_id);
CREATE INDEX idx_query_history_created_at ON query_history(created_at);
CREATE INDEX idx_study_sessions_user_class ON study_sessions(user_id, class_id);

-- Full-text search indexes
CREATE INDEX idx_documents_content_fts ON documents USING GIN(to_tsvector('english', content_text));
CREATE INDEX idx_document_chunks_content_fts ON document_chunks USING GIN(to_tsvector('english', content));

-- Row Level Security (RLS)
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sharing ENABLE ROW LEVEL SECURITY;

-- Policies for institutions (public read, admin write)
CREATE POLICY "Anyone can view institutions" ON institutions FOR SELECT USING (true);

-- Policies for classes
CREATE POLICY "Users can view their own classes" ON classes
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM class_sharing
            WHERE class_sharing.class_id = classes.id
            AND class_sharing.shared_with_user_id = auth.uid()
            AND class_sharing.status = 'accepted'
        )
    );

CREATE POLICY "Users can create their own classes" ON classes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes" ON classes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes" ON classes
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for documents
CREATE POLICY "Users can view documents in their classes" ON documents
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM class_sharing cs
            JOIN classes c ON c.id = cs.class_id
            WHERE c.id = documents.class_id
            AND cs.shared_with_user_id = auth.uid()
            AND cs.status = 'accepted'
        )
    );

CREATE POLICY "Users can upload documents to their classes" ON documents
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM classes
            WHERE classes.id = documents.class_id
            AND classes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for document chunks
CREATE POLICY "Users can view chunks from accessible documents" ON document_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND (documents.user_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM class_sharing cs
                     WHERE cs.class_id = documents.class_id
                     AND cs.shared_with_user_id = auth.uid()
                     AND cs.status = 'accepted'
                 )
            )
        )
    );

-- Policies for study sessions
CREATE POLICY "Users can manage their own study sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Policies for query history
CREATE POLICY "Users can view their own query history" ON query_history
    FOR ALL USING (auth.uid() = user_id);

-- Policies for class sharing
CREATE POLICY "Users can view sharing for their classes" ON class_sharing
    FOR SELECT USING (
        auth.uid() = shared_by_user_id OR
        auth.uid() = shared_with_user_id
    );

CREATE POLICY "Users can create sharing for their classes" ON class_sharing
    FOR INSERT WITH CHECK (
        auth.uid() = shared_by_user_id AND
        EXISTS (
            SELECT 1 FROM classes
            WHERE classes.id = class_sharing.class_id
            AND classes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sharing they created or received" ON class_sharing
    FOR UPDATE USING (
        auth.uid() = shared_by_user_id OR
        auth.uid() = shared_with_user_id
    );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-generate Qdrant collection name
CREATE OR REPLACE FUNCTION generate_qdrant_collection_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qdrant_collection_name IS NULL OR NEW.qdrant_collection_name = '' THEN
        NEW.qdrant_collection_name := 'class_' || replace(NEW.id::text, '-', '_');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_sharing_updated_at BEFORE UPDATE ON class_sharing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_qdrant_collection_name_trigger BEFORE INSERT ON classes
    FOR EACH ROW EXECUTE FUNCTION generate_qdrant_collection_name();

-- Views for common queries
CREATE VIEW user_class_overview AS
SELECT
    c.id,
    c.name,
    c.course_code,
    c.semester,
    c.instructor,
    c.color_theme,
    c.is_archived,
    COUNT(d.id) as document_count,
    COUNT(CASE WHEN d.embedding_status = 'completed' THEN 1 END) as embedded_document_count,
    MAX(d.uploaded_at) as last_upload,
    c.created_at,
    c.updated_at
FROM classes c
LEFT JOIN documents d ON c.id = d.class_id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.name, c.course_code, c.semester, c.instructor, c.color_theme, c.is_archived, c.created_at, c.updated_at;

-- Statistics view
CREATE VIEW class_statistics AS
SELECT
    c.id as class_id,
    c.name as class_name,
    COUNT(DISTINCT d.id) as total_documents,
    COUNT(DISTINCT dc.id) as total_chunks,
    COUNT(DISTINCT qs.id) as total_queries,
    COUNT(DISTINCT ss.id) as total_study_sessions,
    COALESCE(AVG(qh.user_rating), 0) as avg_rating,
    MAX(d.uploaded_at) as last_document_upload,
    MAX(qh.created_at) as last_query
FROM classes c
LEFT JOIN documents d ON c.id = d.class_id
LEFT JOIN document_chunks dc ON d.id = dc.document_id
LEFT JOIN query_history qh ON c.id = qh.class_id
LEFT JOIN study_sessions ss ON c.id = ss.class_id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.name;