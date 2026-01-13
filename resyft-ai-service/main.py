from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

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

# PII keywords to detect
PII_KEYWORDS = [
    'social security', 'ssn', 'ss#', 'social sec',
    'date of birth', 'dob', 'birth date', 'birthdate',
    'driver license', 'drivers license', 'dl#', 'license number',
    'passport', 'passport number',
    'bank account', 'account number', 'routing number',
    'credit card', 'card number', 'cvv', 'expiration',
    'tax id', 'ein', 'itin', 'tin',
    'medicare', 'medicaid', 'member id',
    'phone', 'telephone', 'mobile', 'cell',
    'email', 'e-mail',
    'address', 'street', 'city', 'state', 'zip', 'postal',
    'employer', 'occupation', 'salary', 'income', 'wage',
    'mother maiden', 'maiden name',
    'signature', 'sign here',
]

def check_pii(text: str) -> bool:
    """Check if text contains PII keywords"""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in PII_KEYWORDS)

def classify_block_type(text: str) -> str:
    """Classify the type of a text block"""
    text_lower = text.lower().strip()

    if any(indicator in text_lower for indicator in [':', '_____', '[ ]', '[x]', '□', '☐', '☑']):
        return 'Form field'
    if text_lower in ['[ ]', '[x]', '□', '☐', '☑', 'yes', 'no']:
        return 'Checkbox'
    if 'signature' in text_lower or 'sign here' in text_lower:
        return 'Signature'
    if len(text) < 100 and text.isupper():
        return 'Section header'
    return 'Text'

# ============== Endpoints ==============

@app.get("/")
async def root():
    return {"message": "Form Filler AI Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "form-filler-ai"}

@app.post("/analyze-form", response_model=FormAnalysisResponse)
async def analyze_form(file: UploadFile = File(...)):
    """Analyze a PDF form and extract segments and fields"""
    try:
        content = await file.read()

        # Try to use PyMuPDF if available
        try:
            import fitz
            import tempfile

            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            try:
                doc = fitz.open(tmp_path)
                num_pages = len(doc)
                segments: List[FormSegment] = []
                fields: List[ExtractedFormField] = []

                for page_num in range(num_pages):
                    page = doc[page_num]
                    page_rect = page.rect
                    blocks = page.get_text("dict")["blocks"]

                    for block in blocks:
                        if block.get("type") == 0:
                            bbox = block.get("bbox", (0, 0, 0, 0))
                            block_text = ""
                            for line in block.get("lines", []):
                                for span in line.get("spans", []):
                                    block_text += span.get("text", "") + " "

                            block_text = block_text.strip()
                            if not block_text:
                                continue

                            is_pii = check_pii(block_text)
                            block_type = classify_block_type(block_text)

                            segment = FormSegment(
                                text=block_text,
                                type=block_type,
                                page_number=page_num + 1,
                                top=bbox[1],
                                left=bbox[0],
                                width=bbox[2] - bbox[0],
                                height=bbox[3] - bbox[1],
                                page_width=page_rect.width,
                                page_height=page_rect.height,
                                is_pii=is_pii
                            )
                            segments.append(segment)

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

                    for widget in page.widgets():
                        field_name = widget.field_name or "Unknown"
                        field_value = widget.field_value or ""
                        field_type = "text"

                        if widget.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                            field_type = "checkbox"
                            field_value = "checked" if widget.field_value else "unchecked"

                        fields.append(ExtractedFormField(
                            name=field_name,
                            value=str(field_value),
                            type=field_type,
                            confidence=0.95
                        ))

                doc.close()
                os.unlink(tmp_path)

                all_text = " ".join([s.text for s in segments]).lower()
                form_type = None
                if "tax" in all_text or "irs" in all_text:
                    form_type = "Tax Form"
                elif "insurance" in all_text:
                    form_type = "Insurance Form"
                elif "medical" in all_text or "health" in all_text:
                    form_type = "Medical Form"

                return FormAnalysisResponse(
                    success=True,
                    filename=file.filename or "unknown.pdf",
                    num_pages=num_pages,
                    segments=segments,
                    fields=fields,
                    form_type=form_type
                )
            except Exception as e:
                os.unlink(tmp_path)
                raise e

        except ImportError:
            # PyMuPDF not available - return basic response
            return FormAnalysisResponse(
                success=True,
                filename=file.filename or "unknown.pdf",
                num_pages=1,
                segments=[FormSegment(
                    text="PDF analysis requires PyMuPDF",
                    type="Text",
                    page_number=1,
                    top=0, left=0, width=100, height=20,
                    page_width=612, page_height=792,
                    is_pii=False
                )],
                fields=[],
                form_type=None,
                error="PyMuPDF not available"
            )

    except Exception as e:
        return FormAnalysisResponse(
            success=False,
            filename=file.filename or "unknown.pdf",
            num_pages=0,
            segments=[],
            fields=[],
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
