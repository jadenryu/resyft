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
from services.agent_integration import agent_integration

app = FastAPI(title="Resyft AI Service")  # Production-ready AI service

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
    custom_prompt: Optional[str] = None  # Allow custom prompts
    use_pydantic_agent: bool = Field(default=True)  # Toggle between agents

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
    
class AdvancedExtractionRequest(BaseModel):
    paper_url: Optional[str] = None
    paper_text: Optional[str] = None
    research_topic: str
    thesis_statement: Optional[str] = None
    key_terms: Optional[List[str]] = []
    extraction_mode: str = Field(default="mixed", pattern="^(statistical|qualitative|mixed)$")
    num_quotes: int = Field(default=3, ge=0, le=10)
    num_statistics: int = Field(default=5, ge=0, le=20)
    include_methodology: bool = True
    content_priority: str = Field(default="balanced", pattern="^(quotes|statistics|methods|conclusions|balanced)$")
    min_reliability_score: float = Field(default=0.7, ge=0.0, le=1.0)
    citation_style: str = Field(default="APA")

class AdvancedExtractionResponse(BaseModel):
    title: str
    authors: List[str]
    year: Optional[int]
    key_findings: List[str]
    conclusions: str
    quotes: List[Dict[str, Any]]
    statistics: List[Dict[str, Any]]
    methodology: Optional[Dict[str, Any]]
    reliability_score: float
    relevance_score: float
    suggested_text: str
    citation: str
    supports_thesis: Optional[bool]
    contradictions: List[str]
    future_research: List[str]

extractor = PaperExtractor()
scraper = PaperScraper()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/extract", response_model=ExtractionResponse)
async def extract_paper_data(request: ExtractionRequest):
    """Extract information from research papers - Production-ready with comprehensive error handling"""
    import traceback
    
    try:
        # Enhanced debug logging for frontend troubleshooting
        print(f"🌐 === NEW EXTRACTION REQUEST ===")
        print(f"📝 URL provided: {bool(request.paper_url)}")
        print(f"📝 Text provided: {bool(request.paper_text)}")
        if request.paper_text:
            print(f"📝 Text length: {len(request.paper_text)} chars")
            print(f"📝 Text preview: {request.paper_text[:100]}...")
        print(f"📝 Extraction type: {request.extraction_type}")
        print(f"📝 Using PydanticAI: {request.use_pydantic_agent}")
        print(f"📝 Custom prompt: {request.custom_prompt}")
        
        # Input validation
        if not request.paper_url and not request.paper_text:
            raise HTTPException(400, "Either paper_url or paper_text is required")
        
        if request.paper_text and len(request.paper_text.strip()) < 50:
            raise HTTPException(400, "Paper text must be at least 50 characters long")
        
        if request.extraction_type not in ["numerical", "quotes", "details", "all"]:
            raise HTTPException(400, f"Invalid extraction_type: {request.extraction_type}")
        
        print(f"📝 Processing extraction request - Type: {request.extraction_type}, Agent: {request.use_pydantic_agent}")
        
        # Get paper content with error handling
        paper_content = None
        try:
            if request.paper_url:
                print(f"🔍 Scraping paper from URL: {request.paper_url}")
                paper_content = await scraper.scrape_paper(request.paper_url)
                if not paper_content or len(paper_content.strip()) < 50:
                    raise HTTPException(400, "Failed to extract meaningful content from URL")
            elif request.paper_text:
                paper_content = request.paper_text.strip()
                print(f"🔍 Using provided paper text: {len(paper_content)} characters")
                
        except HTTPException:
            raise  # Re-raise HTTP exceptions
        except Exception as e:
            print(f"❌ Error getting paper content: {e}")
            raise HTTPException(400, f"Failed to retrieve paper content: {str(e)}")
        
        # Choose extraction method with error handling
        result = None
        try:
            if request.use_pydantic_agent:
                print("🤖 Using PydanticAI agent for extraction")
                result = await agent_integration.extract_with_agent(
                    content=paper_content,
                    extraction_type=request.extraction_type,
                    project_id=request.project_id,
                    custom_prompt=request.custom_prompt
                )
            else:
                print("🔧 Using legacy OpenRouter extractor")
                result = await extractor.extract(
                    content=paper_content,
                    extraction_type=request.extraction_type,
                    project_context=request.project_id
                )
                
        except Exception as e:
            print(f"❌ Error during extraction: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            
            # Return fallback response instead of crashing
            result = {
                "methods": "Extraction failed",
                "sample_size": None,
                "conclusions": f"Analysis could not be completed: {str(e)}",
                "important_quotes": ["Analysis system temporarily unavailable"],
                "reliability_score": 0.0,
                "relevance_score": 0.0,
                "support_score": 0.0,
                "error": str(e)
            }
        
        # Validate result structure
        if not result or not isinstance(result, dict):
            print("❌ Invalid result structure from extraction")
            result = {
                "methods": "Invalid result",
                "sample_size": None,
                "conclusions": "Analysis returned invalid data structure",
                "important_quotes": [],
                "reliability_score": 0.0,
                "relevance_score": 0.0,
                "support_score": 0.0
            }
        
        # Ensure all required fields are present
        result.setdefault("methods", None)
        result.setdefault("sample_size", None)
        result.setdefault("key_statistics", None)
        result.setdefault("conclusions", None)
        result.setdefault("important_quotes", [])
        result.setdefault("numerical_data", None)
        result.setdefault("reliability_score", 0.0)
        result.setdefault("relevance_score", 0.0)
        result.setdefault("support_score", 0.0)
        
        print(f"✅ Extraction completed successfully")
        return ExtractionResponse(**result)
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"❌ Unexpected error in extract_paper_data: {e}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(500, f"Internal server error: {str(e)}")

@app.post("/extract/advanced", response_model=AdvancedExtractionResponse)
async def extract_paper_advanced(request: AdvancedExtractionRequest):
    """Advanced extraction endpoint with full PydanticAI agent capabilities"""
    try:
        from services.research_agent import (
            UserSettings, ProjectContext, ExtractionMode, ContentPriority,
            analyze_research_paper
        )
        
        # Get paper content
        if request.paper_url:
            paper_content = await scraper.scrape_paper(request.paper_url)
        elif request.paper_text:
            paper_content = request.paper_text
        else:
            raise HTTPException(400, "Either paper_url or paper_text is required")
        
        # Map string enums to actual enums
        extraction_mode_map = {
            "statistical": ExtractionMode.STATISTICAL,
            "qualitative": ExtractionMode.QUALITATIVE,
            "mixed": ExtractionMode.MIXED
        }
        
        content_priority_map = {
            "quotes": ContentPriority.QUOTES,
            "statistics": ContentPriority.STATISTICS,
            "methods": ContentPriority.METHODS,
            "conclusions": ContentPriority.CONCLUSIONS,
            "balanced": ContentPriority.BALANCED
        }
        
        # Create settings
        user_settings = UserSettings(
            extraction_mode=extraction_mode_map[request.extraction_mode],
            num_quotes=request.num_quotes,
            num_statistics=request.num_statistics,
            include_methodology=request.include_methodology,
            include_sample_size=True,
            content_priority=content_priority_map[request.content_priority],
            min_reliability_score=request.min_reliability_score
        )
        
        project_context = ProjectContext(
            research_topic=request.research_topic,
            thesis_statement=request.thesis_statement,
            key_terms=request.key_terms or [],
            citation_style=request.citation_style
        )
        
        # Run analysis
        result = await analyze_research_paper(
            paper_content=paper_content,
            user_settings=user_settings,
            project_context=project_context
        )
        
        # Convert to response format
        return AdvancedExtractionResponse(
            title=result.title,
            authors=result.authors,
            year=result.year,
            key_findings=result.key_findings,
            conclusions=result.conclusions,
            quotes=[{
                "text": q.text,
                "page_number": q.page_number,
                "context": q.context,
                "relevance_score": q.relevance_score
            } for q in result.quotes],
            statistics=[{
                "value": s.value,
                "description": s.description,
                "context": s.context,
                "significance": s.significance
            } for s in result.statistics],
            methodology={
                "approach": result.methodology.approach,
                "design": result.methodology.design,
                "sample_size": result.methodology.sample_size,
                "data_collection": result.methodology.data_collection,
                "limitations": result.methodology.limitations
            } if result.methodology else None,
            reliability_score=result.reliability_score,
            relevance_score=result.relevance_score,
            suggested_text=result.suggested_text,
            citation=result.citation,
            supports_thesis=result.supports_thesis,
            contradictions=result.contradictions,
            future_research=result.future_research
        )
        
    except Exception as e:
        raise HTTPException(500, f"Advanced extraction failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)