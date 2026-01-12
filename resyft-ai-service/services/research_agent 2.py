"""
Research Paper Analysis Agent using PydanticAI
This agent processes research papers and extracts customizable information
based on user preferences and project settings.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum
import re

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

# Output models
class ExtractedQuote(BaseModel):
    """A quote extracted from the research paper"""
    text: str = Field(description="The exact quote from the paper")
    page_number: Optional[int] = Field(default=None, description="Page number if available")
    context: str = Field(description="Brief context around the quote")
    relevance_score: float = Field(ge=0.0, le=1.0, description="Relevance to research topic")

class ExtractedStatistic(BaseModel):
    """A statistic extracted from the research paper"""
    value: str = Field(description="The statistical value (e.g., '23%', 'p<0.001')")
    description: str = Field(description="What this statistic represents")
    context: str = Field(description="The context in which this statistic appears")
    significance: Optional[str] = Field(default=None, description="Statistical significance if mentioned")

class MethodologyInfo(BaseModel):
    """Information about the research methodology"""
    approach: str = Field(description="Research approach (e.g., quantitative, qualitative, mixed)")
    design: str = Field(description="Study design (e.g., RCT, observational, meta-analysis)")
    sample_size: Optional[int] = Field(default=None, description="Number of participants/samples")
    data_collection: str = Field(description="How data was collected")
    limitations: List[str] = Field(default_factory=list, description="Study limitations mentioned")

class ResearchAnalysisOutput(BaseModel):
    """Complete output from research paper analysis"""
    # Core extracted information
    title: str = Field(description="Title of the research paper")
    authors: List[str] = Field(description="List of authors")
    year: Optional[int] = Field(default=None, description="Publication year")
    
    # Main findings
    key_findings: List[str] = Field(description="Main findings from the paper")
    conclusions: str = Field(description="Primary conclusions of the research")
    
    # Extracted content based on settings
    quotes: List[ExtractedQuote] = Field(default_factory=list)
    statistics: List[ExtractedStatistic] = Field(default_factory=list)
    methodology: Optional[MethodologyInfo] = Field(default=None)
    
    # Quality metrics
    reliability_score: float = Field(ge=0.0, le=1.0, description="Overall reliability score")
    relevance_score: float = Field(ge=0.0, le=1.0, description="Relevance to research topic")
    
    # Ready-to-use content
    suggested_text: str = Field(description="Suggested text for direct use in research")
    citation: str = Field(description="Properly formatted citation")
    
    # Additional insights
    supports_thesis: Optional[bool] = Field(default=None, description="Whether findings support the thesis")
    contradictions: List[str] = Field(default_factory=list, description="Any contradictions found")
    future_research: List[str] = Field(default_factory=list, description="Suggested future research")

# Create the main agent using OpenRouter
import os
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

# Configure OpenAI model to use OpenRouter
api_key = os.getenv('OPENROUTER_API_KEY')
if not api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

openai_model = OpenAIModel(
    'google/gemini-2.0-flash-exp',
    provider=OpenRouterProvider(api_key=api_key),
)

research_agent = Agent(
    openai_model,
    deps_type=ResearchAgentDeps,
    output_type=ResearchAnalysisOutput,
    system_prompt=(
        "You are an expert research paper analyst specializing in academic literature. "
        "Your task is to extract and analyze information from research papers based on "
        "user preferences and project requirements. Always be accurate and never "
        "hallucinate statistics or quotes - only extract what is explicitly stated."
    ),
)

# Dynamic system prompt based on dependencies
@research_agent.system_prompt
async def add_extraction_context(ctx: RunContext[ResearchAgentDeps]) -> str:
    """Add user settings and project context to the system prompt"""
    deps = ctx.deps
    settings = deps.user_settings
    project = deps.project_context
    
    prompt_parts = []
    
    # Add project context
    prompt_parts.append(f"Research Topic: {project.research_topic}")
    if project.thesis_statement:
        prompt_parts.append(f"Thesis to evaluate: {project.thesis_statement}")
    if project.key_terms:
        prompt_parts.append(f"Focus on these key terms: {', '.join(project.key_terms)}")
    
    # Add extraction preferences
    mode_instructions = {
        ExtractionMode.STATISTICAL: "Focus primarily on numerical data, statistics, and quantitative findings.",
        ExtractionMode.QUALITATIVE: "Focus on qualitative insights, themes, and descriptive findings.",
        ExtractionMode.MIXED: "Balance both statistical and qualitative information."
    }
    prompt_parts.append(mode_instructions[settings.extraction_mode])
    
    # Add specific requirements
    prompt_parts.append(f"Extract {settings.num_quotes} relevant quotes that support the research.")
    prompt_parts.append(f"Find {settings.num_statistics} key statistics or numerical findings.")
    
    if settings.include_methodology:
        prompt_parts.append("Provide detailed methodology information.")
    
    # Add priority guidance
    priority_instructions = {
        ContentPriority.QUOTES: "Prioritize finding impactful quotes.",
        ContentPriority.STATISTICS: "Prioritize statistical findings and numbers.",
        ContentPriority.METHODS: "Prioritize methodology details.",
        ContentPriority.CONCLUSIONS: "Prioritize conclusions and implications.",
        ContentPriority.BALANCED: "Give equal weight to all types of content."
    }
    prompt_parts.append(priority_instructions[settings.content_priority])
    
    # Add citation style
    prompt_parts.append(f"Format citations in {project.citation_style} style.")
    
    return "\n".join(prompt_parts)

# Tool for extracting paper metadata
@research_agent.tool
async def extract_paper_metadata(ctx: RunContext[ResearchAgentDeps]) -> Dict[str, Any]:
    """Extract basic metadata from the paper content"""
    content = ctx.deps.paper_content
    metadata = {}
    
    # Extract title (usually in the first few lines)
    title_match = re.search(r'^(.+?)(?:\n|$)', content, re.MULTILINE)
    if title_match:
        metadata['title'] = title_match.group(1).strip()
    
    # Extract year (look for 4-digit years)
    year_matches = re.findall(r'\b(19|20)\d{2}\b', content)
    if year_matches:
        metadata['year'] = int(year_matches[0])
    
    # Extract authors (heuristic - look for lines with multiple names)
    # This is simplified and would need enhancement for production
    metadata['authors'] = []  # Would need proper extraction logic
    
    return metadata

# Tool for validating quotes
@research_agent.tool
async def validate_quote(ctx: RunContext[ResearchAgentDeps], quote: str) -> bool:
    """Validate that a quote actually exists in the paper"""
    # Simple validation - check if the quote exists in the content
    # In production, this would be more sophisticated
    return quote.lower() in ctx.deps.paper_content.lower()

# Tool for calculating relevance scores
@research_agent.tool
async def calculate_relevance(ctx: RunContext[ResearchAgentDeps], text: str) -> float:
    """Calculate relevance score based on key terms and research topic"""
    deps = ctx.deps
    text_lower = text.lower()
    
    score = 0.0
    
    # Check research topic presence
    if deps.project_context.research_topic.lower() in text_lower:
        score += 0.3
    
    # Check key terms
    if deps.project_context.key_terms:
        term_matches = sum(1 for term in deps.project_context.key_terms if term.lower() in text_lower)
        score += (term_matches / len(deps.project_context.key_terms)) * 0.4
    
    # Check thesis alignment if provided
    if deps.project_context.thesis_statement:
        # Simplified - would use more sophisticated NLP in production
        if any(word in text_lower for word in deps.project_context.thesis_statement.lower().split()):
            score += 0.3
    
    return min(score, 1.0)

# Output validator
@research_agent.output_validator
async def validate_output(ctx: RunContext[ResearchAgentDeps], output: ResearchAnalysisOutput) -> ResearchAnalysisOutput:
    """Validate and potentially retry if output doesn't meet requirements"""
    settings = ctx.deps.user_settings
    
    # Check if we have the requested number of quotes
    if len(output.quotes) < settings.num_quotes:
        raise ModelRetry(f"Please extract {settings.num_quotes} quotes as requested")
    
    # Check if we have the requested number of statistics
    if len(output.statistics) < settings.num_statistics:
        raise ModelRetry(f"Please extract {settings.num_statistics} statistics as requested")
    
    # Check reliability score threshold
    if output.reliability_score < settings.min_reliability_score:
        raise ModelRetry(
            f"The reliability score ({output.reliability_score}) is below the minimum threshold "
            f"({settings.min_reliability_score}). Please re-evaluate."
        )
    
    # Validate that quotes are actual quotes from the paper
    for quote in output.quotes:
        if not await validate_quote(ctx, quote.text):
            raise ModelRetry(f"Quote '{quote.text[:50]}...' not found in paper. Use exact quotes only.")
    
    return output

# Helper function to run analysis
async def analyze_research_paper(
    paper_content: str,
    user_settings: UserSettings,
    project_context: ProjectContext,
    paper_url: Optional[str] = None,
    paper_metadata: Optional[Dict[str, Any]] = None
) -> ResearchAnalysisOutput:
    """
    Analyze a research paper with given settings and context
    
    Args:
        paper_content: Full text of the research paper
        user_settings: User's extraction preferences
        project_context: Project-specific context
        paper_url: Optional URL of the paper
        paper_metadata: Optional pre-extracted metadata
        
    Returns:
        ResearchAnalysisOutput with all extracted information
    """
    deps = ResearchAgentDeps(
        user_settings=user_settings,
        project_context=project_context,
        paper_content=paper_content,
        paper_url=paper_url,
        paper_metadata=paper_metadata
    )
    
    result = await research_agent.run(
        f"Please analyze this research paper and extract information according to the settings provided.",
        deps=deps
    )
    
    return result.output

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
    print(f"Found {len(result.quotes)} quotes and {len(result.statistics)} statistics")