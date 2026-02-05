from fastapi import APIRouter, Depends, HTTPException, Form
from ..services.supabase_service import supabase
from ..services.interview_service import start_interview, chat_interview
from ..dependencies import get_current_user
import json

router = APIRouter()

@router.post("/start")
async def start_interview_endpoint(
    evaluation_id: str = Form(...),
    current_user = Depends(get_current_user)
):
    try:
        # 1. Fetch evaluation context
        response = supabase.table("evaluations").select("*, resumes(parsed_text), job_descriptions(content)").eq("id", evaluation_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Evaluation context not found")
            
        evaluation = response.data[0]
        resume_text = evaluation["resumes"]["parsed_text"]
        jd_text = evaluation["job_descriptions"]["content"]
        
        # 2. Check for an existing active session for this evaluation
        existing_session = supabase.table("interview_sessions").select("*").eq("evaluation_id", evaluation_id).eq("user_id", current_user.user.id).eq("status", "active").order("created_at", desc=True).limit(1).execute()
        
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

        # 3. No active session found, get first question from AI
        ai_response = start_interview(resume_text, jd_text)
        
        # 4. Create interview session in Supabase
        first_message = {
            "role": "assistant",
            "content": ai_response["next_question"],
            "feedback": ai_response.get("feedback", ""),
            "context_clue": ai_response.get("context_clue", "")
        }
        
        session_data = {
            "user_id": current_user.user.id,
            "evaluation_id": evaluation_id,
            "messages": [first_message],
            "status": "active"
        }
        
        session_response = supabase.table("interview_sessions").insert(session_data).execute()
        
        if not session_response.data:
            raise Exception("Failed to create interview session")
            
        session = session_response.data[0]
        
        return {
            "session_id": session["id"],
            "first_question": ai_response["next_question"],
            "context_clue": ai_response.get("context_clue", "")
        }
        
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
        
        # 2. Add user's answer to history
        messages.append({"role": "user", "content": user_answer})
        
        # 3. Call AI for feedback and next question
        ai_response = chat_interview(resume_text, jd_text, messages)
        
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
        print(f"Error in interview chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
