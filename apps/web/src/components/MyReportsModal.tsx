import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Clock, CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Report } from '@yol/shared';

export const MyReportsModal: React.FC = () => {
  const { activeTab, setActiveTab, t, token, user, setIsAuthOpen } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyReports = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/reports/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.warn('Failed to load my reports', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-reports' && token) {
      fetchMyReports();
    }
  }, [activeTab, token]);

  if (activeTab !== 'my-reports') return null;

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Under Review</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Published to Map</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-reports-title"
        className="w-full max-w-2xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="my-reports-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                {t('nav.myReports')}
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                Track verification progress of your community road submissions
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('map')}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="py-12 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-accentOrange mb-3" />
            <h3 className="text-lg font-bold text-textPrimary dark:text-darkText">Sign in required</h3>
            <p className="text-sm text-textSecondary dark:text-darkTextSec max-w-sm mt-1">
              Please sign in with your citizen account to view and track your reports.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="mt-5 px-6 py-2.5 rounded-full bg-blackPill text-white font-bold"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-textSecondary dark:text-darkTextSec">
                {t('common.loading')}
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-textSecondary dark:text-darkTextSec">You have not submitted any reports yet.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div 
                  key={report.id}
                  className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-textSecondary uppercase tracking-wider">
                        {report.id} • {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <h4 className="font-bold text-base text-textPrimary dark:text-darkText mt-0.5">
                        {report.title}
                      </h4>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  <p className="text-xs text-textSecondary dark:text-darkTextSec">
                    {report.description || 'No additional details provided.'}
                  </p>

                  {report.statusNotes && (
                    <div className="mt-1 p-2.5 rounded-xl bg-white dark:bg-darkCard text-xs border border-yolBorder dark:border-gray-700">
                      <span className="font-bold text-accentOrange">Editor feedback: </span>
                      <span className="text-textSecondary dark:text-darkTextSec">{report.statusNotes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-textSecondary dark:text-darkTextSec pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Category: <strong className="capitalize text-textPrimary dark:text-darkText">{report.category}</strong></span>
                    <span>Coordinates: {report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
