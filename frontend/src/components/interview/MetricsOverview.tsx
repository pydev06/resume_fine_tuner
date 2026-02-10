import type { InterviewAnalytics } from '../../types/interview';

interface MetricsOverviewProps {
    analytics: InterviewAnalytics;
}

export default function MetricsOverview({ analytics }: MetricsOverviewProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'from-emerald-500/20 to-emerald-600/20';
        if (score >= 60) return 'from-amber-500/20 to-amber-600/20';
        return 'from-red-500/20 to-red-600/20';
    };

    const metrics = [
        {
            label: 'Overall Quality',
            value: analytics.overall_quality_score,
            icon: '🎯',
            description: 'Answer quality and relevance'
        },
        {
            label: 'Confidence',
            value: analytics.overall_confidence_score,
            icon: '💪',
            description: 'Speaking confidence level'
        },
        {
            label: 'Clarity',
            value: analytics.overall_clarity_score,
            icon: '✨',
            description: 'Communication clarity'
        },
        {
            label: 'Fluency',
            value: analytics.average_fluency_score,
            icon: '🗣️',
            description: 'Speech fluency score'
        }
    ];

    const stats = [
        {
            label: 'Total Questions',
            value: analytics.total_questions,
            icon: '❓'
        },
        {
            label: 'Strong Answers',
            value: analytics.strong_answers_count,
            icon: '✅',
            color: 'text-emerald-400'
        },
        {
            label: 'Weak Answers',
            value: analytics.weak_answers_count,
            icon: '⚠️',
            color: 'text-amber-400'
        },
        {
            label: 'Avg WPM',
            value: Math.round(analytics.average_words_per_minute),
            icon: '⚡'
        },
        {
            label: 'Filler Words',
            value: analytics.total_filler_words,
            icon: '🔇',
            color: analytics.total_filler_words > 10 ? 'text-amber-400' : 'text-emerald-400'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Main Score Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Overall Performance</h2>
                    <div className={`text-7xl font-bold ${getScoreColor(analytics.overall_quality_score)} mb-2`}>
                        {Math.round(analytics.overall_quality_score)}
                    </div>
                    <div className="text-white/60">out of 100</div>
                </div>

                {/* Score Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className={`bg-gradient-to-br ${getScoreBg(metric.value)} rounded-xl p-4 border border-white/10`}
                        >
                            <div className="text-3xl mb-2">{metric.icon}</div>
                            <div className={`text-3xl font-bold ${getScoreColor(metric.value)} mb-1`}>
                                {Math.round(metric.value)}
                            </div>
                            <div className="text-white font-semibold mb-1">{metric.label}</div>
                            <div className="text-white/50 text-sm">{metric.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10"
                    >
                        <div className="text-3xl mb-2">{stat.icon}</div>
                        <div className={`text-2xl font-bold ${stat.color || 'text-white'} mb-1`}>
                            {stat.value}
                        </div>
                        <div className="text-white/60 text-sm">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Performance Breakdown */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Performance Breakdown</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-white mb-1">
                            <span>Quality Score</span>
                            <span className="font-semibold">{Math.round(analytics.overall_quality_score)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000"
                                style={{ width: `${analytics.overall_quality_score}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-white mb-1">
                            <span>Confidence</span>
                            <span className="font-semibold">{Math.round(analytics.overall_confidence_score)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000"
                                style={{ width: `${analytics.overall_confidence_score}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-white mb-1">
                            <span>Clarity</span>
                            <span className="font-semibold">{Math.round(analytics.overall_clarity_score)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-1000"
                                style={{ width: `${analytics.overall_clarity_score}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
