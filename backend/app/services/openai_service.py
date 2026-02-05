from openai import OpenAI
from app.core.config import settings
import json

client = OpenAI(api_key=settings.openai_api_key)

def analyze_resume(resume_text: str, jd_text: str) -> dict:
    prompt = f"""
    You are an expert AI Resume Analyzer and Recruiter. 
    Compare the Resume against the Job Description.
    
    Job Description:
    {jd_text}
    
    Resume:
    {resume_text}
    
    ### Task:
    1. Calculate a "match_score" (0-100) based on how well the candidate fits the JD.
    2. Identify "key_missing_skills" and "strengths".
    3. Generate "interview_questions".
    4. **Smart Tailoring (CRITICAL RULES):**
       - Identify 3-5 weak or generic bullet points to rewrite using the STAR method.
       - **Rule 1: High-Score Threshold:** IF the `match_score` is > 85%, DO NOT SUGGEST REWRITES. Return `[]`.
       - **Rule 2: Idempotency:** If a bullet point is ALREADY highly tailored (uses JD keywords, demonstrates impact, fits the role), DO NOT suggest a rewrite for it. 
       - **Rule 3: Structural Gaps:** Recognize that low scores are often due to structural gaps (e.g., missing degrees or years of experience) that cannot be fixed by rewording. Do NOT suggest marginal "nitpicky" changes just to fill the quota if the content is already optimized.
       - **Rule 4: Keyword Preservation:** NEVER remove a technical skill, software, or specialized keyword found in the original bullet point unless it is explicitly irrelevant to the JD. Your goal is to keep the "flavor" of the original while adding the "spice" of the JD.
       - **Rule 5: Score Improvement Objective:** Every rewrite MUST be designed to maintain or increase the `match_score`. If a rewrite risks lowering the score by being too vague or missing original context, do not suggest it.
       - Only suggest a rewrite if it provides a **significant** upgrade in impact or keyword alignment.
    
    Provide the output in the following JSON format ONLY:
    {{
        "match_score": <number 0-100>,
        "key_missing_skills": [<list of strings>],
        "strengths": [<list of strings>],
        "summary": "<short summary including top 3 reasons to hire>",
        "ats_score": <number 0-100>,
        "optimization_feedback": "<A short message specifically for the user explaining the score context. If the score is low but no rewrites are suggested, explain that the gap is structural (e.g., missing experience) rather than linguistic.>",
        "interview_questions": [<list of 5 interview questions>],
        "suggested_rewrites": [
            {{
                "original": "<original bullet point text>",
                "rewritten": "<improved, tailored bullet point>",
                "reason": "<brief explanation of why this is better>"
            }}
        ]
    }}
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
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        return {"error": str(e)}

def parse_resume_structure(resume_text: str) -> dict:
    prompt = f"""
    You are an expert Resume Parser. 
    Extract the following information from the resume text into a standard structured JSON format.
    
    Resume Text:
    {resume_text}
    
    Output JSON format ONLY:
    {{
        "contact_info": {{
            "name": "Full Name",
            "email": "Email",
            "phone": "Phone",
            "linkedin": "LinkedIn URL (optional)",
            "location": "City, State (optional)"
        }},
        "summary": "Professional Summary",
        "experience": [
            {{
                "company": "Company Name",
                "role": "Job Title",
                "dates": "Date Range",
                "description": ["Bullet point 1", "Bullet point 2"]
            }}
        ],
        "education": [
            {{
                "institution": "University Name",
                "degree": "Degree",
                "dates": "Date Range"
            }}
        ],
        "skills": ["Skill 1", "Skill 2"]
    }}
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
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error parsing resume structure: {e}")
        return {"error": str(e)}
