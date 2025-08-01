"""
Integration layer between the FastAPI service and PydanticAI research agent
"""

import asyncio
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import json
import os

from .research_agent import (
    research_agent,
    analyze_research_paper,
    UserSettings,
    ProjectContext,
    ExtractionMode,
    ContentPriority,
    ResearchAnalysisOutput
)


@dataclass
class ProjectSettings:
    """Project-specific settings loaded from database or config"""
    research_topic: str
    thesis_statement: Optional[str] = None
    key_terms: List[str] = None
    citation_style: str = "APA"
    extraction_mode: str = "mixed"
    num_quotes: int = 3
    num_statistics: int = 5
    include_methodology: bool = True
    content_priority: str = "balanced"
    min_reliability_score: float = 0.7


class ResearchAgentIntegration:
    """Integrates PydanticAI research agent with existing API"""
    
    def __init__(self):
        # In production, this would load from a database
        self.project_cache: Dict[str, ProjectSettings] = {}
        
    async def load_project_settings(self, project_id: Optional[str]) -> ProjectSettings:
        """Load project settings from database or use defaults"""
        # In production, this would query a database
        # For now, return default settings
        
        if project_id and project_id in self.project_cache:
            return self.project_cache[project_id]
            
        # Default settings
        return ProjectSettings(
            research_topic="General research analysis",
            thesis_statement=None,
            key_terms=[],
            citation_style="APA",
            extraction_mode="mixed",
            num_quotes=3,
            num_statistics=5,
            include_methodology=True,
            content_priority="balanced",
            min_reliability_score=0.7
        )
    
    def map_extraction_type_to_settings(self, extraction_type: str) -> Dict[str, Any]:
        """Map legacy extraction types to new agent settings"""
        
        mappings = {
            "numerical": {
                "extraction_mode": ExtractionMode.STATISTICAL,
                "content_priority": ContentPriority.STATISTICS,
                "num_quotes": 1,
                "num_statistics": 10,
            },
            "quotes": {
                "extraction_mode": ExtractionMode.QUALITATIVE,
                "content_priority": ContentPriority.QUOTES,
                "num_quotes": 5,
                "num_statistics": 2,
            },
            "details": {
                "extraction_mode": ExtractionMode.MIXED,
                "content_priority": ContentPriority.METHODS,
                "include_methodology": True,
                "include_sample_size": True,
            },
            "all": {
                "extraction_mode": ExtractionMode.MIXED,
                "content_priority": ContentPriority.BALANCED,
                "num_quotes": 3,
                "num_statistics": 5,
            }
        }
        
        return mappings.get(extraction_type, mappings["all"])
    
    async def extract_with_agent(
        self,
        content: str,
        extraction_type: str,
        project_id: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Extract information using PydanticAI agent - Production-ready with comprehensive error handling"""
        
        try:
            # Input validation
            if not content or not content.strip():
                raise ValueError("Content cannot be empty")
            
            if len(content.strip()) < 10:
                raise ValueError("Content is too short for meaningful analysis")
                
            if extraction_type not in ["numerical", "quotes", "details", "all"]:
                raise ValueError(f"Invalid extraction_type: {extraction_type}")
            
            print(f"🔍 Starting PydanticAI analysis - Content length: {len(content)}, Type: {extraction_type}")
            
            # Load project settings with error handling
            try:
                project_settings = await self.load_project_settings(project_id)
            except Exception as e:
                print(f"⚠️  Warning: Failed to load project settings, using defaults: {e}")
                project_settings = ProjectSettings(
                    research_topic="General research analysis",
                    extraction_mode="mixed"
                )
            
            # Map extraction type to user settings
            type_settings = self.map_extraction_type_to_settings(extraction_type)
            
            # Create UserSettings with validation
            try:
                user_settings = UserSettings(
                    extraction_mode=type_settings.get("extraction_mode", project_settings.extraction_mode),
                    num_quotes=min(max(type_settings.get("num_quotes", project_settings.num_quotes), 0), 10),
                    num_statistics=min(max(type_settings.get("num_statistics", project_settings.num_statistics), 0), 20),
                    include_methodology=type_settings.get("include_methodology", project_settings.include_methodology),
                    include_sample_size=type_settings.get("include_sample_size", True),
                    content_priority=type_settings.get("content_priority", project_settings.content_priority),
                    min_reliability_score=max(min(project_settings.min_reliability_score, 1.0), 0.0)
                )
            except Exception as e:
                print(f"⚠️  Warning: Failed to create user settings, using defaults: {e}")
                user_settings = UserSettings()
            
            # Create ProjectContext with validation
            try:
                project_context = ProjectContext(
                    research_topic=custom_prompt or project_settings.research_topic or "Research analysis",
                    thesis_statement=project_settings.thesis_statement,
                    key_terms=project_settings.key_terms or [],
                    citation_style=project_settings.citation_style or "APA"
                )
            except Exception as e:
                print(f"⚠️  Warning: Failed to create project context, using defaults: {e}")
                project_context = ProjectContext(
                    research_topic="Research analysis"
                )
            
            # Run the analysis with comprehensive error handling
            try:
                result = await analyze_research_paper(
                    paper_content=content,
                    user_settings=user_settings,
                    project_context=project_context
                )
                
                print(f"✅ PydanticAI analysis completed successfully")
                print(f"🔍 Title: {result.title}")
                print(f"🔍 Methods: {result.methods}")
                print(f"🔍 Sample size: {result.sample_size}")
                print(f"🔍 Conclusions: {result.conclusions}")
                print(f"🔍 Quotes: {len(result.important_quotes) if result.important_quotes else 0}")
                
                # Validate result quality
                if (result.title and result.title.startswith("Error:")) or \
                   (result.conclusions and "failed" in result.conclusions.lower()):
                    print(f"⚠️  Analysis completed but with errors: {result.conclusions}")
                
                # Convert to legacy format with error handling
                try:
                    converted = self.convert_to_legacy_format(result)
                    print(f"✅ Successfully converted to legacy format")
                    return converted
                except Exception as e:
                    print(f"❌ Error converting to legacy format: {e}")
                    # Manual conversion as fallback
                    return {
                        "methods": result.methods,
                        "sample_size": result.sample_size,
                        "conclusions": result.conclusions,
                        "important_quotes": result.important_quotes or [],
                        "reliability_score": result.reliability_score,
                        "relevance_score": result.relevance_score,
                        "support_score": result.reliability_score * 0.9,
                        "_full_result": {
                            "title": result.title,
                            "suggested_text": f"{result.title}. {result.conclusions}" if result.title else result.conclusions
                        }
                    }
                    
            except ValueError as e:
                print(f"❌ Validation error during analysis: {e}")
                return {
                    "methods": "Content validation failed",
                    "sample_size": None,
                    "conclusions": f"Analysis failed: {str(e)}",
                    "important_quotes": [],
                    "reliability_score": 0.0,
                    "relevance_score": 0.0,
                    "support_score": 0.0,
                    "error": str(e)
                }
                
            except Exception as e:
                print(f"❌ Unexpected error during analysis: {e}")
                import traceback
                traceback.print_exc()
                return {
                    "methods": "Analysis engine error",
                    "sample_size": None,
                    "conclusions": f"Internal analysis error: {str(e)}",
                    "important_quotes": [],
                    "reliability_score": 0.0,
                    "relevance_score": 0.0,
                    "support_score": 0.0,
                    "error": str(e)
                }
                
        except Exception as e:
            print(f"❌ Critical error in extract_with_agent: {e}")
            import traceback
            traceback.print_exc()
            
            # Return safe fallback response
            return {
                "methods": "System error occurred",
                "sample_size": None,
                "conclusions": "The research analysis system encountered an error. Please try again.",
                "important_quotes": ["Analysis system temporarily unavailable"],
                "reliability_score": 0.0,
                "relevance_score": 0.0,
                "support_score": 0.0,
                "error": f"System error: {str(e)}"
            }
    
    def convert_to_legacy_format(self, result: ResearchAnalysisOutput) -> Dict[str, Any]:
        """Convert simplified PydanticAI output to legacy API format"""
        return {
            "methods": result.methods,
            "sample_size": result.sample_size,
            "conclusions": result.conclusions,
            "important_quotes": result.important_quotes,
            "reliability_score": result.reliability_score,
            "relevance_score": result.relevance_score,
            "support_score": result.reliability_score * 0.9,  # Approximation
            
            # Additional simplified fields
            "_full_result": {
                "title": result.title,
                "suggested_text": f"{result.title}. {result.conclusions}" if result.title else result.conclusions
            }
        }


# Global instance
agent_integration = ResearchAgentIntegration()