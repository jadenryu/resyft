"""
Vector Database Service for Resyft School Productivity Platform
Handles Qdrant vector database operations for document embeddings and semantic search
"""

import os
import uuid
import asyncio
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime

from qdrant_client import AsyncQdrantClient, QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct, Filter, FieldCondition,
    MatchValue, SearchRequest, ScrollRequest, CollectionInfo
)
from fastembed import TextEmbedding
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorService:
    """
    High-performance vector database service using Qdrant for document embeddings
    Optimized for school productivity and course material management
    """

    def __init__(self):
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY")  # Optional for cloud

        # Initialize clients
        self._init_clients()

        # Initialize embedding model
        self.embedding_model = None
        self.embedding_dim = 384  # Default for BAAI/bge-small-en-v1.5
        self.model_name = "BAAI/bge-small-en-v1.5"

        self._init_embedding_model()

    def _init_clients(self):
        """Initialize Qdrant clients (sync and async)"""
        try:
            # Async client for main operations
            if self.qdrant_api_key:
                self.async_client = AsyncQdrantClient(
                    url=self.qdrant_url,
                    api_key=self.qdrant_api_key
                )
                self.sync_client = QdrantClient(
                    url=self.qdrant_url,
                    api_key=self.qdrant_api_key
                )
            else:
                self.async_client = AsyncQdrantClient(url=self.qdrant_url)
                self.sync_client = QdrantClient(url=self.qdrant_url)

            logger.info(f"✅ Qdrant clients initialized: {self.qdrant_url}")

        except Exception as e:
            logger.error(f"❌ Failed to initialize Qdrant clients: {e}")
            # Fallback to local in-memory mode for development
            self.async_client = AsyncQdrantClient(":memory:")
            self.sync_client = QdrantClient(":memory:")
            logger.warning("🔄 Using in-memory Qdrant for fallback")

    def _init_embedding_model(self):
        """Initialize FastEmbed model for text embeddings"""
        try:
            self.embedding_model = TextEmbedding(model_name=self.model_name)
            logger.info(f"✅ Embedding model loaded: {self.model_name}")
        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {e}")
            raise

    async def create_class_collection(self, class_id: str, class_name: str) -> bool:
        """
        Create a new Qdrant collection for a class

        Args:
            class_id: UUID of the class
            class_name: Human-readable class name for metadata

        Returns:
            bool: Success status
        """
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"

            # Check if collection already exists
            collections = await self.async_client.get_collections()
            existing_names = [c.name for c in collections.collections]

            if collection_name in existing_names:
                logger.info(f"📚 Collection already exists: {collection_name}")
                return True

            # Create collection with optimized settings
            await self.async_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE
                ),
                # Optimize for academic content
                optimizers_config={
                    "deleted_threshold": 0.2,
                    "vacuum_min_vector_number": 1000,
                    "default_segment_number": 2
                },
                hnsw_config={
                    "m": 16,  # Good balance for academic documents
                    "ef_construct": 100,
                    "full_scan_threshold": 10000
                }
            )

            logger.info(f"✅ Created collection: {collection_name} for class: {class_name}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to create collection for class {class_id}: {e}")
            return False

    async def delete_class_collection(self, class_id: str) -> bool:
        """Delete a class collection from Qdrant"""
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"
            await self.async_client.delete_collection(collection_name)
            logger.info(f"🗑️ Deleted collection: {collection_name}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete collection for class {class_id}: {e}")
            return False

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts using FastEmbed

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors
        """
        try:
            if not texts:
                return []

            # Generate embeddings
            embeddings = list(self.embedding_model.embed(texts))

            # Convert to lists for JSON serialization
            return [embedding.tolist() for embedding in embeddings]

        except Exception as e:
            logger.error(f"❌ Failed to generate embeddings: {e}")
            return []

    async def add_document_chunks(
        self,
        class_id: str,
        document_id: str,
        chunks: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Add document chunks to class collection

        Args:
            class_id: Class UUID
            document_id: Document UUID
            chunks: List of chunk dictionaries with 'content', 'metadata', etc.

        Returns:
            List of Qdrant point IDs
        """
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"

            # Extract text content for embedding
            texts = [chunk['content'] for chunk in chunks]

            # Generate embeddings
            embeddings = self.generate_embeddings(texts)

            if not embeddings:
                logger.error("❌ No embeddings generated")
                return []

            # Create points for Qdrant
            points = []
            point_ids = []

            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid.uuid4())
                point_ids.append(point_id)

                # Enhanced metadata
                payload = {
                    "document_id": document_id,
                    "class_id": class_id,
                    "chunk_index": i,
                    "content": chunk['content'],
                    "content_preview": chunk['content'][:200] + "..." if len(chunk['content']) > 200 else chunk['content'],
                    "content_length": len(chunk['content']),
                    "timestamp": datetime.now().isoformat(),
                    **chunk.get('metadata', {})
                }

                points.append(PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                ))

            # Upload to Qdrant
            await self.async_client.upsert(
                collection_name=collection_name,
                points=points,
                wait=True
            )

            logger.info(f"✅ Added {len(points)} chunks to collection {collection_name}")
            return point_ids

        except Exception as e:
            logger.error(f"❌ Failed to add document chunks: {e}")
            return []

    async def semantic_search(
        self,
        class_id: str,
        query_text: str,
        limit: int = 10,
        score_threshold: float = 0.7,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search within a class collection

        Args:
            class_id: Class UUID
            query_text: Search query
            limit: Maximum results to return
            score_threshold: Minimum similarity score
            document_id: Optional filter to specific document

        Returns:
            List of search results with content and metadata
        """
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"

            # Generate query embedding
            query_embeddings = self.generate_embeddings([query_text])
            if not query_embeddings:
                return []

            query_vector = query_embeddings[0]

            # Build filter if document_id specified
            query_filter = None
            if document_id:
                query_filter = Filter(
                    must=[FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )]
                )

            # Perform search
            search_results = await self.async_client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False
            )

            # Format results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "score": float(result.score),
                    "content": result.payload.get("content", ""),
                    "content_preview": result.payload.get("content_preview", ""),
                    "document_id": result.payload.get("document_id"),
                    "chunk_index": result.payload.get("chunk_index"),
                    "metadata": {k: v for k, v in result.payload.items()
                               if k not in ["content", "content_preview", "document_id", "chunk_index"]}
                })

            logger.info(f"🔍 Found {len(results)} results for query in class {class_id}")
            return results

        except Exception as e:
            logger.error(f"❌ Semantic search failed: {e}")
            return []

    async def get_collection_info(self, class_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a class collection"""
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"
            info = await self.async_client.get_collection(collection_name)

            return {
                "collection_name": collection_name,
                "vectors_count": info.vectors_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "points_count": info.points_count,
                "segments_count": info.segments_count,
                "status": info.status.value,
                "optimizer_status": info.optimizer_status.ok,
                "disk_data_size": getattr(info, 'disk_data_size', 0),
                "ram_data_size": getattr(info, 'ram_data_size', 0)
            }

        except Exception as e:
            logger.error(f"❌ Failed to get collection info: {e}")
            return None

    async def delete_document_chunks(self, class_id: str, document_id: str) -> bool:
        """Delete all chunks for a specific document"""
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"

            # Delete points by document_id filter
            await self.async_client.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )]
                )
            )

            logger.info(f"🗑️ Deleted chunks for document {document_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to delete document chunks: {e}")
            return False

    async def get_document_chunks(self, class_id: str, document_id: str) -> List[Dict[str, Any]]:
        """Retrieve all chunks for a specific document"""
        try:
            collection_name = f"class_{class_id.replace('-', '_')}"

            # Scroll through all points for this document
            points, _ = await self.async_client.scroll(
                collection_name=collection_name,
                scroll_filter=Filter(
                    must=[FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )]
                ),
                limit=1000,  # Adjust based on expected chunk count
                with_payload=True,
                with_vectors=False
            )

            # Format results
            chunks = []
            for point in points:
                chunks.append({
                    "id": point.id,
                    "content": point.payload.get("content", ""),
                    "chunk_index": point.payload.get("chunk_index", 0),
                    "metadata": {k: v for k, v in point.payload.items()
                               if k not in ["content", "document_id", "class_id"]}
                })

            # Sort by chunk index
            chunks.sort(key=lambda x: x["chunk_index"])

            logger.info(f"📄 Retrieved {len(chunks)} chunks for document {document_id}")
            return chunks

        except Exception as e:
            logger.error(f"❌ Failed to retrieve document chunks: {e}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """Check the health status of the vector service"""
        try:
            # Test Qdrant connection
            collections = await self.async_client.get_collections()

            # Test embedding model
            test_embedding = self.generate_embeddings(["test"])

            return {
                "status": "healthy",
                "qdrant_url": self.qdrant_url,
                "collections_count": len(collections.collections),
                "embedding_model": self.model_name,
                "embedding_dimension": self.embedding_dim,
                "embedding_test": len(test_embedding) > 0,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Vector service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


# Global instance
vector_service = VectorService()