import { Link as LinkIcon, Type } from 'lucide-react'

interface JobDescriptionInputProps {
    jdText: string
    setJdText: (text: string) => void
    jdUrl: string
    setJdUrl: (url: string) => void
    jobTitle: string
    setJobTitle: (title: string) => void
    companyName: string
    setCompanyName: (name: string) => void
    activeTab: 'text' | 'url'
    setActiveTab: (tab: 'text' | 'url') => void
}

export default function JobDescriptionInput({
    jdText, setJdText,
    jdUrl, setJdUrl,
    jobTitle, setJobTitle,
    companyName, setCompanyName,
    activeTab, setActiveTab
}: JobDescriptionInputProps) {
    return (
        <div className="space-y-4">
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'text'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Type className="w-3.5 h-3.5" />
                    <span>Paste JD</span>
                </button>
                <button
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'url'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Link URL</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Job Title *"
                        className="w-full bg-white/5 border border-slate-700/50 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/20 transition-all font-medium"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company Name *"
                        className="w-full bg-white/5 border border-slate-700/50 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/20 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="relative group">
                {activeTab === 'text' ? (
                    <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="e.g. Seeking a Senior Software Engineer with specialization in React and Node.js..."
                        className="w-full h-40 bg-white/5 border border-slate-700/50 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/20 transition-all resize-none font-medium"
                    />
                ) : (
                    <div className="flex items-center relative">
                        <LinkIcon className="absolute left-4 w-4 h-4 text-slate-500" />
                        <input
                            type="url"
                            value={jdUrl}
                            onChange={(e) => setJdUrl(e.target.value)}
                            placeholder="https://linkedin.com/jobs/view/..."
                            className="w-full bg-white/5 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/20 transition-all font-medium"
                        />
                    </div>
                )}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>
        </div>
    )
}
