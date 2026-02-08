import React from 'react'
import { CheckCircle, XCircle, Download, Loader2, MessageSquare, Zap, Target, Star, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface EvaluationResultProps {
    data: {
        evaluation_id?: string
        match_score: number
        key_missing_skills: string[]
        strengths: string[]
        summary: string
        ats_score: number
        interview_questions: string[]
        parsed_text?: string
        resume_name?: string
        suggested_rewrites?: {
            original: string
            rewritten: string
            reason: string
        }[]
        optimization_feedback?: string
    }
}

export default function EvaluationResult({ data }: EvaluationResultProps) {
    const navigate = useNavigate()
    const [downloading, setDownloading] = React.useState(false)

    const isDocx = data.resume_name?.toLowerCase().endsWith('.docx')

    const handleDownload = async () => {
        if (!data.evaluation_id) return
        const endpoint = isDocx ? '/generate-docx' : '/generate-pdf'

        try {
            setDownloading(true)
            const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
            const token = session?.access_token

            const formData = new FormData()
            formData.append('evaluation_id', data.evaluation_id)

            const response = await fetch(`${getApiUrl(endpoint)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (!response.ok) throw new Error('Failed to generate file')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const ext = isDocx ? 'docx' : 'pdf'
            a.download = `tailored_resume_${new Date().getTime()}.${ext}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error downloading file:', error)
        } finally {
            setDownloading(false)
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    const getScoreStyles = (score: number) => {
        if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' }
        if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' }
        return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-500/20' }
    }

    const matchStyles = getScoreStyles(data.match_score)
    const atsStyles = getScoreStyles(data.ats_score)

    // Helper for URL (assuming getApiUrl is available from parent context or imported)
    // For this rewrite, I'll use a local helper if needed, but getApiUrl is in Dashboard.tsx
    function getApiUrl(path: string) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        return `${baseUrl}${path}`
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div variants={item} className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Target className="w-24 h-24 text-white" />
                    </div>
                    <h3 className="text-slate-400 font-bold mb-6 uppercase tracking-[0.2em] text-[10px]">Strategic Alignment</h3>
                    <div className="flex flex-col items-center">
                        <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${matchStyles.border} ${matchStyles.bg} ${matchStyles.glow} shadow-2xl transition-transform duration-500 group-hover:scale-105`}>
                            <div className="text-center font-black">
                                <span className={`text-5xl tracking-tighter ${matchStyles.text}`}>{data.match_score}</span>
                                <span className="text-xl text-slate-400 ml-0.5">%</span>
                            </div>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="72" cy="72" r="68"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeDasharray={427}
                                    strokeDashoffset={427 - (427 * data.match_score) / 100}
                                    className={`${matchStyles.text} opacity-20`}
                                />
                            </svg>
                        </div>
                        <p className="mt-6 text-sm font-bold text-white tracking-tight">Role Match Index</p>
                    </div>
                </motion.div>

                <motion.div variants={item} className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Zap className="w-24 h-24 text-white" />
                    </div>
                    <h3 className="text-slate-400 font-bold mb-6 uppercase tracking-[0.2em] text-[10px]">Processing Rank</h3>
                    <div className="flex flex-col items-center">
                        <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${atsStyles.border} ${atsStyles.bg} ${atsStyles.glow} shadow-2xl transition-transform duration-500 group-hover:scale-105`}>
                            <div className="text-center font-black">
                                <span className={`text-5xl tracking-tighter ${atsStyles.text}`}>{data.ats_score}</span>
                                <span className="text-xl text-slate-400 ml-0.5">%</span>
                            </div>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="72" cy="72" r="68"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeDasharray={427}
                                    strokeDashoffset={427 - (427 * data.ats_score) / 100}
                                    className={`${atsStyles.text} opacity-20`}
                                />
                            </svg>
                        </div>
                        <p className="mt-6 text-sm font-bold text-white tracking-tight">ATS Versatility</p>
                    </div>
                </motion.div>
            </div>

            {/* AI Strategic Insight */}
            {data.optimization_feedback && (
                <motion.div variants={item} className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-8 rounded-[2rem] border border-indigo-500/20 glass-card">
                    <div className="flex items-start space-x-6">
                        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                            <BrainCircuit className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-black text-white text-lg tracking-tight mb-2">Neural Optimization Strategy</h4>
                            <p className="text-slate-300 text-sm leading-relaxed overflow-hidden line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                {data.optimization_feedback}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Analysis Summary */}
            <motion.div variants={item} className="glass-card p-10 rounded-[2.5rem]">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Executive Summary</h3>
                <p className="text-slate-200 leading-relaxed font-medium text-lg">
                    {data.summary}
                </p>
            </motion.div>

            {/* Competency Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div variants={item} className="glass-card p-8 rounded-[2.5rem] bg-emerald-500/5 border-emerald-500/10">
                    <h3 className="text-white font-black text-xl mb-8 flex items-center tracking-tight">
                        <CheckCircle className="w-6 h-6 mr-3 text-emerald-400" /> Key Competitive Advantages
                    </h3>
                    <ul className="grid grid-cols-1 gap-4">
                        {data.strengths.map((item, idx) => (
                            <li key={idx} className="flex items-center bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/10 group hover:bg-emerald-500/10 transition-colors">
                                <div className="p-1 bg-emerald-400/20 rounded-lg mr-4">
                                    <Star className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <span className="text-slate-200 text-sm font-bold tracking-tight">{item}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div variants={item} className="glass-card p-8 rounded-[2.5rem] bg-red-500/5 border-red-500/10">
                    <h3 className="text-white font-black text-xl mb-8 flex items-center tracking-tight">
                        <XCircle className="w-6 h-6 mr-3 text-red-400" /> Strategic Vulnerabilities
                    </h3>
                    <ul className="grid grid-cols-1 gap-4">
                        {data.key_missing_skills.map((item, idx) => (
                            <li key={idx} className="flex items-center bg-red-950/20 p-4 rounded-2xl border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                                <div className="p-1 bg-red-400/20 rounded-lg mr-4 drop-shadow-sm">
                                    <Zap className="w-3.5 h-3.5 text-red-400" />
                                </div>
                                <span className="text-slate-200 text-sm font-bold tracking-tight">{item}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* Smart Rewrites Section */}
            {data.suggested_rewrites && data.suggested_rewrites.length > 0 && (
                <motion.div variants={item} className="relative z-10">
                    <div className="glass-card p-10 rounded-[3rem] border-indigo-500/20 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                            <div className="flex items-center space-x-6">
                                <div className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl shadow-indigo-600/20 ring-1 ring-white/20">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter">AI Core Tailoring</h3>
                                    <p className="text-slate-400 text-sm font-semibold">Self-correction via STAR architecture optimization</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate(`/interview/${data.evaluation_id}`)}
                                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center space-x-3 group"
                                >
                                    <MessageSquare className="w-4 h-4 text-indigo-400 group-hover:scale-125 transition-transform" />
                                    <span>Run Mock Simulator</span>
                                </button>

                                {isDocx ? (
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center space-x-3"
                                    >
                                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        <span>{downloading ? 'Tailoring Assets...' : 'Download tailored .docx'}</span>
                                    </button>
                                ) : (
                                    <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-4 rounded-2xl flex items-center space-x-4 max-w-sm">
                                        <div className="p-2 bg-amber-400/20 rounded-xl">
                                            <Loader2 className="w-4 h-4 text-amber-300" />
                                        </div>
                                        <p className="text-xs font-bold text-amber-200 leading-snug">
                                            Tailored downloads require <span className="text-amber-400">.docx</span> source to preserve original document formatting.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {data.suggested_rewrites.map((item: any, idx: number) => (
                                <div key={idx} className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-300">
                                    <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Heuristic Node #{idx + 1}</span>
                                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-4 py-1.5 rounded-full border border-indigo-400/20">{item.reason}</span>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-red-400/70 uppercase tracking-widest flex items-center">
                                                <XCircle className="w-3 h-3 mr-2" /> Initial Version
                                            </p>
                                            <div className="p-5 bg-red-400/5 rounded-2xl border border-red-400/10 text-slate-400 text-sm font-medium leading-relaxed italic line-through decoration-red-400/30">
                                                {item.original}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center">
                                                <CheckCircle className="w-3 h-3 mr-2" /> Optimized Component
                                            </p>
                                            <div className="p-5 bg-emerald-400/5 rounded-2xl border border-emerald-400/20 text-white text-sm font-bold leading-relaxed shadow-lg">
                                                {item.rewritten}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Mock Interview Terminal */}
            <motion.div variants={item} className="glass-card p-10 rounded-[3rem]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white tracking-tight">Interview Simulation Pack</h3>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full">Automated Training</div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {data.interview_questions.map((q, idx) => (
                        <div key={idx} className="group flex items-center bg-slate-900/60 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                            <div className="mr-6 text-slate-700 font-black text-2xl group-hover:text-indigo-500/50 transition-colors">
                                {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                            </div>
                            <p className="text-white font-bold leading-relaxed flex-1">{q}</p>
                            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                <ArrowRight className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Raw System View */}
            <motion.div variants={item} className="glass-card p-10 rounded-[3rem]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">ATS Sensor View</h3>
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <Terminal className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-inner p-8 rounded-3xl font-mono text-[13px] whitespace-pre-wrap max-h-[300px] overflow-y-auto text-slate-400 border border-white/5 shadow-inner">
                    {data.parsed_text || "Sensor data unavailable."}
                </div>
            </motion.div>
        </motion.div>
    )
}

function BrainCircuit(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 4.5V2" />
            <path d="M18 10h2" />
            <path d="M4 10h2" />
            <path d="M12 21.5V19" />
            <path d="M16.5 4.5a4.5 4.5 0 0 0-9 0" />
            <path d="M21 12a9 9 0 0 1-18 0" />
            <path d="M12 11h.01" />
        </svg>
    )
}

function Terminal(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
    )
}
