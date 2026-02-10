"""
Interview Analytics API Router
Provides endpoints for interview replay and analysis features.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel

from app.services.interview_analyzer import InterviewAnalyzer
from app.services.supabase_service import supabase, get_user_credits, deduct_user_credits
from app.dependencies import get_current_user

router = APIRouter(prefix="/interview", tags=["interview_analytics"])

# Initialize analyzer
analyzer = InterviewAnalyzer()


# Request/Response Models
class AnalyzeRequest(BaseModel):
    session_id: str


class AnalyticsResponse(BaseModel):
    analytics_id: str
    session_id: str
    status: str
    overall_analytics: Optional[dict] = None


# Endpoints

@router.post("/{session_id}/analyze")
async def analyze_interview(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Trigger analysis for a completed interview session
    
    This endpoint starts the analysis pipeline which:
    1. Analyzes speech patterns (filler words, pace, fluency)
    2. Evaluates sentiment (confidence, clarity)
    3. Scores answer quality
    4. Generates ideal answers
    5. Provides improvement suggestions
    """
    try:
        user_id = current_user['id']
        
        # Check if session exists and belongs to user
        session = supabase.table('interview_sessions')\
            .select('*')\
            .eq('id', session_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not session.data:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        # Check if already analyzed (return cached - FREE)
        existing = supabase.table('interview_analytics')\
            .select('*')\
            .eq('session_id', session_id)\
            .execute()
        
        if existing.data and len(existing.data) > 0:
            return {
                "message": "Analysis already exists",
                "analytics_id": existing.data[0]['id'],
                "status": existing.data[0]['analysis_status']
            }
        
        # Check if user has credits
        credits = get_user_credits(user_id)
        if credits <= 0:
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits. Please top up to analyze this interview."
            )
        
        # Start analysis
        result = await analyzer.analyze_interview(session_id, user_id)
        
        # Deduct 1 credit for analysis
        deduct_user_credits(user_id, 1)
        
        return {
            "message": "Analysis completed successfully",
            "analytics_id": result['analytics_id'],
            "status": result['status'],
            "question_count": result['question_count']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/analytics")
async def get_interview_analytics(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete analytics for an interview session
    
    Returns:
    - Overall metrics (confidence, clarity, quality scores)
    - Speech metrics (WPM, filler words, fluency)
    - Performance breakdown
    - Improvement areas
    """
    try:
        user_id = current_user['id']
        
        # Fetch analytics using the view
        response = supabase.from_('interview_analytics_complete')\
            .select('*')\
            .eq('session_id', session_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Analytics not found. Run analysis first."
            )
        
        analytics = response.data[0]
        
        return {
            "analytics": analytics,
            "status": analytics['analysis_status']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/replay")
async def get_interview_replay_data(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get data for replay timeline
    
    Returns:
    - All questions and answers
    - Question-level analytics
    - Timeline markers
    - Performance heatmap data
    """
    try:
        user_id = current_user['id']
        
        # Fetch overall analytics
        analytics_response = supabase.table('interview_analytics')\
            .select('*')\
            .eq('session_id', session_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not analytics_response.data:
            raise HTTPException(
                status_code=404,
                detail="Analytics not found. Run analysis first."
            )
        
        analytics = analytics_response.data[0]
        
        # Fetch question-level analytics
        questions_response = supabase.table('question_analytics')\
            .select('*')\
            .eq('session_id', session_id)\
            .order('question_number')\
            .execute()
        
        questions = questions_response.data if questions_response.data else []
        
        # Build timeline data
        timeline = []
        for q in questions:
            timeline.append({
                'question_number': q['question_number'],
                'question': q['question_text'],
                'answer': q['user_answer'],
                'quality_score': q['answer_quality_score'],
                'performance_category': q['performance_category'],
                'confidence': q['confidence_level'],
                'clarity': q['clarity_score']
            })
        
        return {
            "session_id": session_id,
            "overall_analytics": analytics,
            "timeline": timeline,
            "question_count": len(questions)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/question/{question_number}")
async def get_question_analytics(
    session_id: str,
    question_number: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed analytics for a specific question
    
    Returns:
    - Question and answer text
    - Ideal answer
    - All scores (quality, relevance, completeness, structure)
    - Speech metrics
    - Sentiment analysis
    - Improvement suggestions
    - Strengths and weaknesses
    """
    try:
        user_id = current_user['id']
        
        # Verify session belongs to user
        session = supabase.table('interview_sessions')\
            .select('id')\
            .eq('id', session_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not session.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Fetch question analytics
        response = supabase.table('question_analytics')\
            .select('*')\
            .eq('session_id', session_id)\
            .eq('question_number', question_number)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Analytics for question {question_number} not found"
            )
        
        question_data = response.data[0]
        
        return {
            "question_analytics": question_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/improvements")
async def get_improvement_suggestions(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get aggregated improvement suggestions for the entire interview
    
    Returns:
    - Top improvement areas
    - Specific suggestions by category
    - Priority recommendations
    """
    try:
        user_id = current_user['id']
        
        # Fetch all question analytics
        response = supabase.table('question_analytics')\
            .select('improvement_suggestions, weaknesses, performance_category')\
            .eq('session_id', session_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No analytics found")
        
        # Aggregate improvements
        all_improvements = []
        all_weaknesses = []
        weak_count = 0
        
        for q in response.data:
            if q.get('improvement_suggestions'):
                all_improvements.extend(q['improvement_suggestions'])
            if q.get('weaknesses'):
                all_weaknesses.extend(q['weaknesses'])
            if q.get('performance_category') == 'weak':
                weak_count += 1
        
        # Categorize and prioritize
        improvement_categories = {}
        for imp in all_improvements:
            category = imp.get('type', 'general')
            if category not in improvement_categories:
                improvement_categories[category] = []
            improvement_categories[category].append(imp)
        
        return {
            "session_id": session_id,
            "total_questions": len(response.data),
            "weak_answers_count": weak_count,
            "improvement_categories": improvement_categories,
            "common_weaknesses": list(set(all_weaknesses)),
            "priority_improvements": [
                imp for imp in all_improvements if imp.get('priority') == 'high'
            ][:5]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
