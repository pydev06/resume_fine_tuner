import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    Send,
    ArrowLeft,
    MessageSquare,
    TrendingUp,
    Award,
    Loader2,
    CheckCircle2,
    Users,
    Mic,
    Volume2,
    Square
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getApiUrl } from '../lib/api'
import { AudioRecorder } from '../lib/audio'

interface Message {
    role: 'user' | 'assistant'
    content: string
    feedback?: string
    context_clue?: string
    is_final?: boolean
}

export default function MockInterview() {
    const { evaluationId } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [starting, setStarting] = useState(true)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [categorySlug, setCategorySlug] = useState<string>('generic')
    const [categoryName, setCategoryName] = useState<string>('Generic')
    const [isRecording, setIsRecording] = useState(false)
    const [recordingLoading, setRecordingLoading] = useState(false)
    const [playingMessageIdx, setPlayingMessageIdx] = useState<number | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const recorderRef = useRef<AudioRecorder>(new AudioRecorder())

    useEffect(() => {
        // Read category from URL params
        const category = searchParams.get('category') || 'generic'
        setCategorySlug(category)
        fetchCategoryName(category)
    }, [searchParams])

    const fetchCategoryName = async (slug: string) => {
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const token = authSession?.access_token
            const response = await fetch(getApiUrl('/interview/categories'), {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            const category = data.categories?.find((c: any) => c.slug === slug)
            if (category) setCategoryName(category.name)
        } catch (error) {
            console.error('Error fetching category:', error)
        }
    }

    useEffect(() => {
        if (evaluationId && categorySlug) {
            startSession()
        }
    }, [evaluationId, categorySlug])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const startSession = async () => {
        try {
            setStarting(true)
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const token = authSession?.access_token

            const formData = new FormData()
            formData.append('evaluation_id', evaluationId!)
            formData.append('category_slug', categorySlug)

            const response = await fetch(getApiUrl('/interview/start'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) throw new Error('Failed to start interview')

            const data = await response.json()
            setSessionId(data.session_id)

            if (data.messages && data.messages.length > 0) {
                setMessages(data.messages)
            } else {
                setMessages([{
                    role: 'assistant',
                    content: data.first_question,
                    context_clue: data.context_clue
                }])
            }
        } catch (error: any) {
            console.error('Error starting session:', error)
            if (error.message.includes('402') || (error.response && error.response.status === 402)) {
                alert('Insufficient credits. Redirecting to pricing.')
                navigate('/pricing')
            } else {
                alert('Failed to start interview session.')
            }
        } finally {
            setStarting(false)
        }
    }

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!input.trim() || loading || !sessionId) return

        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)

        try {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const token = authSession?.access_token

            const formData = new FormData()
            formData.append('session_id', sessionId)
            formData.append('user_answer', userMsg)

            const response = await fetch(getApiUrl('/interview/chat'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) throw new Error('Failed to send message')

            const data = await response.json()
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.next_question,
                feedback: data.feedback,
                context_clue: data.context_clue,
                is_final: data.is_final
            }])
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to get response from interviewer.')
        } finally {
            setLoading(false)
        }
    }

    const handleStartRecording = async () => {
        try {
            await recorderRef.current.start()
            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
            alert('Could not access microphone. Please check permissions.')
        }
    }

    const handleStopRecording = async () => {
        try {
            setIsRecording(false)
            setRecordingLoading(true)
            const audioBlob = await recorderRef.current.stop()

            const { data: { session: authSession } } = await supabase.auth.getSession()
            const token = authSession?.access_token

            const formData = new FormData()
            formData.append('audio', audioBlob)

            const response = await fetch(getApiUrl('/interview/transcribe'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) throw new Error('Transcription failed')
            const { text } = await response.json()

            if (text) {
                setInput(text)
            }
        } catch (error) {
            console.error('Error stopping recording:', error)
            alert('Failed to transcribe audio.')
        } finally {
            setRecordingLoading(false)
        }
    }

    const handlePlaySpeech = async (text: string, idx: number) => {
        try {
            setPlayingMessageIdx(idx)
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const token = authSession?.access_token

            const response = await fetch(`${getApiUrl('/interview/speak')}?text=${encodeURIComponent(text)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Speech generation failed')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)

            audio.onended = () => setPlayingMessageIdx(null)
            await audio.play()
        } catch (error) {
            console.error('Error playing speech:', error)
            setPlayingMessageIdx(null)
        }
    }

    if (starting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative p-10 bg-slate-900/80 rounded-full border border-white/10 backdrop-blur-xl">
                        <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
                    </div>
                </div>
                <div className="text-center relative z-10">
                    <h2 className="text-3xl font-black text-white tracking-tight mb-3">Priming Interview Engine</h2>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto">The AI interviewer is synthesizing your background with the target role's technical requirements.</p>
                </div>
            </div>
        )
    }

    const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant')

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 relative">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600/10 blur-[160px] rounded-full" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/10 blur-[160px] rounded-full" />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 sm:mb-10 relative z-10 space-y-4 sm:space-y-0">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center text-slate-400 hover:text-white transition-all font-bold group bg-white/5 px-4 sm:px-6 py-2.5 rounded-2xl border border-white/5 hover:border-white/10 text-xs sm:text-sm"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Evaluation
                </button>
                <div className="flex items-center space-x-3">
                    {/* Category Badge */}
                    <div className="flex items-center space-x-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                        <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            {categoryName}
                        </span>
                    </div>
                    {/* Live Session Badge */}
                    <div className="flex items-center space-x-3 bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Session </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                {/* Chat Column */}
                <div className="lg:col-span-2 flex flex-col h-[75vh] glass-card rounded-[2.5rem] border-white/10 overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b border-white/5 bg-white/5 flex items-center space-x-4 sm:space-x-5">
                        <div className="p-2 sm:p-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-600/20">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">AI Interviewer</h2>
                            <p className="text-[8px] sm:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Senior Technical Lead Persona</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scroll-smooth custom-scrollbar"
                    >
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div className={`max-w-[90%] sm:max-w-[85%] ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[1.5rem] sm:rounded-[2rem] rounded-tr-none py-3 sm:py-4 px-5 sm:px-7 shadow-xl shadow-indigo-500/20'
                                    : 'glass-card border-none bg-white/5 text-slate-200 rounded-[1.5rem] sm:rounded-[2rem] rounded-tl-none py-4 sm:py-5 px-5 sm:px-7'}`}>
                                    <div className="flex justify-between items-start gap-3 sm:gap-4">
                                        <p className="text-sm sm:text-[15px] leading-relaxed font-medium">
                                            {msg.content}
                                        </p>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => handlePlaySpeech(msg.content, idx)}
                                                disabled={playingMessageIdx !== null}
                                                className={`mt-0.5 p-2 rounded-xl transition-all ${playingMessageIdx === idx ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                            >
                                                <Volume2 className={`w-4 h-4 ${playingMessageIdx === idx ? 'animate-pulse' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {msg.role === 'assistant' && msg.context_clue && (
                                        <div className="mt-5 flex items-start space-x-3 bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 group/tip">
                                            <div className="p-1.5 bg-indigo-500/20 rounded-lg group-hover/tip:scale-110 transition-transform">
                                                <Award className="w-3.5 h-3.5 text-indigo-400" />
                                            </div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-tight">
                                                Pro-tip: <span className="text-indigo-200">{msg.context_clue}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="glass-card bg-white/5 rounded-2xl rounded-tl-none py-4 px-7 border-none">
                                    <div className="flex space-x-1.5 items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {messages[messages.length - 1]?.is_final && (
                            <div className="flex flex-col items-center justify-center py-12 px-8 space-y-6 glass-card border-dashed border-2 border-indigo-500/30 rounded-[3rem] bg-indigo-500/5">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />
                                    <div className="relative p-5 bg-slate-900/80 rounded-full border border-indigo-500/30">
                                        <Award className="w-12 h-12 text-indigo-400" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-white tracking-tight mb-2">Interview Completed!</h3>
                                    <p className="text-slate-400 font-medium text-sm max-w-sm">You've successfully navigated the technical gauntlet. Review your real-time analytics for architectural improvements.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/history')}
                                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                                >
                                    Finish & Save Session
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    {!messages[messages.length - 1]?.is_final && (
                        <form
                            onSubmit={handleSend}
                            className="p-4 sm:p-8 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-5"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Respond to interviewer..."
                                disabled={loading}
                                className="flex-1 bg-slate-900/50 border border-white/10 rounded-2xl px-5 sm:px-6 py-3 sm:py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                            />
                            <div className="flex items-center justify-center space-x-3">
                                <button
                                    type="button"
                                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                                    disabled={loading || recordingLoading}
                                    className={`p-3.5 sm:p-4 rounded-2xl transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'}`}
                                >
                                    {recordingLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : (isRecording ? <Square className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />)}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading || isRecording}
                                    className="flex-1 sm:flex-none p-3.5 sm:p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:hover:scale-100 flex justify-center items-center"
                                >
                                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Feedback Column */}
                <div className="space-y-8">
                    <div className="glass-card p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                        <h3 className="text-lg font-black text-white mb-8 flex items-center uppercase tracking-wider">
                            <TrendingUp className="w-5 h-5 mr-3 text-indigo-400" />
                            Live Feedback
                        </h3>

                        {lastAiMessage?.feedback ? (
                            <div className="space-y-6 animate-slide-up">
                                <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Architectural Insight</h4>
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                        {lastAiMessage.feedback}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 opacity-40">
                                <MessageSquare className="w-14 h-14 text-slate-500" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest px-8 leading-relaxed">Awaiting candidate response for analytical processing.</p>
                            </div>
                        )}
                    </div>

                    {/* Interview Tips */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-10 rounded-[2.5rem] text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <h4 className="text-lg font-black mb-6 flex items-center uppercase tracking-wider">
                            <Award className="w-5 h-5 mr-3 text-indigo-400" />
                            Mastery Protocol
                        </h4>
                        <ul className="space-y-5 text-sm font-medium text-slate-300">
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-4 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                <span className="flex-1">Deploy the <span className="text-white font-black">STAR</span> framework for behavioral architectural queries.</span>
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-4 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                <span className="flex-1">Inject <span className="text-white font-black">metrics</span> (e.g., Latency Reduced by 40%) into your results.</span>
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-4 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                <span className="flex-1">Maintain <span className="text-white font-black">concise efficiency</span> without compromising technical depth.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
