from dotenv import load_dotenv
load_dotenv()  # Load environment variables first

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os
import uvicorn

from services.extractor import PaperExtractor
from services.scraper import PaperScraper

app = FastAPI(title="Resyft AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractionRequest(BaseModel):
    paper_url: Optional[str] = None
    paper_text: Optional[str] = None
    extraction_type: str = Field(..., pattern="^(numerical|quotes|details|all)$")
    project_id: Optional[str] = None

class ExtractionResponse(BaseModel):
    methods: Optional[str] = None
    sample_size: Optional[int] = None
    key_statistics: Optional[Dict[str, Any]] = None
    conclusions: Optional[str] = None
    important_quotes: Optional[List[str]] = None
    numerical_data: Optional[Dict[str, float]] = None
    reliability_score: Optional[float] = None
    relevance_score: Optional[float] = None
    support_score: Optional[float] = None

extractor = PaperExtractor()
scraper = PaperScraper()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/extract", response_model=ExtractionResponse)
async def extract_paper_data(request: ExtractionRequest):
    try:
        # Get paper content
        if request.paper_url:
            paper_content = await scraper.scrape_paper(request.paper_url)
        elif request.paper_text:
            paper_content = request.paper_text
        else:
            raise HTTPException(400, "Either paper_url or paper_text is required")
        
        # Extract information
        result = await extractor.extract(
            content=paper_content,
            extraction_type=request.extraction_type,
            project_context=request.project_id
        )
        
        return ExtractionResponse(**result)
        
    except Exception as e:
        raise HTTPException(500, f"Extraction failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)