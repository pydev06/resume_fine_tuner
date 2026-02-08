import React, { useState, useCallback } from 'react'
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react'

interface ResumeUploadProps {
    onFileSelect: (file: File | null) => void
    selectedFile: File | null
}

export default function ResumeUpload({ onFileSelect, selectedFile }: ResumeUploadProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0])
        }
    }, [onFileSelect])

    return (
        <div className="space-y-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-upload')?.click()}
                className={`
                    relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 group
                    ${isDragging
                        ? 'border-indigo-400 bg-indigo-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-white/5 hover:bg-white/10'
                    }
                    ${selectedFile ? 'py-6 px-4' : 'py-12 px-6'}
                `}
            >
                <input
                    id="resume-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onFileSelect(file)
                    }}
                />

                <div className="flex flex-col items-center text-center">
                    {selectedFile ? (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h4 className="font-bold text-white mb-1 truncate max-w-[200px]">
                                {selectedFile.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onFileSelect(null)
                                }}
                                className="mt-4 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center space-x-1"
                            >
                                <X className="w-3 h-3" />
                                <span>Remove File</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-indigo-400' : 'text-slate-500'}`} />
                            </div>
                            <h4 className="font-bold text-white mb-2 tracking-tight">
                                {isDragging ? 'Drop to Upload' : 'Choose Resume'}
                            </h4>
                            <p className="text-sm text-slate-400 font-medium max-w-[180px] leading-relaxed">
                                PDF, DOC, DOCX up to 10MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white/5 px-3 py-2 rounded-xl">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Parsable</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white/5 px-3 py-2 rounded-xl">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>ATS Verified</span>
                </div>
            </div>
        </div>
    )
}
