import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Upload, FileText } from 'lucide-react'

export default function Home() {
    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" />
            </div>

            {/* Hero Section */}
            <div className="relative isolate px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl py-24 sm:py-48 lg:py-56 text-center animate-slide-up">
                    <div className="mb-8 flex justify-center">
                        <div className="relative rounded-full px-4 py-1.5 text-xs sm:text-sm leading-6 text-slate-400 ring-1 ring-white/10 bg-white/5 backdrop-blur-xl transition-all hover:ring-white/20 uppercase tracking-widest font-bold">
                            Neural Processing <span className="font-black text-indigo-400 ml-1">v4.0 Alpha</span>
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-tight">
                        Architect Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Perfect Career</span>
                    </h1>
                    <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-400 font-medium px-4">
                        Stop guessing. Get high-fidelity, AI-driven feedback on your resume.
                        Uncover latent skill gaps, bypass ATS gatekeepers, and dominate your interviews.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 hover:-translate-y-1 transition-all flex items-center justify-center group"
                        >
                            Start Analyzing Free
                            <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="text-sm font-black text-slate-400 hover:text-white transition-colors tracking-widest uppercase">
                            Intelligence Report <span aria-hidden="true" className="ml-2 font-light">↓</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Feature Section */}
            <div id="features" className="mx-auto max-w-7xl px-6 lg:px-8 pb-32">
                <div className="mx-auto max-w-2xl text-center mb-20">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Core Capabilities</h2>
                    <p className="text-3xl font-black tracking-tighter text-white sm:text-5xl">Engineered for success</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
                    <div className="glass-card p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] group hover:bg-white/5 transition-colors border-white/5">
                        <div className="mb-6 sm:mb-8 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                            <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4 tracking-tight">Smart Extraction</h3>
                        <p className="text-sm sm:text-slate-400 font-medium leading-relaxed">
                            Deep neural parsing of PDF and DOCX documents with 99.9% semantic accuracy.
                        </p>
                    </div>

                    <div className="glass-card p-10 rounded-[2.5rem] group hover:bg-white/5 transition-colors border-white/5 ring-1 ring-emerald-500/10 scale-105 shadow-2xl shadow-emerald-500/5">
                        <div className="mb-8 w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4 tracking-tight">ATS Infiltration</h3>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Simulate gatekeeper algorithms and optimize keywords for maximum recruiter visibility.
                        </p>
                    </div>

                    <div className="glass-card p-10 rounded-[2.5rem] group hover:bg-white/5 transition-colors border-white/5">
                        <div className="mb-8 w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                            <FileText className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4 tracking-tight">Interview Forge</h3>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Custom-generated technical and behavioral queries based on your unique profile.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
