import { useState, useEffect } from 'react'
import { Code2, Heart, HardHat, DollarSign, GraduationCap, Scale, Megaphone, TrendingUp, Sparkles } from 'lucide-react'
import { getApiUrl } from '../lib/api'
import { supabase } from '../lib/supabase'

interface Domain {
    id: string
    name: string
    slug: string
    description: string
    icon: string
    color: string
}

interface DomainSelectorProps {
    onSelect: (slug: string) => void
    selectedSlug?: string
    evaluationId?: string
    autoDetect?: boolean
}

const iconMap: Record<string, any> = {
    'Code2': Code2,
    'Heart': Heart,
    'HardHat': HardHat,
    'DollarSign': DollarSign,
    'GraduationCap': GraduationCap,
    'Scale': Scale,
    'Megaphone': Megaphone,
    'TrendingUp': TrendingUp,
    'Sparkles': Sparkles
}

export default function DomainSelector({ onSelect, selectedSlug, evaluationId, autoDetect = true }: DomainSelectorProps) {
    const [domains, setDomains] = useState<Domain[]>([])
    const [loading, setLoading] = useState(true)
    const [detecting, setDetecting] = useState(false)
    const [selected, setSelected] = useState(selectedSlug || 'technology')
    const [confidence, setConfidence] = useState<number | null>(null)

    useEffect(() => {
        fetchDomains()
        if (autoDetect && evaluationId) {
            detectDomain()
        }
    }, [evaluationId])

    const fetchDomains = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const response = await fetch(getApiUrl('/interview/domains'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch domains: ${response.status}`)
            }

            const data = await response.json()
            setDomains(data.domains || [])
        } catch (error) {
            console.error('Error fetching domains:', error)
        } finally {
            setLoading(false)
        }
    }

    const detectDomain = async () => {
        if (!evaluationId) return

        try {
            setDetecting(true)
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const formData = new FormData()
            formData.append('evaluation_id', evaluationId)

            const response = await fetch(getApiUrl('/interview/detect-domain'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) {
                throw new Error(`Failed to detect domain: ${response.status}`)
            }

            const data = await response.json()
            setSelected(data.domain)
            setConfidence(data.confidence)
            onSelect(data.domain)
        } catch (error) {
            console.error('Error detecting domain:', error)
            // Default to technology on error
            setSelected('technology')
            onSelect('technology')
        } finally {
            setDetecting(false)
        }
    }

    const handleSelect = (slug: string) => {
        setSelected(slug)
        setConfidence(null) // Clear auto-detection confidence
        onSelect(slug)
    }

    if (loading || detecting) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    {detecting && (
                        <p className="text-xs text-slate-400 font-medium">
                            Analyzing your profile...
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Professional Domain
                </h4>
                {confidence && confidence > 0.6 && (
                    <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            Auto-Detected ({Math.round(confidence * 100)}%)
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {domains.map(domain => {
                    const IconComponent = iconMap[domain.icon] || Sparkles
                    const isSelected = selected === domain.slug

                    return (
                        <button
                            key={domain.id}
                            onClick={() => handleSelect(domain.slug)}
                            className={`p-4 rounded-2xl border transition-all group ${isSelected
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-lg scale-105'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex flex-col items-center space-y-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white/5'
                                    }`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-center leading-tight">
                                    {domain.name}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Description of selected domain */}
            {domains.find(d => d.slug === selected) && (
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        <span className="font-bold text-indigo-400">
                            {domains.find(d => d.slug === selected)?.name}:
                        </span>{' '}
                        {domains.find(d => d.slug === selected)?.description}
                    </p>
                </div>
            )}
        </div>
    )
}
