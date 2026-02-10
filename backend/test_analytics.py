"""
Test script for Interview Analytics API
Tests the complete analysis pipeline with a real interview session.
"""

import requests
import json
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000/api"
# You'll need to get a valid session token from your frontend
AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"  # Replace with actual token

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}


def get_interview_sessions():
    """Fetch available interview sessions"""
    print("📋 Fetching interview sessions...")
    # This would need to be implemented in your API
    # For now, you'll need to get a session_id from Supabase directly
    pass


def trigger_analysis(session_id: str):
    """Trigger analysis for an interview session"""
    print(f"\n🔬 Triggering analysis for session: {session_id}")
    
    url = f"{BASE_URL}/interview/{session_id}/analyze"
    
    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print("✅ Analysis triggered successfully!")
        print(json.dumps(result, indent=2))
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None


def get_analytics(session_id: str):
    """Get analytics results"""
    print(f"\n📊 Fetching analytics for session: {session_id}")
    
    url = f"{BASE_URL}/interview/{session_id}/analytics"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print("✅ Analytics retrieved!")
        
        # Display key metrics
        analytics = result.get('analytics', {})
        print("\n📈 Overall Metrics:")
        print(f"  • Overall Quality Score: {analytics.get('overall_quality_score', 0)}/100")
        print(f"  • Confidence Score: {analytics.get('overall_confidence_score', 0)}/100")
        print(f"  • Clarity Score: {analytics.get('overall_clarity_score', 0)}/100")
        print(f"  • Total Questions: {analytics.get('total_questions', 0)}")
        print(f"  • Strong Answers: {analytics.get('strong_answers_count', 0)}")
        print(f"  • Weak Answers: {analytics.get('weak_answers_count', 0)}")
        print(f"  • Filler Words: {analytics.get('filler_word_count', 0)}")
        print(f"  • Words per Minute: {analytics.get('words_per_minute', 0)}")
        
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None


def get_replay_data(session_id: str):
    """Get replay timeline data"""
    print(f"\n🎬 Fetching replay data for session: {session_id}")
    
    url = f"{BASE_URL}/interview/{session_id}/replay"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print("✅ Replay data retrieved!")
        
        timeline = result.get('timeline', [])
        print(f"\n📝 Timeline ({len(timeline)} questions):")
        
        for item in timeline[:3]:  # Show first 3
            print(f"\n  Q{item['question_number']}: {item['question'][:60]}...")
            print(f"    Quality: {item['quality_score']}/100")
            print(f"    Performance: {item['performance_category']}")
        
        if len(timeline) > 3:
            print(f"\n  ... and {len(timeline) - 3} more questions")
        
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None


def get_question_details(session_id: str, question_number: int):
    """Get detailed analytics for a specific question"""
    print(f"\n🔍 Fetching details for question {question_number}...")
    
    url = f"{BASE_URL}/interview/{session_id}/question/{question_number}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        qa = result.get('question_analytics', {})
        
        print("✅ Question details retrieved!")
        print(f"\n📋 Question {question_number}:")
        print(f"  Question: {qa.get('question_text', '')[:80]}...")
        print(f"  Answer: {qa.get('user_answer', '')[:80]}...")
        print(f"\n  Scores:")
        print(f"    • Quality: {qa.get('answer_quality_score', 0)}/100")
        print(f"    • Relevance: {qa.get('relevance_score', 0)}/100")
        print(f"    • Completeness: {qa.get('completeness_score', 0)}/100")
        print(f"    • Confidence: {qa.get('confidence_level', 0)}/100")
        print(f"    • Clarity: {qa.get('clarity_score', 0)}/100")
        
        print(f"\n  💪 Strengths:")
        for strength in qa.get('strengths', [])[:3]:
            print(f"    • {strength}")
        
        print(f"\n  ⚠️  Weaknesses:")
        for weakness in qa.get('weaknesses', [])[:3]:
            print(f"    • {weakness}")
        
        print(f"\n  💡 Improvements:")
        for imp in qa.get('improvement_suggestions', [])[:3]:
            print(f"    • [{imp.get('priority', 'medium')}] {imp.get('suggestion', '')}")
        
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None


def get_improvements(session_id: str):
    """Get aggregated improvement suggestions"""
    print(f"\n💡 Fetching improvement suggestions...")
    
    url = f"{BASE_URL}/interview/{session_id}/improvements"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print("✅ Improvements retrieved!")
        
        print(f"\n🎯 Priority Improvements:")
        for imp in result.get('priority_improvements', [])[:5]:
            print(f"  • {imp.get('suggestion', '')}")
        
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None


def run_complete_test(session_id: str):
    """Run complete test suite"""
    print("=" * 60)
    print("🧪 AI Interview Analytics - Complete Test")
    print("=" * 60)
    
    # Step 1: Trigger analysis
    analysis_result = trigger_analysis(session_id)
    if not analysis_result:
        print("\n❌ Analysis failed. Stopping test.")
        return
    
    # Step 2: Get analytics
    analytics = get_analytics(session_id)
    
    # Step 3: Get replay data
    replay = get_replay_data(session_id)
    
    # Step 4: Get question details (first question)
    if replay and replay.get('timeline'):
        get_question_details(session_id, 1)
    
    # Step 5: Get improvements
    get_improvements(session_id)
    
    print("\n" + "=" * 60)
    print("✅ Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    # Replace with an actual session ID from your database
    SESSION_ID = "YOUR_SESSION_ID_HERE"
    
    print("""
    ⚠️  Before running this script:
    1. Get a valid session_id from Supabase (interview_sessions table)
    2. Get your auth token from the frontend (localStorage or cookies)
    3. Update SESSION_ID and AUTH_TOKEN in this script
    4. Make sure the backend server is running (uvicorn app.main:app --reload)
    """)
    
    # Uncomment to run:
    # run_complete_test(SESSION_ID)
