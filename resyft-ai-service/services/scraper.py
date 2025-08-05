import httpx
import aiohttp
import asyncio
from bs4 import BeautifulSoup
from typing import Optional
import re

class PaperScraper:
    def __init__(self):
        self.session = None
    
    async def scrape_paper(self, url: str) -> str:
        """Scrape content from a research paper URL"""
        try:
            # Check if it's a PDF
            if url.endswith('.pdf') or 'pdf' in url.lower():
                return await self._extract_pdf_content(url)
            else:
                return await self._extract_web_content(url)
        except Exception as e:
            raise Exception(f"Failed to scrape paper: {str(e)}")
    
    async def _extract_pdf_content(self, url: str) -> str:
        """Extract text from PDF - simplified fallback"""
        return f"PDF content extraction not available in production mode. Please provide the paper text directly instead of URL: {url}"
    
    async def _extract_web_content(self, url: str) -> str:
        """Extract content from web page using BeautifulSoup"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to fetch {url}")
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Try to find main content areas (common patterns for research papers)
                content_selectors = [
                    'article', 'main', '.content', '.paper-content', 
                    '.abstract', '.full-text', '#main-content'
                ]
                
                text = ""
                for selector in content_selectors:
                    content = soup.select_one(selector)
                    if content:
                        text = content.get_text()
                        break
                
                # Fallback to body if no main content found
                if not text:
                    text = soup.get_text()
                
                # Clean up the text
                text = re.sub(r'\s+', ' ', text)  # Multiple whitespace to single space
                text = re.sub(r'\n+', '\n', text)  # Multiple newlines to single
                text = text.strip()
                
                if len(text) < 100:
                    raise Exception("Extracted content is too short - may not be a valid research paper")
                
                return text