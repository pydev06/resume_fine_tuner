import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Briefcase, Building2 } from 'lucide-react';

interface ChartData {
    date: string;
    score: number;
    ats: number;
    company?: string;
    title?: string;
}

interface AnalysisChartProps {
    data: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Force merge all properties from all payload items
        const rawData = payload.reduce((acc: any, p: any) => ({ ...acc, ...p.payload }), {});

        // Try multiple paths to find the metadata
        const title = rawData.title || rawData.jd_metadata?.title;
        const company = rawData.company || rawData.jd_metadata?.company;

        return (
            <div className="glass-card p-5 rounded-[2rem] border-white/10 backdrop-blur-3xl shadow-2xl min-w-[280px]">
                <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">{label}</p>
                    <div className="space-y-4 mb-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                <Briefcase className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Role</span>
                                <span className="text-xs font-black text-white tracking-tight truncate">
                                    {title || 'Target Job Role'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-purple-500/10 rounded-xl">
                                <Building2 className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Company</span>
                                <span className="text-[11px] font-bold text-slate-300 tracking-tight truncate">
                                    {company || 'General Analysis'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-12 bg-indigo-500/5 px-4 py-3 rounded-xl border border-indigo-500/10">
                        <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Match Score</span>
                        </div>
                        <span className="text-base font-black text-white">{payload[0].value}%</span>
                    </div>
                    {payload[1] && (
                        <div className="flex items-center justify-between gap-12 bg-emerald-500/5 px-4 py-3 rounded-xl border border-emerald-500/10">
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ATS Score</span>
                            </div>
                            <span className="text-base font-black text-white">{payload[1].value}%</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default function AnalysisChart({ data }: AnalysisChartProps) {
    return (
        <div className="w-full h-[300px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorMatch" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorATS" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.03)"
                    />
                    <XAxis
                        dataKey="date"
                        hide
                    />
                    <YAxis
                        hide
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#818cf8"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMatch)"
                        animationDuration={2000}
                    />
                    <Area
                        type="monotone"
                        dataKey="ats"
                        stroke="#34d399"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorATS)"
                        animationDuration={2500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
