import os
import httpx
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client

app = FastAPI()

# Initialize Supabase client
def get_supabase() -> Optional[Client]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for backend operations
    if url and key:
        return create_client(url, key)
    return None

# CORS - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class FormSegment(BaseModel):
    text: str
    type: str
    page_number: int
    top: float
    left: float
    width: float
    height: float
    page_width: float
    page_height: float
    is_pii: bool = False

class ExtractedFormField(BaseModel):
    name: str
    value: str
    type: str
    confidence: float

class FormAnalysisResponse(BaseModel):
    success: bool
    filename: str
    num_pages: int
    segments: List[FormSegment]
    fields: List[ExtractedFormField]
    form_type: Optional[str] = None
    error: Optional[str] = None

PII_KEYWORDS = ['social security', 'ssn', 'date of birth', 'dob', 'driver license',
    'passport', 'bank account', 'credit card', 'tax id', 'phone', 'email',
    'address', 'salary', 'income', 'signature']

def check_pii(text: str) -> bool:
    return any(kw in text.lower() for kw in PII_KEYWORDS)

# Embedding models
class EmbeddingSegment(BaseModel):
    text: str
    type: str
    page_number: int
    is_pii: bool = False

class StoreEmbeddingsRequest(BaseModel):
    user_id: str
    project_id: str
    form_id: str
    form_name: str
    segments: List[EmbeddingSegment]

class StoreEmbeddingsResponse(BaseModel):
    success: bool
    stored_count: int = 0
    error: Optional[str] = None

class ChatMessageBase(BaseModel):
    role: str
    content: str

class RAGChatRequest(BaseModel):
    user_id: str
    project_id: str
    message: str
    history: List[ChatMessageBase] = []
    current_form_context: Optional[str] = None  # Current form segments for immediate context

class RAGChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    sources: List[str] = []
    error: Optional[str] = None

async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using OpenAI API via OpenRouter"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise Exception("OPENROUTER_API_KEY not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/text-embedding-ada-002",
                "input": texts
            },
            timeout=60.0
        )

        if response.status_code == 200:
            data = response.json()
            return [item["embedding"] for item in data["data"]]
        else:
            raise Exception(f"Embedding API error: {response.status_code}")

@app.get("/")
def root():
    return {"status": "ok", "service": "form-filler-ai"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Handle OPTIONS preflight for analyze-form
@app.options("/analyze-form")
async def options_analyze_form():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

def classify_text_type(text: str, bbox: tuple, page_width: float, page_height: float) -> str:
    """Classify text based on content and position"""
    text_lower = text.lower().strip()
    x0, y0, x1, y1 = bbox
    width = x1 - x0

    # Check for section headers (large text near top or left, short text)
    if len(text) < 50 and (y0 < page_height * 0.15 or text.endswith(':')):
        if any(kw in text_lower for kw in ['section', 'part', 'step', 'instructions', 'information']):
            return "Section Header"

    # Check for form labels (short text ending with colon or near form fields)
    if len(text) < 40 and (text.endswith(':') or text.endswith('?')):
        return "Label"

    # Check for checkboxes/options
    if text_lower.startswith(('yes', 'no', '[ ]', '[x]', '☐', '☑')):
        return "Checkbox"

    # Check for signature lines
    if 'signature' in text_lower or 'sign here' in text_lower or 'date:' in text_lower:
        return "Signature"

    # Check for instructions (longer text)
    if len(text) > 100:
        return "Instructions"

    return "Text"

@app.post("/analyze-form")
async def analyze_form(file: UploadFile = File(...)):
    try:
        import fitz
        import tempfile

        content = await file.read()

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        doc = fitz.open(tmp_path)
        segments = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            page_width = page.rect.width
            page_height = page.rect.height

            # Extract text blocks with line-level granularity for better segmentation
            for block in page.get_text("dict")["blocks"]:
                if block.get("type") == 0:  # Text block
                    # Process each line separately for better segmentation
                    for line in block.get("lines", []):
                        line_bbox = line.get("bbox", (0,0,0,0))
                        line_text = " ".join(span.get("text", "") for span in line.get("spans", []))

                        if line_text.strip():
                            text_type = classify_text_type(line_text, line_bbox, page_width, page_height)
                            segments.append(FormSegment(
                                text=line_text.strip(),
                                type=text_type,
                                page_number=page_num+1,
                                top=line_bbox[1],
                                left=line_bbox[0],
                                width=line_bbox[2]-line_bbox[0],
                                height=line_bbox[3]-line_bbox[1],
                                page_width=page_width,
                                page_height=page_height,
                                is_pii=check_pii(line_text)
                            ))

            # Extract form widgets (interactive form fields)
            for widget in page.widgets():
                if widget.rect:
                    field_name = widget.field_name or "Field"
                    field_value = widget.field_value or ""
                    field_type = widget.field_type_string or "Unknown"

                    # Map widget type to our type system
                    if field_type in ["Text", "Tx"]:
                        seg_type = "Form Field"
                    elif field_type in ["CheckBox", "Btn"]:
                        seg_type = "Checkbox"
                    elif field_type in ["ComboBox", "Choice", "Ch"]:
                        seg_type = "Dropdown"
                    elif field_type == "Sig":
                        seg_type = "Signature"
                    else:
                        seg_type = "Form Field"

                    display_text = f"{field_name}: {field_value}" if field_value else field_name

                    segments.append(FormSegment(
                        text=display_text,
                        type=seg_type,
                        page_number=page_num+1,
                        top=widget.rect.y0,
                        left=widget.rect.x0,
                        width=widget.rect.width,
                        height=widget.rect.height,
                        page_width=page_width,
                        page_height=page_height,
                        is_pii=check_pii(display_text)
                    ))

        num_pages = len(doc)
        doc.close()
        os.unlink(tmp_path)

        return FormAnalysisResponse(
            success=True,
            filename=file.filename or "file.pdf",
            num_pages=num_pages,
            segments=segments,
            fields=[]
        )
    except Exception as e:
        return FormAnalysisResponse(
            success=False,
            filename=file.filename or "file.pdf",
            num_pages=0,
            segments=[],
            fields=[],
            error=str(e)
        )

class SummaryRequest(BaseModel):
    segments: List[FormSegment]
    filename: str

class SummaryResponse(BaseModel):
    success: bool
    summary: Optional[str] = None
    error: Optional[str] = None

@app.options("/summarize-form")
async def options_summarize_form():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

@app.post("/summarize-form")
async def summarize_form(request: SummaryRequest):
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return SummaryResponse(
                success=False,
                error="OpenRouter API key not configured"
            )

        # Build context from segments
        text_content = []
        pii_fields = []
        form_fields = []

        for seg in request.segments:
            if seg.is_pii:
                pii_fields.append(seg.text)
            if seg.type in ["Form Field", "Checkbox", "Dropdown"]:
                form_fields.append(seg.text)
            text_content.append(f"[{seg.type}] {seg.text}")

        # Limit content to avoid token limits
        content_preview = "\n".join(text_content[:100])

        prompt = f"""Analyze this form and provide a brief, helpful summary in 2-3 sentences.

Form: {request.filename}
Content preview:
{content_preview}

PII fields detected: {len(pii_fields)}
Form fields detected: {len(form_fields)}

Provide:
1. What type of form this appears to be
2. Its main purpose
3. Any important notes about filling it out

Keep response under 100 words."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:3000"),
                },
                json={
                    "model": os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet"),
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 200,
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                summary = data["choices"][0]["message"]["content"]
                return SummaryResponse(success=True, summary=summary)
            else:
                return SummaryResponse(
                    success=False,
                    error=f"API error: {response.status_code}"
                )

    except Exception as e:
        return SummaryResponse(
            success=False,
            error=str(e)
        )


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None

@app.options("/chat")
async def options_chat():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return ChatResponse(
                success=False,
                error="OpenRouter API key not configured"
            )

        # Build conversation messages
        messages = [
            {
                "role": "system",
                "content": f"""You are a helpful AI assistant that helps users understand and fill out forms.
You have access to the following form content (may include multiple forms from a project):

{request.context}

Help the user understand the forms, explain what information is needed for each field,
and provide guidance on how to complete them correctly. Be concise and helpful.
If the user asks about a specific form, focus on that form's content.
If asked about something not in the provided forms, politely explain that you can only help with the available form content."""
            }
        ]

        # Add conversation history
        for msg in request.history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add current message
        messages.append({
            "role": "user",
            "content": request.message
        })

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:3000"),
                },
                json={
                    "model": os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet"),
                    "messages": messages,
                    "max_tokens": 1000,
                },
                timeout=60.0  # Increased timeout for larger contexts
            )

            if response.status_code == 200:
                data = response.json()
                reply = data["choices"][0]["message"]["content"]
                return ChatResponse(success=True, response=reply)
            else:
                return ChatResponse(
                    success=False,
                    error=f"API error: {response.status_code}"
                )

    except Exception as e:
        return ChatResponse(
            success=False,
            error=str(e)
        )


# ============== RAG Endpoints ==============

@app.options("/store-embeddings")
async def options_store_embeddings():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

@app.post("/store-embeddings")
async def store_embeddings(request: StoreEmbeddingsRequest):
    """Store segment embeddings in Supabase for RAG retrieval"""
    try:
        supabase = get_supabase()
        if not supabase:
            return StoreEmbeddingsResponse(
                success=False,
                error="Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY."
            )

        # Filter out very short segments
        valid_segments = [s for s in request.segments if len(s.text.strip()) > 10]
        if not valid_segments:
            return StoreEmbeddingsResponse(success=True, stored_count=0)

        # Generate embeddings in batches of 100
        batch_size = 100
        total_stored = 0

        for i in range(0, len(valid_segments), batch_size):
            batch = valid_segments[i:i + batch_size]
            texts = [s.text for s in batch]

            try:
                embeddings = await generate_embeddings(texts)
            except Exception as e:
                print(f"Embedding generation error: {e}")
                continue

            # Prepare records for insertion
            records = []
            for seg, embedding in zip(batch, embeddings):
                records.append({
                    "user_id": request.user_id,
                    "project_id": request.project_id,
                    "form_id": request.form_id,
                    "form_name": request.form_name,
                    "segment_text": seg.text,
                    "segment_type": seg.type,
                    "page_number": seg.page_number,
                    "is_pii": seg.is_pii,
                    "embedding": embedding
                })

            # Insert into Supabase
            result = supabase.table("segment_embeddings").insert(records).execute()
            total_stored += len(records)

        return StoreEmbeddingsResponse(success=True, stored_count=total_stored)

    except Exception as e:
        print(f"Store embeddings error: {e}")
        return StoreEmbeddingsResponse(success=False, error=str(e))


@app.options("/rag-chat")
async def options_rag_chat():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

@app.post("/rag-chat")
async def rag_chat(request: RAGChatRequest):
    """Chat with RAG - retrieves relevant segments via semantic search"""
    try:
        supabase = get_supabase()
        api_key = os.getenv("OPENROUTER_API_KEY")

        if not api_key:
            return RAGChatResponse(success=False, error="OPENROUTER_API_KEY not configured")

        context_segments = []
        sources = []

        # If Supabase is configured, do semantic search
        if supabase:
            try:
                # Generate embedding for the query
                query_embedding = (await generate_embeddings([request.message]))[0]

                # Search for similar segments
                result = supabase.rpc(
                    "search_segments",
                    {
                        "query_embedding": query_embedding,
                        "match_project_id": request.project_id,
                        "match_user_id": request.user_id,
                        "match_count": 30
                    }
                ).execute()

                if result.data:
                    for row in result.data:
                        pii_marker = " [PII]" if row.get("is_pii") else ""
                        context_segments.append(
                            f"[{row['form_name']} - Page {row['page_number']}] [{row['segment_type']}{pii_marker}] {row['segment_text']}"
                        )
                        if row['form_name'] not in sources:
                            sources.append(row['form_name'])

            except Exception as e:
                print(f"RAG search error: {e}")
                # Fall back to no context if search fails

        # Build context from retrieved segments and current form
        context_parts = []

        # Add current form context if provided (immediate context for the form being viewed)
        if request.current_form_context:
            context_parts.append("Current form content:\n" + request.current_form_context)

        # Add RAG-retrieved segments from other forms
        if context_segments:
            context_parts.append("Related information from other forms in this project:\n" + "\n".join(context_segments))

        if context_parts:
            context = "\n\n".join(context_parts)
        else:
            context = "No form content available. Please upload a form to get started."

        # Build messages for LLM
        messages = [
            {
                "role": "system",
                "content": f"""You are a helpful AI assistant that helps users understand and fill out forms.
You have access to the following form content:

{context}

Help the user understand the forms, explain what information is needed for each field,
and provide guidance on how to complete them correctly. Be concise and helpful.
When answering questions, prioritize information from the current form being viewed.
Cite which form the information comes from when relevant."""
            }
        ]

        # Add conversation history
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": request.message})

        # Call LLM
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:3000"),
                },
                json={
                    "model": os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet"),
                    "messages": messages,
                    "max_tokens": 1000,
                },
                timeout=60.0
            )

            if response.status_code == 200:
                data = response.json()
                reply = data["choices"][0]["message"]["content"]
                return RAGChatResponse(success=True, response=reply, sources=sources)
            else:
                return RAGChatResponse(success=False, error=f"API error: {response.status_code}")

    except Exception as e:
        print(f"RAG chat error: {e}")
        return RAGChatResponse(success=False, error=str(e))


@app.delete("/clear-embeddings/{project_id}")
async def clear_embeddings(project_id: str, user_id: str):
    """Clear all embeddings for a project"""
    try:
        supabase = get_supabase()
        if not supabase:
            return {"success": False, "error": "Supabase not configured"}

        supabase.table("segment_embeddings").delete().eq(
            "project_id", project_id
        ).eq("user_id", user_id).execute()

        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
