// client/src/components/dashboard/AIInsightsPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateFinancialInsights, getRecommendations, markRecommendationRead } from '@/lib/firestoreService';
import { AIRecommendation } from '@/types/firestore';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-100 dark:bg-red-900/30'    },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  low:    { label: 'Low',    color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  budget: '💰', investment: '📈', savings: '🏦', spending: '💸',
  general: '💡', emergency_fund: '🛡️', tax: '📋', debt: '⚠️',
};

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIRecommendation[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const fetchExistingInsights = useCallback(async () => {
    try {
      setLoadingExisting(true);
      const data = await getRecommendations(false);
      // Filter to only show AI-generated insights (type === 'ai_generated')
      const aiInsights = (data.recommendations || []).filter(
        (r: AIRecommendation) => r.type === 'ai_generated'
      );
      setInsights(aiInsights);
    } catch (e) {
      console.error('Failed to fetch existing insights:', e);
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingInsights();
  }, [fetchExistingInsights]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateFinancialInsights();
      if (data.insights && data.insights.length > 0) {
        // Prepend new insights to the list
        setInsights(prev => [...data.insights, ...prev]);
      }
    } catch (e: any) {
      const msg = e?.message || 'Unknown error';
      if (msg.includes('GEMINI_API_KEY')) {
        setError('⚙️ Gemini API key not configured. Please add GEMINI_API_KEY to server/app/.env and restart the server.');
      } else {
        setError(`Failed to generate insights: ${msg}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkRead = async (insightId: string) => {
    setMarkingRead(insightId);
    try {
      await markRecommendationRead(insightId);
      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, isRead: true } : i)
      );
    } catch (e) {
      console.error('Failed to mark as read:', e);
    } finally {
      setMarkingRead(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 AI Financial Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Powered by <span className="font-semibold text-blue-600 dark:text-blue-400">Neo</span> — your personal AI finance advisor
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          id="generate-insights-btn"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md
            ${generating
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:shadow-lg active:scale-95'
            }`}
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analysing your finances…
            </>
          ) : (
            <>✨ Generate My Insights</>
          )}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading existing */}
      {loadingExisting ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : insights.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No insights yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Click <strong>✨ Generate My Insights</strong> and Neo will analyse your financial data
            to give you personalised, actionable advice.
          </p>
        </div>
      ) : (
        /* Insight cards */
        <div className="space-y-4">
          {insights.map((insight) => {
            const priority = PRIORITY_CONFIG[insight.priority] ?? PRIORITY_CONFIG.medium;
            const emoji = CATEGORY_EMOJI[insight.category] ?? '💡';
            const isRead = insight.isRead;

            return (
              <div
                key={insight.id}
                className={`rounded-2xl border p-5 transition-all duration-300
                  ${isRead
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                    : 'border-violet-200 dark:border-violet-800 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: emoji + content */}
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0 mt-0.5">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className={`font-semibold text-gray-900 dark:text-white ${isRead ? '' : ''}`}>
                          {insight.title}
                        </h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                          {priority.label}
                        </span>
                        {isRead && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">✓ Read</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                        {insight.description}
                      </p>

                      {insight.suggestedAction && (
                        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2">
                          <span className="text-blue-500 text-sm mt-0.5 flex-shrink-0">→</span>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            {insight.suggestedAction}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: mark-read button */}
                  {!isRead && (
                    <button
                      id={`mark-read-${insight.id}`}
                      onClick={() => handleMarkRead(insight.id)}
                      disabled={markingRead === insight.id}
                      className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 
                                 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 
                                 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      {markingRead === insight.id ? '…' : 'Mark as read'}
                    </button>
                  )}
                </div>

                {/* Footer: timestamp */}
                {insight.createdAt && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pl-12">
                    Generated {new Date(insight.createdAt as unknown as string).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
