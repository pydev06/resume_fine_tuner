interface AnswerCardProps {
    questionNumber: number;
    question: string;
    answer: string;
    qualityScore: number;
    performanceCategory: 'strong' | 'average' | 'weak';
    confidence: number;
    clarity: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export default function AnswerCard({
    questionNumber,
    question,
    answer,
    qualityScore,
    performanceCategory,
    confidence,
    clarity,
    isExpanded,
    onToggle
}: AnswerCardProps) {
    const getPerformanceColor = (category: string) => {
        switch (category) {
            case 'strong':
                return 'border-emerald-500 bg-emerald-500/10';
            case 'weak':
                return 'border-red-500 bg-red-500/10';
            default:
                return 'border-amber-500 bg-amber-500/10';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className={`bg-white/10 backdrop-blur-lg rounded-2xl border-2 ${getPerformanceColor(performanceCategory)} overflow-hidden transition-all`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full p-6 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-white/60 font-semibold">Question {questionNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${performanceCategory === 'strong' ? 'bg-emerald-500/20 text-emerald-400' :
                                    performanceCategory === 'weak' ? 'bg-red-500/20 text-red-400' :
                                        'bg-amber-500/20 text-amber-400'
                                }`}>
                                {performanceCategory}
                            </span>
                        </div>
                        <p className="text-white font-medium">{question}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className={`text-3xl font-bold ${getScoreColor(qualityScore)}`}>
                                {Math.round(qualityScore)}
                            </div>
                            <div className="text-white/60 text-sm">Score</div>
                        </div>
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-6 pb-6 space-y-4 animate-fadeIn">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className={`text-2xl font-bold ${getScoreColor(qualityScore)}`}>
                                {Math.round(qualityScore)}
                            </div>
                            <div className="text-white/60 text-sm">Quality</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className={`text-2xl font-bold ${getScoreColor(confidence)}`}>
                                {Math.round(confidence)}
                            </div>
                            <div className="text-white/60 text-sm">Confidence</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className={`text-2xl font-bold ${getScoreColor(clarity)}`}>
                                {Math.round(clarity)}
                            </div>
                            <div className="text-white/60 text-sm">Clarity</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-2xl font-bold text-white">
                                {answer.split(' ').length}
                            </div>
                            <div className="text-white/60 text-sm">Words</div>
                        </div>
                    </div>

                    {/* Answer Text */}
                    <div>
                        <h4 className="text-white font-semibold mb-2">Your Answer</h4>
                        <div className="bg-white/5 rounded-lg p-4 text-white/80 leading-relaxed">
                            {answer}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
