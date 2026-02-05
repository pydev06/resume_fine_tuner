import httpx
from bs4 import BeautifulSoup

def scrape_job_description(url: str) -> str:
    try:
        # Basic header to avoid immediate blocking, though real scrapers need more
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
        }
        with httpx.Client(follow_redirects=True, headers=headers) as client:
            response = client.get(url, timeout=10.0)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Very basic extraction: get all text. 
            # In a real app, we'd target specific containers based on the domain (LinkedIn, etc.)
            # For now, we strip script and style elements.
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.extract()
                
            text = soup.get_text(separator='\n')
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text[:10000] # Limit length for API context
            
    except Exception as e:
        return f"Error scraping URL: {str(e)}"
