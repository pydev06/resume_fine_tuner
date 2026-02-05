import { Link as LinkIcon, FileType } from 'lucide-react'

interface JobDescriptionInputProps {
    jdText: string
    setJdText: (text: string) => void
    jdUrl: string
    setJdUrl: (url: string) => void
    activeTab: 'text' | 'url'
    setActiveTab: (tab: 'text' | 'url') => void
}

export default function JobDescriptionInput({
    jdText, setJdText,
    jdUrl, setJdUrl,
    activeTab, setActiveTab
}: JobDescriptionInputProps) {
    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
                Job Description
            </label>

            <div className="flex space-x-2 mb-3 bg-gray-100/50 p-1 rounded-lg w-fit">
                <button
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${activeTab === 'text'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}
                    onClick={() => setActiveTab('text')}
                >
                    <FileType className="w-4 h-4 mr-2" />
                    Paste Text
                </button>
                <button
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${activeTab === 'url'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}
                    onClick={() => setActiveTab('url')}
                >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Job URL
                </button>
            </div>

            {activeTab === 'text' ? (
                <textarea
                    className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 min-h-[150px] p-4 transition-all resize-y bg-gray-50/30 focus:bg-white"
                    placeholder="Paste the full job description here..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                />
            ) : (
                <div className="animate-fade-in">
                    <input
                        type="url"
                        className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-4 transition-all bg-gray-50/30 focus:bg-white"
                        placeholder="https://linkedin.com/jobs/..."
                        value={jdUrl}
                        onChange={(e) => setJdUrl(e.target.value)}
                    />
                    <p className="mt-3 text-xs text-gray-500 ml-1">
                        Enter the direct link to the job posting. We'll extract the details for you.
                    </p>
                </div>
            )}
        </div>
    )
}
