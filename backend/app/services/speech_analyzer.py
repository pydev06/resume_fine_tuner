"""
Speech Analysis Service
Analyzes speech patterns, filler words, pace, and pauses from interview transcripts.
"""

import re
from typing import Dict, List, Tuple
from collections import Counter

# Common filler words to detect
FILLER_WORDS = [
    'um', 'uh', 'like', 'you know', 'i mean', 'sort of', 'kind of',
    'actually', 'basically', 'literally', 'honestly', 'right',
    'so', 'well', 'yeah', 'okay', 'ok'
]

# Pause indicators (multiple spaces, ellipsis, etc.)
PAUSE_PATTERNS = [
    r'\.{3,}',  # Ellipsis (...)
    r'\s{2,}',  # Multiple spaces
    r'\[pause\]',  # Explicit pause markers
]


class SpeechAnalyzer:
    """Analyzes speech patterns from interview transcripts"""
    
    def __init__(self):
        self.filler_words = FILLER_WORDS
        self.pause_patterns = PAUSE_PATTERNS
    
    def analyze_transcript(self, transcript: str, duration_seconds: int = None) -> Dict:
        """
        Analyze complete speech patterns from transcript
        
        Args:
            transcript: The text transcript of speech
            duration_seconds: Duration of speech in seconds (optional)
        
        Returns:
            Dictionary with speech metrics
        """
        if not transcript or not transcript.strip():
            return self._empty_analysis()
        
        # Clean and normalize text
        text = self._normalize_text(transcript)
        
        # Calculate metrics
        word_count = self._count_words(text)
        filler_analysis = self.detect_filler_words(text)
        pause_analysis = self.detect_pauses(text)
        
        # Calculate speaking pace if duration provided
        wpm = 0
        if duration_seconds and duration_seconds > 0:
            wpm = self.calculate_speaking_pace(word_count, duration_seconds)
        
        return {
            'total_words': word_count,
            'words_per_minute': round(wpm, 2),
            'filler_word_count': filler_analysis['total_count'],
            'filler_words_detail': filler_analysis['details'],
            'filler_word_percentage': round(filler_analysis['percentage'], 2),
            'pause_count': pause_analysis['count'],
            'average_pause_duration': pause_analysis['average_duration'],
            'speech_fluency_score': self._calculate_fluency_score(
                filler_analysis['percentage'],
                pause_analysis['count'],
                word_count
            )
        }
    
    def detect_filler_words(self, text: str) -> Dict:
        """
        Detect and count filler words in text
        
        Args:
            text: The text to analyze
        
        Returns:
            Dictionary with filler word analysis
        """
        text_lower = text.lower()
        filler_counts = {}
        total_count = 0
        
        # Count each filler word
        for filler in self.filler_words:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(filler) + r'\b'
            matches = re.findall(pattern, text_lower)
            count = len(matches)
            
            if count > 0:
                filler_counts[filler] = count
                total_count += count
        
        # Calculate percentage
        total_words = self._count_words(text)
        percentage = (total_count / total_words * 100) if total_words > 0 else 0
        
        return {
            'total_count': total_count,
            'details': filler_counts,
            'percentage': percentage
        }
    
    def calculate_speaking_pace(self, word_count: int, duration_seconds: int) -> float:
        """
        Calculate words per minute
        
        Args:
            word_count: Number of words spoken
            duration_seconds: Duration in seconds
        
        Returns:
            Words per minute (WPM)
        """
        if duration_seconds <= 0:
            return 0
        
        minutes = duration_seconds / 60
        wpm = word_count / minutes
        return round(wpm, 2)
    
    def detect_pauses(self, text: str) -> Dict:
        """
        Detect pauses in speech from text patterns
        
        Args:
            text: The text to analyze
        
        Returns:
            Dictionary with pause analysis
        """
        pause_count = 0
        
        # Detect pauses using patterns
        for pattern in self.pause_patterns:
            matches = re.findall(pattern, text)
            pause_count += len(matches)
        
        # Estimate average pause duration (simplified)
        # In a real implementation, this would come from audio analysis
        average_duration = 0.5 if pause_count > 0 else 0
        
        return {
            'count': pause_count,
            'average_duration': average_duration
        }
    
    def evaluate_speaking_pace(self, wpm: float) -> Dict:
        """
        Evaluate if speaking pace is optimal
        
        Optimal speaking pace for interviews: 120-150 WPM
        
        Args:
            wpm: Words per minute
        
        Returns:
            Dictionary with pace evaluation
        """
        if wpm == 0:
            return {
                'rating': 'unknown',
                'feedback': 'Unable to calculate speaking pace',
                'score': 0
            }
        
        if wpm < 100:
            return {
                'rating': 'too_slow',
                'feedback': 'Speaking pace is too slow. Try to be more concise and confident.',
                'score': 60
            }
        elif wpm < 120:
            return {
                'rating': 'slightly_slow',
                'feedback': 'Speaking pace is slightly slow. You can speak a bit faster.',
                'score': 75
            }
        elif wpm <= 150:
            return {
                'rating': 'optimal',
                'feedback': 'Excellent speaking pace! Clear and easy to follow.',
                'score': 100
            }
        elif wpm <= 180:
            return {
                'rating': 'slightly_fast',
                'feedback': 'Speaking pace is slightly fast. Try to slow down a bit.',
                'score': 75
            }
        else:
            return {
                'rating': 'too_fast',
                'feedback': 'Speaking pace is too fast. Slow down to ensure clarity.',
                'score': 60
            }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for analysis"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _count_words(self, text: str) -> int:
        """Count words in text"""
        if not text:
            return 0
        words = text.split()
        return len(words)
    
    def _calculate_fluency_score(self, filler_percentage: float, pause_count: int, word_count: int) -> float:
        """
        Calculate overall speech fluency score (0-100)
        
        Factors:
        - Filler word percentage (lower is better)
        - Pause frequency (moderate is good)
        - Overall coherence
        """
        # Start with perfect score
        score = 100.0
        
        # Penalize for filler words
        # 0-2% filler: no penalty
        # 2-5% filler: -10 points
        # 5-10% filler: -25 points
        # 10%+ filler: -40 points
        if filler_percentage > 10:
            score -= 40
        elif filler_percentage > 5:
            score -= 25
        elif filler_percentage > 2:
            score -= 10
        
        # Penalize for excessive pauses
        # Normalize pause count by word count
        pause_ratio = (pause_count / word_count * 100) if word_count > 0 else 0
        if pause_ratio > 5:
            score -= 20
        elif pause_ratio > 3:
            score -= 10
        
        return max(0, min(100, score))
    
    def _empty_analysis(self) -> Dict:
        """Return empty analysis structure"""
        return {
            'total_words': 0,
            'words_per_minute': 0,
            'filler_word_count': 0,
            'filler_words_detail': {},
            'filler_word_percentage': 0,
            'pause_count': 0,
            'average_pause_duration': 0,
            'speech_fluency_score': 0
        }


# Example usage
if __name__ == "__main__":
    analyzer = SpeechAnalyzer()
    
    sample_text = """
    Um, well, I think that, you know, my experience in software development, 
    like, really prepared me for this role. I mean, I've worked on, uh, 
    several projects where I had to, sort of, lead a team and basically 
    deliver results under pressure.
    """
    
    result = analyzer.analyze_transcript(sample_text, duration_seconds=30)
    print("Speech Analysis Results:")
    print(f"Total words: {result['total_words']}")
    print(f"WPM: {result['words_per_minute']}")
    print(f"Filler words: {result['filler_word_count']} ({result['filler_word_percentage']}%)")
    print(f"Fluency score: {result['speech_fluency_score']}/100")
