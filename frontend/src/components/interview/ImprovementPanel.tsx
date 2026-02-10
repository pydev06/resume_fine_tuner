import { useState } from 'react';
import type { ImprovementsData } from '../../types/interview';

interface ImprovementPanelProps {
    improvements: ImprovementsData;
}

export default function ImprovementPanel({ improvements }: ImprovementPanelProps) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'low':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const categoryIcons: Record<string, string> = {
        speech: '🗣️',
        content: '📝',
        structure: '🏗️',
        confidence: '💪',
        clarity: '✨',
        general: '💡'
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {improvements.total_questions}
                    </div>
                    <div className="text-white/60">Total Questions</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                    <div className="text-3xl mb-2">⚠️</div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">
                        {improvements.weak_answers_count}
                    </div>
                    <div className="text-white/60">Needs Improvement</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                        {improvements.priority_improvements.length}
                    </div>
                    <div className="text-white/60">Priority Items</div>
                </div>
            </div>

            {/* Priority Improvements */}
            {improvements.priority_improvements.length > 0 && (
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🔥</span>
                        Priority Improvements
                    </h3>
                    <div className="space-y-3">
                        {improvements.priority_improvements.map((item, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold border capitalize ${getPriorityColor(item.priority)}`}>
                                                {item.priority || 'medium'}
                                            </span>
                                            <span className="text-white/60 text-sm capitalize">{item.type}</span>
                                        </div>
                                        <p className="text-white">{item.suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Common Weaknesses */}
            {improvements.common_weaknesses.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <h3 className="text-2xl font-bold text-white mb-4">Common Weaknesses</h3>
                    <div className="flex flex-wrap gap-2">
                        {improvements.common_weaknesses.map((weakness, index) => (
                            <span
                                key={index}
                                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm border border-amber-500/30"
                            >
                                {weakness}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Categorized Improvements */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4">Improvement Categories</h3>
                <div className="space-y-3">
                    {Object.entries(improvements.improvement_categories).map(([category, suggestions]) => (
                        <div key={category} className="border border-white/10 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{categoryIcons[category] || '💡'}</span>
                                    <span className="text-white font-semibold capitalize">{category}</span>
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                                        {suggestions.length}
                                    </span>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-white transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {expandedCategory === category && (
                                <div className="p-4 space-y-2 bg-white/5 animate-fadeIn">
                                    {suggestions.map((suggestion, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                            <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                {suggestion.priority && (
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border capitalize mb-2 ${getPriorityColor(suggestion.priority)}`}>
                                                        {suggestion.priority}
                                                    </span>
                                                )}
                                                <p className="text-white/90">{suggestion.suggestion}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
