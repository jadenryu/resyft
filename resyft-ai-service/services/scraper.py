from crawl4ai import AsyncWebCrawler
import PyPDF2
import httpx
import io
from typing import Optional

class PaperScraper:
    def __init__(self):
        self.crawler = AsyncWebCrawler()
    
    async def scrape_paper(self, url: str) -> str:
        """Scrape content from a research paper URL"""
        try:
            # Check if it's a PDF
            if url.endswith('.pdf') or 'pdf' in url:
                return await self._extract_pdf_content(url)
            else:
                return await self._extract_web_content(url)
        except Exception as e:
            raise Exception(f"Failed to scrape paper: {str(e)}")
    
    async def _extract_pdf_content(self, url: str) -> str:
        """Extract text from PDF"""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            
            pdf_file = io.BytesIO(response.content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
    
    async def _extract_web_content(self, url: str) -> str:
        """Extract content from web page"""
        async with self.crawler:
            result = await self.crawler.arun(url)
            return result.markdown