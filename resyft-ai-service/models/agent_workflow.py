"""
Agentic Workflow System for Resyft Document Analysis
Orchestrates the complete flow from input to specialized analysis
"""

from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from dataclasses import dataclass
import asyncio
import logging
from datetime import datetime

from .topic_classifier import (
    classify_document_topic, 
    DocumentInput, 
    TopicClassification,
    DocumentTopic
)
from .specialized_agents import (
    analyze_with_specialized_agent,
    AnalysisContext,
    AnalysisResult
)

# Configure logging
logger = logging.getLogger(__name__)


class WorkflowResult(BaseModel):
    """Complete result from the agentic workflow"""
    # Classification results
    classification: TopicClassification
    
    # Analysis results
    analysis: AnalysisResult
    
    # Workflow metadata
    processing_time_seconds: float
    workflow_version: str = "1.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Status information
    success: bool = True
    error_message: Optional[str] = None
    warnings: list[str] = Field(default_factory=list)


@dataclass
class WorkflowConfig:
    """Configuration for the workflow execution"""
    min_confidence_threshold: float = 0.3  # Minimum confidence to use specialized agent
    enable_fallback_analysis: bool = True   # Use general agent if confidence too low
    max_processing_time: int = 300         # Maximum seconds before timeout
    detailed_logging: bool = True          # Enable detailed workflow logging


class ResyftAgenticWorkflow:
    """
    Main orchestrator for the Resyft document analysis workflow
    Manages the complete flow from input to specialized analysis
    """
    
    def __init__(self, config: Optional[WorkflowConfig] = None):
        self.config = config or WorkflowConfig()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    async def process_document(
        self,
        content: str,
        source_type: str = "text",
        filename: Optional[str] = None,
        user_requirements: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> WorkflowResult:
        """
        Process a document through the complete agentic workflow
        
        Args:
            content: Document content (text, URL content, etc.)
            source_type: Type of source ('text', 'url', 'file')
            filename: Optional filename for context
            user_requirements: Optional specific user requirements for analysis
            metadata: Optional additional metadata
            
        Returns:
            WorkflowResult containing classification and analysis
        """
        start_time = datetime.utcnow()
        warnings = []
        
        try:
            # Step 1: Prepare document input
            self._log("Starting document analysis workflow", level="INFO")
            document = DocumentInput(
                content=content,
                source_type=source_type,
                filename=filename,
                metadata=metadata or {}
            )
            
            # Step 2: Topic Classification
            self._log("Beginning topic classification", level="INFO")
            classification = await self._classify_document(document)
            
            self._log(
                f"Classification complete: {classification.primary_topic} "
                f"(confidence: {classification.confidence_score:.2f})",
                level="INFO"
            )
            
            # Step 3: Route to Specialized Agent
            self._log("Routing to specialized agent", level="INFO")
            analysis_context = AnalysisContext(
                document=document,
                classification_confidence=classification.confidence_score,
                user_requirements=user_requirements
            )
            
            # Check confidence threshold
            if classification.confidence_score < self.config.min_confidence_threshold:
                warnings.append(
                    f"Low classification confidence ({classification.confidence_score:.2f}). "
                    "Using general analysis approach."
                )
                if self.config.enable_fallback_analysis:
                    # Use general agent for low-confidence classifications
                    analysis = await self._analyze_with_fallback(analysis_context)
                else:
                    # Still use classified agent but note the low confidence
                    analysis = await self._analyze_with_specialized_agent(
                        classification.primary_topic, analysis_context
                    )
            else:
                # Use specialized agent with confidence
                analysis = await self._analyze_with_specialized_agent(
                    classification.primary_topic, analysis_context
                )
            
            # Calculate processing time
            end_time = datetime.utcnow()
            processing_time = (end_time - start_time).total_seconds()
            
            self._log(
                f"Workflow completed successfully in {processing_time:.2f} seconds",
                level="INFO"
            )
            
            return WorkflowResult(
                classification=classification,
                analysis=analysis,
                processing_time_seconds=processing_time,
                timestamp=end_time,
                warnings=warnings
            )
            
        except asyncio.TimeoutError:
            error_msg = f"Workflow timed out after {self.config.max_processing_time} seconds"
            self._log(error_msg, level="ERROR")
            return self._create_error_result(error_msg, start_time, warnings)
            
        except Exception as e:
            error_msg = f"Workflow failed with error: {str(e)}"
            self._log(error_msg, level="ERROR", exc_info=True)
            return self._create_error_result(error_msg, start_time, warnings)
    
    async def _classify_document(self, document: DocumentInput) -> TopicClassification:
        """Step 1: Classify the document topic"""
        try:
            classification = await classify_document_topic(document)
            return classification
        except Exception as e:
            self._log(f"Classification failed: {str(e)}", level="WARNING")
            # Return fallback classification
            return TopicClassification(
                primary_topic=DocumentTopic.GENERAL,
                confidence_score=0.1,
                reasoning=f"Classification failed, using fallback: {str(e)}",
                key_indicators=[],
                secondary_topics=[]
            )
    
    async def _analyze_with_specialized_agent(
        self, 
        topic: DocumentTopic, 
        context: AnalysisContext
    ) -> AnalysisResult:
        """Step 2: Analyze with the appropriate specialized agent"""
        try:
            analysis = await analyze_with_specialized_agent(topic, context)
            return analysis
        except Exception as e:
            self._log(f"Specialized agent analysis failed: {str(e)}", level="WARNING")
            # Fallback to general analysis
            return await self._analyze_with_fallback(context)
    
    async def _analyze_with_fallback(self, context: AnalysisContext) -> AnalysisResult:
        """Fallback analysis when specialized agents fail"""
        try:
            # Use the general/data science agent as fallback
            return await analyze_with_specialized_agent(DocumentTopic.DATA_SCIENCE, context)
        except Exception as e:
            self._log(f"Fallback analysis also failed: {str(e)}", level="ERROR")
            # Return minimal error result
            return AnalysisResult(
                key_findings=[f"Analysis could not be completed due to error: {str(e)}"],
                methodology="Unable to determine",
                technical_concepts=[],
                data_insights={},
                practical_applications=[],
                limitations=["Analysis failed due to system error"],
                future_directions=[],
                confidence_assessment="Very Low - System Error",
                field_specific_insights={"error": str(e)}
            )
    
    def _create_error_result(
        self, 
        error_message: str, 
        start_time: datetime, 
        warnings: list[str]
    ) -> WorkflowResult:
        """Create a workflow result for error cases"""
        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds()
        
        return WorkflowResult(
            classification=TopicClassification(
                primary_topic=DocumentTopic.GENERAL,
                confidence_score=0.0,
                reasoning="Workflow failed before classification",
                key_indicators=[],
                secondary_topics=[]
            ),
            analysis=AnalysisResult(
                key_findings=[],
                methodology="Unknown",
                technical_concepts=[],
                data_insights={},
                practical_applications=[],
                limitations=["Analysis failed"],
                future_directions=[],
                confidence_assessment="None - Workflow Error",
                field_specific_insights={}
            ),
            processing_time_seconds=processing_time,
            timestamp=end_time,
            success=False,
            error_message=error_message,
            warnings=warnings
        )
    
    def _log(self, message: str, level: str = "INFO", exc_info: bool = False):
        """Internal logging method"""
        if not self.config.detailed_logging:
            return
            
        log_method = getattr(self.logger, level.lower(), self.logger.info)
        log_method(message, exc_info=exc_info)


# Convenience function for direct workflow execution
async def analyze_document(
    content: str,
    source_type: str = "text",
    filename: Optional[str] = None,
    user_requirements: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    config: Optional[WorkflowConfig] = None
) -> WorkflowResult:
    """
    Convenience function to analyze a document through the complete workflow
    
    Args:
        content: Document content
        source_type: Source type ('text', 'url', 'file')
        filename: Optional filename
        user_requirements: Optional user requirements
        metadata: Optional metadata
        config: Optional workflow configuration
        
    Returns:
        Complete workflow result
    """
    workflow = ResyftAgenticWorkflow(config)
    return await workflow.process_document(
        content=content,
        source_type=source_type,
        filename=filename,
        user_requirements=user_requirements,
        metadata=metadata
    )


# Batch processing function for multiple documents
async def analyze_documents_batch(
    documents: list[Dict[str, Any]],
    config: Optional[WorkflowConfig] = None
) -> list[WorkflowResult]:
    """
    Process multiple documents concurrently
    
    Args:
        documents: List of document dictionaries with 'content' and other fields
        config: Optional workflow configuration
        
    Returns:
        List of workflow results
    """
    workflow = ResyftAgenticWorkflow(config)
    
    # Create tasks for concurrent processing
    tasks = []
    for doc in documents:
        task = workflow.process_document(
            content=doc.get('content', ''),
            source_type=doc.get('source_type', 'text'),
            filename=doc.get('filename'),
            user_requirements=doc.get('user_requirements'),
            metadata=doc.get('metadata')
        )
        tasks.append(task)
    
    # Execute concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle any exceptions in results
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            # Create error result for failed tasks
            error_result = WorkflowResult(
                classification=TopicClassification(
                    primary_topic=DocumentTopic.GENERAL,
                    confidence_score=0.0,
                    reasoning=f"Batch processing failed: {str(result)}",
                    key_indicators=[],
                    secondary_topics=[]
                ),
                analysis=AnalysisResult(
                    key_findings=[],
                    methodology="Unknown",
                    technical_concepts=[],
                    data_insights={},
                    practical_applications=[],
                    limitations=["Batch processing error"],
                    future_directions=[],
                    confidence_assessment="None - Processing Error",
                    field_specific_insights={"batch_error": str(result)}
                ),
                processing_time_seconds=0.0,
                success=False,
                error_message=str(result)
            )
            processed_results.append(error_result)
        else:
            processed_results.append(result)
    
    return processed_results


# Export main functions and classes
__all__ = [
    'analyze_document',
    'analyze_documents_batch', 
    'ResyftAgenticWorkflow',
    'WorkflowResult',
    'WorkflowConfig'
]