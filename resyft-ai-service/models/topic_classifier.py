"""
Topic Classification Agent for Resyft Document Analysis
Determines the field/topic of input documents to route to specialized agents
"""

from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from dataclasses import dataclass


class DocumentTopic(str, Enum):
    """Supported document topics/fields"""
    NEUROSCIENCE = "neuroscience"
    CYBERSECURITY = "cybersecurity" 
    DATA_SCIENCE = "data_science"
    COMPUTER_SCIENCE = "computer_science"
    MEDICINE = "medicine"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    BIOLOGY = "biology"
    PSYCHOLOGY = "psychology"
    ENGINEERING = "engineering"
    BUSINESS = "business"
    ECONOMICS = "economics"
    SOCIAL_SCIENCES = "social_sciences"
    HUMANITIES = "humanities"
    MATHEMATICS = "mathematics"
    ENVIRONMENTAL_SCIENCE = "environmental_science"
    GENERAL = "general"  # Fallback for unspecialized content


class TopicClassification(BaseModel):
    """Classification result from topic analysis"""
    primary_topic: DocumentTopic = Field(
        description="Primary field/topic of the document"
    )
    confidence_score: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in classification (0.0 to 1.0)"
    )
    secondary_topics: list[DocumentTopic] = Field(
        default_factory=list,
        description="Secondary topics if document spans multiple fields"
    )
    reasoning: str = Field(
        description="Brief explanation of why this classification was chosen"
    )
    key_indicators: list[str] = Field(
        default_factory=list,
        description="Key terms, phrases, or concepts that led to this classification"
    )


@dataclass
class DocumentInput:
    """Input document information"""
    content: str
    source_type: str  # 'url', 'text', 'file'
    filename: Optional[str] = None
    metadata: Optional[dict] = None


# Topic Classification Agent (lazy initialization)
_topic_classifier_agent = None

def get_topic_classifier_agent():
    """Get or create the topic classification agent"""
    global _topic_classifier_agent
    if _topic_classifier_agent is None:
        _topic_classifier_agent = Agent(
            'openai:gpt-4o',
            deps_type=DocumentInput,
            output_type=TopicClassification,
            system_prompt="""
You are an expert document classifier with deep knowledge across all academic and professional fields.
Your task is to accurately classify documents into their primary field/topic based on content analysis.

CLASSIFICATION CRITERIA:
- Analyze vocabulary, terminology, and concepts used
- Consider methodologies mentioned
- Look for field-specific jargon and technical terms
- Identify theoretical frameworks or models referenced
- Consider citation patterns and reference types
- Assess research methods and experimental approaches

CONFIDENCE SCORING:
- 0.9-1.0: Extremely clear field indicators, specialized terminology
- 0.7-0.9: Strong field indicators, some specialized terms
- 0.5-0.7: Moderate indicators, some ambiguity
- 0.3-0.5: Weak indicators, high uncertainty
- 0.0-0.3: Very unclear or too general to classify

MULTI-FIELD DOCUMENTS:
- Choose the DOMINANT field as primary
- List other significant fields as secondary
- Interdisciplinary work should favor the methodology's origin field

QUALITY STANDARDS:
- Be precise in terminology identification
- Provide clear, specific reasoning
- List concrete examples from the text
- Default to 'general' only when truly unclassifiable
            """.strip()
        )
    return _topic_classifier_agent


async def analyze_document_structure(
    ctx: RunContext[DocumentInput], 
    focus_area: str
) -> str:
    """Analyze specific structural elements of the document for classification clues"""
    content = ctx.deps.content.lower()
    
    if focus_area == "methodology":
        # Look for research methodology indicators
        method_indicators = [
            "methodology", "experimental design", "statistical analysis",
            "survey", "interview", "case study", "meta-analysis",
            "randomized controlled trial", "qualitative", "quantitative"
        ]
        found = [term for term in method_indicators if term in content]
        return f"Methodology indicators found: {', '.join(found) if found else 'None'}"
    
    elif focus_area == "technical_terms":
        # Field-specific technical term detection
        field_terms = {
            "neuroscience": ["neural", "brain", "neuron", "synapse", "fmri", "eeg", "cognitive"],
            "cybersecurity": ["security", "vulnerability", "malware", "encryption", "firewall", "threat"],
            "data_science": ["machine learning", "algorithm", "dataset", "model", "prediction", "analytics"],
            "medicine": ["patient", "clinical", "diagnosis", "treatment", "therapy", "medical"],
            "physics": ["quantum", "particle", "energy", "field", "theory", "experiment"],
        }
        
        results = {}
        for field, terms in field_terms.items():
            count = sum(1 for term in terms if term in content)
            if count > 0:
                results[field] = count
        
        return f"Technical term analysis: {results}"
    
    elif focus_area == "citation_style":
        # Analyze citation patterns which can indicate field
        citation_patterns = {
            "apa": "(author, year)" in content or "et al." in content,
            "ieee": "[1]" in content or "[2]" in content,
            "mla": "Works Cited" in content,
            "chicago": "footnote" in content or "endnote" in content
        }
        
        found_styles = [style for style, present in citation_patterns.items() if present]
        return f"Citation styles detected: {', '.join(found_styles) if found_styles else 'None'}"
    
    return "No specific analysis available for this focus area"


async def extract_key_concepts(ctx: RunContext[DocumentInput]) -> list[str]:
    """Extract key concepts and terminology from the document"""
    content = ctx.deps.content
    
    # Simple concept extraction - in production, use more sophisticated NLP
    import re
    
    # Extract capitalized terms (likely proper nouns/technical terms)
    capitalized_terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
    
    # Extract terms in quotes (often technical terms or definitions)
    quoted_terms = re.findall(r'"([^"]+)"', content)
    
    # Extract terms with special formatting indicators
    technical_indicators = re.findall(r'\b\w+(?:_\w+)+\b', content)  # snake_case terms
    
    # Combine and limit
    all_concepts = list(set(capitalized_terms + quoted_terms + technical_indicators))
    
    # Return top 20 most relevant
    return all_concepts[:20]


async def classify_document_topic(document: DocumentInput) -> TopicClassification:
    """
    Main function to classify a document's topic using the PydanticAI agent
    
    Args:
        document: DocumentInput containing the document content and metadata
        
    Returns:
        TopicClassification with primary topic, confidence, and reasoning
    """
    try:
        # Get the agent and add tools
        agent = get_topic_classifier_agent()
        
        # Add tools dynamically
        agent.tool(analyze_document_structure)
        agent.tool(extract_key_concepts)
        
        # Run the classification agent
        result = await agent.run(
            user_prompt=f"""
            Please classify this document into its primary field/topic:
            
            SOURCE TYPE: {document.source_type}
            FILENAME: {document.filename or 'N/A'}
            
            CONTENT:
            {document.content[:5000]}  # Limit content for token efficiency
            
            Analyze the content thoroughly and provide a comprehensive classification.
            """,
            deps=document
        )
        
        return result.output
        
    except Exception as e:
        # Fallback classification in case of errors
        return TopicClassification(
            primary_topic=DocumentTopic.GENERAL,
            confidence_score=0.1,
            reasoning=f"Classification failed due to error: {str(e)}",
            key_indicators=[],
            secondary_topics=[]
        )


# Export the main classification function
__all__ = ['classify_document_topic', 'DocumentTopic', 'TopicClassification', 'DocumentInput']