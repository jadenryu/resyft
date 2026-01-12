# Resyft School Productivity Platform v2.0

**Transform your study experience with AI-powered document analysis and vector search.**

Resyft is a next-generation school productivity platform that uses advanced vector databases and AI to help students organize, search, and learn from their course materials more effectively.

## 🎯 Key Features

### 📚 Smart Class Management
- **Class-based Organization**: Organize documents by courses/classes
- **Intelligent Document Processing**: Support for PDFs, DOCX, TXT, MD, HTML
- **Automatic Chunking**: Smart text segmentation optimized for academic content
- **Vector Embeddings**: Fast semantic search across all course materials

### 🧠 AI-Powered Learning
- **Semantic Search**: Find concepts and ideas, not just keywords
- **Document-Grounded Responses**: AI answers based only on your uploaded materials
- **Study Session Tracking**: Monitor learning progress and engagement
- **Zero Hallucination**: Responses grounded in your actual course content

### ⚡ High Performance
- **Qdrant Vector Database**: Lightning-fast similarity search
- **FastEmbed Embeddings**: Optimized text embeddings with 384-dimensional vectors
- **Intelligent Caching**: Redis-powered performance optimization
- **Scalable Architecture**: Microservices design for production deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Service    │
│   (Next.js)     │◄──►│  (Express.js)   │◄──►│   (FastAPI)     │
│                 │    │                 │    │                 │
│ • Class UI      │    │ • Auth          │    │ • Vector DB     │
│ • Document Chat │    │ • File Upload   │    │ • Embeddings    │
│ • Search        │    │ • User Mgmt     │    │ • Document AI   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Qdrant      │    │     Redis       │
│   (Supabase)    │    │ (Vector Store)  │    │   (Cache)       │
│                 │    │                 │    │                 │
│ • User Data     │    │ • Embeddings    │    │ • Sessions      │
│ • Classes       │    │ • Semantic      │    │ • Queue Jobs    │
│ • Documents     │    │   Search        │    │ • Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **Python** 3.10+
- **Docker** & Docker Compose (recommended)
- **PostgreSQL** 15+ (or Supabase account)
- **OpenAI API Key** (for embeddings and AI)

### Option 1: Docker Development Setup (Recommended)

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd resyft
   cp .env.example .env
   ```

2. **Configure Environment**
   ```bash
   # Edit .env file with your settings
   OPENAI_API_KEY="sk-your-openai-key"
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

3. **Start Development Stack**
   ```bash
   # Start all services
   docker-compose --profile development up -d

   # View logs
   docker-compose logs -f
   ```

4. **Access Services**
   - **Frontend**: http://localhost:3000
   - **AI Service**: http://localhost:8001
   - **Backend API**: http://localhost:8000
   - **Qdrant UI**: http://localhost:6333/dashboard
   - **pgAdmin**: http://localhost:5050

### Option 2: Manual Development Setup

1. **Database Setup**
   ```bash
   # Start PostgreSQL and Qdrant
   docker run -d -p 5432:5432 -e POSTGRES_DB=resyft_school postgres:15
   docker run -d -p 6333:6333 qdrant/qdrant:latest

   # Apply schema
   psql -h localhost -U postgres -d resyft_school -f supabase_schema_v2.sql
   ```

2. **AI Service Setup**
   ```bash
   cd resyft-ai-service
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   python main_v2.py
   ```

3. **Backend Setup**
   ```bash
   cd resyft-backend
   npm install
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd resyft-frontend
   npm install
   npm run dev
   ```

## 📖 Usage Guide

### Creating Your First Class

1. **Navigate to the Dashboard**
   - Open http://localhost:3000
   - Sign in with your account

2. **Create a New Class**
   ```javascript
   // Example API call
   POST /api/classes
   {
     "name": "Introduction to Computer Science",
     "course_code": "CS101",
     "semester": "Fall 2024",
     "instructor": "Dr. Smith"
   }
   ```

3. **Upload Course Materials**
   - Drag and drop PDF, DOCX, or text files
   - Files are automatically processed and embedded
   - Vector search becomes available immediately

### Searching Your Documents

1. **Semantic Search**
   ```javascript
   // Search across all class materials
   POST /api/search/semantic
   {
     "class_id": "your-class-id",
     "query": "What are the main principles of object-oriented programming?",
     "limit": 10,
     "score_threshold": 0.7
   }
   ```

2. **Chat Interface**
   - Select a class from the dashboard
   - Ask questions in natural language
   - Get answers grounded in your course materials

### Advanced Features

#### Study Sessions
```javascript
// Start a study session
POST /api/study-sessions
{
  "class_id": "your-class-id",
  "session_name": "Midterm Review"
}
```

#### Analytics
```javascript
// Get class analytics
GET /api/analytics/classes/{class_id}
```

## 🔧 Configuration

### Environment Variables

#### Required
```bash
# AI Service
OPENAI_API_KEY="sk-your-openai-key"
QDRANT_URL="http://localhost:6333"

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/resyft_school"

# Frontend
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

#### Optional Performance Tuning
```bash
# Embedding Configuration
DEFAULT_EMBEDDING_MODEL="BAAI/bge-small-en-v1.5"
CHUNK_SIZE="512"
CHUNK_OVERLAP="64"
MAX_CHUNK_SIZE="1024"

# File Limits
MAX_FILE_SIZE_MB="50"
MAX_FILES_PER_CLASS="100"

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE="60"
```

### Database Schema

The platform uses a sophisticated schema optimized for academic content:

- **Classes**: Course organization and metadata
- **Documents**: File storage and processing status
- **Document Chunks**: Vector-searchable content segments
- **Study Sessions**: Learning progress tracking
- **Query History**: Search analytics and optimization

See `supabase_schema_v2.sql` for the complete schema.

### Vector Database Configuration

Qdrant collections are automatically created with optimized settings:

```python
# Collection settings for academic content
VectorParams(
    size=384,  # FastEmbed dimension
    distance=Distance.COSINE
)

# HNSW optimization
hnsw_config={
    "m": 16,
    "ef_construct": 100,
    "full_scan_threshold": 10000
}
```

## 📊 Performance Optimization

### Vector Search Performance
- **Embedding Model**: BAAI/bge-small-en-v1.5 (384D, optimized for speed)
- **Chunking Strategy**: Academic-aware text segmentation
- **Caching**: Redis-powered result caching
- **Batch Processing**: Efficient bulk document processing

### Production Recommendations

1. **Scaling**
   ```bash
   # Use production Docker Compose
   docker-compose --profile production up -d
   ```

2. **Database Optimization**
   ```sql
   -- Recommended indexes (already in schema)
   CREATE INDEX idx_documents_embedding_status ON documents(embedding_status);
   CREATE INDEX idx_document_chunks_qdrant_point ON document_chunks(qdrant_point_id);
   ```

3. **Monitoring**
   ```bash
   # Health checks
   curl http://localhost:8001/health
   curl http://localhost:8001/health/vector
   ```

## 🔒 Security

### Authentication
- **Supabase Auth**: Row-level security (RLS) policies
- **JWT Tokens**: Secure API access
- **CORS Configuration**: Restricted origins

### Data Privacy
- **Isolated Collections**: Each class has its own vector collection
- **User Permissions**: RLS ensures data isolation
- **Secure Storage**: Documents encrypted at rest

### API Security
```javascript
// All endpoints require authentication
headers: {
  'Authorization': 'Bearer <jwt-token>',
  'Content-Type': 'application/json'
}
```

## 🧪 Testing

### Health Checks
```bash
# Service health
curl http://localhost:8001/health

# Vector service
curl http://localhost:8001/health/vector

# Document processor
curl http://localhost:8001/health/processor
```

### Development Endpoints
```bash
# List Qdrant collections
curl http://localhost:8001/dev/collections

# Test document upload
curl -X POST http://localhost:8001/classes/{class_id}/documents \
  -F "file=@test.pdf" \
  -F "document_type=lecture_notes"
```

## 📚 API Documentation

### Core Endpoints

#### Classes
- `POST /classes` - Create new class
- `GET /classes/{id}/info` - Get class information
- `DELETE /classes/{id}` - Delete class and vectors

#### Documents
- `POST /classes/{id}/documents` - Upload document
- `DELETE /classes/{id}/documents/{doc_id}` - Delete document
- `GET /classes/{id}/documents/{doc_id}/chunks` - Get document chunks

#### Search
- `POST /search/semantic` - Semantic search
- `GET /classes/{id}/search?q=query` - Quick search

#### Study Sessions
- `POST /study-sessions` - Start study session
- `PUT /study-sessions/{id}/end` - End study session

See the FastAPI docs at http://localhost:8001/docs for interactive API documentation.

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Production environment
   NODE_ENV=production
   DEBUG=false

   # Use production databases
   QDRANT_URL="https://your-cluster.qdrant.tech:6333"
   QDRANT_API_KEY="your-production-key"
   ```

2. **Docker Production**
   ```bash
   docker-compose --profile production up -d
   ```

3. **Railway Deployment**
   ```bash
   # Railway CLI
   railway login
   railway link
   railway up
   ```

### Scaling Considerations

- **Vector Database**: Qdrant Cloud for high-availability
- **File Storage**: Supabase Storage or AWS S3
- **Caching**: Redis Cloud for distributed caching
- **Monitoring**: Sentry for error tracking

## 🤝 Contributing

1. **Development Setup**
   ```bash
   git clone <repository>
   cd resyft
   docker-compose --profile development up -d
   ```

2. **Code Quality**
   ```bash
   # Frontend
   cd resyft-frontend
   npm run lint
   npm run typecheck

   # Backend
   cd resyft-backend
   npm run lint

   # AI Service
   cd resyft-ai-service
   black .
   flake8 .
   ```

3. **Testing**
   ```bash
   # Run tests
   npm test
   python -m pytest
   ```

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

### Common Issues

1. **Vector Search Not Working**
   - Check Qdrant connection: `curl http://localhost:6333/collections`
   - Verify embeddings: Check document `embedding_status`

2. **Document Upload Fails**
   - Check file size limits (default: 50MB)
   - Verify supported formats: PDF, DOCX, TXT, MD, HTML

3. **Performance Issues**
   - Monitor Redis cache hit rates
   - Check Qdrant collection optimization
   - Review chunk size settings

### Getting Help

- **Documentation**: See `/docs` folder
- **Issues**: Create GitHub issue with logs
- **Health Checks**: Use `/health` endpoints for diagnostics

---

**Ready to transform your study experience?** 🎓

Get started with Resyft and discover how AI can make learning more efficient and engaging!