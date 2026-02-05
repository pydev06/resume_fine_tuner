from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Use service role key for backend operations (bypasses RLS)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")

# Create client with service role key for backend operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_resume_to_storage(user_id: str, file_content: bytes, filename: str) -> str:
    """
    Upload resume file to Supabase Storage.
    Returns the public URL of the uploaded file.
    """
    import time
    
    # Add timestamp to filename to avoid duplicates
    timestamp = int(time.time())
    name_parts = filename.rsplit('.', 1)
    if len(name_parts) == 2:
        unique_filename = f"{name_parts[0]}_{timestamp}.{name_parts[1]}"
    else:
        unique_filename = f"{filename}_{timestamp}"
    
    # Create user-specific path
    file_path = f"{user_id}/{unique_filename}"
    
    # Upload to 'resumes' bucket with upsert option
    response = supabase.storage.from_("resumes").upload(
        file_path,
        file_content,
        {"content-type": "application/pdf" if filename.endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         "upsert": "true"}
    )
    
    # Get the public URL
    file_url = supabase.storage.from_("resumes").get_public_url(file_path)
    return file_url


def save_resume_record(user_id: str, file_url: str, filename: str, parsed_text: str) -> dict:
    """
    Save resume metadata to the database.
    Returns the created resume record.
    """
    data = {
        "user_id": user_id,
        "file_url": file_url,
        "filename": filename,
        "parsed_text": parsed_text
    }
    
    response = supabase.table("resumes").insert(data).execute()
    return response.data[0] if response.data else None


def save_job_description(user_id: str, content: str, url: str = None, title: str = None) -> dict:
    """
    Save job description to the database.
    Returns the created JD record.
    """
    data = {
        "user_id": user_id,
        "content": content,
        "url": url,
        "title": title
    }
    
    response = supabase.table("job_descriptions").insert(data).execute()
    return response.data[0] if response.data else None


def save_evaluation(user_id: str, resume_id: str, jd_id: str, score: int, analysis_json: dict, ats_score: int, evaluation_id: str = None) -> dict:
    """
    Save evaluation results to the database.
    If evaluation_id is provided, updates the existing record.
    Returns the created/updated evaluation record.
    """
    data = {
        "user_id": user_id,
        "resume_id": resume_id,
        "jd_id": jd_id,
        "score": score,
        "analysis_json": analysis_json,
        "ats_score": ats_score
    }
    
    if evaluation_id:
        # Update existing record
        response = supabase.table("evaluations").update(data).eq("id", evaluation_id).execute()
    else:
        # Insert new record
        response = supabase.table("evaluations").insert(data).execute()
        
    return response.data[0] if response.data else None


def get_user_evaluations(user_id: str, limit: int = 10):
    """
    Fetch user's evaluation history with related resume and JD data.
    """
    response = supabase.table("evaluations").select(
        "*, resumes(filename, file_url), job_descriptions(title, content)"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
    
    return response.data


def get_user_resumes(user_id: str):
    """
    Fetch all resumes for a user.
    """
    response = supabase.table("resumes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data
