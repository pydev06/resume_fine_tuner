import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Send,
    ArrowLeft,
    MessageSquare,
    TrendingUp,
    Award,
    Loader2,
    CheckCircle2,
    Users
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getApiUrl } from '../lib/api'

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
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [starting, setStarting] = useState(true)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (evaluationId) {
            startSession()
        }
    }, [evaluationId])

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
        } catch (error) {
            console.error('Error starting session:', error)
            alert('Failed to start interview session.')
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

    if (starting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <h2 className="text-xl font-bold text-gray-900">Setting up the Interview Room...</h2>
                <p className="text-gray-500">The AI interviewer is reviewing your resume and the job description.</p>
            </div>
        )
    }

    const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant')

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Evaluation
                </button>
                <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-700">Interview Session Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chat Column */}
                <div className="lg:col-span-2 flex flex-col h-[70vh] bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center space-x-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">AI Interviewer</h2>
                            <p className="text-xs text-gray-500 font-medium">Senior Hiring Manager Persona</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                    >
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none py-3 px-5 shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-800 rounded-2xl rounded-tl-none py-4 px-6 border border-gray-100'}`}>
                                    <p className="text-sm md:text-base leading-relaxed">
                                        {msg.content}
                                    </p>

                                    {msg.role === 'assistant' && msg.context_clue && (
                                        <div className="mt-4 flex items-start space-x-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                            <Award className="w-4 h-4 text-indigo-600 mt-0.5" />
                                            <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                                                Pro-tip: {msg.context_clue}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-gray-50 rounded-2xl rounded-tl-none py-4 px-6 border border-gray-100">
                                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                </div>
                            </div>
                        )}
                        {messages[messages.length - 1]?.is_final && (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/20">
                                <Award className="w-12 h-12 text-indigo-600" />
                                <h3 className="text-xl font-bold text-gray-900">Interview Completed!</h3>
                                <p className="text-gray-500 text-center px-6">You've reached the end of this mock session. Review your feedback to improve further.</p>
                                <button
                                    onClick={() => navigate('/history')}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Finish & Save
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    {!messages[messages.length - 1]?.is_final && (
                        <form
                            onSubmit={handleSend}
                            className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center space-x-4"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your answer here..."
                                disabled={loading}
                                className="flex-1 bg-white border border-gray-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-0.5"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </form>
                    )}
                </div>

                {/* Feedback Column */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-3 text-indigo-600" />
                            Real-time Feedback
                        </h3>

                        {lastAiMessage?.feedback ? (
                            <div className="space-y-4 animate-slide-up">
                                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Reviewing your performance</h4>
                                    </div>
                                    <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                                        {lastAiMessage.feedback}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <MessageSquare className="w-12 h-12 text-gray-200" />
                                <p className="text-gray-400 text-sm px-4">The AI interviewer will provide feedback on your answers right here.</p>
                            </div>
                        )}
                    </div>

                    {/* Interview Tips */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200/50">
                        <h4 className="font-bold mb-4 flex items-center">
                            <Award className="w-5 h-5 mr-3" />
                            Star Interview Tips
                        </h4>
                        <ul className="space-y-4 text-sm text-indigo-50 font-medium">
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mr-3 mt-2 flex-shrink-0" />
                                Use the STAR method (Situation, Task, Action, Result) for behavioral questions.
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mr-3 mt-2 flex-shrink-0" />
                                Quantify your achievements (e.g., "Increased sales by 20%").
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mr-3 mt-2 flex-shrink-0" />
                                Keep your answers concise but comprehensive.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
