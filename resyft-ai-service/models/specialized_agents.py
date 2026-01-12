"""
Specialized Secondary Agents for Document Analysis
Each agent is a master in their specific field/topic
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from .topic_classifier import DocumentTopic, DocumentInput


class AnalysisResult(BaseModel):
    """Structured output from specialized agents"""
    key_findings: List[str] = Field(
        description="Main findings, discoveries, or conclusions"
    )
    methodology: Optional[str] = Field(
        description="Research methodology or approach used"
    )
    technical_concepts: List[str] = Field(
        description="Important technical concepts, terms, or theories"
    )
    data_insights: Optional[Dict[str, Any]] = Field(
        description="Statistical data, measurements, or quantitative insights"
    )
    practical_applications: List[str] = Field(
        description="Real-world applications or implications"
    )
    limitations: List[str] = Field(
        description="Study limitations or constraints mentioned"
    )
    future_directions: List[str] = Field(
        description="Suggested future research or next steps"
    )
    confidence_assessment: str = Field(
        description="Assessment of the document's scientific rigor and reliability"
    )
    field_specific_insights: Dict[str, Any] = Field(
        description="Insights specific to this field of study"
    )


@dataclass
class AnalysisContext:
    """Context for specialized analysis"""
    document: DocumentInput
    classification_confidence: float
    user_requirements: Optional[str] = None


# Lazy agent initialization to avoid import-time API key requirements
_agents = {}

def get_neuroscience_agent():
    """Get or create the neuroscience agent"""
    if 'neuroscience' not in _agents:
        agent = Agent(
            'openai:gpt-4o',
            deps_type=AnalysisContext,
            output_type=AnalysisResult,
            system_prompt="""
You are a world-renowned neuroscience expert with deep expertise in:
- Neuroanatomy and neurophysiology
- Cognitive neuroscience and behavioral studies
- Neuroimaging techniques (fMRI, PET, EEG, MEG)
- Computational neuroscience and neural networks
- Neuropharmacology and neurotransmitter systems
- Neurological disorders and pathology
- Brain development and plasticity
- Synaptic transmission and neural circuits

ANALYSIS APPROACH:
- Identify brain regions, neural pathways, and circuits discussed
- Analyze experimental paradigms and neuroimaging methods
- Evaluate statistical approaches for neural data
- Assess behavioral correlates and cognitive functions
- Review neurotransmitter systems and molecular mechanisms
- Consider clinical implications for neurological conditions
- Evaluate experimental controls and potential confounds

FIELD-SPECIFIC INSIGHTS should include:
- Brain regions and neural networks involved
- Neurotransmitter systems and molecular pathways
- Experimental paradigms and control conditions
- Clinical relevance and translational potential
- Methodological considerations for neural data
            """.strip()
        )
        # Add tools
        agent.tool(extract_quantitative_data)
        agent.tool(identify_methodological_approach)
        _agents['neuroscience'] = agent
    return _agents['neuroscience']

def get_cybersecurity_agent():
    """Get or create the cybersecurity agent"""
    if 'cybersecurity' not in _agents:
        agent = Agent(
            'openai:gpt-4o',
            deps_type=AnalysisContext,
            output_type=AnalysisResult,
            system_prompt="""
You are a leading cybersecurity expert with mastery in:
- Network security and infrastructure protection
- Threat analysis and vulnerability assessment
- Malware analysis and reverse engineering
- Cryptography and encryption protocols
- Security incident response and forensics
- Risk assessment and security frameworks
- Penetration testing and ethical hacking
- Security compliance and governance

ANALYSIS APPROACH:
- Identify security threats, vulnerabilities, and attack vectors
- Analyze defense mechanisms and security controls
- Evaluate risk assessment methodologies
- Review compliance frameworks and standards
- Assess incident response procedures
- Consider threat landscape and emerging risks
- Evaluate security tools and technologies

FIELD-SPECIFIC INSIGHTS should include:
- Threat types and attack methodologies
- Security controls and defense strategies
- Risk levels and impact assessments
- Compliance requirements and frameworks
- Tools and technologies mentioned
- Incident response and mitigation strategies
            """.strip()
        )
        # Add tools
        agent.tool(extract_quantitative_data)
        agent.tool(identify_methodological_approach)
        _agents['cybersecurity'] = agent
    return _agents['cybersecurity']

def get_data_science_agent():
    """Get or create the data science agent"""
    if 'data_science' not in _agents:
        agent = Agent(
            'openai:gpt-4o', 
            deps_type=AnalysisContext,
            output_type=AnalysisResult,
            system_prompt="""
You are a distinguished data science expert with expertise in:
- Machine learning algorithms and model development
- Statistical analysis and hypothesis testing
- Data mining and pattern recognition
- Big data analytics and distributed computing
- Feature engineering and model optimization
- Data visualization and exploratory analysis
- Predictive modeling and forecasting
- A/B testing and experimental design

ANALYSIS APPROACH:
- Identify datasets, variables, and data sources
- Analyze statistical methods and model architectures
- Evaluate feature selection and engineering approaches
- Assess model performance metrics and validation
- Review data preprocessing and cleaning procedures
- Consider scalability and computational requirements
- Evaluate business impact and practical applications

FIELD-SPECIFIC INSIGHTS should include:
- Algorithms and models used
- Dataset characteristics and size
- Performance metrics and validation methods
- Feature importance and selection criteria
- Computational requirements and scalability
- Business applications and ROI potential
            """.strip()
        )
        # Add tools
        agent.tool(extract_quantitative_data)
        agent.tool(identify_methodological_approach)
        _agents['data_science'] = agent
    return _agents['data_science']

def get_medicine_agent():
    """Get or create the medicine agent"""
    if 'medicine' not in _agents:
        agent = Agent(
            'openai:gpt-4o',
            deps_type=AnalysisContext, 
            output_type=AnalysisResult,
            system_prompt="""
You are an expert physician-researcher with comprehensive knowledge in:
- Clinical medicine and patient care
- Medical diagnostics and treatment protocols
- Pharmacology and drug mechanisms
- Medical research methodology and clinical trials
- Public health and epidemiology
- Medical imaging and laboratory diagnostics
- Evidence-based medicine and systematic reviews
- Medical ethics and healthcare policy

ANALYSIS APPROACH:
- Identify clinical conditions, treatments, and interventions
- Analyze study design, patient populations, and outcomes
- Evaluate diagnostic procedures and accuracy
- Assess treatment efficacy and safety profiles
- Review statistical methods for clinical data
- Consider ethical implications and patient safety
- Evaluate generalizability to clinical practice

FIELD-SPECIFIC INSIGHTS should include:
- Clinical conditions and patient populations
- Treatment interventions and outcomes
- Diagnostic methods and accuracy
- Safety profiles and adverse events
- Clinical trial design and ethics
- Healthcare implications and policy
            """.strip()
        )
        # Add tools
        agent.tool(extract_quantitative_data)
        agent.tool(identify_methodological_approach)
        _agents['medicine'] = agent
    return _agents['medicine']

def get_computer_science_agent():
    """Get or create the computer science agent"""
    if 'computer_science' not in _agents:
        agent = Agent(
            'openai:gpt-4o',
            deps_type=AnalysisContext,
            output_type=AnalysisResult, 
            system_prompt="""
You are a computer science expert with deep knowledge in:
- Software engineering and system design
- Algorithms and data structures
- Programming languages and paradigms
- Distributed systems and cloud computing
- Database systems and data management
- Human-computer interaction
- Artificial intelligence and automation
- Computer graphics and visualization

ANALYSIS APPROACH:
- Identify algorithms, data structures, and computational methods
- Analyze system architecture and design patterns
- Evaluate performance metrics and complexity analysis
- Assess scalability and distributed system considerations
- Review implementation details and code quality
- Consider user experience and interface design
- Evaluate security and privacy implications

FIELD-SPECIFIC INSIGHTS should include:
- Algorithms and computational complexity
- System architecture and design patterns
- Performance metrics and scalability
- Programming languages and frameworks
- Security considerations and vulnerabilities
- User interface and experience factors
            """.strip()
        )
        # Add tools
        agent.tool(extract_quantitative_data)
        agent.tool(identify_methodological_approach)
        _agents['computer_science'] = agent
    return _agents['computer_science']

# Tool functions that are added to all specialized agents
async def extract_quantitative_data(ctx: RunContext[AnalysisContext]) -> Dict[str, Any]:
    """Extract numerical data, statistics, and measurements from the document"""
    import re
    content = ctx.deps.document.content
    
    # Extract numbers with units/context
    numbers_with_context = re.findall(r'(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)', content)
    
    # Extract statistical measures
    stats_pattern = r'(p\s*[<>=]\s*\d+\.\d+|r\s*=\s*\d+\.\d+|n\s*=\s*\d+)'
    statistical_measures = re.findall(stats_pattern, content, re.IGNORECASE)
    
    # Extract percentages
    percentages = re.findall(r'(\d+(?:\.\d+)?%)', content)
    
    return {
        "numerical_data": numbers_with_context[:10],  # Limit results
        "statistical_measures": statistical_measures[:10],
        "percentages": percentages[:10]
    }

async def identify_methodological_approach(ctx: RunContext[AnalysisContext]) -> str:
    """Identify the research methodology or approach used"""
    content = ctx.deps.document.content.lower()
    
    # Method indicators
    methodologies = {
        "experimental": ["experiment", "control group", "randomized", "trial"],
        "observational": ["observational", "cohort", "cross-sectional", "longitudinal"],
        "survey": ["survey", "questionnaire", "interview", "poll"],
        "case_study": ["case study", "case report", "case series"],
        "meta_analysis": ["meta-analysis", "systematic review", "pooled analysis"],
        "computational": ["simulation", "modeling", "algorithm", "computational"],
        "qualitative": ["qualitative", "thematic analysis", "grounded theory"],
        "mixed_methods": ["mixed methods", "triangulation", "sequential"]
    }
    
    detected_methods = []
    for method, indicators in methodologies.items():
        if any(indicator in content for indicator in indicators):
            detected_methods.append(method)
    
    return f"Detected methodologies: {', '.join(detected_methods) if detected_methods else 'Not clearly specified'}"

# Agent registry for easy access
def get_specialized_agents():
    """Get the registry of specialized agents"""
    return {
        DocumentTopic.NEUROSCIENCE: get_neuroscience_agent(),
        DocumentTopic.CYBERSECURITY: get_cybersecurity_agent(),
        DocumentTopic.DATA_SCIENCE: get_data_science_agent(),
        DocumentTopic.MEDICINE: get_medicine_agent(),
        DocumentTopic.COMPUTER_SCIENCE: get_computer_science_agent(),
        DocumentTopic.GENERAL: get_data_science_agent(),  # Use data science as default
    }

# Additional agents for other fields would be added here following the same pattern
# For now, implementing the core 5 agents as requested

async def analyze_with_specialized_agent(
    topic: DocumentTopic,
    context: AnalysisContext
) -> AnalysisResult:
    """
    Route analysis to the appropriate specialized agent based on topic
    
    Args:
        topic: The classified topic of the document
        context: Analysis context including document and requirements
        
    Returns:
        AnalysisResult from the specialized agent
    """
    # Get the appropriate agent
    agents = get_specialized_agents()
    agent = agents.get(topic, agents[DocumentTopic.GENERAL])
    
    # Create user prompt for the specialized agent
    user_prompt = f"""
    Analyze this {topic.value} document with your expert knowledge.
    
    USER REQUIREMENTS: {context.user_requirements or 'Comprehensive analysis requested'}
    CLASSIFICATION CONFIDENCE: {context.classification_confidence}
    
    DOCUMENT CONTENT:
    {context.document.content}
    
    Provide a thorough, expert-level analysis focusing on your field's perspective.
    Be specific, technical, and comprehensive in your evaluation.
    """
    
    try:
        # Run the specialized agent
        result = await agent.run(user_prompt, deps=context)
        return result.output
        
    except Exception as e:
        # Fallback result in case of errors
        return AnalysisResult(
            key_findings=[f"Analysis failed: {str(e)}"],
            methodology="Unknown due to processing error",
            technical_concepts=[],
            data_insights={},
            practical_applications=[],
            limitations=[f"Unable to complete analysis: {str(e)}"],
            future_directions=[],
            confidence_assessment="Low - analysis incomplete due to error",
            field_specific_insights={"error": str(e)}
        )


# Export functions and classes
__all__ = [
    'analyze_with_specialized_agent', 
    'AnalysisResult', 
    'AnalysisContext',
    'get_specialized_agents'
]