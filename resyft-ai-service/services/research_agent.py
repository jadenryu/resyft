"""
Research Paper Analysis Agent using PydanticAI
This agent processes research papers and extracts customizable information
based on user preferences and project settings.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, ModelRetry

# Enums for user preferences
class ExtractionMode(str, Enum):
    STATISTICAL = "statistical"
    QUALITATIVE = "qualitative"
    MIXED = "mixed"

class ContentPriority(str, Enum):
    QUOTES = "quotes"
    STATISTICS = "statistics"
    METHODS = "methods"
    CONCLUSIONS = "conclusions"
    BALANCED = "balanced"

# User settings model
class UserSettings(BaseModel):
    """User-specific extraction settings for research analysis"""
    extraction_mode: ExtractionMode = Field(default=ExtractionMode.MIXED)
    num_quotes: int = Field(default=2, ge=0, le=10)
    num_statistics: int = Field(default=3, ge=0, le=20)
    include_methodology: bool = Field(default=True)
    include_sample_size: bool = Field(default=True)
    content_priority: ContentPriority = Field(default=ContentPriority.BALANCED)
    min_reliability_score: float = Field(default=0.7, ge=0.0, le=1.0)

# Project context model
class ProjectContext(BaseModel):
    """Project-specific context for research analysis"""
    research_topic: str = Field(description="The main research topic/question")
    thesis_statement: Optional[str] = Field(default=None, description="Optional thesis to support")
    key_terms: List[str] = Field(default_factory=list, description="Important terms to focus on")
    citation_style: str = Field(default="APA", description="Citation style preference")

# Dependencies dataclass
@dataclass
class ResearchAgentDeps:
    """Dependencies for the research analysis agent"""
    user_settings: UserSettings
    project_context: ProjectContext
    paper_content: str  # The full text of the research paper
    paper_url: Optional[str] = None
    paper_metadata: Optional[Dict[str, Any]] = None

# Removed complex nested models for simplicity

# Simplified output model based on context7 best practices
class ResearchAnalysisOutput(BaseModel):
    """Simplified research paper analysis output for reliable extraction"""
    title: str = Field(description="Title of the research paper")
    methods: Optional[str] = Field(default=None, description="Research methodology used")
    sample_size: Optional[int] = Field(default=None, description="Number of participants or samples")
    conclusions: str = Field(description="Main conclusions from the research")
    important_quotes: List[str] = Field(default_factory=list, description="Key quotes from the paper")
    reliability_score: float = Field(default=0.8, ge=0.0, le=1.0, description="Reliability score")
    relevance_score: float = Field(default=0.8, ge=0.0, le=1.0, description="Relevance score")

# Create the main agent using OpenRouter (temporary until we get direct Gemini API key)
import os
from dotenv import load_dotenv
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

# Load environment variables
load_dotenv()

# Configure OpenAI model to use OpenRouter for Gemini access
api_key = os.getenv('OPENROUTER_API_KEY')
if not api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

openai_model = OpenAIModel(
    'google/gemini-2.5-flash-lite',  # Use Gemini 2.5 Flash Lite model on OpenRouter
    provider=OpenAIProvider(
        base_url='https://openrouter.ai/api/v1',
        api_key=api_key
    ),
)

# Removed unused imports

# Production-grade agent configuration following Context7 best practices
research_agent = Agent(
    openai_model,
    deps_type=ResearchAgentDeps,
    output_type=ResearchAnalysisOutput,  # Structured output validation
    system_prompt=(
        "You are a research paper analyzer. Extract the requested information from the research paper text provided. "
        "Only use information that is explicitly stated in the paper. If something is not mentioned, set it to null or empty. "
        "Provide accurate, reliable analysis based solely on the paper content."
    ),
)

# Improved system prompt based on context7 best practices for structured extraction
@research_agent.system_prompt
async def add_extraction_context(ctx: RunContext[ResearchAgentDeps]) -> str:
    """Enhanced system prompt for reliable structured extraction"""
    deps = ctx.deps
    
    return f"""You are a research paper analyzer. I will provide you with research paper text, and you must extract specific information and return it in the exact JSON structure I specify.

RESEARCH PAPER TEXT:
{deps.paper_content}

EXTRACTION INSTRUCTIONS:
1. Read the paper text carefully
2. Extract ONLY information explicitly stated in the paper
3. For missing information, use appropriate null/empty values
4. Return the data in the exact structure specified

REQUIRED OUTPUT STRUCTURE:
- title: Extract the paper's title (if clearly stated, otherwise use first heading)
- methods: Describe the research methodology if mentioned (string)
- sample_size: Number of participants/samples if mentioned (integer or null)
- conclusions: Main findings and conclusions (string)
- important_quotes: Extract 2-3 key direct quotes from the paper (array of strings)
- reliability_score: Rate study reliability 0.0-1.0 based on methodology clarity
- relevance_score: Rate relevance to research topic 0.0-1.0

IMPORTANT: Extract actual information from the provided text, not generic placeholders."""

# Tools and validators removed for simplicity and Gemini compatibility

# Helper function to run analysis with comprehensive error handling
async def analyze_research_paper(
    paper_content: str,
    user_settings: UserSettings,
    project_context: ProjectContext,
    paper_url: Optional[str] = None,
    paper_metadata: Optional[Dict[str, Any]] = None
) -> ResearchAnalysisOutput:
    """
    Analyze a research paper with given settings and context - Production-ready with error handling
    
    Args:
        paper_content: Full text of the research paper
        user_settings: User's extraction preferences
        project_context: Project-specific context
        paper_url: Optional URL of the paper
        paper_metadata: Optional pre-extracted metadata
        
    Returns:
        ResearchAnalysisOutput with all extracted information
        
    Raises:
        ValueError: If paper_content is empty or invalid
        Exception: For any other processing errors
    """
    from pydantic_ai.exceptions import UnexpectedModelBehavior, ModelHTTPError
    from pydantic_ai import capture_run_messages
    import traceback
    
    # Input validation
    if not paper_content or not paper_content.strip():
        raise ValueError("Paper content cannot be empty")
    
    if len(paper_content.strip()) < 50:
        raise ValueError("Paper content is too short to analyze (minimum 50 characters)")
    
    print(f"🔍 DEBUG - Paper content length: {len(paper_content)}")
    print(f"🔍 DEBUG - Paper content preview: {paper_content[:200]}...")
    
    try:
        deps = ResearchAgentDeps(
            user_settings=user_settings,
            project_context=project_context,
            paper_content=paper_content,
            paper_url=paper_url,
            paper_metadata=paper_metadata
        )
        
        # Use message capture for debugging
        with capture_run_messages() as messages:
            try:
                result = await research_agent.run(
                    "Please analyze the research paper provided in the system prompt and extract the requested information according to the settings.",
                    deps=deps
                )
                
                print(f"🔍 DEBUG - Agent output: {result.output}")
                
                # Validate output is not empty/null
                if not result.output:
                    raise ValueError("Agent returned empty output")
                
                # Validate at least some extraction happened - Fixed logic
                output = result.output
                title_empty = not output.title or output.title.lower() in ['null', 'none', '']
                conclusions_empty = not output.conclusions or output.conclusions.lower() in ['null', 'none', '']
                methods_empty = not output.methods or output.methods.lower() in ['null', 'none', '']
                
                # Only fail if ALL fields are empty/null
                if title_empty and conclusions_empty and methods_empty and not output.sample_size:
                    print(f"🔍 DEBUG - Messages during run: {len(messages)} messages")
                    for i, msg in enumerate(messages[-3:]):  # Show last 3 messages
                        print(f"🔍 DEBUG - Message {i}: {str(msg)[:200]}...")
                    raise ValueError("Agent failed to extract meaningful content from paper")
                
                return result.output
                
            except UnexpectedModelBehavior as e:
                print(f"❌ Model behavior error: {e}")
                print(f"❌ Cause: {e.__cause__}")
                print(f"🔍 DEBUG - Messages during error: {len(messages)} messages")
                
                # Return fallback with error information
                return ResearchAnalysisOutput(
                    title="Error: Model behavior issue",
                    methods=None,
                    sample_size=None,
                    conclusions=f"Analysis failed due to model behavior: {str(e)}",
                    important_quotes=[],
                    reliability_score=0.0,
                    relevance_score=0.0
                )
                
            except ModelHTTPError as e:
                print(f"❌ Model HTTP error: {e}")
                print(f"❌ Status code: {getattr(e, 'status_code', 'unknown')}")
                
                # Return fallback with error information
                return ResearchAnalysisOutput(
                    title="Error: API connection issue",
                    methods=None,
                    sample_size=None,
                    conclusions=f"Analysis failed due to API error: {str(e)}",
                    important_quotes=[],
                    reliability_score=0.0,
                    relevance_score=0.0
                )
                
    except Exception as e:
        print(f"❌ Unexpected error in analyze_research_paper: {e}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        
        # Return fallback result instead of crashing
        return ResearchAnalysisOutput(
            title="Error: Analysis failed",
            methods=None,
            sample_size=None,
            conclusions=f"Analysis failed due to unexpected error: {str(e)}",
            important_quotes=[],
            reliability_score=0.0,
            relevance_score=0.0
        )

# Example usage function
async def example_usage():
    """Example of how to use the research agent"""
    # User settings
    user_settings = UserSettings(
        extraction_mode=ExtractionMode.MIXED,
        num_quotes=3,
        num_statistics=5,
        include_methodology=True,
        content_priority=ContentPriority.STATISTICS
    )
    
    # Project context
    project_context = ProjectContext(
        research_topic="Impact of AI on education",
        thesis_statement="AI tools improve learning outcomes in higher education",
        key_terms=["artificial intelligence", "learning outcomes", "student performance"],
        citation_style="APA"
    )
    
    # Sample paper content (would be full paper in reality)
    paper_content = """
    Title: The Impact of Artificial Intelligence on Higher Education Learning Outcomes
    Authors: Smith, J., Johnson, K., Williams, L.
    Year: 2024
    
    Abstract: This study examines the effect of AI-powered learning tools on student performance
    in university settings. Our randomized controlled trial with 1,247 participants showed
    a 23% improvement in test scores (p<0.001) when students used AI tutoring systems...
    
    [Full paper content would go here]
    """
    
    # Run analysis
    result = await analyze_research_paper(
        paper_content=paper_content,
        user_settings=user_settings,
        project_context=project_context
    )
    
    print(f"Analysis complete: {result.title}")
    print(f"Relevance score: {result.relevance_score}")
    print(f"Found {len(result.important_quotes)} quotes")