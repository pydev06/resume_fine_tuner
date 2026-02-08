import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Check,
    Zap,
    Shield,
    ArrowLeft,
    CreditCard,
    Star,
    Sparkles,
    Globe,
    Flag,
    Loader2,
    CheckCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getApiUrl } from '../lib/api'

// Add Razorpay type for TS
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function Pricing() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState<string | null>(null)
    const [region, setRegion] = useState<'IN' | 'GLOBAL'>('IN')

    // Load Razorpay script dynamically
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const plans = [
        {
            id: 'starter',
            name: 'Starter Pack',
            price: region === 'IN' ? '₹499' : '$5',
            credits: '10 Interviews',
            description: 'Perfect for a single job application.',
            features: [
                '10 AI Mock Interviews',
                'Advanced Resume Analysis',
                'STAR Method Feedback',
                'Live Voice Simulation'
            ],
            icon: <Zap className="w-6 h-6 text-yellow-400" />,
            color: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'pro',
            name: 'Pro Pack',
            price: region === 'IN' ? '₹1,299' : '$15',
            credits: '50 Interviews',
            description: 'Best for active job hunters.',
            features: [
                '50 AI Mock Interviews',
                'Unlimited Resume Versions',
                'Executive-Level Feedback',
                'Priority AI Response',
                'PDF/Docx Tailoring'
            ],
            icon: <Star className="w-6 h-6 text-purple-400" />,
            color: 'from-purple-500 to-pink-600',
            popular: true
        }
    ]

    const handleBuy = async (planId: string) => {
        try {
            setLoading(planId)
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            const provider = region === 'IN' ? 'razorpay' : 'lemonsqueezy'

            const response = await fetch(getApiUrl('/payment/create-checkout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: planId,
                    provider: provider
                })
            })

            if (!response.ok) throw new Error('Checkout failed')

            const data = await response.json()

            if (provider === 'razorpay') {
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: data.amount,
                    currency: data.currency,
                    name: 'Resume AI Tuner',
                    description: `Credits: ${data.credits}`,
                    order_id: data.order_id,
                    handler: async (response: any) => {
                        const verifyRes = await fetch(getApiUrl('/payment/verify-razorpay'), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                ...response,
                                credits: data.credits
                            })
                        })
                        if (verifyRes.ok) {
                            navigate('/dashboard?status=success')
                        } else {
                            alert('Payment verification failed. Please contact support.')
                        }
                    },
                    prefill: {
                        email: session?.user?.email
                    },
                    theme: {
                        color: '#6366f1'
                    }
                }
                const rzp = new window.Razorpay(options)
                rzp.open()
            } else {
                window.location.href = data.url
            }

        } catch (error) {
            console.error('Payment error:', error)
            alert('Could not initiate checkout. Please try again.')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 sm:mb-16 gap-6 sm:gap-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center w-full sm:w-auto text-slate-400 hover:text-white transition-all group font-black uppercase tracking-widest text-[10px] sm:text-xs bg-white/5 py-3 rounded-xl sm:bg-transparent sm:py-0 border border-white/5 sm:border-none"
                    >
                        <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>

                    {/* Region Selector */}
                    <div className="bg-white/5 p-1 rounded-2xl flex items-center border border-white/5 backdrop-blur-xl w-full sm:w-auto">
                        <button
                            onClick={() => setRegion('IN')}
                            className={`flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${region === 'IN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Flag className="w-3.5 h-3.5 mr-2" />
                            India (INR)
                        </button>
                        <button
                            onClick={() => setRegion('GLOBAL')}
                            className={`flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${region === 'GLOBAL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Globe className="w-3.5 h-3.5 mr-2" />
                            Global (USD)
                        </button>
                    </div>
                </div>

                <div className="text-center mb-16 sm:mb-20 animate-slide-up">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
                        Forge Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Competitive Edge</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium px-4">
                        Invest in your future with high-fidelity simulations.
                        {region === 'IN' ? ' Instant local checkout via UPI, Cards' : ' Worldwide processing via Lemon Squeezy.'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 glass-card transition-all duration-500 hover:-translate-y-2 border-white/5 shadow-2xll flex flex-col ${plan.popular ? 'border-purple-500/30' : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 whitespace-nowrap">
                                    Priority Choice
                                </div>
                            )}

                            <div className="flex items-center mb-10">
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${plan.color} shadow-lg ring-1 ring-white/20`}>
                                    {plan.icon}
                                </div>
                                <div className="ml-6">
                                    <h3 className="text-2xl font-black tracking-tight text-white">{plan.name}</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-8 sm:mb-10">
                                <div className="flex items-baseline">
                                    <span className="text-5xl sm:text-6xl font-black tracking-tighter">{plan.price}</span>
                                    <span className="text-slate-500 ml-3 text-xs sm:text-sm font-bold tracking-widest uppercase">/ Pack</span>
                                </div>
                                <div className="mt-4 flex items-center text-emerald-400 font-black text-xs uppercase tracking-widest">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {plan.credits}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-12 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-slate-300 group">
                                        <div className="p-1 rounded-lg bg-white/5 mr-4 border border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleBuy(plan.id)}
                                disabled={loading !== null}
                                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/30 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-auto`}
                            >
                                {loading === plan.id ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-3" />
                                        Get Started
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-16 sm:mt-20 flex justify-center">
                    <div className="glass-card px-6 sm:px-10 py-4 sm:py-6 rounded-3xl border-white/5 flex flex-wrap justify-center items-center gap-6 sm:gap-12 opacity-80 backdrop-blur-xl mx-4">
                        <div className="flex items-center space-x-3">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {region === 'IN' ? 'Razorpay Secure' : 'Global LS Gateway'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Certified Evaluation</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
