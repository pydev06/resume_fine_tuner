import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ResumeUpload from '../components/ResumeUpload'
import JobDescriptionInput from '../components/JobDescriptionInput'
import EvaluationResult from '../components/EvaluationResult'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { Sparkles, ArrowRight } from 'lucide-react'
import { getApiUrl } from '../lib/api'

export default function Dashboard() {
    const location = useLocation()
    const [file, setFile] = useState<File | null>(null)
    const [jdText, setJdText] = useState('')
    const [jdUrl, setJdUrl] = useState('')
    const [jdTab, setJdTab] = useState<'text' | 'url'>('text')

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')

    // Check if navigated from history with evaluation result
    useEffect(() => {
        if (location.state?.evaluationResult) {
            setResult(location.state.evaluationResult)
        }
    }, [location])

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please upload a resume.")
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

        setError('')
        setLoading(true)
        setResult(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const formData = new FormData()
            formData.append('resume', file)

            if (jdTab === 'text') {
                formData.append('job_description', jdText)
            } else {
                formData.append('job_description_url', jdUrl)
            }

            const analyzeUrl = getApiUrl('/analyze')

            const response = await axios.post(analyzeUrl, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })

            setResult(response.data)

        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.detail || "An error occurred during analysis.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 animate-fade-in relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Col: Inputs */}
                <div className="space-y-8 sticky top-24 self-start">
                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">1</div>
                            <h2 className="text-xl font-bold text-gray-900">Upload Resume</h2>
                        </div>
                        <ResumeUpload selectedFile={file} onFileSelect={setFile} />
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">2</div>
                            <h2 className="text-xl font-bold text-gray-900">Job Target</h2>
                        </div>
                        <JobDescriptionInput
                            jdText={jdText} setJdText={setJdText}
                            jdUrl={jdUrl} setJdUrl={setJdUrl}
                            activeTab={jdTab} setActiveTab={setJdTab}
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center transition-all duration-300
                    ${loading
                                ? 'bg-gray-400 cursor-not-allowed transform-none'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25 hover:-translate-y-1'}`}
                    >
                        {loading ? (
                            <>
                                <Sparkles className="animate-spin w-5 h-5 mr-3" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                Start Analysis <ArrowRight className="w-5 h-5 ml-3" />
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-start animate-fade-in">
                            <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-red-500 mr-3" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Right Col: Results */}
                <div className="min-h-[600px]">
                    {result ? (
                        <EvaluationResult data={result} />
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 space-y-4">
                            <div className="p-6 bg-gray-50 rounded-full animate-pulse">
                                <Sparkles className="w-12 h-12 text-gray-300" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-gray-500 text-lg">Ready to Analyze</h3>
                                <p className="text-sm mt-1 max-w-xs mx-auto">Upload your resume and the job description to get AI-powered insights.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
