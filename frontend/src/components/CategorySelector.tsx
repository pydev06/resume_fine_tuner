import { useState, useEffect } from 'react'
import { Code2, Network, Server, Database, Layout, Users, Sparkles, ArrowRight } from 'lucide-react'
import { getApiUrl } from '../lib/api'
import { supabase } from '../lib/supabase'

interface Category {
    id: string
    name: string
    slug: string
    description: string
    icon: string
    color: string
    gradient: string
}

interface CategorySelectorProps {
    onSelect: (slug: string) => void
    selectedSlug?: string
    domain?: string
}

const iconMap: Record<string, any> = {
    'Code2': Code2,
    'Network': Network,
    'Server': Server,
    'Database': Database,
    'Layout': Layout,
    'Users': Users,
    'Sparkles': Sparkles
}

export default function CategorySelector({ onSelect, selectedSlug = 'generic', domain = 'technology' }: CategorySelectorProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(selectedSlug)

    useEffect(() => {
        fetchCategories()
    }, [domain])

    const fetchCategories = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const url = domain
                ? getApiUrl(`/interview/categories?domain=${domain}`)
                : getApiUrl('/interview/categories')

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch categories: ${response.status}`)
            }

            const data = await response.json()
            setCategories(data.categories || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (slug: string) => {
        setSelected(slug)
        onSelect(slug)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Interview Focus
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map(category => {
                    const IconComponent = iconMap[category.icon] || Sparkles
                    const isSelected = selected === category.slug

                    return (
                        <button
                            key={category.id}
                            onClick={() => handleSelect(category.slug)}
                            className={`p-4 rounded-2xl border transition-all group ${isSelected
                                    ? `bg-gradient-to-br ${category.gradient} border-transparent text-white shadow-lg scale-105`
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex flex-col items-center space-y-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white/5'
                                    }`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-center leading-tight">
                                    {category.name}
                                </p>
                            </div>
                            {isSelected && (
                                <div className="mt-2 flex items-center justify-center text-xs opacity-75">
                                    <span>Selected</span>
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Description of selected category */}
            {categories.find(c => c.slug === selected) && (
                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        <span className="font-bold text-indigo-400">
                            {categories.find(c => c.slug === selected)?.name}:
                        </span>{' '}
                        {categories.find(c => c.slug === selected)?.description}
                    </p>
                </div>
            )}
        </div>
    )
}
