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


def save_job_description(user_id: str, content: str, url: str = None, title: str = None, company: str = None) -> dict:
    """
    Save job description to the database.
    Returns the created JD record.
    """
    data = {
        "user_id": user_id,
        "content": content,
        "url": url,
        "title": title,
        "company": company
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
        "*, resumes(filename, file_url), job_descriptions(title, company, content)"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
    
    return response.data


def get_user_resumes(user_id: str):
    """
    Fetch all resumes for a user.
    """
    response = supabase.table("resumes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data


def get_user_credits(user_id: str) -> int:
    """
    Get current credit balance for a user.
    """
    try:
        response = supabase.table("profiles").select("credits").eq("id", user_id).execute()
        if response.data:
            return response.data[0].get("credits", 0)
        # If no profile exists yet, create one with 5 free credits
        res = supabase.table("profiles").insert({"id": user_id, "credits": 5}).execute()
        return 5
    except Exception as e:
        print(f"Error fetching/creating profile: {str(e)}")
        return 0


def add_user_credits(user_id: str, amount: int) -> int:
    """
    Add credits to a user's balance.
    """
    current_credits = get_user_credits(user_id)
    new_total = current_credits + amount
    supabase.table("profiles").update({"credits": new_total}).eq("id", user_id).execute()
    return new_total


def deduct_user_credits(user_id: str, amount: int = 1) -> bool:
    """
    Deduct credits from user's balance. Returns True if successful.
    """
    current_credits = get_user_credits(user_id)
    if current_credits < amount:
        return False
    
    new_total = current_credits - amount
    supabase.table("profiles").update({"credits": new_total}).eq("id", user_id).execute()
    return True


def delete_user_evaluation(user_id: str, evaluation_id: str) -> bool:
    """
    Delete an evaluation record. If the associated resume is not used elsewhere,
    deletes the resume record and the file from storage.
    """
    try:
        # 1. Get evaluation details to find associated resume
        eval_resp = supabase.table("evaluations").select("resume_id").eq("id", evaluation_id).eq("user_id", user_id).execute()
        if not eval_resp.data:
            return False
            
        resume_id = eval_resp.data[0]["resume_id"]
        
        # 2. Delete the evaluation
        supabase.table("evaluations").delete().eq("id", evaluation_id).eq("user_id", user_id).execute()
        
        # 3. Check if resume is used by other evaluations
        other_evals = supabase.table("evaluations").select("id").eq("resume_id", resume_id).execute()
        
        if not other_evals.data:
            # Resume is orphaned, delete it
            delete_resume_with_file(user_id, resume_id)
            
        return True
    except Exception as e:
        print(f"Error deleting evaluation: {str(e)}")
        return False


def delete_resume_with_file(user_id: str, resume_id: str):
    """
    Deletes a resume record and its corresponding file in Supabase Storage.
    """
    try:
        # Get record to find storage path
        resume_resp = supabase.table("resumes").select("file_url").eq("id", resume_id).eq("user_id", user_id).execute()
        if not resume_resp.data:
            return
            
        file_url = resume_resp.data[0]["file_url"]
        
        # Supabase public URLs are like: .../storage/v1/object/public/resumes/USER_ID/FILENAME
        # We need the path: USER_ID/FILENAME
        if "resumes/" in file_url:
            file_path = file_url.split("resumes/")[1]
            # Delete from storage
            supabase.storage.from_("resumes").remove([file_path])
            
        # Delete from DB
        supabase.table("resumes").delete().eq("id", resume_id).eq("user_id", user_id).execute()
    except Exception as e:
        print(f"Error deleting resume/file: {str(e)}")
