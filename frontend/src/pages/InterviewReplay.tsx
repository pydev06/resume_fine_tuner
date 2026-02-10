import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getInterviewAnalytics,
    getInterviewReplay,
    getImprovements,
    analyzeInterview
} from '../lib/api';
import type { InterviewAnalytics, ReplayData, ImprovementsData } from '../types/interview';
import MetricsOverview from '../components/interview/MetricsOverview';
import ReplayTimeline from '../components/interview/ReplayTimeline';
import PerformanceChart from '../components/interview/PerformanceChart';
import ImprovementPanel from '../components/interview/ImprovementPanel';

type TabType = 'overview' | 'replay' | 'insights' | 'improvements';

export default function InterviewReplay() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [analytics, setAnalytics] = useState<InterviewAnalytics | null>(null);
    const [replayData, setReplayData] = useState<ReplayData | null>(null);
    const [improvements, setImprovements] = useState<ImprovementsData | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<number>(1);

    useEffect(() => {
        if (sessionId) {
            loadAnalytics();
        }
    }, [sessionId]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to fetch existing analytics
            try {
                const analyticsResponse = await getInterviewAnalytics(sessionId!);
                setAnalytics(analyticsResponse.analytics);

                // Load replay and improvements data
                const [replayResponse, improvementsResponse] = await Promise.all([
                    getInterviewReplay(sessionId!),
                    getImprovements(sessionId!)
                ]);

                setReplayData(replayResponse);
                setImprovements(improvementsResponse);
            } catch (err) {
                // Analytics don't exist, need to trigger analysis
                console.log('No analytics found, need to analyze');
                setError('Analysis not found. Click "Analyze Interview" to generate insights.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            setError(null);

            await analyzeInterview(sessionId!);

            // Reload analytics after analysis completes
            await loadAnalytics();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze interview');
        } finally {
            setAnalyzing(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'replay', label: 'Replay', icon: '🎬' },
        { id: 'insights', label: 'Insights', icon: '📈' },
        { id: 'improvements', label: 'Improvements', icon: '🎯' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error && !analytics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">🤖</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Analysis Required</h2>
                    <p className="text-white/80 mb-6">{error}</p>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzing ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Analyzing...
                            </span>
                        ) : (
                            '🚀 Analyze Interview'
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="w-full mt-3 text-white/60 hover:text-white transition-colors"
                    >
                        ← Back to History
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/history')}
                        className="text-white/60 hover:text-white transition-colors mb-4 flex items-center gap-2"
                    >
                        ← Back to History
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">Interview Replay & Analysis</h1>
                    <p className="text-white/60">Session ID: {sessionId}</p>
                </div>

                {/* Tabs */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 mb-6 flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id
                                ? 'bg-white text-indigo-900'
                                : 'text-white hover:bg-white/10'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-fadeIn">
                    {activeTab === 'overview' && analytics && (
                        <MetricsOverview analytics={analytics} />
                    )}

                    {activeTab === 'replay' && replayData && (
                        <div className="space-y-6">
                            <ReplayTimeline
                                timeline={replayData.timeline}
                                selectedQuestion={selectedQuestion}
                                onSelectQuestion={setSelectedQuestion}
                            />
                        </div>
                    )}

                    {activeTab === 'insights' && replayData && (
                        <PerformanceChart timeline={replayData.timeline} />
                    )}

                    {activeTab === 'improvements' && improvements && (
                        <ImprovementPanel improvements={improvements} />
                    )}
                </div>
            </div>
        </div>
    );
}
