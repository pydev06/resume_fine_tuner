import { useState, useEffect } from 'react'
import { FileText, Calendar, ChevronRight, Loader2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Resume {
    id: string
    filename: string
    created_at: string
}

interface ResumeLibraryProps {
    onSelect: (resumeId: string, filename: string) => void
    selectedResumeId: string | null
}

export default function ResumeLibrary({ onSelect, selectedResumeId }: ResumeLibraryProps) {
    const [resumes, setResumes] = useState<Resume[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchResumes()
    }, [])

    const fetchResumes = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from('resumes')
                .select('id, filename, created_at')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setResumes(data || [])
        } catch (error) {
            console.error('Error fetching resumes:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredResumes = resumes.filter(r =>
        r.filename.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading && resumes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 glass-card bg-white/5 border-none rounded-2xl">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Scanning Archive...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search your library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredResumes.length === 0 ? (
                    <div className="py-10 text-center glass-card bg-white/5 border-none rounded-2xl">
                        <p className="text-sm text-slate-500 font-medium tracking-tight">No resumes found in your library.</p>
                    </div>
                ) : (
                    filteredResumes.map((resume) => (
                        <button
                            key={resume.id}
                            onClick={() => onSelect(resume.id, resume.filename)}
                            className={`
                                w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group
                                ${selectedResumeId === resume.id
                                    ? 'bg-indigo-600 shadow-xl shadow-indigo-500/20 translate-x-1'
                                    : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'}
                            `}
                        >
                            <div className="flex items-center space-x-4 min-w-0">
                                <div className={`p-2.5 rounded-xl transition-colors ${selectedResumeId === resume.id ? 'bg-white/20' : 'bg-slate-800'}`}>
                                    <FileText className={`w-5 h-5 ${selectedResumeId === resume.id ? 'text-white' : 'text-slate-400'}`} />
                                </div>
                                <div className="text-left min-w-0">
                                    <h4 className={`text-sm font-bold truncate tracking-tight ${selectedResumeId === resume.id ? 'text-white' : 'text-slate-200'}`}>
                                        {resume.filename}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Calendar className={`w-3 h-3 ${selectedResumeId === resume.id ? 'text-indigo-200' : 'text-slate-500'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedResumeId === resume.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                            {new Date(resume.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${selectedResumeId === resume.id ? 'text-white' : 'text-slate-600'}`} />
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
