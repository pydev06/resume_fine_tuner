"""
Answer Evaluation Service
Evaluates interview answer quality and generates AI-powered improvements.
"""

import re
import json
from typing import Dict, List, Optional
import openai
from app.core.config import settings


class AnswerEvaluator:
    """Evaluates interview answers and generates improvements"""
    
    def __init__(self):
        # Initialize OpenAI client if needed
        pass
    
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        context: Dict
    ) -> Dict:
        """
        Comprehensive evaluation of interview answer
        
        Args:
            question: The interview question
            answer: The user's answer
            context: Additional context (domain, category, job_description, etc.)
        
        Returns:
            Dictionary with evaluation results
        """
        if not answer or not answer.strip():
            return self._empty_evaluation()
        
        # Calculate basic metrics
        word_count = len(answer.split())
        
        # Evaluate different aspects
        relevance_score = self._evaluate_relevance(question, answer)
        completeness_score = self._evaluate_completeness(answer, word_count)
        structure_score = self._evaluate_structure(answer)
        
        # Extract keywords
        keywords_used = self.extract_keywords(answer, context.get('domain', 'technology'))
        
        # Calculate overall quality score
        quality_score = (relevance_score + completeness_score + structure_score) / 3
        
        # Determine performance category
        performance_category = self._categorize_performance(quality_score)
        
        # Identify strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(
            answer, relevance_score, completeness_score, structure_score
        )
        
        return {
            'answer_quality_score': round(quality_score, 2),
            'relevance_score': round(relevance_score, 2),
            'completeness_score': round(completeness_score, 2),
            'structure_score': round(structure_score, 2),
            'performance_category': performance_category,
            'keywords_used': keywords_used,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'word_count': word_count
        }
    
    async def generate_ideal_answer(
        self,
        question: str,
        context: Dict
    ) -> str:
        """
        Generate AI ideal answer for comparison
        
        Args:
            question: The interview question
            context: Context including domain, category, job_description
        
        Returns:
            Ideal answer text
        """
        try:
            prompt = self._build_ideal_answer_prompt(question, context)
            
            # TODO: Implement actual OpenAI API call
            # For now, return a placeholder
            ideal_answer = f"""Based on the question "{question}", an ideal answer would demonstrate:
1. Relevant experience and specific examples
2. Clear structure using the STAR method
3. Quantifiable results and achievements
4. Alignment with the role requirements

[This is a placeholder - implement OpenAI integration for production]"""
            
            return ideal_answer
        
        except Exception as e:
            return f"Error generating ideal answer: {str(e)}"
    
    async def generate_improvements(
        self,
        question: str,
        user_answer: str,
        ideal_answer: str,
        evaluation: Dict
    ) -> List[Dict]:
        """
        Generate specific improvement suggestions
        
        Args:
            question: The interview question
            user_answer: User's answer
            ideal_answer: AI-generated ideal answer
            evaluation: Evaluation results
        
        Returns:
            List of improvement suggestions
        """
        improvements = []
        
        # Check answer length
        word_count = len(user_answer.split())
        if word_count < 50:
            improvements.append({
                'type': 'length',
                'priority': 'high',
                'suggestion': 'Your answer is too brief. Expand with specific examples and details.',
                'example': 'Add concrete examples from your experience to support your points.'
            })
        elif word_count > 200:
            improvements.append({
                'type': 'length',
                'priority': 'medium',
                'suggestion': 'Your answer is quite long. Focus on the most relevant points.',
                'example': 'Aim for 100-150 words to maintain interviewer engagement.'
            })
        
        # Check for STAR method
        if not self._uses_star_method(user_answer):
            improvements.append({
                'type': 'structure',
                'priority': 'high',
                'suggestion': 'Use the STAR method (Situation, Task, Action, Result) to structure your answer.',
                'example': 'Start with the situation, describe your task, explain your actions, and highlight the results.'
            })
        
        # Check for specific examples
        if not self._has_specific_examples(user_answer):
            improvements.append({
                'type': 'specificity',
                'priority': 'high',
                'suggestion': 'Include specific examples and quantifiable results.',
                'example': 'Instead of "I improved performance," say "I improved performance by 40% through optimization."'
            })
        
        # Check for weak language
        weak_phrases = self._find_weak_language(user_answer)
        if weak_phrases:
            improvements.append({
                'type': 'confidence',
                'priority': 'medium',
                'suggestion': f'Replace weak phrases: {", ".join(weak_phrases[:3])}',
                'example': 'Use confident language like "I successfully" instead of "I tried to"'
            })
        
        # Check relevance to question
        if evaluation.get('relevance_score', 0) < 70:
            improvements.append({
                'type': 'relevance',
                'priority': 'high',
                'suggestion': 'Ensure your answer directly addresses the question asked.',
                'example': 'Reread the question and align your response more closely with what\'s being asked.'
            })
        
        return improvements
    
    def extract_keywords(self, text: str, domain: str) -> List[str]:
        """
        Extract relevant keywords from answer based on domain
        
        Args:
            text: The answer text
            domain: Professional domain
        
        Returns:
            List of keywords found
        """
        # Domain-specific keywords
        domain_keywords = {
            'technology': [
                'software', 'development', 'programming', 'code', 'api',
                'database', 'cloud', 'agile', 'scrum', 'testing', 'deployment',
                'architecture', 'scalability', 'performance', 'security'
            ],
            'healthcare': [
                'patient', 'clinical', 'medical', 'diagnosis', 'treatment',
                'care', 'protocol', 'safety', 'compliance', 'hipaa'
            ],
            'construction': [
                'project', 'site', 'safety', 'budget', 'schedule', 'quality',
                'contractor', 'blueprint', 'building', 'materials', 'codes'
            ],
            'finance': [
                'financial', 'analysis', 'budget', 'revenue', 'profit',
                'investment', 'risk', 'compliance', 'audit', 'reporting'
            ]
        }
        
        keywords = domain_keywords.get(domain, domain_keywords['technology'])
        text_lower = text.lower()
        
        found_keywords = []
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                found_keywords.append(keyword)
        
        return found_keywords
    
    def _evaluate_relevance(self, question: str, answer: str) -> float:
        """Evaluate how relevant the answer is to the question"""
        # Extract key terms from question
        question_words = set(question.lower().split())
        answer_words = set(answer.lower().split())
        
        # Remove common words
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        question_words -= common_words
        answer_words -= common_words
        
        # Calculate overlap
        if not question_words:
            return 70.0
        
        overlap = len(question_words & answer_words)
        relevance = (overlap / len(question_words)) * 100
        
        # Ensure minimum score
        return max(50, min(100, relevance * 1.5))
    
    def _evaluate_completeness(self, answer: str, word_count: int) -> float:
        """Evaluate if answer is complete and thorough"""
        score = 70.0
        
        # Optimal length: 75-150 words
        if 75 <= word_count <= 150:
            score = 100
        elif 50 <= word_count < 75:
            score = 85
        elif 150 < word_count <= 200:
            score = 85
        elif word_count < 50:
            score = 60
        else:
            score = 70
        
        # Check for examples
        if self._has_specific_examples(answer):
            score = min(100, score + 10)
        
        return score
    
    def _evaluate_structure(self, answer: str) -> float:
        """Evaluate answer structure and organization"""
        score = 70.0
        
        # Check for STAR method
        if self._uses_star_method(answer):
            score += 20
        
        # Check for clear opening
        sentences = answer.split('.')
        if sentences and len(sentences[0].split()) > 5:
            score += 5
        
        # Check for conclusion
        if len(sentences) > 2 and any(word in sentences[-1].lower() for word in ['result', 'outcome', 'achieved', 'successfully']):
            score += 5
        
        return min(100, score)
    
    def _uses_star_method(self, answer: str) -> bool:
        """Check if answer uses STAR method"""
        answer_lower = answer.lower()
        
        star_indicators = {
            'situation': ['situation', 'context', 'background', 'when'],
            'task': ['task', 'challenge', 'problem', 'goal', 'objective'],
            'action': ['action', 'did', 'implemented', 'developed', 'created'],
            'result': ['result', 'outcome', 'achieved', 'improved', 'increased']
        }
        
        matches = 0
        for category, indicators in star_indicators.items():
            if any(indicator in answer_lower for indicator in indicators):
                matches += 1
        
        return matches >= 3
    
    def _has_specific_examples(self, answer: str) -> bool:
        """Check if answer includes specific examples"""
        answer_lower = answer.lower()
        
        example_indicators = [
            'for example', 'for instance', 'specifically', 'in one case',
            'when i', 'i worked on', 'in my role', 'at my previous',
            'increased by', 'reduced by', 'improved by', '%', 'percent'
        ]
        
        return any(indicator in answer_lower for indicator in example_indicators)
    
    def _find_weak_language(self, answer: str) -> List[str]:
        """Find weak or hesitant language"""
        weak_phrases = [
            'i think', 'i guess', 'maybe', 'perhaps', 'kind of',
            'sort of', 'i tried', 'i attempted', 'hopefully'
        ]
        
        answer_lower = answer.lower()
        found = []
        
        for phrase in weak_phrases:
            if phrase in answer_lower:
                found.append(phrase)
        
        return found
    
    def _categorize_performance(self, quality_score: float) -> str:
        """Categorize performance based on quality score"""
        if quality_score >= 80:
            return 'strong'
        elif quality_score >= 60:
            return 'average'
        else:
            return 'weak'
    
    def _identify_strengths_weaknesses(
        self,
        answer: str,
        relevance: float,
        completeness: float,
        structure: float
    ) -> tuple:
        """Identify specific strengths and weaknesses"""
        strengths = []
        weaknesses = []
        
        # Relevance
        if relevance >= 80:
            strengths.append("Answer directly addresses the question")
        elif relevance < 60:
            weaknesses.append("Answer could be more relevant to the question")
        
        # Completeness
        if completeness >= 80:
            strengths.append("Answer is thorough and well-detailed")
        elif completeness < 60:
            weaknesses.append("Answer needs more detail and examples")
        
        # Structure
        if structure >= 80:
            strengths.append("Well-structured response")
        elif structure < 60:
            weaknesses.append("Answer structure could be improved")
        
        # Specific examples
        if self._has_specific_examples(answer):
            strengths.append("Includes specific examples")
        else:
            weaknesses.append("Missing specific examples")
        
        # STAR method
        if self._uses_star_method(answer):
            strengths.append("Uses STAR method effectively")
        else:
            weaknesses.append("Could benefit from STAR method structure")
        
        return strengths, weaknesses
    
    def _build_ideal_answer_prompt(self, question: str, context: Dict) -> str:
        """Build prompt for generating ideal answer"""
        domain = context.get('domain', 'technology')
        category = context.get('category', 'general')
        jd = context.get('job_description', '')
        
        prompt = f"""Generate an ideal interview answer for this question.

Question: {question}

Context:
- Domain: {domain}
- Category: {category}
- Job Description: {jd[:200]}...

Requirements:
1. Use STAR method (Situation, Task, Action, Result)
2. Include specific, quantifiable results
3. Demonstrate relevant expertise
4. Keep it concise (100-150 words)
5. Use confident, professional language

Generate the ideal answer:"""
        
        return prompt
    
    def _empty_evaluation(self) -> Dict:
        """Return empty evaluation structure"""
        return {
            'answer_quality_score': 0,
            'relevance_score': 0,
            'completeness_score': 0,
            'structure_score': 0,
            'performance_category': 'weak',
            'keywords_used': [],
            'strengths': [],
            'weaknesses': [],
            'word_count': 0
        }


# Example usage
if __name__ == "__main__":
    import asyncio
    
    evaluator = AnswerEvaluator()
    
    sample_answer = """
    In my previous role as a software engineer, I faced a situation where our application
    was experiencing performance issues. My task was to identify and resolve the bottlenecks.
    I conducted a thorough analysis, implemented caching strategies, and optimized database
    queries. As a result, we achieved a 45% improvement in response time and reduced server
    costs by 30%.
    """
    
    async def test():
        evaluation = await evaluator.evaluate_answer(
            "Tell me about a time you improved system performance",
            sample_answer,
            {'domain': 'technology', 'category': 'backend'}
        )
        
        print("Answer Evaluation:")
        print(f"Quality Score: {evaluation['answer_quality_score']}/100")
        print(f"Performance: {evaluation['performance_category']}")
        print(f"Strengths: {evaluation['strengths']}")
        print(f"Weaknesses: {evaluation['weaknesses']}")
    
    asyncio.run(test())
