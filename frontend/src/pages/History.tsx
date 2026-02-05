import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    Clock,
    FileText,
    Briefcase,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Download,
    Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../lib/api'

interface Evaluation {
    id: string
    created_at: string
    score: number
    ats_score: number
    analysis_json: any
    resumes: {
        filename: string
        file_url: string
    }
    job_descriptions: {
        title: string
        content: string
    }
}

export default function History() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const response = await fetch(getApiUrl('/history'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setEvaluations(data.evaluations || [])
            }
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (evaluationId: string, filename: string) => {
        const isDocx = filename.toLowerCase().endsWith('.docx')
        const endpoint = isDocx ? '/generate-docx' : '/generate-pdf'

        try {
            setDownloadingId(evaluationId)
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const formData = new FormData()
            formData.append('evaluation_id', evaluationId)

            const response = await fetch(getApiUrl(endpoint), {
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
            setDownloadingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
                    <p className="text-gray-500 mt-2">View your past resume evaluations</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg shadow-indigo-100"
                >
                    New Analysis
                </button>
            </div>

            {evaluations.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No analysis history yet</h3>
                    <p className="text-gray-500 mb-6">Start analyzing resumes to see your history here</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
                    >
                        Analyze Resume
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {evaluations.map((evaluation) => {
                        const isExpanded = expandedId === evaluation.id
                        const analysis = evaluation.analysis_json || {}

                        return (
                            <div
                                key={evaluation.id}
                                className={`bg-white rounded-2xl shadow-lg border transition-all duration-300 ${isExpanded ? 'border-indigo-200 shadow-indigo-100/50' : 'border-gray-100 shadow-gray-200/50'}`}
                            >
                                {/* Card Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="p-2 bg-indigo-50 rounded-lg">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1">{evaluation.resumes?.filename || 'Resume'}</h3>
                                            </div>
                                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                <span className="line-clamp-1 font-medium">{evaluation.job_descriptions?.title || 'Job Description'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-6 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                                            <div className="text-center">
                                                <div className="flex items-center space-x-1 text-2xl font-black text-indigo-600">
                                                    <span>{evaluation.score || analysis.match_score || 0}</span>
                                                    <span className="text-xs text-indigo-400 font-bold">%</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Match</p>
                                            </div>
                                            <div className="w-px h-8 bg-gray-200" />
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-emerald-600">
                                                    <span>{evaluation.ats_score || analysis.ats_score || 0}</span>
                                                    <span className="text-xs text-emerald-400 font-bold">%</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">ATS</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatDate(evaluation.created_at)}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleExpand(evaluation.id)}
                                            className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700 font-bold transition-all px-4 py-2 hover:bg-indigo-50 rounded-xl"
                                        >
                                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-indigo-50 bg-gray-50/30 p-8 space-y-8 animate-fade-in rounded-b-2xl">
                                        {/* AI Optimization Feedback */}
                                        {analysis.optimization_feedback && (
                                            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-start space-x-4">
                                                <div className="p-2 bg-indigo-600 rounded-xl mt-1 shadow-lg shadow-indigo-100">
                                                    <TrendingUp className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-indigo-900 text-sm mb-1 uppercase tracking-tight">AI Optimization Insight</h4>
                                                    <p className="text-indigo-800/80 text-sm leading-relaxed font-medium">{analysis.optimization_feedback}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => navigate(`/interview/${evaluation.id}`)}
                                                className="flex items-center justify-center space-x-3 px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-gray-100 active:scale-95"
                                            >
                                                <MessageSquare className="w-5 h-5" />
                                                <span>Start Mock Interview</span>
                                            </button>

                                            {evaluation.resumes?.filename?.toLowerCase().endsWith('.docx') ? (
                                                <button
                                                    onClick={() => handleDownload(evaluation.id, evaluation.resumes.filename)}
                                                    disabled={downloadingId === evaluation.id}
                                                    className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 active:scale-95"
                                                >
                                                    {downloadingId === evaluation.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                                    <span>{downloadingId === evaluation.id ? 'Tailoring...' : 'Download Tailored (.docx)'}</span>
                                                </button>
                                            ) : (
                                                <div className="bg-amber-50 border border-amber-200 px-6 py-4 rounded-2xl flex items-center space-x-4">
                                                    <div className="p-2 bg-amber-200 rounded-xl shadow-sm">
                                                        <FileText className="w-5 h-5 text-amber-700" />
                                                    </div>
                                                    <p className="text-xs font-bold text-amber-800 leading-tight">
                                                        Upload a <b className="text-amber-900">.docx</b> file to enable tailored downloads with preserved formatting.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Strengths */}
                                            {analysis.strengths && (
                                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                                        <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" />
                                                        Key Strengths
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {analysis.strengths.slice(0, 4).map((s: string, i: number) => (
                                                            <li key={i} className="text-sm text-gray-600 font-medium flex items-start">
                                                                <span className="text-emerald-500 mr-2">●</span> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Skills Gap */}
                                            {analysis.key_missing_skills && (
                                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                                        <AlertCircle className="w-5 h-5 mr-3 text-orange-500" />
                                                        Missing Skills
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {analysis.key_missing_skills.slice(0, 4).map((s: string, i: number) => (
                                                            <li key={i} className="text-sm text-gray-600 font-medium flex items-start">
                                                                <span className="text-orange-500 mr-2">●</span> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
