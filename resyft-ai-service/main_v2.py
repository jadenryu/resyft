"""
Resyft School Productivity Platform - AI Service v2.0
Transformed for class-based document management with vector database integration
"""

from dotenv import load_dotenv
load_dotenv()  # Load environment variables first

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
import os
import uuid
import uvicorn
import logging
from datetime import datetime

# Import new services
from services.vector_service import vector_service
from services.document_processor import document_processor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resyft School Productivity AI Service",
    description="Vector database and AI-powered document analysis for academic productivity",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# Request/Response Models
# =====================

class CreateClassRequest(BaseModel):
    """Request to create a new class/course"""
    name: str = Field(..., min_length=1, max_length=200, description="Class name")
    course_code: Optional[str] = Field(None, max_length=50, description="Course code (e.g., CS101)")
    description: Optional[str] = Field(None, max_length=1000, description="Class description")
    semester: Optional[str] = Field(None, max_length=50, description="Semester (e.g., Fall 2024)")
    instructor: Optional[str] = Field(None, max_length=100, description="Instructor name")
    color_theme: str = Field("#3B82F6", description="UI color theme")

class CreateClassResponse(BaseModel):
    """Response for class creation"""
    success: bool
    class_id: str
    collection_name: str
    message: str

class DocumentUploadResponse(BaseModel):
    """Response for document upload"""
    success: bool
    document_id: str
    filename: str
    content_preview: str
    chunk_count: int
    processing_time: float
    embedding_status: str
    message: str
    error: Optional[str] = None

class SemanticSearchRequest(BaseModel):
    """Request for semantic search within a class"""
    class_id: str = Field(..., description="Class UUID")
    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    limit: int = Field(10, ge=1, le=50, description="Maximum results")
    score_threshold: float = Field(0.7, ge=0.0, le=1.0, description="Minimum similarity score")
    document_id: Optional[str] = Field(None, description="Filter to specific document")

class SemanticSearchResponse(BaseModel):
    """Response for semantic search"""
    success: bool
    query: str
    results_count: int
    processing_time: float
    results: List[Dict[str, Any]]

class StudySessionRequest(BaseModel):
    """Request to start a study session"""
    class_id: str = Field(..., description="Class UUID")
    session_name: Optional[str] = Field(None, description="Optional session name")

class StudySessionResponse(BaseModel):
    """Response for study session"""
    success: bool
    session_id: str
    class_id: str
    started_at: str

class ClassInfoResponse(BaseModel):
    """Response for class information"""
    success: bool
    class_id: str
    collection_info: Dict[str, Any]
    document_count: int
    total_chunks: int

# =====================
# Health Check Endpoints
# =====================

@app.get("/health")
async def health_check():
    """Overall service health check"""
    try:
        vector_health = await vector_service.health_check()
        processor_health = await document_processor.health_check()

        return {
            "status": "healthy" if vector_health["status"] == "healthy" and processor_health["status"] == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "vector_database": vector_health,
                "document_processor": processor_health
            }
        }
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(500, f"Health check failed: {str(e)}")

@app.get("/health/vector")
async def vector_health_check():
    """Vector service specific health check"""
    return await vector_service.health_check()

@app.get("/health/processor")
async def processor_health_check():
    """Document processor specific health check"""
    return await document_processor.health_check()

# =====================
# Class Management Endpoints
# =====================

@app.post("/classes", response_model=CreateClassResponse)
async def create_class(request: CreateClassRequest):
    """Create a new class and corresponding Qdrant collection"""
    try:
        class_id = str(uuid.uuid4())

        logger.info(f"📚 Creating class: {request.name} (ID: {class_id})")

        # Create Qdrant collection for the class
        success = await vector_service.create_class_collection(class_id, request.name)

        if not success:
            raise HTTPException(500, "Failed to create vector collection for class")

        collection_name = f"class_{class_id.replace('-', '_')}"

        return CreateClassResponse(
            success=True,
            class_id=class_id,
            collection_name=collection_name,
            message=f"Class '{request.name}' created successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Class creation failed: {e}")
        raise HTTPException(500, f"Class creation failed: {str(e)}")

@app.delete("/classes/{class_id}")
async def delete_class(class_id: str):
    """Delete a class and its vector collection"""
    try:
        success = await vector_service.delete_class_collection(class_id)

        if not success:
            raise HTTPException(500, "Failed to delete vector collection")

        return {
            "success": True,
            "message": f"Class {class_id} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Class deletion failed: {e}")
        raise HTTPException(500, f"Class deletion failed: {str(e)}")

@app.get("/classes/{class_id}/info", response_model=ClassInfoResponse)
async def get_class_info(class_id: str):
    """Get information about a class and its vector collection"""
    try:
        collection_info = await vector_service.get_collection_info(class_id)

        if not collection_info:
            raise HTTPException(404, "Class collection not found")

        # TODO: Get document count from database when integrated
        document_count = 0  # Placeholder

        return ClassInfoResponse(
            success=True,
            class_id=class_id,
            collection_info=collection_info,
            document_count=document_count,
            total_chunks=collection_info["points_count"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get class info: {e}")
        raise HTTPException(500, f"Failed to get class info: {str(e)}")

# =====================
# Document Management Endpoints
# =====================

@app.post("/classes/{class_id}/documents", response_model=DocumentUploadResponse)
async def upload_document(
    class_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: str = Form("lecture_notes")
):
    """Upload and process a document for a class"""
    try:
        document_id = str(uuid.uuid4())

        logger.info(f"📄 Uploading document: {file.filename} to class {class_id}")

        # Validate file
        if not file.filename:
            raise HTTPException(400, "Filename is required")

        # Read file content
        file_content = await file.read()
        if len(file_content) == 0:
            raise HTTPException(400, "Empty file")

        # Process document
        processing_result = await document_processor.process_document(
            file_content=file_content,
            filename=file.filename,
            document_id=document_id,
            class_id=class_id,
            document_type=document_type
        )

        if not processing_result["success"]:
            raise HTTPException(400, f"Document processing failed: {processing_result['error']}")

        # Add chunks to vector database
        chunks = processing_result["chunks"]
        point_ids = await vector_service.add_document_chunks(
            class_id=class_id,
            document_id=document_id,
            chunks=chunks
        )

        if not point_ids:
            logger.warning(f"⚠️ No embeddings created for document {document_id}")
            embedding_status = "failed"
        else:
            embedding_status = "completed"
            logger.info(f"✅ Created {len(point_ids)} embeddings for document {document_id}")

        return DocumentUploadResponse(
            success=True,
            document_id=document_id,
            filename=file.filename,
            content_preview=processing_result["content_preview"],
            chunk_count=processing_result["chunk_count"],
            processing_time=processing_result["processing_time"],
            embedding_status=embedding_status,
            message=f"Document '{file.filename}' uploaded and processed successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Document upload failed: {e}")
        raise HTTPException(500, f"Document upload failed: {str(e)}")

@app.delete("/classes/{class_id}/documents/{document_id}")
async def delete_document(class_id: str, document_id: str):
    """Delete a document and its vector embeddings"""
    try:
        success = await vector_service.delete_document_chunks(class_id, document_id)

        if not success:
            raise HTTPException(500, "Failed to delete document embeddings")

        return {
            "success": True,
            "message": f"Document {document_id} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Document deletion failed: {e}")
        raise HTTPException(500, f"Document deletion failed: {str(e)}")

@app.get("/classes/{class_id}/documents/{document_id}/chunks")
async def get_document_chunks(class_id: str, document_id: str):
    """Retrieve all chunks for a specific document"""
    try:
        chunks = await vector_service.get_document_chunks(class_id, document_id)

        return {
            "success": True,
            "document_id": document_id,
            "chunk_count": len(chunks),
            "chunks": chunks
        }

    except Exception as e:
        logger.error(f"❌ Failed to get document chunks: {e}")
        raise HTTPException(500, f"Failed to get document chunks: {str(e)}")

# =====================
# Search and Query Endpoints
# =====================

@app.post("/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    """Perform semantic search within a class collection"""
    try:
        start_time = datetime.now()

        logger.info(f"🔍 Semantic search in class {request.class_id}: '{request.query}'")

        results = await vector_service.semantic_search(
            class_id=request.class_id,
            query_text=request.query,
            limit=request.limit,
            score_threshold=request.score_threshold,
            document_id=request.document_id
        )

        processing_time = (datetime.now() - start_time).total_seconds()

        return SemanticSearchResponse(
            success=True,
            query=request.query,
            results_count=len(results),
            processing_time=processing_time,
            results=results
        )

    except Exception as e:
        logger.error(f"❌ Semantic search failed: {e}")
        raise HTTPException(500, f"Semantic search failed: {str(e)}")

@app.get("/classes/{class_id}/search")
async def quick_search(
    class_id: str,
    q: str,
    limit: int = 10,
    threshold: float = 0.7
):
    """Quick search endpoint for simple queries"""
    try:
        results = await vector_service.semantic_search(
            class_id=class_id,
            query_text=q,
            limit=limit,
            score_threshold=threshold
        )

        return {
            "success": True,
            "query": q,
            "results": results
        }

    except Exception as e:
        logger.error(f"❌ Quick search failed: {e}")
        raise HTTPException(500, f"Quick search failed: {str(e)}")

# =====================
# Study Session Endpoints
# =====================

@app.post("/study-sessions", response_model=StudySessionResponse)
async def start_study_session(request: StudySessionRequest):
    """Start a new study session for a class"""
    try:
        session_id = str(uuid.uuid4())
        started_at = datetime.now()

        # TODO: Store session in database when integrated

        logger.info(f"📖 Started study session {session_id} for class {request.class_id}")

        return StudySessionResponse(
            success=True,
            session_id=session_id,
            class_id=request.class_id,
            started_at=started_at.isoformat()
        )

    except Exception as e:
        logger.error(f"❌ Failed to start study session: {e}")
        raise HTTPException(500, f"Failed to start study session: {str(e)}")

@app.put("/study-sessions/{session_id}/end")
async def end_study_session(session_id: str):
    """End a study session"""
    try:
        ended_at = datetime.now()

        # TODO: Update session in database when integrated

        logger.info(f"📖 Ended study session {session_id}")

        return {
            "success": True,
            "session_id": session_id,
            "ended_at": ended_at.isoformat(),
            "message": "Study session ended successfully"
        }

    except Exception as e:
        logger.error(f"❌ Failed to end study session: {e}")
        raise HTTPException(500, f"Failed to end study session: {str(e)}")

# =====================
# Analytics and Statistics
# =====================

@app.get("/analytics/classes/{class_id}")
async def get_class_analytics(class_id: str):
    """Get analytics for a specific class"""
    try:
        collection_info = await vector_service.get_collection_info(class_id)

        if not collection_info:
            raise HTTPException(404, "Class not found")

        # TODO: Add more analytics from database when integrated
        analytics = {
            "class_id": class_id,
            "vector_stats": collection_info,
            "total_documents": 0,  # Placeholder
            "total_chunks": collection_info["points_count"],
            "total_queries": 0,  # Placeholder
            "avg_query_rating": 0,  # Placeholder
            "last_activity": None,  # Placeholder
            "storage_usage": {
                "disk_size_bytes": collection_info.get("disk_data_size", 0),
                "ram_size_bytes": collection_info.get("ram_data_size", 0)
            }
        }

        return {
            "success": True,
            "analytics": analytics
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get class analytics: {e}")
        raise HTTPException(500, f"Failed to get class analytics: {str(e)}")

# =====================
# Development and Testing Endpoints
# =====================

@app.get("/dev/collections")
async def list_collections():
    """Development endpoint to list all Qdrant collections"""
    try:
        collections = await vector_service.async_client.get_collections()

        return {
            "collections": [
                {
                    "name": collection.name,
                    "vectors_count": getattr(collection, 'vectors_count', 0),
                    "points_count": getattr(collection, 'points_count', 0)
                }
                for collection in collections.collections
            ]
        }

    except Exception as e:
        logger.error(f"❌ Failed to list collections: {e}")
        raise HTTPException(500, f"Failed to list collections: {str(e)}")

# =====================
# Main Application
# =====================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main_v2:app", host="0.0.0.0", port=port, reload=True)