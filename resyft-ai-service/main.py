from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import uvicorn
import tempfile
import fitz  # PyMuPDF

app = FastAPI(title="Form Filler AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Models ==============

class FormSegment(BaseModel):
    """A segment extracted from a PDF form"""
    text: str
    type: str  # Title, Text, Form field, Checkbox, etc.
    page_number: int
    top: float
    left: float
    width: float
    height: float
    page_width: float
    page_height: float

class ExtractedFormField(BaseModel):
    """A field extracted from a form"""
    name: str
    value: str
    type: str  # text, checkbox, date, number, etc.
    confidence: float

class FormAnalysisResponse(BaseModel):
    """Response from form analysis"""
    success: bool
    filename: str
    num_pages: int
    segments: List[FormSegment]
    fields: List[ExtractedFormField]
    form_type: Optional[str] = None
    error: Optional[str] = None

# ============== Helper Functions ==============

def classify_block_type(text: str, block_rect: tuple, page_rect: tuple) -> str:
    """Classify the type of a text block based on content and position"""
    text_lower = text.lower().strip()

    # Check for form field indicators
    if any(indicator in text_lower for indicator in [':', '_____', '[ ]', '[x]', '□', '☐', '☑']):
        return 'Form field'

    # Check for checkboxes
    if text_lower in ['[ ]', '[x]', '□', '☐', '☑', 'yes', 'no']:
        return 'Checkbox'

    # Check for signature lines
    if 'signature' in text_lower or 'sign here' in text_lower:
        return 'Signature'

    # Check for date fields
    if 'date' in text_lower and ('/' in text or '-' in text or ':' in text_lower):
        return 'Date field'

    # Check position - titles are usually at top and larger
    x0, y0, x1, y1 = block_rect
    page_width = page_rect[2] - page_rect[0]
    page_height = page_rect[3] - page_rect[1]

    relative_y = (y0 - page_rect[1]) / page_height
    block_width = x1 - x0

    # Title detection
    if relative_y < 0.15 and block_width > page_width * 0.5:
        return 'Title'

    # Section header detection
    if len(text) < 100 and text.isupper():
        return 'Section header'

    return 'Text'

# ============== Endpoints ==============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "form-filler-ai"}

@app.post("/analyze-form", response_model=FormAnalysisResponse)
async def analyze_form(file: UploadFile = File(...)):
    """
    Analyze a PDF form and extract segments and fields
    """
    try:
        print(f"📄 === FORM ANALYSIS REQUEST ===")
        print(f"📝 Filename: {file.filename}")
        print(f"📝 Content type: {file.content_type}")

        # Read file content
        content = await file.read()
        print(f"📝 File size: {len(content)} bytes")

        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(tmp_path)
            num_pages = len(doc)
            print(f"📝 Number of pages: {num_pages}")

            segments: List[FormSegment] = []
            fields: List[ExtractedFormField] = []

            for page_num in range(num_pages):
                page = doc[page_num]
                page_rect = page.rect
                page_width = page_rect.width
                page_height = page_rect.height

                # Extract text blocks
                blocks = page.get_text("dict")["blocks"]

                for block in blocks:
                    if block.get("type") == 0:  # Text block
                        # Get block bounds
                        bbox = block.get("bbox", (0, 0, 0, 0))

                        # Extract text from lines
                        block_text = ""
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                block_text += span.get("text", "") + " "

                        block_text = block_text.strip()
                        if not block_text:
                            continue

                        # Classify block type
                        block_type = classify_block_type(block_text, bbox, page_rect)

                        segment = FormSegment(
                            text=block_text,
                            type=block_type,
                            page_number=page_num + 1,
                            top=bbox[1],
                            left=bbox[0],
                            width=bbox[2] - bbox[0],
                            height=bbox[3] - bbox[1],
                            page_width=page_width,
                            page_height=page_height
                        )
                        segments.append(segment)

                        # Try to extract form fields
                        if ':' in block_text:
                            parts = block_text.split(':', 1)
                            if len(parts) == 2:
                                field_name = parts[0].strip()
                                field_value = parts[1].strip()
                                if field_name and len(field_name) < 50:
                                    fields.append(ExtractedFormField(
                                        name=field_name,
                                        value=field_value,
                                        type='text',
                                        confidence=0.8
                                    ))

                # Extract form widgets (interactive fields)
                for widget in page.widgets():
                    field_name = widget.field_name or "Unknown"
                    field_value = widget.field_value or ""
                    field_type = "text"

                    if widget.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                        field_type = "checkbox"
                        field_value = "checked" if widget.field_value else "unchecked"
                    elif widget.field_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
                        field_type = "radio"
                    elif widget.field_type == fitz.PDF_WIDGET_TYPE_COMBOBOX:
                        field_type = "dropdown"
                    elif widget.field_type == fitz.PDF_WIDGET_TYPE_LISTBOX:
                        field_type = "listbox"

                    fields.append(ExtractedFormField(
                        name=field_name,
                        value=str(field_value),
                        type=field_type,
                        confidence=0.95
                    ))

            doc.close()

            # Determine form type based on content
            all_text = " ".join([s.text for s in segments]).lower()
            form_type = None
            if "tax" in all_text or "irs" in all_text or "1040" in all_text:
                form_type = "Tax Form"
            elif "insurance" in all_text or "coverage" in all_text:
                form_type = "Insurance Form"
            elif "application" in all_text:
                form_type = "Application Form"
            elif "medical" in all_text or "health" in all_text or "patient" in all_text:
                form_type = "Medical Form"

            print(f"✅ Analysis complete: {len(segments)} segments, {len(fields)} fields")

            return FormAnalysisResponse(
                success=True,
                filename=file.filename or "unknown.pdf",
                num_pages=num_pages,
                segments=segments,
                fields=fields,
                form_type=form_type
            )

        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except Exception as e:
        print(f"❌ Error analyzing form: {e}")
        import traceback
        traceback.print_exc()
        return FormAnalysisResponse(
            success=False,
            filename=file.filename or "unknown.pdf",
            num_pages=0,
            segments=[],
            fields=[],
            error=str(e)
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
