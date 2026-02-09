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
    Loader2,
    Plus,
    Archive,
    Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../lib/api'
import AnalysisChart from '../components/AnalysisChart'
import CategorySelector from '../components/CategorySelector'

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
        company: string
        content: string
    }
}

export default function History() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [selectedDomains, setSelectedDomains] = useState<Record<string, string>>({})
    const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({})
    const navigate = useNavigate()

    useEffect(() => {
        fetchHistory()
    }, [])

    // Auto-detect domain when evaluation is expanded
    useEffect(() => {
        if (expandedId && !selectedDomains[expandedId]) {
            detectDomainForEvaluation(expandedId)
        }
    }, [expandedId])

    const detectDomainForEvaluation = async (evaluationId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const formData = new FormData()
            formData.append('evaluation_id', evaluationId)

            const response = await fetch(getApiUrl('/interview/detect-domain'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setSelectedDomains(prev => ({ ...prev, [evaluationId]: data.domain }))
            }
        } catch (error) {
            console.error('Error detecting domain:', error)
            // Default to technology on error
            setSelectedDomains(prev => ({ ...prev, [evaluationId]: 'technology' }))
        }
    }

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

    const handleDelete = async (evaluationId: string) => {
        if (!window.confirm('Are you sure you want to delete this analysis? This will also remove the resume if it is not used in other evaluations. This action cannot be undone.')) {
            return
        }

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const response = await fetch(getApiUrl(`/history/${evaluationId}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                setEvaluations(evaluations.filter(e => e.id !== evaluationId))
            } else {
                const error = await response.json()
                alert(`Error: ${error.detail || 'Failed to delete'}`)
            }
        } catch (error) {
            console.error('Error deleting evaluation:', error)
            alert('An error occurred during deletion.')
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

    const chartData = [...evaluations]
        .reverse()
        .map(e => ({
            date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: e.score || e.analysis_json?.match_score || 0,
            ats: e.ats_score || e.analysis_json?.ats_score || 0,
            company: e.job_descriptions?.company || '',
            title: e.job_descriptions?.title || '',
            // Include raw JD object for extra safety in tooltip
            jd_metadata: e.job_descriptions || {}
        }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-slide-up">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">Analysis History</h1>
                    <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Archives of your career progression</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Initiate New Analysis
                </button>
            </div>

            {evaluations.length === 0 ? (
                <div className="glass-card rounded-[3rem] border-white/5 p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Archive className="w-32 h-32 text-white" />
                    </div>
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5">
                        <FileText className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">No analysis history found</h3>
                    <p className="text-slate-400 mb-10 font-medium">Your career evolution starts with your first upload.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest hover:bg-white/10"
                    >
                        Analyze Resume
                    </button>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Career Velocity Section */}
                    <div className="glass-card rounded-[3rem] border-white/5 p-10 relative overflow-hidden group">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-4">
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-3 text-indigo-400" />
                                    Career Velocity
                                </h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Neural score analysis over time</p>
                            </div>
                            <div className="bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                                    {evaluations.length} Scans Completed
                                </span>
                            </div>
                        </div>

                        <AnalysisChart data={chartData} />
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {evaluations.map((evaluation, idx) => {
                            const isExpanded = expandedId === evaluation.id
                            const analysis = evaluation.analysis_json || {}

                            return (
                                <div
                                    key={evaluation.id}
                                    className={`glass-card rounded-[2.5rem] border-white/5 transition-all duration-500 hover:bg-white/[0.03] overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    {/* Card Header */}
                                    <div className="p-8">
                                        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-8">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-indigo-400/10 rounded-2xl border border-indigo-400/20">
                                                        <FileText className="w-6 h-6 text-indigo-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-white tracking-tight line-clamp-1">
                                                        {evaluation.resumes?.filename || 'Resume'}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center space-x-4 text-slate-400">
                                                    <Briefcase className="w-4 h-4 text-slate-600" />
                                                    <span className="text-sm font-bold tracking-tight line-clamp-1 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                                        {(evaluation.job_descriptions?.title || 'Target Job')}
                                                        {evaluation.job_descriptions?.company && ` @ ${evaluation.job_descriptions.company}`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 bg-white/5 px-4 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-inner backdrop-blur-3xl min-w-0 sm:min-w-[280px] justify-center">
                                                <div className="flex sm:block items-center justify-between sm:text-center px-2">
                                                    <div className="flex items-center justify-center space-x-1 text-2xl sm:text-3xl font-black text-indigo-400 tracking-tighter">
                                                        <span>{evaluation.score || analysis.match_score || 0}</span>
                                                        <span className="text-xs text-indigo-400/50 font-black">%</span>
                                                    </div>
                                                    <p className="text-[9px] sm:text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.2em] mt-1">Match</p>
                                                </div>
                                                <div className="hidden sm:block w-px h-10 bg-white/5" />
                                                <div className="block sm:hidden h-px w-full bg-white/5" />
                                                <div className="flex sm:block items-center justify-between sm:text-center px-2">
                                                    <div className="flex items-center justify-center space-x-1 text-2xl sm:text-3xl font-black text-emerald-400 tracking-tighter">
                                                        <span>{evaluation.ats_score || analysis.ats_score || 0}</span>
                                                        <span className="text-xs text-emerald-400/50 font-black">%</span>
                                                    </div>
                                                    <p className="text-[9px] sm:text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mt-1">ATS</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-6 border-t border-white/5 space-y-4 sm:space-y-0">
                                            <div className="flex items-center space-x-3 text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">
                                                <Clock className="w-4 h-4 text-slate-600" />
                                                <span>{formatDate(evaluation.created_at)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => toggleExpand(evaluation.id)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center space-x-3 text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-widest px-4 sm:px-6 py-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5"
                                                >
                                                    <span>{isExpanded ? 'Hide Intel' : 'View Intel'}</span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(evaluation.id)}
                                                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
                                                    title="Delete Analysis"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-white/5 bg-white/[0.01] p-10 space-y-10 animate-slide-up">
                                            {/* AI Insight */}
                                            {analysis.optimization_feedback && (
                                                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-8 rounded-[2rem] border border-white/5 shadow-2xl flex items-start space-x-6 backdrop-blur-xl">
                                                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg ring-1 ring-white/20">
                                                        <TrendingUp className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-white text-sm mb-2 uppercase tracking-tight">Neural Optimization Insight</h4>
                                                        <p className="text-slate-400 text-sm leading-relaxed font-bold">{analysis.optimization_feedback}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* View JD Content */}
                                            {evaluation.job_descriptions?.content && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center space-x-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        <span>Targeted Job Description</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl max-h-40 overflow-y-auto group/jd hover:bg-white/[0.04] transition-all">
                                                        <p className="text-xs text-slate-500/60 font-medium leading-relaxed group-hover/jd:text-slate-500 transition-colors whitespace-pre-wrap">
                                                            {evaluation.job_descriptions.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Auto-Detected Domain Display */}
                                            {selectedDomains[evaluation.id] && (
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${selectedDomains[evaluation.id] === 'technology' ? 'bg-gradient-to-r from-indigo-500 to-blue-600 border-indigo-400/30' :
                                                            selectedDomains[evaluation.id] === 'healthcare' ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400/30' :
                                                                selectedDomains[evaluation.id] === 'construction' ? 'bg-gradient-to-r from-orange-500 to-amber-600 border-orange-400/30' :
                                                                    selectedDomains[evaluation.id] === 'finance' ? 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-400/30' :
                                                                        selectedDomains[evaluation.id] === 'education' ? 'bg-gradient-to-r from-purple-500 to-violet-600 border-purple-400/30' :
                                                                            selectedDomains[evaluation.id] === 'legal' ? 'bg-gradient-to-r from-sky-500 to-blue-600 border-sky-400/30' :
                                                                                selectedDomains[evaluation.id] === 'marketing' ? 'bg-gradient-to-r from-pink-500 to-rose-600 border-pink-400/30' :
                                                                                    selectedDomains[evaluation.id] === 'sales' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 border-teal-400/30' :
                                                                                        'bg-gradient-to-r from-indigo-500 to-blue-600 border-indigo-400/30'
                                                        }`}>
                                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                            {selectedDomains[evaluation.id] === 'technology' && 'IT Professional'}
                                                            {selectedDomains[evaluation.id] === 'healthcare' && 'Healthcare Professional'}
                                                            {selectedDomains[evaluation.id] === 'construction' && 'Construction Professional'}
                                                            {selectedDomains[evaluation.id] === 'finance' && 'Finance Professional'}
                                                            {selectedDomains[evaluation.id] === 'education' && 'Education Professional'}
                                                            {selectedDomains[evaluation.id] === 'legal' && 'Legal Professional'}
                                                            {selectedDomains[evaluation.id] === 'marketing' && 'Marketing Professional'}
                                                            {selectedDomains[evaluation.id] === 'sales' && 'Sales Professional'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Category Selection */}
                                            <div className="mb-6">
                                                <CategorySelector
                                                    onSelect={(slug) => setSelectedCategories(prev => ({ ...prev, [evaluation.id]: slug }))}
                                                    selectedSlug={selectedCategories[evaluation.id] || 'generic'}
                                                    domain={selectedDomains[evaluation.id] || 'technology'}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <button
                                                    onClick={() => {
                                                        const domain = selectedDomains[evaluation.id] || 'technology'
                                                        const category = selectedCategories[evaluation.id] || 'generic'
                                                        navigate(`/interview/${evaluation.id}?domain=${domain}&category=${category}`)
                                                    }}
                                                    className="flex items-center justify-center space-x-4 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                                                >
                                                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                                                    <span>Mock Simulator</span>
                                                </button>

                                                {evaluation.resumes?.filename?.toLowerCase().endsWith('.docx') ? (
                                                    <button
                                                        onClick={() => handleDownload(evaluation.id, evaluation.resumes.filename)}
                                                        disabled={downloadingId === evaluation.id}
                                                        className="flex items-center justify-center space-x-4 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                                                    >
                                                        {downloadingId === evaluation.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                                        <span>{downloadingId === evaluation.id ? 'Refining...' : 'Download Tailored'}</span>
                                                    </button>
                                                ) : (
                                                    <div className="bg-amber-500/5 border border-amber-500/20 px-8 py-5 rounded-[2rem] flex items-center space-x-4">
                                                        <div className="p-2 bg-amber-400/10 rounded-xl">
                                                            <AlertCircle className="w-5 h-5 text-amber-400" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-relaxed">
                                                            Upload <span className="text-white">.docx</span> source to unlock <br /> tailored downloads with formatting.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Competency Grids */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {analysis.strengths && (
                                                    <div className="p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 h-full">
                                                        <h4 className="font-black text-white text-lg mb-6 flex items-center tracking-tight">
                                                            <CheckCircle className="w-5 h-5 mr-3 text-emerald-400" />
                                                            Competitive Edges
                                                        </h4>
                                                        <ul className="space-y-4">
                                                            {analysis.strengths.slice(0, 4).map((s: string, i: number) => (
                                                                <li key={i} className="text-sm text-slate-400 font-bold tracking-tight flex items-start group transition-colors hover:text-white">
                                                                    <span className="text-emerald-500 mr-4 font-black">→</span> {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {analysis.key_missing_skills && (
                                                    <div className="p-8 bg-red-500/5 rounded-[2rem] border border-red-500/10 h-full">
                                                        <h4 className="font-black text-white text-lg mb-6 flex items-center tracking-tight">
                                                            <AlertCircle className="w-5 h-5 mr-3 text-red-400" />
                                                            Missing Skillsets
                                                        </h4>
                                                        <ul className="space-y-4">
                                                            {analysis.key_missing_skills.slice(0, 4).map((s: string, i: number) => (
                                                                <li key={i} className="text-sm text-slate-400 font-bold tracking-tight flex items-start group transition-colors hover:text-white">
                                                                    <span className="text-red-500 mr-4 font-black">×</span> {s}
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
                </div>
            )}
        </div>
    )
}
