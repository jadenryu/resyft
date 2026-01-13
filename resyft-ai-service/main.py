import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    text_lower = text.lower()
    return any(kw in text_lower for kw in PII_KEYWORDS)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/analyze-form", response_model=FormAnalysisResponse)
async def analyze_form(file: UploadFile = File(...)):
    try:
        import fitz
        import tempfile

        content = await file.read()
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        doc = fitz.open(tmp_path)
        segments, fields = [], []

        for page_num in range(len(doc)):
            page = doc[page_num]
            for block in page.get_text("dict")["blocks"]:
                if block.get("type") == 0:
                    bbox = block.get("bbox", (0,0,0,0))
                    text = " ".join(span.get("text","") for line in block.get("lines",[]) for span in line.get("spans",[]))
                    if text.strip():
                        segments.append(FormSegment(
                            text=text.strip(), type="Text", page_number=page_num+1,
                            top=bbox[1], left=bbox[0], width=bbox[2]-bbox[0], height=bbox[3]-bbox[1],
                            page_width=page.rect.width, page_height=page.rect.height,
                            is_pii=check_pii(text)
                        ))

        doc.close()
        os.unlink(tmp_path)
        return FormAnalysisResponse(success=True, filename=file.filename or "file.pdf", num_pages=len(doc), segments=segments, fields=fields)
    except Exception as e:
        return FormAnalysisResponse(success=False, filename=file.filename or "file.pdf", num_pages=0, segments=[], fields=[], error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))
