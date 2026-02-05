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
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                        <span className="p-1 bg-indigo-600 text-white rounded-md text-sm font-black">AI</span> Resume Analyzer
                    </h1>
                    <nav className="flex items-center space-x-2">
                        <Link
                            to="/dashboard"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive('/dashboard')
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            to="/history"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive('/history')
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            <span>History</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 hover:bg-gray-100 rounded-full"
                        >
                            Sign Out
                        </button>
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <Outlet />
            </main>
        </div>
    )
}
