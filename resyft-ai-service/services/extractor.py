from openai import OpenAI
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os
import json

class ExtractionResult(BaseModel):
    methods: Optional[str] = Field(None, description="Research methods used in the paper")
    sample_size: Optional[int] = Field(None, description="Sample size of the study")
    key_statistics: Optional[Dict[str, Any]] = Field(None, description="Key statistical findings")
    conclusions: Optional[str] = Field(None, description="Main conclusions of the paper")
    important_quotes: Optional[List[str]] = Field(None, description="Important quotes from the paper")
    numerical_data: Optional[Dict[str, float]] = Field(None, description="Numerical data extracted")
    reliability_score: Optional[float] = Field(None, description="Reliability score (0-1)")
    relevance_score: Optional[float] = Field(None, description="Relevance score (0-1)")
    support_score: Optional[float] = Field(None, description="Support score (0-1)")

class PaperExtractor:
    def __init__(self):
        # Initialize OpenRouter client
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            default_headers={
                "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:3000"),
                "X-Title": "Resyft Research Analysis"
            }
        )
        
        # Default to Claude 3.5 Sonnet for best performance
        self.model = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")
    
    async def extract(self, content: str, extraction_type: str, project_context: Optional[str] = None) -> Dict[str, Any]:
        """Extract information from paper content using OpenRouter"""
        
        prompt = self._build_prompt(content, extraction_type, project_context)
        
        # Create the function schema for structured output
        function_schema = {
            "name": "extract_paper_data",
            "description": "Extract structured data from research paper",
            "parameters": {
                "type": "object",
                "properties": {
                    "methods": {"type": "string", "description": "Research methods used"},
                    "sample_size": {"type": "integer", "description": "Sample size of the study"},
                    "key_statistics": {"type": "object", "description": "Key statistical findings"},
                    "conclusions": {"type": "string", "description": "Main conclusions"},
                    "important_quotes": {"type": "array", "items": {"type": "string"}, "description": "Important quotes"},
                    "numerical_data": {"type": "object", "description": "Numerical data as key-value pairs"},
                    "reliability_score": {"type": "number", "minimum": 0, "maximum": 1, "description": "Reliability score"},
                    "relevance_score": {"type": "number", "minimum": 0, "maximum": 1, "description": "Relevance score"},
                    "support_score": {"type": "number", "minimum": 0, "maximum": 1, "description": "Support score"}
                },
                "required": ["reliability_score", "relevance_score", "support_score"]
            }
        }
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a research paper analysis expert. Extract key information from research papers including methods, statistics, and conclusions. 
                        
                        For reliability_score: Rate 0-1 based on methodology rigor, sample size, and peer review status.
                        For relevance_score: Rate 0-1 based on how current and applicable the research is.
                        For support_score: Rate 0-1 based on how well the conclusions are supported by the data.
                        
                        Focus on extracting the specific type of information requested."""
                    },
                    {"role": "user", "content": prompt}
                ],
                functions=[function_schema],
                function_call={"name": "extract_paper_data"},
                temperature=0.3,
                max_tokens=4000
            )
            
            # Extract the function call response
            function_args = json.loads(response.choices[0].message.function_call.arguments)
            
            # Filter out None values
            result = {k: v for k, v in function_args.items() if v is not None}
            
            return result
            
        except Exception as e:
            print(f"OpenRouter extraction error: {str(e)}")
            # Fallback to simpler extraction without function calling
            return await self._fallback_extraction(content, extraction_type, prompt)
    
    async def _fallback_extraction(self, content: str, extraction_type: str, prompt: str) -> Dict[str, Any]:
        """Fallback extraction method without function calling"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a research paper analysis expert. Provide a JSON response with extracted information."
                    },
                    {
                        "role": "user",
                        "content": f"{prompt}\n\nProvide your response as a valid JSON object with these fields: methods, sample_size, key_statistics, conclusions, important_quotes, numerical_data, reliability_score (0-1), relevance_score (0-1), support_score (0-1)."
                    }
                ],
                temperature=0.3,
                max_tokens=4000
            )
            
            # Try to parse JSON from response
            response_text = response.choices[0].message.content
            # Find JSON in response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Return minimal response if parsing fails
                return {
                    "conclusions": response_text,
                    "reliability_score": 0.5,
                    "relevance_score": 0.5,
                    "support_score": 0.5
                }
                
        except Exception as e:
            print(f"Fallback extraction error: {str(e)}")
            return {
                "error": "Extraction failed",
                "reliability_score": 0,
                "relevance_score": 0,
                "support_score": 0
            }
    
    def _build_prompt(self, content: str, extraction_type: str, project_context: Optional[str] = None) -> str:
        """Build extraction prompt based on type"""
        
        # Limit content to prevent token overflow
        max_content_length = 8000
        if len(content) > max_content_length:
            content = content[:max_content_length] + "... [truncated]"
        
        base_prompt = f"Analyze this research paper and extract information:\n\n{content}\n\n"
        
        if extraction_type == "numerical":
            base_prompt += "Focus on extracting all numerical data, statistics, and quantitative findings. Include sample sizes, p-values, effect sizes, percentages, and any other numerical results."
        elif extraction_type == "quotes":
            base_prompt += "Focus on extracting important quotes and qualitative insights. Include key statements from authors, significant findings expressed in words, and notable conclusions."
        elif extraction_type == "details":
            base_prompt += "Focus on extracting methodology details, sample information, and key findings. Include research design, participant demographics, data collection methods, and analysis approaches."
        else:  # all
            base_prompt += "Extract comprehensive information including methods, statistics, quotes, and conclusions. Provide a complete analysis of the paper."
        
        if project_context:
            base_prompt += f"\n\nProject context for relevance scoring: {project_context}"
        
        return base_prompt