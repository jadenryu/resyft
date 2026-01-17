"""
Document Processing Service for Resyft School Productivity Platform
Handles document parsing, text extraction, and intelligent chunking for vector embeddings
"""

import os
import uuid
import asyncio
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from datetime import datetime
import mimetypes
import tempfile
from pathlib import Path

# Document processing imports
import fitz  # PyMuPDF
from docx import Document as DocxDocument
import PyPDF2
from bs4 import BeautifulSoup

# Text processing and chunking
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    MarkdownHeaderTextSplitter,
    TokenTextSplitter
)
import tiktoken

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    High-performance document processing service optimized for academic content
    Supports multiple file formats and intelligent chunking strategies
    """

    def __init__(self):
        # Chunking configuration optimized for study materials
        self.default_chunk_size = 512  # Tokens, good for semantic coherence
        self.default_chunk_overlap = 64  # 12.5% overlap for context preservation
        self.max_chunk_size = 1024  # Maximum for complex topics
        self.min_chunk_size = 128  # Minimum meaningful chunk

        # Supported file types
        self.supported_types = {
            'application/pdf': self._process_pdf,
            'text/plain': self._process_text,
            'text/markdown': self._process_markdown,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._process_docx,
            'text/html': self._process_html,
            'application/rtf': self._process_text,  # Basic text extraction
        }

        # Initialize tokenizer for precise chunking
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer
        except Exception as e:
            logger.warning(f"Could not load tiktoken: {e}")
            self.tokenizer = None

    async def process_document(
        self,
        file_content: bytes,
        filename: str,
        document_id: str,
        class_id: str,
        document_type: str = "lecture_notes"
    ) -> Dict[str, Any]:
        """
        Process a document and return extracted content with chunks

        Args:
            file_content: Raw file bytes
            filename: Original filename
            document_id: UUID of the document
            class_id: UUID of the class
            document_type: Type of document for optimized processing

        Returns:
            Processing result with content, chunks, and metadata
        """
        try:
            start_time = datetime.now()

            # Detect MIME type
            mime_type, _ = mimetypes.guess_type(filename)
            file_extension = Path(filename).suffix.lower()

            logger.info(f"📄 Processing document: {filename} ({mime_type})")

            # Extract text content
            extraction_result = await self._extract_text_content(
                file_content, mime_type, file_extension, filename
            )

            if not extraction_result["success"]:
                return {
                    "success": False,
                    "error": extraction_result["error"],
                    "processing_time": (datetime.now() - start_time).total_seconds()
                }

            content = extraction_result["content"]
            metadata = extraction_result["metadata"]

            # Create chunks optimized for document type
            chunks = await self._create_intelligent_chunks(
                content, document_type, filename, metadata
            )

            # Calculate statistics
            processing_time = (datetime.now() - start_time).total_seconds()
            content_preview = content[:500] + "..." if len(content) > 500 else content

            result = {
                "success": True,
                "content": content,
                "content_preview": content_preview,
                "content_length": len(content),
                "chunks": chunks,
                "chunk_count": len(chunks),
                "metadata": {
                    **metadata,
                    "document_id": document_id,
                    "class_id": class_id,
                    "filename": filename,
                    "file_extension": file_extension,
                    "mime_type": mime_type,
                    "document_type": document_type,
                    "processing_time_seconds": processing_time,
                    "processed_at": datetime.now().isoformat()
                },
                "processing_time": processing_time
            }

            logger.info(f"Processed {filename}: {len(chunks)} chunks in {processing_time:.2f}s")
            return result

        except Exception as e:
            logger.error(f"Document processing failed for {filename}: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": (datetime.now() - start_time).total_seconds()
            }

    async def _extract_text_content(
        self,
        file_content: bytes,
        mime_type: str,
        file_extension: str,
        filename: str
    ) -> Dict[str, Any]:
        """Extract text content from various file formats"""
        try:
            # Use MIME type or fall back to file extension
            processor = self.supported_types.get(mime_type)

            if not processor:
                # Try to determine processor by file extension
                extension_mapping = {
                    '.pdf': self._process_pdf,
                    '.txt': self._process_text,
                    '.md': self._process_markdown,
                    '.docx': self._process_docx,
                    '.html': self._process_html,
                    '.htm': self._process_html,
                    '.rtf': self._process_text
                }
                processor = extension_mapping.get(file_extension)

            if not processor:
                return {
                    "success": False,
                    "error": f"Unsupported file type: {mime_type or file_extension}"
                }

            # Create temporary file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name

            try:
                # Process the file
                result = await processor(temp_file_path, filename)
                return result
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return {
                "success": False,
                "error": f"Text extraction failed: {str(e)}"
            }

    async def _process_pdf(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process PDF files using PyMuPDF for better text extraction"""
        try:
            content = ""
            metadata = {"pages": 0, "extraction_method": "pymupdf"}

            # Try PyMuPDF first (better for complex layouts)
            try:
                doc = fitz.open(file_path)
                pages_text = []

                for page_num, page in enumerate(doc):
                    page_text = page.get_text()
                    if page_text.strip():
                        pages_text.append(f"[Page {page_num + 1}]\n{page_text}")

                content = "\n\n".join(pages_text)
                metadata["pages"] = len(doc)
                doc.close()

            except Exception as pymupdf_error:
                logger.warning(f"PyMuPDF failed, trying PyPDF2: {pymupdf_error}")

                # Fallback to PyPDF2
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    pages_text = []

                    for page_num, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        if page_text.strip():
                            pages_text.append(f"[Page {page_num + 1}]\n{page_text}")

                    content = "\n\n".join(pages_text)
                    metadata["pages"] = len(pdf_reader.pages)
                    metadata["extraction_method"] = "pypdf2"

            if not content.strip():
                return {
                    "success": False,
                    "error": "No text content could be extracted from PDF"
                }

            return {
                "success": True,
                "content": content,
                "metadata": metadata
            }

        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            return {
                "success": False,
                "error": f"PDF processing failed: {str(e)}"
            }

    async def _process_docx(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process DOCX files"""
        try:
            doc = DocxDocument(file_path)
            paragraphs = []

            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    paragraphs.append(paragraph.text)

            content = "\n\n".join(paragraphs)

            # Extract metadata
            metadata = {
                "paragraphs": len(paragraphs),
                "extraction_method": "python-docx"
            }

            # Try to get document properties
            try:
                core_props = doc.core_properties
                if core_props.title:
                    metadata["title"] = core_props.title
                if core_props.author:
                    metadata["author"] = core_props.author
                if core_props.subject:
                    metadata["subject"] = core_props.subject
            except:
                pass

            return {
                "success": True,
                "content": content,
                "metadata": metadata
            }

        except Exception as e:
            logger.error(f"DOCX processing failed: {e}")
            return {
                "success": False,
                "error": f"DOCX processing failed: {str(e)}"
            }

    async def _process_text(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process plain text files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            return {
                "success": True,
                "content": content,
                "metadata": {
                    "lines": content.count('\n') + 1,
                    "extraction_method": "plain_text"
                }
            }

        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    content = file.read()
                return {
                    "success": True,
                    "content": content,
                    "metadata": {
                        "lines": content.count('\n') + 1,
                        "extraction_method": "plain_text_latin1"
                    }
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Text encoding error: {str(e)}"
                }

        except Exception as e:
            logger.error(f"Text processing failed: {e}")
            return {
                "success": False,
                "error": f"Text processing failed: {str(e)}"
            }

    async def _process_markdown(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process Markdown files with header structure preservation"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            # Count markdown elements
            headers = content.count('#')
            code_blocks = content.count('```')
            links = content.count('[')

            return {
                "success": True,
                "content": content,
                "metadata": {
                    "headers": headers,
                    "code_blocks": code_blocks // 2,  # Pairs of ```
                    "links": links,
                    "extraction_method": "markdown"
                }
            }

        except Exception as e:
            logger.error(f"Markdown processing failed: {e}")
            return {
                "success": False,
                "error": f"Markdown processing failed: {str(e)}"
            }

    async def _process_html(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process HTML files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                html_content = file.read()

            soup = BeautifulSoup(html_content, 'html.parser')

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.extract()

            # Get text content
            content = soup.get_text()

            # Clean up whitespace
            lines = [line.strip() for line in content.splitlines()]
            content = '\n'.join(line for line in lines if line)

            return {
                "success": True,
                "content": content,
                "metadata": {
                    "html_elements": len(soup.find_all()),
                    "extraction_method": "beautifulsoup"
                }
            }

        except Exception as e:
            logger.error(f"HTML processing failed: {e}")
            return {
                "success": False,
                "error": f"HTML processing failed: {str(e)}"
            }

    async def _create_intelligent_chunks(
        self,
        content: str,
        document_type: str,
        filename: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Create intelligent chunks based on document type and content structure"""
        try:
            chunks = []

            # Choose chunking strategy based on document type
            if document_type == "lecture_notes" or "notes" in filename.lower():
                chunks = self._chunk_lecture_notes(content)
            elif document_type == "textbook" or "book" in filename.lower():
                chunks = self._chunk_textbook(content)
            elif document_type == "slides" or "slide" in filename.lower():
                chunks = self._chunk_slides(content)
            elif document_type == "syllabus":
                chunks = self._chunk_syllabus(content)
            else:
                # Default academic chunking
                chunks = self._chunk_academic_content(content)

            # Add metadata to each chunk
            for i, chunk in enumerate(chunks):
                chunk.update({
                    "chunk_id": str(uuid.uuid4()),
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "document_type": document_type,
                    "filename": filename,
                    "source_metadata": metadata
                })

            return chunks

        except Exception as e:
            logger.error(f"Chunking failed: {e}")
            # Fallback to simple chunking
            return self._chunk_academic_content(content)

    def _chunk_lecture_notes(self, content: str) -> List[Dict[str, Any]]:
        """Optimized chunking for lecture notes - preserves topic boundaries"""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.default_chunk_size,
            chunk_overlap=self.default_chunk_overlap,
            separators=[
                "\n# ",  # Markdown headers
                "\n## ",
                "\n### ",
                "\n\n",  # Paragraph breaks
                "\n",
                ". ",
                "? ",
                "! ",
                " ",
                ""
            ],
            length_function=self._token_length if self.tokenizer else len
        )

        chunks_text = splitter.split_text(content)
        return [{"content": chunk, "metadata": {"chunk_type": "lecture_section"}}
                for chunk in chunks_text if chunk.strip()]

    def _chunk_textbook(self, content: str) -> List[Dict[str, Any]]:
        """Larger chunks for textbook content to preserve context"""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.max_chunk_size,
            chunk_overlap=128,  # More overlap for complex concepts
            separators=[
                "\n# ",
                "\n## ",
                "\n### ",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            length_function=self._token_length if self.tokenizer else len
        )

        chunks_text = splitter.split_text(content)
        return [{"content": chunk, "metadata": {"chunk_type": "textbook_section"}}
                for chunk in chunks_text if chunk.strip()]

    def _chunk_slides(self, content: str) -> List[Dict[str, Any]]:
        """Slide-aware chunking - each slide becomes a chunk"""
        # Look for slide indicators
        slide_separators = [
            "Slide ",
            "[Page ",
            "---",
            "\n\n\n"  # Multiple line breaks often indicate slide boundaries
        ]

        # Try to split by slide indicators first
        chunks = []
        current_chunk = ""

        lines = content.split('\n')
        for line in lines:
            if any(sep in line for sep in slide_separators) and current_chunk.strip():
                chunks.append(current_chunk.strip())
                current_chunk = line + '\n'
            else:
                current_chunk += line + '\n'

        # Add final chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        # If slide detection didn't work well, fall back to smaller chunks
        if len(chunks) < 3:
            return self._chunk_academic_content(content)

        return [{"content": chunk, "metadata": {"chunk_type": "slide"}}
                for chunk in chunks if chunk.strip()]

    def _chunk_syllabus(self, content: str) -> List[Dict[str, Any]]:
        """Syllabus-specific chunking - preserves course structure"""
        # Syllabus sections are often well-structured
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.default_chunk_size,
            chunk_overlap=32,  # Less overlap for structured content
            separators=[
                "\nWeek ",
                "\nModule ",
                "\nChapter ",
                "\nSection ",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            length_function=self._token_length if self.tokenizer else len
        )

        chunks_text = splitter.split_text(content)
        return [{"content": chunk, "metadata": {"chunk_type": "syllabus_section"}}
                for chunk in chunks_text if chunk.strip()]

    def _chunk_academic_content(self, content: str) -> List[Dict[str, Any]]:
        """Default academic content chunking"""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.default_chunk_size,
            chunk_overlap=self.default_chunk_overlap,
            separators=[
                "\n\n",  # Paragraph breaks
                "\n",
                ". ",
                "? ",
                "! ",
                " ",
                ""
            ],
            length_function=self._token_length if self.tokenizer else len
        )

        chunks_text = splitter.split_text(content)
        return [{"content": chunk, "metadata": {"chunk_type": "academic_content"}}
                for chunk in chunks_text if chunk.strip()]

    def _token_length(self, text: str) -> int:
        """Calculate text length in tokens"""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        return len(text)

    async def health_check(self) -> Dict[str, Any]:
        """Health check for document processor"""
        try:
            # Test basic functionality
            test_result = await self._create_intelligent_chunks(
                "Test content for health check.",
                "test",
                "test.txt",
                {}
            )

            return {
                "status": "healthy",
                "supported_formats": list(self.supported_types.keys()),
                "chunk_test": len(test_result) > 0,
                "tokenizer_available": self.tokenizer is not None,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Document processor health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


# Global instance
document_processor = DocumentProcessor()