import React, { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface ResumeUploadProps {
    onFileSelect: (file: File | null) => void
    selectedFile: File | null
}

export default function ResumeUpload({ onFileSelect, selectedFile }: ResumeUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0])
        }
    }, [onFileSelect])

    const handleClick = () => {
        inputRef.current?.click()
    }

    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Resume <span className="text-gray-400 font-normal">(PDF/DOCX)</span>
            </label>

            {!selectedFile ? (
                <div
                    onClick={handleClick}
                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group
                ${dragActive
                            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className={`p-4 rounded-full mb-3 transition-colors ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 shadow-sm group-hover:text-indigo-500 group-hover:shadow-md'}`}>
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="mb-2 text-sm text-gray-600"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400">PDF or DOCX (MAX. 5MB)</p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-xl shadow-sm ring-1 ring-indigo-50/50 animate-fade-in">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onFileSelect(null)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove file"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}
