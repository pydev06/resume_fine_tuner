import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, History } from 'lucide-react'

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen font-sans text-slate-100 selection:bg-indigo-500/30">
            <header className="sticky top-0 z-50 bg-[#020617]/50 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <span className="text-white text-xs font-black tracking-tighter">AI</span>
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Resume Analyzer
                        </h1>
                    </Link>
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                        <Link
                            to="/dashboard"
                            className={`flex items-center space-x-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive('/dashboard')
                                ? 'bg-white/10 text-white border border-white/10 shadow-inner'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <Link
                            to="/history"
                            className={`flex items-center space-x-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive('/history')
                                ? 'bg-white/10 text-white border border-white/10 shadow-inner'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            <span className="hidden sm:inline">History</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-semibold text-slate-400 hover:text-red-400 transition-all px-3 sm:px-5 py-2.5 hover:bg-red-400/10 rounded-xl"
                        >
                            <span className="sm:hidden">Exit</span>
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Outlet />
            </main>
        </div>
    )
}
