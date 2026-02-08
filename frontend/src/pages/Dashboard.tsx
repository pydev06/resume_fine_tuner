import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ResumeUpload from '../components/ResumeUpload'
import ResumeLibrary from '../components/ResumeLibrary'
import JobDescriptionInput from '../components/JobDescriptionInput'
import EvaluationResult from '../components/EvaluationResult'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { Sparkles, ArrowRight, Wallet, PlusCircle, BrainCircuit, Library, Upload } from 'lucide-react'
import { getApiUrl } from '../lib/api'

export default function Dashboard() {
    const location = useLocation()
    const [file, setFile] = useState<File | null>(null)
    const [resumeTab, setResumeTab] = useState<'upload' | 'library'>('upload')
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
    const [selectedResumeName, setSelectedResumeName] = useState<string | null>(null)

    const [jdText, setJdText] = useState('')
    const [jdUrl, setJdUrl] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [jdTab, setJdTab] = useState<'text' | 'url'>('text')

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')
    const [credits, setCredits] = useState<number | null>(null)

    useEffect(() => {
        if (location.state?.evaluationResult) {
            setResult(location.state.evaluationResult)
        }
        fetchCredits()
    }, [location])

    const fetchCredits = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await axios.get(getApiUrl('/payment/credits'), {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            })
            setCredits(response.data.credits)
        } catch (err) {
            console.error("Error fetching credits:", err)
        }
    }

    const handleAnalyze = async () => {
        if (resumeTab === 'upload' && !file) {
            setError("Please upload a resume.")
            return
        }
        if (resumeTab === 'library' && !selectedResumeId) {
            setError("Please select a resume from your library.")
            return
        }
        if (jdTab === 'text' && !jdText) {
            setError("Please enter a Job Description.")
            return
        }
        if (jdTab === 'url' && !jdUrl) {
            setError("Please enter a Job URL.")
            return
        }
        if (!jobTitle.trim()) {
            setError("Please enter a Job Title.")
            return
        }
        if (!companyName.trim()) {
            setError("Please enter the Company Name.")
            return
        }

        setError('')
        setLoading(true)
        setResult(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const formData = new FormData()

            if (resumeTab === 'upload' && file) {
                formData.append('resume', file)
            } else if (resumeTab === 'library' && selectedResumeId) {
                formData.append('resume_id', selectedResumeId)
            }

            if (jdTab === 'text') {
                formData.append('job_description', jdText)
            } else {
                formData.append('job_description_url', jdUrl)
            }

            if (jobTitle) formData.append('job_title', jobTitle)
            if (companyName) formData.append('company_name', companyName)

            const response = await axios.post(getApiUrl('/analyze'), formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })

            setResult(response.data)
            // Refresh credits after analysis
            fetchCredits()

        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.detail || "An error occurred during analysis.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 relative pb-20"
        >
            {/* Credits Section */}
            <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-2">
                <div className="glass-card px-5 py-2.5 rounded-2xl flex items-center justify-between sm:justify-start space-x-3 shadow-xl">
                    <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">
                            Credits: <span className="text-white font-black text-base">{credits !== null ? credits : '...'}</span>
                        </span>
                    </div>
                </div>
                <Link
                    to="/pricing"
                    className="flex items-center justify-center space-x-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>Get Credits</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10">
                {/* Left Col: Inputs */}
                <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
                    <section className="glass-card p-8 rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <BrainCircuit className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-6 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20 flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight">Technical Profile</h2>
                                    <p className="text-slate-400 text-xs font-medium">Choose your technical source</p>
                                </div>
                            </div>

                            {/* Resume Source Tabs */}
                            <div className="flex w-full sm:w-auto p-1 bg-white/5 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setResumeTab('upload')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${resumeTab === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Upload className="w-3 h-3" />
                                    <span>Upload</span>
                                </button>
                                <button
                                    onClick={() => setResumeTab('library')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${resumeTab === 'library' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Library className="w-3 h-3" />
                                    <span>Library</span>
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {resumeTab === 'upload' ? (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ResumeUpload selectedFile={file} onFileSelect={setFile} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="library"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ResumeLibrary
                                        onSelect={(id, name) => {
                                            setSelectedResumeId(id)
                                            setSelectedResumeName(name)
                                        }}
                                        selectedResumeId={selectedResumeId}
                                    />
                                    {selectedResumeName && (
                                        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-3">
                                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Selected Asset</p>
                                                <p className="text-sm font-bold text-white truncate">{selectedResumeName}</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    <section className="glass-card p-8 rounded-[2rem] relative overflow-hidden group">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20">
                                2
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Target Role</h2>
                                <p className="text-slate-400 text-xs font-medium">Paste JD text or a LinkedIn URL</p>
                            </div>
                        </div>
                        <JobDescriptionInput
                            jdText={jdText} setJdText={setJdText}
                            jdUrl={jdUrl} setJdUrl={setJdUrl}
                            jobTitle={jobTitle} setJobTitle={setJobTitle}
                            companyName={companyName} setCompanyName={setCompanyName}
                            activeTab={jdTab} setActiveTab={setJdTab}
                        />
                    </section>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className={`group relative w-full py-5 px-8 rounded-[1.5rem] text-white font-black text-xl shadow-2xl transition-all duration-500
                    ${loading
                                ? 'bg-slate-800 cursor-not-allowed border border-white/5'
                                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:shadow-indigo-500/40 hover:-translate-y-1 hover:scale-[1.02]'}`}
                    >
                        <div className="relative z-10 flex items-center justify-center">
                            {loading ? (
                                <>
                                    <Sparkles className="animate-spin w-6 h-6 mr-3 text-indigo-300" />
                                    <span>Engineering Results...</span>
                                </>
                            ) : (
                                <>
                                    <span>Run AI Analysis</span>
                                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                        {!loading && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />}
                    </button>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`p-5 rounded-2xl text-sm flex items-start glass-card border-none ${error.includes("Insufficient credits")
                                    ? "bg-amber-500/10 text-amber-200"
                                    : "bg-red-500/10 text-red-200"
                                    }`}>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${error.includes("Insufficient credits") ? "bg-amber-400" : "bg-red-400"}`} />
                                        <span className="font-bold">Attention Required</span>
                                    </div>
                                    <p className="opacity-90">{error}</p>
                                    {error.includes("Insufficient credits") && (
                                        <Link to="/pricing" className="inline-flex items-center mt-3 font-black text-amber-400 hover:text-amber-300 transition-colors">
                                            Reload Credits <ArrowRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Col: Results */}
                <div className="min-h-[600px] relative">
                    {/* Ambient Glow behind results */}
                    <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

                    {result ? (
                        <div className="animate-fade-in relative z-10">
                            <EvaluationResult data={result} />
                        </div>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-12 glass-card rounded-[3rem] text-slate-500 space-y-6 min-h-[600px] border-dashed border-2 border-slate-700/50">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                <div className="relative p-8 bg-slate-800/80 rounded-full border border-white/5">
                                    <Sparkles className="w-16 h-16 text-indigo-400/50" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="font-black text-white text-2xl tracking-tight mb-2">Engine Primed</h3>
                                <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed font-medium">
                                    Initiate analysis to receive deep architectural feedback on your professional profile.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
