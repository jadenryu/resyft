import os
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

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
