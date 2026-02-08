from openai import OpenAI
from ..core.config import settings
import json

client = OpenAI(api_key=settings.openai_api_key)

def get_interviewer_system_prompt(resume_text: str, jd_text: str):
    return f"""
    You are an expert Executive Recruiter and Hiring Manager. 
    You are conducting a formal mock interview for a candidate based on their Resume and the Job Description provided.

    Job Description:
    {jd_text}
    
    Candidate's Resume:
    {resume_text}

    ### Your Goals:
    1. Conduct a realistic, professional, yet supportive interview.
    2. Ask one question at a time.
    3. For every answer the candidate provides, you MUST provide "Real-time Feedback" (briefly) before moving to the next question.
    4. Feedback should be actionable: "Good use of keywords, but try to use the STAR method to quantify your results." or "That was a strong answer, but you might want to mention your experience with X specifically."
    5. Maintain a persona of a "Sophisticated, Senior Interviewer".

    ### Response Format:
    You must always respond in JSON format with the following keys:
    {{
        "feedback": "Your evaluation of their PREVIOUS answer (leave empty for the first question). Do not be afraid to be critical but constructive.",
        "next_question": "The next interview question you want to ask.",
        "context_clue": "A short hint for the candidate on what you are looking for in this question.",
        "is_final": false // set to true if the interview is over (usually after 5-6 questions)
    }}
    """

def start_interview(resume_text: str, jd_text: str) -> dict:
    system_prompt = get_interviewer_system_prompt(resume_text, jd_text)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Hi, I'm ready for my interview. Please start."}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error starting interview: {e}")
        return {"error": str(e)}

def chat_interview(resume_text: str, jd_text: str, message_history: list) -> dict:
    system_prompt = get_interviewer_system_prompt(resume_text, jd_text)
    
    # Prepare messages for OpenAI
    openai_messages = [{"role": "system", "content": system_prompt}]
    
    # Map message history (from Supabase) to OpenAI format
    for msg in message_history:
        role = "user" if msg["role"] == "user" else "assistant"
        content = msg["content"]
        openai_messages.append({"role": role, "content": content})
        
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=openai_messages,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error in interview chat: {e}")
        return {"error": str(e)}

def transcribe_audio(audio_file) -> str:
    try:
        # Save temporary file because OpenAI requires a file object with a name/extension
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_file.read())
            tmp_path = tmp.name
            
        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=f
            )
            
        os.unlink(tmp_path)
        return transcript.text
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        raise e

def generate_speech(text: str):
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        return response.content # Returns the audio bytes
    except Exception as e:
        print(f"Error generating speech: {e}")
        raise e
