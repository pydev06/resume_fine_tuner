import sys
import os
import json
from openai import OpenAI

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.services.supabase_service import supabase

client = OpenAI(api_key=settings.openai_api_key)

def extract_metadata(jd_content):
    print(f"Extracting metadata for JD content (first 100 chars): {jd_content[:100]}...")
    prompt = f"""
    You are an expert recruiter. Given the job description content below, extract the Job Title and Company Name.
    
    Job Description:
    {jd_content}
    
    Return a JSON object in this format:
    {{
        "title": "Extracted Job Title",
        "company": "Extracted Company Name"
    }}
    
    If you cannot find the company name, use "General Analysis".
    If you cannot find the job title, use "Target Job Role".
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("title"), data.get("company")
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        return None, None

def run_backfill():
    print("Starting backfill for job descriptions...")
    
    # Fetch job descriptions with missing title or company
    response = supabase.table("job_descriptions").select("id, content").or_("title.is.null,company.is.null").execute()
    
    jds = response.data
    if not jds:
        print("No job descriptions found needing backfill.")
        return

    print(f"Found {len(jds)} records to backfill.")
    
    count = 0
    for jd in jds:
        jd_id = jd["id"]
        content = jd["content"]
        
        title, company = extract_metadata(content)
        
        if title and company:
            update_resp = supabase.table("job_descriptions").update({
                "title": title,
                "company": company
            }).eq("id", jd_id).execute()
            
            if update_resp.data:
                print(f"Successfully updated record {jd_id}: {title} @ {company}")
                count += 1
            else:
                print(f"Failed to update record {jd_id}")
        else:
            print(f"Skipping record {jd_id} due to extraction failure.")

    print(f"Backfill complete. Updated {count} records.")

if __name__ == "__main__":
    run_backfill()
