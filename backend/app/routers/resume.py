from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import Response
from ..services.resume_parser import parse_resume
from ..services.openai_service import analyze_resume, parse_resume_structure
from ..services.scraper_service import scrape_job_description
from ..services.pdf_service import generate_resume_pdf
from ..services.docx_service import generate_tailored_docx
import requests
from ..services.supabase_service import (
    upload_resume_to_storage,
    save_resume_record,
    save_job_description,
    save_evaluation,
    get_user_evaluations,
    get_user_resumes,
    supabase  # Import supabase client for caching queries
)
from ..dependencies import get_current_user
from typing import Optional

router = APIRouter()

@router.post("/analyze")
async def analyze_resume_endpoint(
    resume: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    job_description_url: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    if not job_description and not job_description_url:
        raise HTTPException(status_code=400, detail="Either job description text or URL is required")

    # Extract user ID from UserResponse object
    user_id = current_user.user.id

    # 1. Get JD Text
    jd_text = job_description
    jd_title = None
    if job_description_url:
        scraped_text = scrape_job_description(job_description_url)
        if "Error scraping URL" in scraped_text:
             raise HTTPException(status_code=400, detail=scraped_text)
        jd_text = scraped_text
        # Extract title from first line or URL
        jd_title = jd_text.split('\n')[0][:100] if jd_text else job_description_url

    # 2. Read and parse file
    try:
        content = await resume.read()
        resume_text = parse_resume(content, resume.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    # 3. Upload resume to storage
    try:
        file_url = upload_resume_to_storage(user_id, content, resume.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

    # 4. Check if this resume+JD combination was already analyzed (caching)
    is_refresh = False
    existing_evaluation_id = None
    existing_resume_id = None
    existing_jd_id = None

    try:
        # Check for existing evaluation with same resume text and JD
        existing_resume = supabase.table("resumes").select("id").eq("user_id", user_id).eq("parsed_text", resume_text).execute()
        existing_jd = supabase.table("job_descriptions").select("id").eq("user_id", user_id).eq("content", jd_text).execute()
        
        if existing_resume.data and existing_jd.data:
            existing_resume_id = existing_resume.data[0]["id"]
            existing_jd_id = existing_jd.data[0]["id"]

            # Check if evaluation exists
            existing_eval = supabase.table("evaluations").select("*").eq("resume_id", existing_resume_id).eq("jd_id", existing_jd_id).execute()
            
            if existing_eval.data:
                cached_data = existing_eval.data[0]["analysis_json"]
                
                # Check if this cached result has the new "Smart Tailoring" & "Feedback" features
                if "suggested_rewrites" in cached_data and "optimization_feedback" in cached_data:
                    # Return cached result
                    cached_data["parsed_text"] = resume_text
                    cached_data["cached"] = True
                    cached_data["evaluation_id"] = existing_eval.data[0]["id"]
                    cached_data["resume_id"] = existing_resume_id
                    return cached_data
                else:
                    # Cache is stale (missing new features), mark for refresh
                    print("Cache stale (missing suggested_rewrites or optimization_feedback). Re-analyzing...")
                    is_refresh = True
                    existing_evaluation_id = existing_eval.data[0]["id"]

    except Exception as e:
        print(f"Error checking cache: {str(e)}")

    # 5. Analyze (only if not cached or stale)
    analysis_result = analyze_resume(resume_text, jd_text)
    
    if "error" in analysis_result:
        raise HTTPException(status_code=500, detail=analysis_result["error"])

    # 6. Save to database
    try:
        current_resume_id = None
        current_jd_id = None

        if is_refresh and existing_resume_id and existing_jd_id:
            # Reuse existing records
            current_resume_id = existing_resume_id
            current_jd_id = existing_jd_id
        else:
            # Create new records
            resume_record = save_resume_record(user_id, file_url, resume.filename, resume_text)
            current_resume_id = resume_record["id"]
            
            jd_record = save_job_description(user_id, jd_text, job_description_url, jd_title)
            current_jd_id = jd_record["id"]
        
        # Save or Update evaluation
        evaluation_record = save_evaluation(
            user_id=user_id,
            resume_id=current_resume_id,
            jd_id=current_jd_id,
            score=analysis_result.get("match_score", 0),
            analysis_json=analysis_result,
            ats_score=analysis_result.get("ats_score", 0),
            evaluation_id=existing_evaluation_id  # Pass ID if we are updating
        )
        
        # Add IDs to response
        analysis_result["evaluation_id"] = evaluation_record["id"]
        analysis_result["resume_id"] = resume_record["id"]
        
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error saving to database: {str(e)}")

    analysis_result["parsed_text"] = resume_text
    analysis_result["resume_name"] = resume.filename
    return analysis_result


@router.get("/history")
async def get_history(
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """Get user's evaluation history"""
    user_id = current_user.user.id
    try:
        evaluations = get_user_evaluations(user_id, limit)
        return {"evaluations": evaluations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")


@router.get("/resumes")
async def get_resumes(
    current_user = Depends(get_current_user)
):
    """Get user's uploaded resumes"""
    user_id = current_user.user.id
    try:
        resumes = get_user_resumes(user_id)
        return {"resumes": resumes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching resumes: {str(e)}")


import difflib

def merge_rewrites_into_structure(structure: dict, rewrites: list) -> dict:
    """
    Update the structured resume data with the rewritten bullet points.
    Uses fuzzy matching to handle slight variations in how AI quotes the original text.
    """
    if not rewrites:
        return structure
        
    # Flat list of original texts to search against
    rewrite_originals = [item["original"].strip() for item in rewrites if "original" in item]
    
    if "experience" in structure:
        for exp in structure["experience"]:
            if "description" in exp:
                new_desc = []
                for bullet in exp["description"]:
                    clean_bullet = bullet.strip()
                    
                    # 1. Exact Match Check
                    match_found = False
                    for item in rewrites:
                        if item["original"].strip() == clean_bullet:
                            new_desc.append(item["rewritten"])
                            match_found = True
                            break
                    
                    if match_found:
                        continue
                        
                    # 2. Fuzzy Match Check (difflib)
                    # We look for a match with similarity > 0.85
                    best_match = None
                    highest_ratio = 0.0
                    
                    for item in rewrites:
                        orig = item["original"].strip()
                        ratio = difflib.SequenceMatcher(None, clean_bullet, orig).ratio()
                        if ratio > highest_ratio:
                            highest_ratio = ratio
                            best_match = item["rewritten"]

                    if highest_ratio > 0.85:
                         new_desc.append(best_match)
                         print(f"Fuzzy matched: '{clean_bullet}' -> Rewritten (Score: {highest_ratio:.2f})")
                    else:
                         new_desc.append(bullet)
                         
                exp["description"] = new_desc
                
    return structure


@router.post("/generate-pdf")
async def generate_pdf_endpoint(
    evaluation_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        # 1. Fetch evaluation data
        response = supabase.table("evaluations").select("*, resumes(*), job_descriptions(*)").eq("id", evaluation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
        evaluation = response.data[0]
        analysis = evaluation["analysis_json"]
        resume_text = evaluation["resumes"]["parsed_text"]
        
        # 2. Check if we have structured data in the analysis
        # If not, generating it now (this is a one-time cost for older analyses)
        if "structured_resume" not in analysis:
            print("Generating structured resume data...")
            structured_data = parse_resume_structure(resume_text)
            
            # Save it back to the evaluation so we don't pay for it again
            analysis["structured_resume"] = structured_data
            supabase.table("evaluations").update({"analysis_json": analysis}).eq("id", evaluation_id).execute()
        else:
            structured_data = analysis["structured_resume"]
            
        # 3. Merge "Smart Rewrites" into the structure
        rewrites = analysis.get("suggested_rewrites", [])
        final_data = merge_rewrites_into_structure(structured_data, rewrites)
        
        # 4. Generate PDF
        pdf_bytes = generate_resume_pdf(final_data)
        
        # 5. Return PDF
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=tailored_resume.pdf"
            }
        )
        
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/generate-docx")
async def generate_docx_endpoint(
    evaluation_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        # 1. Fetch evaluation data
        response = supabase.table("evaluations").select("*, resumes(*)").eq("id", evaluation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
        evaluation = response.data[0]
        analysis = evaluation["analysis_json"]
        file_url = evaluation["resumes"]["file_url"]
        filename = evaluation["resumes"]["filename"]

        if not filename.lower().endswith('.docx'):
            raise HTTPException(status_code=400, detail="Original resume must be a .docx file for tailored formatting.")

        # 2. Download the original docx file from storage
        # We extract the path from the URL and use the SDK to download (authenticated)
        try:
            # The URL is typically .../storage/v1/object/public/resumes/USER_ID/FILENAME
            # We need the path: USER_ID/FILENAME
            if "/resumes/" in file_url:
                storage_path = file_url.split("/resumes/")[1]
                print(f"Downloading from storage path: {storage_path}")
                file_bytes = supabase.storage.from_("resumes").download(storage_path)
            else:
                # Fallback to requests if URL format is unexpected
                file_response = requests.get(file_url)
                if file_response.status_code != 200:
                    raise Exception(f"Requests fallback failed with status {file_response.status_code}")
                file_bytes = file_response.content
        except Exception as e:
            print(f"Error fetching from storage: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch original resume from storage: {str(e)}")

        # 3. Apply rewrites
        rewrites = analysis.get("suggested_rewrites", [])
        if not rewrites:
             return Response(content=file_bytes, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

        tailored_bytes = generate_tailored_docx(file_bytes, rewrites)

        # 4. Return tailored DOCX
        return Response(
            content=tailored_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=tailored_{filename}"
            }
        )

    except Exception as e:
        print(f"Error generating DOCX: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
