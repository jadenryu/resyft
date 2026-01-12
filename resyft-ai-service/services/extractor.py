from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os
import json
import httpx

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
        # Initialize OpenRouter configuration for Gemini
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "google/gla:gemini-2.5-flash-lite"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://resyft.com",
            "X-Title": "Resyft Paper Analysis",
        }
    
    async def extract(self, content: str, extraction_type: str, project_context: Optional[str] = None) -> Dict[str, Any]:
        """Extract information from paper content using Gemini via OpenRouter"""
        
        prompt = self._build_prompt(content, extraction_type, project_context)
        
        system_prompt = """You are a research paper analysis expert. Analyze the provided research paper and extract key information in a structured format.

For scoring:
- reliability_score (0-1): Rate based on methodology rigor, sample size, and peer review status
- relevance_score (0-1): Rate based on how current and applicable the research is  
- support_score (0-1): Rate based on how well conclusions are supported by data

Return a valid JSON object with the extracted information. Focus on the specific extraction type requested."""
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 2000
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    print(f"OpenRouter API error: {response.status_code} - {response.text}")
                    raise Exception(f"OpenRouter API error: {response.status_code}")
                
                data = response.json()
                
                if 'choices' not in data or not data['choices']:
                    raise Exception("No response from OpenRouter API")
                
                content = data['choices'][0]['message']['content']
                
                # Parse JSON from response
                try:
                    # Look for JSON in the response
                    start_idx = content.find('{')
                    end_idx = content.rfind('}') + 1
                    
                    if start_idx != -1 and end_idx > start_idx:
                        json_str = content[start_idx:end_idx]
                        result = json.loads(json_str)
                        
                        # Ensure required scores are present
                        result.setdefault("reliability_score", 0.5)
                        result.setdefault("relevance_score", 0.5) 
                        result.setdefault("support_score", 0.5)
                        
                        # Filter out None values
                        result = {k: v for k, v in result.items() if v is not None}
                        
                        print(f"✅ Gemini extraction successful - Type: {extraction_type}")
                        return result
                    else:
                        raise Exception("No valid JSON found in response")
                        
                except json.JSONDecodeError as e:
                    print(f"JSON parsing error: {e}")
                    # Fallback to text-based response
                    return {
                        "conclusions": content,
                        "reliability_score": 0.5,
                        "relevance_score": 0.5,
                        "support_score": 0.5
                    }
                    
        except Exception as e:
            print(f"Gemini extraction error: {str(e)}")
            # Fallback to simpler extraction
            return await self._fallback_extraction(content, extraction_type, prompt)
    
    async def _fallback_extraction(self, content: str, extraction_type: str, prompt: str) -> Dict[str, Any]:
        """Fallback extraction method with simple text analysis"""
        try:
            # Simple fallback - basic analysis without API call
            print(f"⚠️ Using fallback extraction for type: {extraction_type}")
            
            # Basic text analysis
            word_count = len(content.split())
            has_numbers = any(char.isdigit() for char in content)
            
            reliability = 0.3 if word_count > 1000 else 0.2
            relevance = 0.4 if has_numbers else 0.3
            support = 0.3
            
            fallback_result = {
                "methods": "Analysis method not fully determined",
                "conclusions": "Basic analysis completed - full extraction requires API connection",
                "reliability_score": reliability,
                "relevance_score": relevance,
                "support_score": support,
                "important_quotes": [],
                "fallback": True
            }
            
            return fallback_result
                
        except Exception as e:
            print(f"Fallback extraction error: {str(e)}")
            return {
                "error": "All extraction methods failed",
                "conclusions": "Unable to analyze paper content",
                "reliability_score": 0.0,
                "relevance_score": 0.0,
                "support_score": 0.0
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