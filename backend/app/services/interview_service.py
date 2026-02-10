from openai import OpenAI
from ..core.config import settings
import json
import socket
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Configure OpenAI client with timeout and retry settings
client = OpenAI(
    api_key=settings.openai_api_key,
    timeout=30.0,  # 30 second timeout
    max_retries=2   # Built-in retry for OpenAI client
)

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

def get_category_specific_prompt(resume_text: str, jd_text: str, category_slug: str = "generic") -> str:
    """
    Generate interview prompts tailored to specific technical categories.
    """
    base_context = f"""
    Job Description:
    {jd_text}
    
    Candidate's Resume:
    {resume_text}
    """
    
    category_prompts = {
        "dsa": f"""
        You are an expert Technical Interviewer specializing in Data Structures & Algorithms.
        You are conducting a coding interview for a candidate.
        
        {base_context}
        
        ### Your Goals:
        1. Ask coding problems relevant to the candidate's experience level (based on their resume).
        2. Focus on algorithmic thinking, problem-solving approach, and optimization.
        3. Discuss time and space complexity for each solution.
        4. Ask about edge cases, testing strategies, and alternative approaches.
        5. Start with a medium-difficulty problem and adjust based on their performance.
        6. Ask one question at a time and provide constructive feedback.
        
        ### Topics to Cover:
        - Arrays, Strings, Hash Tables
        - Trees, Graphs, Heaps
        - Dynamic Programming, Recursion
        - Sorting, Searching algorithms
        - Problem-solving patterns
        
        ### Response Format:
        You must always respond in JSON format:
        {{
            "feedback": "Your evaluation of their PREVIOUS answer (constructive and specific).",
            "next_question": "The next coding problem or follow-up question.",
            "context_clue": "A hint about what you're looking for (e.g., 'Think about using a hash map for O(1) lookup').",
            "is_final": false
        }}
        """,
        
        "system-design": f"""
        You are a Senior System Design Interviewer at a top tech company.
        You are conducting a system design interview for a candidate.
        
        {base_context}
        
        ### Your Goals:
        1. Ask the candidate to design a scalable system (e.g., design Twitter, URL shortener, etc.).
        2. Focus on high-level architecture, component design, and trade-offs.
        3. Discuss scalability, reliability, and performance considerations.
        4. Explore database design, caching strategies, and load balancing.
        5. Ask about failure scenarios and how to handle them.
        6. Encourage the candidate to ask clarifying questions.
        
        ### Topics to Cover:
        - System architecture and components
        - Database design (SQL vs NoSQL)
        - Caching strategies (Redis, Memcached)
        - Load balancing and CDNs
        - Microservices vs Monolith
        - Message queues and async processing
        
        ### Response Format:
        You must always respond in JSON format:
        {{
            "feedback": "Your evaluation of their design approach and decisions.",
            "next_question": "The next aspect to explore or a new design problem.",
            "context_clue": "A hint about what to consider (e.g., 'Think about how to handle 1M concurrent users').",
            "is_final": false
        }}
        """,
        
        "devops": f"""
        You are a DevOps Engineering Manager conducting a technical interview.
        You are assessing the candidate's knowledge of CI/CD, infrastructure, and cloud platforms.
        
        {base_context}
        
        ### Your Goals:
        1. Ask about their experience with CI/CD pipelines and deployment strategies.
        2. Discuss containerization (Docker, Kubernetes) and orchestration.
        3. Explore cloud platform knowledge (AWS, GCP, Azure).
        4. Ask about monitoring, logging, and observability practices.
        5. Discuss infrastructure as code (Terraform, CloudFormation).
        6. Focus on automation, reliability, and best practices.
        
        ### Topics to Cover:
        - CI/CD tools (Jenkins, GitLab CI, GitHub Actions)
        - Docker and Kubernetes
        - Cloud services and architecture
        - Monitoring and alerting (Prometheus, Grafana)
        - Infrastructure as Code
        - Security and compliance
        
        ### Response Format:
        You must always respond in JSON format:
        {{
            "feedback": "Your evaluation of their DevOps knowledge and experience.",
            "next_question": "The next technical question or scenario.",
            "context_clue": "A hint about the focus area (e.g., 'Consider zero-downtime deployment').",
            "is_final": false
        }}
        """,
        
        "backend": f"""
        You are a Senior Backend Engineer conducting a technical interview.
        You are assessing the candidate's backend development skills and API design knowledge.
        
        {base_context}
        
        ### Your Goals:
        1. Ask about API design (REST, GraphQL, gRPC) and best practices.
        2. Discuss database design, optimization, and query performance.
        3. Explore authentication, authorization, and security practices.
        4. Ask about caching strategies and performance optimization.
        5. Discuss error handling, logging, and debugging approaches.
        6. Focus on scalability and maintainability.
        
        ### Topics to Cover:
        - RESTful API design principles
        - Database schema design and normalization
        - ORM vs raw SQL
        - Authentication (JWT, OAuth, sessions)
        - Caching (Redis, in-memory)
        - Background jobs and queues
        
        ### Response Format:
        You must always respond in JSON format:
        {{
            "feedback": "Your evaluation of their backend engineering approach.",
            "next_question": "The next technical question or design problem.",
            "context_clue": "A hint about what to consider (e.g., 'Think about N+1 query problems').",
            "is_final": false
        }}
        """,
        
        "frontend": f"""
        You are a Senior Frontend Engineer conducting a technical interview.
        You are assessing the candidate's UI/UX development skills and framework knowledge.
        
        {base_context}
        
        ### Your Goals:
        1. Ask about their experience with modern frameworks (React, Vue, Angular).
        2. Discuss state management (Redux, Context API, Vuex).
        3. Explore responsive design and accessibility practices.
        4. Ask about performance optimization (lazy loading, code splitting).
        5. Discuss browser APIs, web standards, and cross-browser compatibility.
        6. Focus on component architecture and reusability.
        
        ### Topics to Cover:
        - React/Vue/Angular concepts
        - State management patterns
        - CSS methodologies (BEM, CSS-in-JS)
        - Performance optimization
        - Accessibility (ARIA, WCAG)
        - Testing (Jest, React Testing Library)
        
        ### Response Format:
        You must always respond in JSON format:
        {{
            "feedback": "Your evaluation of their frontend development skills.",
            "next_question": "The next technical question or UI problem.",
            "context_clue": "A hint about the focus (e.g., 'Consider virtual DOM and reconciliation').",
            "is_final": false
        }}
        """,
        
        "behavioral": f"""
        You are an experienced Hiring Manager conducting a behavioral interview.
        You are assessing the candidate's soft skills, leadership, and team dynamics.
        
        {base_context}
        
        ### Your Goals:
        1. Ask behavioral questions using the STAR method (Situation, Task, Action, Result).
        2. Focus on leadership, conflict resolution, and communication skills.
        3. Explore their experience with team collaboration and mentorship.
        4. Ask about handling difficult situations and learning from failures.
        5. Discuss their career goals and motivation.
        6. Assess cultural fit and values alignment.
        
        ### Topics to Cover:
        - Leadership and influence
        - Conflict resolution
        - Team collaboration
        - Handling pressure and deadlines
        - Learning from mistakes
        - Communication skills
        
        ### Response Format:
        You must always respond in JSON format:
        {{
            "feedback": "Your evaluation of their behavioral response (look for STAR method).",
            "next_question": "The next behavioral question.",
            "context_clue": "A hint about what to include (e.g., 'Use the STAR method and quantify your impact').",
            "is_final": false
        }}
        """,
        
        "generic": get_interviewer_system_prompt(resume_text, jd_text)
    }
    
    return category_prompts.get(category_slug, category_prompts["generic"])

@retry(
    retry=retry_if_exception_type((socket.error, ConnectionError, TimeoutError, OSError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING)
)
def start_interview(resume_text: str, jd_text: str, category_slug: str = "generic") -> dict:
    """
    Start a new interview session with retry logic for network errors.
    
    Retries up to 3 times with exponential backoff (2s, 4s, 8s) for:
    - socket.error (including Errno 35: Resource temporarily unavailable)
    - ConnectionError
    - TimeoutError
    - OSError
    """
    system_prompt = get_category_specific_prompt(resume_text, jd_text, category_slug)
    
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
    except (socket.error, ConnectionError, TimeoutError, OSError) as e:
        # Network/socket errors - provide user-friendly message
        error_msg = str(e)
        if "Resource temporarily unavailable" in error_msg or "Errno 35" in error_msg:
            logger.error(f"Network resource unavailable: {error_msg}")
            return {
                "error": "Our AI service is temporarily busy. Please try again in a moment.",
                "error_type": "network_busy",
                "retry_suggested": True
            }
        logger.error(f"Network error starting interview: {error_msg}")
        return {
            "error": "Unable to connect to AI service. Please check your connection and try again.",
            "error_type": "network_error",
            "retry_suggested": True
        }
    except Exception as e:
        logger.error(f"Unexpected error starting interview: {str(e)}")
        return {"error": str(e)}

@retry(
    retry=retry_if_exception_type((socket.error, ConnectionError, TimeoutError, OSError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING)
)
def chat_interview(resume_text: str, jd_text: str, message_history: list, category_slug: str = "generic") -> dict:
    """
    Continue an interview conversation with retry logic for network errors.
    
    Retries up to 3 times with exponential backoff (2s, 4s, 8s) for network errors.
    """
    system_prompt = get_category_specific_prompt(resume_text, jd_text, category_slug)
    
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
    except (socket.error, ConnectionError, TimeoutError, OSError) as e:
        # Network/socket errors - provide user-friendly message
        error_msg = str(e)
        if "Resource temporarily unavailable" in error_msg or "Errno 35" in error_msg:
            logger.error(f"Network resource unavailable in chat: {error_msg}")
            return {
                "error": "Our AI service is temporarily busy. Please try again in a moment.",
                "error_type": "network_busy",
                "retry_suggested": True
            }
        logger.error(f"Network error in interview chat: {error_msg}")
        return {
            "error": "Unable to connect to AI service. Please check your connection and try again.",
            "error_type": "network_error",
            "retry_suggested": True
        }
    except Exception as e:
        logger.error(f"Unexpected error in interview chat: {str(e)}")
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
