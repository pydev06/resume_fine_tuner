import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelineItem } from '../../types/interview';

interface PerformanceChartProps {
    timeline: TimelineItem[];
}

export default function PerformanceChart({ timeline }: PerformanceChartProps) {
    const chartData = timeline.map((item) => ({
        question: `Q${item.question_number}`,
        quality: Math.round(item.quality_score),
        confidence: Math.round(item.confidence),
        clarity: Math.round(item.clarity)
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-white/20 rounded-lg p-3">
                    <p className="text-white font-semibold mb-2">{payload[0].payload.question}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Score Progression Line Chart */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Score Progression</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="question"
                            stroke="rgba(255,255,255,0.6)"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.6)"
                            style={{ fontSize: '12px' }}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ color: 'white' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="quality"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            name="Quality"
                            dot={{ fill: '#8b5cf6', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="confidence"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Confidence"
                            dot={{ fill: '#10b981', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="clarity"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            name="Clarity"
                            dot={{ fill: '#f59e0b', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Comparison Bar Chart */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Performance Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="question"
                            stroke="rgba(255,255,255,0.6)"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.6)"
                            style={{ fontSize: '12px' }}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'white' }} />
                        <Bar dataKey="quality" fill="#8b5cf6" name="Quality" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="confidence" fill="#10b981" name="Confidence" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="clarity" fill="#f59e0b" name="Clarity" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                        {Math.round(chartData.reduce((acc, item) => acc + item.quality, 0) / chartData.length)}
                    </div>
                    <div className="text-white font-semibold">Avg Quality</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-6 border border-emerald-500/30">
                    <div className="text-3xl mb-2">💪</div>
                    <div className="text-2xl font-bold text-emerald-400 mb-1">
                        {Math.round(chartData.reduce((acc, item) => acc + item.confidence, 0) / chartData.length)}
                    </div>
                    <div className="text-white font-semibold">Avg Confidence</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl p-6 border border-amber-500/30">
                    <div className="text-3xl mb-2">✨</div>
                    <div className="text-2xl font-bold text-amber-400 mb-1">
                        {Math.round(chartData.reduce((acc, item) => acc + item.clarity, 0) / chartData.length)}
                    </div>
                    <div className="text-white font-semibold">Avg Clarity</div>
                </div>
            </div>
        </div>
    );
}
