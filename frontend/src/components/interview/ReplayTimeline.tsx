import type { TimelineItem } from '../../types/interview';
import { useState } from 'react';
import AnswerCard from './AnswerCard';

interface ReplayTimelineProps {
    timeline: TimelineItem[];
    selectedQuestion: number;
    onSelectQuestion: (questionNumber: number) => void;
}

export default function ReplayTimeline({ timeline, selectedQuestion, onSelectQuestion }: ReplayTimelineProps) {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(selectedQuestion);

    const getPerformanceColor = (category: string) => {
        switch (category) {
            case 'strong':
                return 'bg-emerald-500';
            case 'weak':
                return 'bg-red-500';
            default:
                return 'bg-amber-500';
        }
    };


    return (
        <div className="space-y-6">
            {/* Timeline Header */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">Interview Timeline</h2>

                {/* Timeline Visualization */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4">
                    {timeline.map((item, index) => (
                        <div key={item.question_number} className="flex items-center">
                            <button
                                onClick={() => {
                                    onSelectQuestion(item.question_number);
                                    setExpandedQuestion(item.question_number);
                                }}
                                className={`relative group`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${selectedQuestion === item.question_number
                                        ? `${getPerformanceColor(item.performance_category)} text-white scale-110`
                                        : `bg-white/20 text-white hover:bg-white/30`
                                        }`}
                                >
                                    {item.question_number}
                                </div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                                        <div className="font-semibold mb-1">Q{item.question_number}</div>
                                        <div>Score: {Math.round(item.quality_score)}</div>
                                        <div className="capitalize">{item.performance_category}</div>
                                    </div>
                                </div>
                            </button>

                            {index < timeline.length - 1 && (
                                <div className="w-8 h-1 bg-white/20" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500" />
                        <span className="text-white/80 text-sm">Strong</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                        <span className="text-white/80 text-sm">Average</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                        <span className="text-white/80 text-sm">Weak</span>
                    </div>
                </div>
            </div>

            {/* Answer Cards */}
            <div className="space-y-4">
                {timeline.map((item) => (
                    <AnswerCard
                        key={item.question_number}
                        questionNumber={item.question_number}
                        question={item.question}
                        answer={item.answer}
                        qualityScore={item.quality_score}
                        performanceCategory={item.performance_category}
                        confidence={item.confidence}
                        clarity={item.clarity}
                        isExpanded={expandedQuestion === item.question_number}
                        onToggle={() => setExpandedQuestion(
                            expandedQuestion === item.question_number ? null : item.question_number
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
