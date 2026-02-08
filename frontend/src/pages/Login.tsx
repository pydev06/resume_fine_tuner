import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function Login() {
    const navigate = useNavigate()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN") {
                navigate('/dashboard')
            }
        })
        return () => subscription.unsubscribe()
    }, [navigate])

    return (
        <div className="flex min-h-screen bg-[#020617] relative flex-col justify-center px-6 py-12 lg:px-8 overflow-hidden">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-sm animate-slide-up">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-600/20">
                        <span className="text-white text-xl font-black tracking-tighter">AI</span>
                    </div>
                </div>
                <h2 className="text-center text-3xl font-black tracking-tighter text-white">
                    Access Intelligence
                </h2>
                <p className="mt-2 text-center text-sm font-medium text-slate-400">
                    Sign in to resume analysis
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm glass-card p-10 rounded-[2.5rem] border-white/5 shadow-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#4f46e5',
                                    brandAccent: '#4338ca',
                                    inputBackground: 'rgba(255, 255, 255, 0.05)',
                                    inputText: 'white',
                                    inputBorder: 'rgba(255, 255, 255, 0.1)',
                                    inputPlaceholder: '#94a3b8',
                                }
                            }
                        }
                    }}
                    theme="dark"
                    providers={[]}
                />
            </div>
        </div>
    )
}
