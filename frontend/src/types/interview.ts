// TypeScript interfaces for Interview Analytics

export interface InterviewAnalytics {
    analytics_id: string;
    session_id: string;
    user_id: string;
    overall_confidence_score: number;
    overall_clarity_score: number;
    overall_quality_score: number;
    total_questions: number;
    strong_answers_count: number;
    weak_answers_count: number;
    average_words_per_minute: number;
    total_filler_words: number;
    average_fluency_score: number;
    analysis_status: string;
    created_at: string;
}

export interface QuestionAnalytics {
    id: string;
    session_id: string;
    analytics_id: string;
    question_number: number;
    question_text: string;
    user_answer: string;
    ideal_answer: string | null;
    answer_quality_score: number;
    relevance_score: number;
    completeness_score: number;
    structure_score: number;
    performance_category: 'strong' | 'average' | 'weak';
    confidence_level: number;
    clarity_score: number;
    sentiment_score: number;
    words_per_minute: number;
    filler_words_count: number;
    speech_fluency_score: number;
    keywords_used: string[];
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions: ImprovementSuggestion[];
}

export interface ImprovementSuggestion {
    type: string;
    suggestion: string;
    priority?: 'high' | 'medium' | 'low';
}

export interface TimelineItem {
    question_number: number;
    question: string;
    answer: string;
    quality_score: number;
    performance_category: 'strong' | 'average' | 'weak';
    confidence: number;
    clarity: number;
}

export interface ReplayData {
    session_id: string;
    overall_analytics: InterviewAnalytics;
    timeline: TimelineItem[];
    question_count: number;
}

export interface ImprovementsData {
    session_id: string;
    total_questions: number;
    weak_answers_count: number;
    improvement_categories: Record<string, ImprovementSuggestion[]>;
    common_weaknesses: string[];
    priority_improvements: ImprovementSuggestion[];
}
