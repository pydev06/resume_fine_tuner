from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Response
from ..services.supabase_service import supabase, get_user_credits, deduct_user_credits
from ..services.interview_service import start_interview, chat_interview, transcribe_audio, generate_speech
from ..services.domain_detector import detect_domain
from ..services.cache_service import ai_cache
from ..dependencies import get_current_user
from typing import Optional
import json

router = APIRouter()

@router.get("/domains")
async def get_domains(
    current_user = Depends(get_current_user)
):
    """Get all active professional domains"""
    try:
        response = supabase.table("domains").select("*").eq("is_active", True).order("sort_order").execute()
        return {"domains": response.data}
    except Exception as e:
        print(f"Error fetching domains: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_categories(
    domain: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get all active interview categories, optionally filtered by domain"""
    try:
        query = supabase.table("interview_categories").select("*").eq("is_active", True)
        
        if domain:
            query = query.eq("domain", domain)
        
        response = query.order("sort_order").execute()
        return {"categories": response.data}
    except Exception as e:
        print(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-domain")
async def detect_domain_endpoint(
    evaluation_id: str = Form(...),
    current_user = Depends(get_current_user)
):
    """Auto-detect professional domain from resume and job description"""
    try:
        # Get evaluation context
        response = supabase.table("evaluations").select("*, resumes(parsed_text), job_descriptions(content)").eq("id", evaluation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        evaluation = response.data[0]
        resume_text = evaluation["resumes"]["parsed_text"]
        jd_text = evaluation["job_descriptions"]["content"]
        
        # Check cache first
        cache_key = ai_cache.generate_cache_key(
            f"domain_detection:{resume_text[:100]}:{jd_text[:100]}",
            {"evaluation_id": evaluation_id}
        )
        
        cached_result = await ai_cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Detect domain
        domain_slug, confidence = detect_domain(resume_text, jd_text)
        
        result = {
            "domain": domain_slug,
            "confidence": round(confidence, 2)
        }
        
        # Cache the result
        await ai_cache.set(
            cache_key,
            f"domain_detection:{evaluation_id}",
            result,
            cache_type='domain_detection'
        )
        
        return result
        
    except Exception as e:
        print(f"Error detecting domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start")
async def start_interview_endpoint(
    evaluation_id: str = Form(...),
    category_slug: str = Form(default="generic"),
    current_user = Depends(get_current_user)
):
    try:
        user_id = current_user['id']
        
        # 1. Check if user has credits
        credits = get_user_credits(user_id)
        if credits <= 0:
            raise HTTPException(
                status_code=402, 
                detail="Insufficient credits. Please top up to start a new interview."
            )

        # 2. Get evaluation context (Resume + JD)
        response = supabase.table("evaluations").select("*, resumes(parsed_text), job_descriptions(content)").eq("id", evaluation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evaluation context not found")
            
        evaluation = response.data[0]
        resume_text = evaluation["resumes"]["parsed_text"]
        jd_text = evaluation["job_descriptions"]["content"]
        
        # 2. Check for an existing active session for this evaluation + category
        existing_session = supabase.table("interview_sessions").select("*").eq("evaluation_id", evaluation_id).eq("user_id", current_user['id']).eq("category_slug", category_slug).eq("status", "active").order("created_at", desc=True).limit(1).execute()
        
        if existing_session.data:
            session = existing_session.data[0]
            messages = session.get("messages", [])
            last_ai_message = next((m for m in reversed(messages) if m["role"] == "assistant"), None)
            
            return {
                "session_id": session["id"],
                "first_question": last_ai_message["content"] if last_ai_message else "Ready when you are!",
                "context_clue": last_ai_message.get("context_clue", "") if last_ai_message else "",
                "messages": messages # Return existing history
            }

        # 3. Fetch category details
        category_response = supabase.table("interview_categories").select("*").eq("slug", category_slug).execute()
        if not category_response.data:
            raise HTTPException(status_code=404, detail=f"Category '{category_slug}' not found")
        category = category_response.data[0]
        
        # 4. No active session found, get first question from AI with category
        ai_response = start_interview(resume_text, jd_text, category_slug)
        
        if "error" in ai_response:
            raise HTTPException(status_code=400, detail=f"AI Interviewer failed: {ai_response['error']}")

        # 5. Create interview session in Supabase with category
        first_message = {
            "role": "assistant",
            "content": ai_response.get("next_question", "Ready when you are!"),
            "feedback": ai_response.get("feedback", ""),
            "context_clue": ai_response.get("context_clue", "")
        }
        
        session_data = {
            "user_id": current_user['id'],
            "evaluation_id": evaluation_id,
            "category_id": category["id"],
            "category_slug": category_slug,
            "messages": [first_message],
            "status": "active"
        }
        
        session_response = supabase.table("interview_sessions").insert(session_data).execute()
        
        if not session_response.data:
            raise Exception("Failed to create interview session")
            
        session = session_response.data[0]
        
        # Deduct 1 credit for starting a session
        deduct_user_credits(user_id, 1)
        
        return {
            "session_id": session["id"],
            "first_question": ai_response["next_question"],
            "context_clue": ai_response.get("context_clue", "")
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 402, 404) without converting to 500
        raise
    except Exception as e:
        print(f"Error starting interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_interview_endpoint(
    session_id: str = Form(...),
    user_answer: str = Form(...),
    current_user = Depends(get_current_user)
):
    try:
        # 1. Fetch existing session
        response = supabase.table("interview_sessions").select("*, evaluations(*, resumes(parsed_text), job_descriptions(content))").eq("id", session_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Session not found")
            
        session = response.data[0]
        evaluation = session["evaluations"]
        resume_text = evaluation["resumes"]["parsed_text"]
        jd_text = evaluation["job_descriptions"]["content"]
        messages = session["messages"]
        category_slug = session.get("category_slug", "generic")
        
        # 2. Add user's answer to history
        messages.append({"role": "user", "content": user_answer})
        
        # 3. Call AI for feedback and next question with category
        ai_response = chat_interview(resume_text, jd_text, messages, category_slug)
        
        # 4. Add AI response to history
        ai_message = {
            "role": "assistant",
            "content": ai_response["next_question"],
            "feedback": ai_response.get("feedback", ""),
            "context_clue": ai_response.get("context_clue", ""),
            "is_final": ai_response.get("is_final", False)
        }
        messages.append(ai_message)
        
        # 5. Update session in Supabase
        update_data = {
            "messages": messages,
            "status": "completed" if ai_response.get("is_final") else "active"
        }
        
        supabase.table("interview_sessions").update(update_data).eq("id", session_id).execute()
        
        return ai_response
        
    except Exception as e:
        print(f"Error in interview chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcribe")
async def transcribe_endpoint(
    audio: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    try:
        text = transcribe_audio(audio.file)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/speak")
async def speak_endpoint(
    text: str,
    current_user = Depends(get_current_user)
):
    try:
        audio_content = generate_speech(text)
        return Response(content=audio_content, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")
