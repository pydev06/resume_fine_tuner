import { Share2, CheckCircle, XCircle, Download, Loader2, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
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
            alert('Failed to download file. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-50 ring-emerald-100'
        if (score >= 60) return 'bg-yellow-50 ring-yellow-100'
        return 'bg-red-50 ring-red-100'
    }

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wider text-xs">Match Score</h3>
                    <div className={`relative flex items-center justify-center w-32 h-32 rounded-full ring-8 ${getScoreBg(data.match_score)} ${getScoreColor(data.match_score)}`}>
                        <span className="text-5xl font-bold tracking-tighter">{data.match_score}%</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">Relevance to Job Description</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wider text-xs">ATS Compatibility</h3>
                    <div className={`relative flex items-center justify-center w-32 h-32 rounded-full ring-8 ${getScoreBg(data.ats_score)} ${getScoreColor(data.ats_score)}`}>
                        <span className="text-5xl font-bold tracking-tighter">{data.ats_score}%</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">System Readability Score</p>
                </div>
            </div>

            {/* AI Optimization Feedback (Context for the score) */}
            {data.optimization_feedback && (
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start space-x-4 animate-fade-in shadow-sm">
                    <div className="p-2 bg-indigo-600 rounded-lg mt-1">
                        <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm mb-1 uppercase tracking-tight">AI Optimization Insight</h4>
                        <p className="text-indigo-800 text-sm leading-relaxed">{data.optimization_feedback}</p>
                    </div>
                </div>
            )}

            {/* AI Feedback on High Scores */}
            {data.match_score >= 85 && (!data.suggested_rewrites || data.suggested_rewrites.length === 0) && (
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500 rounded-full">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-900">Excellent Match Found!</h4>
                        <p className="text-emerald-700 text-sm">Your resume already aligns perfectly with this job description. No further tailoring is needed to maintain this high score.</p>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Summary</h3>
                <p className="text-gray-600 leading-relaxed text-base">{data.summary}</p>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100/50">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-6 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" /> Key Strengths
                    </h3>
                    <ul className="space-y-3">
                        {data.strengths.map((item, idx) => (
                            <li key={idx} className="flex items-start bg-white p-3 rounded-xl shadow-sm border border-emerald-100">
                                <span className="inline-block w-2 h-2 mt-2 mr-3 bg-emerald-500 rounded-full flex-shrink-0" />
                                <span className="text-gray-700 text-sm font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-red-50/50 p-8 rounded-2xl border border-red-100/50">
                    <h3 className="text-lg font-semibold text-red-800 mb-6 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" /> Missing Skills / Gaps
                    </h3>
                    <ul className="space-y-3">
                        {data.key_missing_skills.map((item, idx) => (
                            <li key={idx} className="flex items-start bg-white p-3 rounded-xl shadow-sm border border-red-100">
                                <span className="inline-block w-2 h-2 mt-2 mr-3 bg-red-500 rounded-full flex-shrink-0" />
                                <span className="text-gray-700 text-sm font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Smart Rewrites */}
            {data.suggested_rewrites && data.suggested_rewrites.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                                <Share2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-indigo-900">Smart Resume Tailoring</h3>
                                <p className="text-indigo-600 text-sm">AI-suggested improvements to match the job description</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Mock Interview Button */}
                            <button
                                onClick={() => navigate(`/interview/${data.evaluation_id}`)}
                                className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-md active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>Start Mock Interview</span>
                            </button>

                            {isDocx ? (
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95"
                                >
                                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    <span>{downloading ? 'Tailoring...' : 'Download Tailored (.docx)'}</span>
                                </button>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center space-x-2 max-w-xs transition-all hover:shadow-md">
                                    <div className="p-1 bg-amber-200 rounded-full">
                                        <Loader2 className="w-3 h-3 text-amber-700" />
                                    </div>
                                    <p className="text-[11px] font-medium text-amber-800 leading-tight">
                                        Upload a <b>.docx</b> file to enable tailored downloads with preserved formatting.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {data.suggested_rewrites.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Suggestion #{idx + 1}</span>
                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{item.reason}</span>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-red-500 uppercase mb-2 flex items-center">
                                            <XCircle className="w-3 h-3 mr-1" /> Original
                                        </p>
                                        <p className="text-gray-500 text-sm line-through decoration-red-300 decoration-2">{item.original}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-green-600 uppercase mb-2 flex items-center">
                                            <CheckCircle className="w-3 h-3 mr-1" /> AI Rewrite (STAR Method)
                                        </p>
                                        <p className="text-gray-900 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100 border-l-4 border-l-green-500">
                                            {item.rewritten}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Interview Prep */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-6">Interview Preparation</h3>
                <div className="space-y-4">
                    {data.interview_questions.map((q, idx) => (
                        <div key={idx} className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 transition-colors hover:bg-indigo-100/50">
                            <p className="text-indigo-900 font-medium">Q{idx + 1}: {q}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ATS View */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <Share2 className="w-5 h-5 mr-2" /> ATS Simulator View (Raw Text)
                </h3>
                <div className="bg-slate-900 p-6 rounded-xl font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto text-slate-300 border border-slate-700 shadow-inner">
                    {data.parsed_text || "No text parsed."}
                </div>
                <p className="mt-4 text-xs text-gray-400">
                    This is how an Applicant Tracking System sees your resume. Ensure there are no weird characters or formatting issues.
                </p>
            </div>
        </div>
    )
}
