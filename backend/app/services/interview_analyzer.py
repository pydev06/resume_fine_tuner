"""
Interview Analyzer Pipeline
Orchestrates the complete analysis of interview sessions.
"""

import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from uuid import UUID

from app.services.speech_analyzer import SpeechAnalyzer
from app.services.sentiment_analyzer import SentimentAnalyzer
from app.services.answer_evaluator import AnswerEvaluator
from app.services.supabase_service import supabase


class InterviewAnalyzer:
    """Main pipeline for analyzing completed interviews"""
    
    def __init__(self):
        self.speech_analyzer = SpeechAnalyzer()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.answer_evaluator = AnswerEvaluator()
    
    async def analyze_interview(self, session_id: str, user_id: str) -> Dict:
        """
        Complete analysis pipeline for an interview session
        
        Args:
            session_id: UUID of the interview session
            user_id: UUID of the user
        
        Returns:
            Dictionary with analysis results
        """
        try:
            # 1. Fetch interview session data
            session_data = await self._fetch_session_data(session_id)
            if not session_data:
                raise ValueError(f"Session {session_id} not found")
            
            # 2. Create analytics record
            analytics_id = await self._create_analytics_record(session_id, user_id)
            
            # 3. Fetch all Q&A pairs from messages
            qa_pairs = await self._fetch_qa_pairs(session_id)
            
            if not qa_pairs:
                raise ValueError(f"No Q&A pairs found for session {session_id}")
            
            # 4. Analyze each question-answer pair
            question_analytics = []
            overall_metrics = {
                'total_words': 0,
                'total_filler_words': 0,
                'confidence_scores': [],
                'clarity_scores': [],
                'quality_scores': [],
                'strong_count': 0,
                'weak_count': 0
            }
            
            for idx, qa in enumerate(qa_pairs, 1):
                question_analysis = await self._analyze_question(
                    session_id=session_id,
                    analytics_id=analytics_id,
                    question_number=idx,
                    question=qa['question'],
                    answer=qa['answer'],
                    context=session_data
                )
                
                question_analytics.append(question_analysis)
                
                # Aggregate metrics
                overall_metrics['total_words'] += question_analysis.get('words_count', 0)
                overall_metrics['total_filler_words'] += question_analysis.get('filler_words_count', 0)
                overall_metrics['confidence_scores'].append(question_analysis.get('confidence_level', 0))
                overall_metrics['clarity_scores'].append(question_analysis.get('clarity_score', 0))
                overall_metrics['quality_scores'].append(question_analysis.get('answer_quality_score', 0))
                
                if question_analysis.get('performance_category') == 'strong':
                    overall_metrics['strong_count'] += 1
                elif question_analysis.get('performance_category') == 'weak':
                    overall_metrics['weak_count'] += 1
            
            # 5. Calculate overall metrics
            overall_analytics = self._calculate_overall_metrics(overall_metrics, len(qa_pairs))
            
            # 6. Update analytics record with overall metrics
            await self._update_analytics_record(analytics_id, overall_analytics)
            
            # 7. Store question analytics
            await self._store_question_analytics(question_analytics)
            
            return {
                'analytics_id': analytics_id,
                'session_id': session_id,
                'overall_analytics': overall_analytics,
                'question_count': len(qa_pairs),
                'status': 'completed'
            }
        
        except Exception as e:
            # Mark analysis as failed
            await self._mark_analysis_failed(session_id, str(e))
            raise e
    
    async def _analyze_question(
        self,
        session_id: str,
        analytics_id: str,
        question_number: int,
        question: str,
        answer: str,
        context: Dict
    ) -> Dict:
        """Analyze a single question-answer pair"""
        
        # Speech analysis
        speech_metrics = self.speech_analyzer.analyze_transcript(answer)
        
        # Sentiment analysis
        sentiment_metrics = await self.sentiment_analyzer.analyze_answer(question, answer)
        
        # Answer evaluation
        evaluation = await self.answer_evaluator.evaluate_answer(question, answer, context)
        
        # Generate ideal answer
        ideal_answer = await self.answer_evaluator.generate_ideal_answer(question, context)
        
        # Generate improvements
        improvements = await self.answer_evaluator.generate_improvements(
            question, answer, ideal_answer, evaluation
        )
        
        # Combine all metrics
        return {
            'session_id': session_id,
            'analytics_id': analytics_id,
            'question_number': question_number,
            'question_text': question,
            'user_answer': answer,
            'ideal_answer': ideal_answer,
            
            # Scores
            'answer_quality_score': evaluation['answer_quality_score'],
            'relevance_score': evaluation['relevance_score'],
            'completeness_score': evaluation['completeness_score'],
            'structure_score': evaluation['structure_score'],
            'confidence_level': sentiment_metrics['confidence_level'],
            'clarity_score': sentiment_metrics['clarity_score'],
            'sentiment': sentiment_metrics['sentiment'],
            'sentiment_score': sentiment_metrics['sentiment_score'],
            
            # Speech metrics
            'words_count': speech_metrics['total_words'],
            'filler_words_count': speech_metrics['filler_word_count'],
            'speaking_pace': speech_metrics['words_per_minute'],
            
            # Analysis details
            'performance_category': evaluation['performance_category'],
            'improvement_suggestions': improvements,
            'keywords_used': evaluation['keywords_used'],
            'keywords_missing': [],  # TODO: Implement
            'strengths': evaluation['strengths'],
            'weaknesses': evaluation['weaknesses']
        }
    
    def _calculate_overall_metrics(self, metrics: Dict, question_count: int) -> Dict:
        """Calculate overall interview metrics from aggregated data"""
        
        avg_confidence = sum(metrics['confidence_scores']) / len(metrics['confidence_scores']) if metrics['confidence_scores'] else 0
        avg_clarity = sum(metrics['clarity_scores']) / len(metrics['clarity_scores']) if metrics['clarity_scores'] else 0
        avg_quality = sum(metrics['quality_scores']) / len(metrics['quality_scores']) if metrics['quality_scores'] else 0
        
        # Calculate filler word percentage
        filler_percentage = (metrics['total_filler_words'] / metrics['total_words'] * 100) if metrics['total_words'] > 0 else 0
        
        # Identify improvement areas
        improvement_areas = []
        if avg_confidence < 70:
            improvement_areas.append('confidence')
        if avg_clarity < 70:
            improvement_areas.append('clarity')
        if avg_quality < 70:
            improvement_areas.append('answer_quality')
        if filler_percentage > 5:
            improvement_areas.append('speech_fluency')
        
        return {
            'total_questions': question_count,
            'overall_confidence_score': round(avg_confidence, 2),
            'overall_clarity_score': round(avg_clarity, 2),
            'overall_quality_score': round(avg_quality, 2),
            'total_words': metrics['total_words'],
            'filler_word_count': metrics['total_filler_words'],
            'strong_answers_count': metrics['strong_count'],
            'weak_answers_count': metrics['weak_count'],
            'improvement_areas': improvement_areas,
            'analysis_status': 'completed',
            'analysis_completed_at': datetime.utcnow().isoformat()
        }
    
    async def _fetch_session_data(self, session_id: str) -> Optional[Dict]:
        """Fetch interview session data"""
        try:
            response = supabase.table('interview_sessions').select('*').eq('id', session_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error fetching session data: {e}")
            return None
    
    async def _fetch_qa_pairs(self, session_id: str) -> List[Dict]:
        """Fetch question-answer pairs from interview messages"""
        try:
            # Fetch session with messages
            response = supabase.table('interview_sessions')\
                .select('messages')\
                .eq('id', session_id)\
                .execute()
            
            if not response.data or not response.data[0].get('messages'):
                return []
            
            messages = response.data[0]['messages']
            
            # Group messages into Q&A pairs
            qa_pairs = []
            current_question = None
            
            for msg in messages:
                if msg.get('role') == 'assistant':
                    current_question = msg.get('content')
                elif msg.get('role') == 'user' and current_question:
                    qa_pairs.append({
                        'question': current_question,
                        'answer': msg.get('content')
                    })
                    current_question = None
            
            return qa_pairs
        
        except Exception as e:
            print(f"Error fetching Q&A pairs: {e}")
            return []
    
    async def _create_analytics_record(self, session_id: str, user_id: str) -> str:
        """Create initial analytics record"""
        try:
            response = supabase.table('interview_analytics').insert({
                'session_id': session_id,
                'user_id': user_id,
                'analysis_status': 'processing',
                'analysis_started_at': datetime.utcnow().isoformat()
            }).execute()
            
            return response.data[0]['id']
        except Exception as e:
            print(f"Error creating analytics record: {e}")
            raise e
    
    async def _update_analytics_record(self, analytics_id: str, metrics: Dict) -> None:
        """Update analytics record with overall metrics"""
        try:
            supabase.table('interview_analytics').update(metrics).eq('id', analytics_id).execute()
        except Exception as e:
            print(f"Error updating analytics record: {e}")
    
    async def _store_question_analytics(self, question_analytics: List[Dict]) -> None:
        """Store question-level analytics"""
        try:
            if question_analytics:
                supabase.table('question_analytics').insert(question_analytics).execute()
        except Exception as e:
            print(f"Error storing question analytics: {e}")
    
    async def _mark_analysis_failed(self, session_id: str, error: str) -> None:
        """Mark analysis as failed"""
        try:
            supabase.table('interview_analytics')\
                .update({
                    'analysis_status': 'failed',
                    'analysis_completed_at': datetime.utcnow().isoformat()
                })\
                .eq('session_id', session_id)\
                .execute()
        except Exception as e:
            print(f"Error marking analysis as failed: {e}")


# Example usage
if __name__ == "__main__":
    import asyncio
    
    analyzer = InterviewAnalyzer()
    
    async def test():
        result = await analyzer.analyze_interview(
            session_id="test-session-id",
            user_id="test-user-id"
        )
        print("Analysis complete:")
        print(f"Overall quality: {result['overall_analytics']['overall_quality_score']}/100")
    
    # asyncio.run(test())
