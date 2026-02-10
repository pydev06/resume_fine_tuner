"""
Sentiment Analysis Service
Analyzes confidence, clarity, and emotional tone of interview answers.
"""

import re
from typing import Dict, List
import openai
from app.core.config import settings

# Confidence indicators (positive)
CONFIDENCE_INDICATORS = [
    'definitely', 'certainly', 'absolutely', 'confident', 'sure',
    'experienced', 'skilled', 'proficient', 'expert', 'successfully',
    'achieved', 'accomplished', 'led', 'managed', 'delivered'
]

# Hesitation indicators (negative)
HESITATION_INDICATORS = [
    'maybe', 'perhaps', 'might', 'possibly', 'i think', 'i guess',
    'not sure', 'uncertain', 'i believe', 'kind of', 'sort of',
    'probably', 'i suppose'
]

# Clarity indicators (positive)
CLARITY_INDICATORS = [
    'specifically', 'for example', 'such as', 'in particular',
    'first', 'second', 'third', 'finally', 'in conclusion',
    'to summarize', 'the result was', 'this led to'
]

# Vague language (negative for clarity)
VAGUE_LANGUAGE = [
    'things', 'stuff', 'something', 'somehow', 'whatever',
    'and so on', 'etc', 'various', 'several', 'many'
]


class SentimentAnalyzer:
    """Analyzes sentiment, confidence, and clarity of interview answers"""
    
    def __init__(self):
        self.confidence_indicators = CONFIDENCE_INDICATORS
        self.hesitation_indicators = HESITATION_INDICATORS
        self.clarity_indicators = CLARITY_INDICATORS
        self.vague_language = VAGUE_LANGUAGE
    
    async def analyze_answer(self, question: str, answer: str) -> Dict:
        """
        Comprehensive analysis of answer sentiment and quality
        
        Args:
            question: The interview question
            answer: The user's answer
        
        Returns:
            Dictionary with sentiment analysis results
        """
        if not answer or not answer.strip():
            return self._empty_analysis()
        
        # Calculate individual scores
        confidence_score = self.calculate_confidence_score(answer)
        clarity_score = self.calculate_clarity_score(answer)
        
        # Determine overall sentiment
        sentiment_result = self._determine_sentiment(confidence_score, clarity_score)
        
        # Get AI-powered sentiment analysis (if available)
        ai_sentiment = await self._get_ai_sentiment(question, answer)
        
        return {
            'confidence_level': round(confidence_score, 2),
            'clarity_score': round(clarity_score, 2),
            'sentiment': sentiment_result['category'],
            'sentiment_score': round(sentiment_result['score'], 2),
            'confidence_indicators': self._find_indicators(answer, self.confidence_indicators),
            'hesitation_indicators': self._find_indicators(answer, self.hesitation_indicators),
            'clarity_indicators': self._find_indicators(answer, self.clarity_indicators),
            'vague_language': self._find_indicators(answer, self.vague_language),
            'ai_sentiment': ai_sentiment
        }
    
    def calculate_confidence_score(self, text: str) -> float:
        """
        Calculate confidence score based on language patterns
        
        Args:
            text: The text to analyze
        
        Returns:
            Confidence score (0-100)
        """
        text_lower = text.lower()
        
        # Count confidence indicators
        confidence_count = sum(
            1 for indicator in self.confidence_indicators
            if re.search(r'\b' + re.escape(indicator) + r'\b', text_lower)
        )
        
        # Count hesitation indicators
        hesitation_count = sum(
            1 for indicator in self.hesitation_indicators
            if re.search(r'\b' + re.escape(indicator) + r'\b', text_lower)
        )
        
        # Calculate base score
        word_count = len(text.split())
        if word_count == 0:
            return 50.0
        
        # Confidence ratio
        confidence_ratio = confidence_count / word_count * 100
        hesitation_ratio = hesitation_count / word_count * 100
        
        # Start with neutral score
        score = 70.0
        
        # Boost for confidence indicators
        score += min(confidence_ratio * 10, 20)
        
        # Penalty for hesitation
        score -= min(hesitation_ratio * 15, 30)
        
        # Check for strong opening
        if self._has_strong_opening(text):
            score += 10
        
        return max(0, min(100, score))
    
    def calculate_clarity_score(self, text: str) -> float:
        """
        Calculate clarity score based on structure and coherence
        
        Args:
            text: The text to analyze
        
        Returns:
            Clarity score (0-100)
        """
        text_lower = text.lower()
        
        # Count clarity indicators
        clarity_count = sum(
            1 for indicator in self.clarity_indicators
            if re.search(r'\b' + re.escape(indicator) + r'\b', text_lower)
        )
        
        # Count vague language
        vague_count = sum(
            1 for vague in self.vague_language
            if re.search(r'\b' + re.escape(vague) + r'\b', text_lower)
        )
        
        # Analyze structure
        sentences = self._split_sentences(text)
        word_count = len(text.split())
        
        if word_count == 0:
            return 50.0
        
        # Start with base score
        score = 70.0
        
        # Boost for clarity indicators
        score += min(clarity_count * 5, 15)
        
        # Penalty for vague language
        score -= min(vague_count * 3, 15)
        
        # Check sentence structure
        if len(sentences) > 0:
            avg_sentence_length = word_count / len(sentences)
            # Optimal sentence length: 15-25 words
            if 15 <= avg_sentence_length <= 25:
                score += 10
            elif avg_sentence_length > 35:
                score -= 10  # Too long, hard to follow
        
        # Check for examples
        if self._has_examples(text):
            score += 10
        
        return max(0, min(100, score))
    
    async def _get_ai_sentiment(self, question: str, answer: str) -> Dict:
        """
        Get AI-powered sentiment analysis using OpenAI
        
        Args:
            question: The interview question
            answer: The user's answer
        
        Returns:
            AI sentiment analysis results
        """
        try:
            prompt = f"""Analyze the sentiment and tone of this interview answer.

Question: {question}

Answer: {answer}

Provide a brief analysis (2-3 sentences) covering:
1. Overall tone (positive, neutral, negative)
2. Confidence level
3. Professionalism

Format as JSON with keys: tone, confidence_assessment, professionalism_note"""

            # Note: This is a placeholder - implement actual OpenAI call
            # response = await openai.ChatCompletion.acreate(...)
            
            # For now, return basic analysis
            return {
                'tone': 'neutral',
                'confidence_assessment': 'Moderate confidence detected',
                'professionalism_note': 'Professional tone maintained'
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'tone': 'unknown'
            }
    
    def _determine_sentiment(self, confidence: float, clarity: float) -> Dict:
        """
        Determine overall sentiment category based on scores
        
        Args:
            confidence: Confidence score (0-100)
            clarity: Clarity score (0-100)
        
        Returns:
            Sentiment category and score
        """
        # Calculate combined score
        combined = (confidence + clarity) / 2
        
        if combined >= 75:
            return {'category': 'positive', 'score': combined}
        elif combined >= 50:
            return {'category': 'neutral', 'score': combined}
        else:
            return {'category': 'negative', 'score': combined}
    
    def _has_strong_opening(self, text: str) -> bool:
        """Check if answer has a strong, confident opening"""
        first_sentence = self._split_sentences(text)[0] if self._split_sentences(text) else ""
        first_sentence_lower = first_sentence.lower()
        
        strong_openings = [
            'i have', 'i am', 'my experience', 'in my role',
            'i successfully', 'i led', 'i managed', 'i developed'
        ]
        
        return any(opening in first_sentence_lower for opening in strong_openings)
    
    def _has_examples(self, text: str) -> bool:
        """Check if answer includes specific examples"""
        text_lower = text.lower()
        example_phrases = [
            'for example', 'for instance', 'such as', 'specifically',
            'in one case', 'in a recent project', 'when i worked'
        ]
        
        return any(phrase in text_lower for phrase in example_phrases)
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _find_indicators(self, text: str, indicators: List[str]) -> List[str]:
        """Find which indicators are present in text"""
        text_lower = text.lower()
        found = []
        
        for indicator in indicators:
            if re.search(r'\b' + re.escape(indicator) + r'\b', text_lower):
                found.append(indicator)
        
        return found
    
    def _empty_analysis(self) -> Dict:
        """Return empty analysis structure"""
        return {
            'confidence_level': 0,
            'clarity_score': 0,
            'sentiment': 'neutral',
            'sentiment_score': 0,
            'confidence_indicators': [],
            'hesitation_indicators': [],
            'clarity_indicators': [],
            'vague_language': [],
            'ai_sentiment': {}
        }


# Example usage
if __name__ == "__main__":
    import asyncio
    
    analyzer = SentimentAnalyzer()
    
    sample_answer = """
    I have extensive experience in software development, specifically in Python and JavaScript.
    For example, in my recent project, I successfully led a team of 5 developers to deliver
    a complex web application. The result was a 40% improvement in system performance.
    I'm confident that my skills align well with this role.
    """
    
    async def test():
        result = await analyzer.analyze_answer(
            "Tell me about your experience",
            sample_answer
        )
        print("Sentiment Analysis Results:")
        print(f"Confidence: {result['confidence_level']}/100")
        print(f"Clarity: {result['clarity_score']}/100")
        print(f"Sentiment: {result['sentiment']}")
        print(f"Confidence indicators: {result['confidence_indicators']}")
    
    asyncio.run(test())
