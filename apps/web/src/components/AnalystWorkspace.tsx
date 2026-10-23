import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';

export const AnalystWorkspace: React.FC = () => {
  const { activeTab, setActiveTab, token } = useApp();
  const [data, setData] = useState<any>(null);
  const [heatmaps, setHeatmaps] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const [ovRes, hmRes] = await Promise.all([
        fetch('/api/v1/analytics/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/analytics/heatmaps', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setData(ovData);
      }
      if (hmRes.ok) {
        const hmData = await hmRes.json();
        setHeatmaps(hmData.points || []);
      }
    } catch (e) {
      console.warn('Analytics fetch error:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'analyst' && token) {
      fetchAnalytics();
    }
  }, [activeTab, token]);

  if (activeTab !== 'analyst') return null;

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Reports', data.metrics.totalReports],
      ['Published to Map', data.metrics.publishedReports],
      ['Under Review', data.metrics.underReviewReports],
      ['Verification Rate (%)', data.metrics.verificationRatePercent],
      ['Average Review Time (min)', data.metrics.averageReviewTimeMinutes]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `yol_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="analyst-workspace-title"
        className="w-full max-w-4xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accentOrange text-white flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="analyst-workspace-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                Mobility & Incident Analytics
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                Aggregated statistics, category frequency, and privacy-preserved spatial density
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-innerSoftArea dark:bg-gray-800 text-xs font-bold text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700 hover:bg-orangeTint hover:text-accentOrange"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {data ? (
          <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1">
            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
                <span className="text-xs text-textSecondary">Total Reports</span>
                <div className="text-2xl font-extrabold text-textPrimary dark:text-darkText mt-1">
                  {data.metrics.totalReports}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
                <span className="text-xs text-textSecondary">Published Hazards</span>
                <div className="text-2xl font-extrabold text-statusSuccess mt-1">
                  {data.metrics.publishedReports}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
                <span className="text-xs text-textSecondary">Verification Rate</span>
                <div className="text-2xl font-extrabold text-accentOrange mt-1">
                  {data.metrics.verificationRatePercent}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
                <span className="text-xs text-textSecondary">Avg. Review Time</span>
                <div className="text-2xl font-extrabold text-textPrimary dark:text-darkText mt-1">
                  {data.metrics.averageReviewTimeMinutes}m
                </div>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className="p-5 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <h3 className="text-sm font-bold text-textPrimary dark:text-darkText mb-3">
                Incident Frequency by Category
              </h3>
              <div className="space-y-2.5">
                {Object.entries(data.categoryBreakdown || {}).map(([cat, count]: [string, any]) => {
                  const percent = Math.min(Math.round((count / (data.metrics.totalReports || 1)) * 100), 100);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="capitalize text-textPrimary dark:text-darkText">{cat}</span>
                        <span className="text-textSecondary">{count} incidents ({percent}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-accentOrange rounded-full transition-all"
                          style={{ width: `${Math.max(percent, 8)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Spatial Clustering Points */}
            <div className="p-5 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <h3 className="text-sm font-bold text-textPrimary dark:text-darkText mb-1">
                Privacy-Preserving Spatial Clusters (Heatmap Points)
              </h3>
              <p className="text-xs text-textSecondary dark:text-darkTextSec mb-3">
                Coordinates are truncated to 3 decimal places to safeguard private individual trip origins.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {heatmaps.slice(0, 6).map((pt, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-darkCard border border-yolBorder dark:border-gray-700 text-xs">
                    <span className="font-mono font-bold text-accentOrange">{pt.lat}, {pt.lon}</span>
                    <div className="text-[10px] text-textSecondary capitalize">Weight: {pt.weight} • {pt.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-textSecondary">
            Loading analytics metrics...
          </div>
        )}
      </div>
    </div>
  );
};
