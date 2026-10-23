import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Edit3, CheckCircle, XCircle, AlertTriangle, Send, X, Layers } from 'lucide-react';
import { Report, ProposedMapChange } from '@yol/shared';

export const EditorWorkspace: React.FC = () => {
  const { activeTab, setActiveTab, token, refreshData } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isProposing, setIsProposing] = useState(false);

  // Proposal form fields
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propType, setPropType] = useState<ProposedMapChange['changeType']>('add_hazard');

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/editor/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.warn('Failed to fetch editor reports', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'editor' && token) {
      fetchReports();
    }
  }, [activeTab, token]);

  if (activeTab !== 'editor') return null;

  const handleTriage = async (reportId: string, status: 'UNDER_REVIEW' | 'REJECTED' | 'APPROVED') => {
    try {
      const res = await fetch(`/api/v1/editor/reports/${reportId}/triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes: `Triaged by editor as ${status}` })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      alert('Triage error');
    }
  };

  const handleProposeMapChange = async () => {
    if (!selectedReport) return;
    try {
      const res = await fetch('/api/v1/editor/map-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          changeType: propType,
          title: propTitle || selectedReport.title,
          description: propDesc || selectedReport.description,
          latitude: selectedReport.latitude,
          longitude: selectedReport.longitude,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        })
      });

      if (res.ok) {
        alert('Proposed map change successfully submitted to Administrator queue!');
        setIsProposing(false);
        fetchReports();
        refreshData();
      }
    } catch (e) {
      alert('Failed to submit proposal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-workspace-title"
        className="w-full max-w-4xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accentOrange text-white flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="editor-workspace-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                Road Verification Editor Workspace
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                Triage incoming community reports, verify evidence, and draft proposed map updates
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

        {/* Reports Queue */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {reports.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blackPill text-white uppercase">
                      {r.category}
                    </span>
                    <span className="text-xs text-textSecondary">{r.id}</span>
                    {r.duplicateOfId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        Duplicate of {r.duplicateOfId}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-base text-textPrimary dark:text-darkText mt-1">
                    {r.title}
                  </h4>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  r.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  r.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {r.status}
                </span>
              </div>

              <p className="text-xs text-textSecondary dark:text-darkTextSec">
                {r.description || 'No additional note'}
              </p>

              <div className="text-[11px] text-textSecondary">
                Coords: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)} • Urgency: {r.severity}
              </div>

              {/* Editor Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleTriage(r.id, 'UNDER_REVIEW')}
                  className="px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold hover:bg-yellow-200"
                >
                  Mark Under Review
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(r);
                    setPropTitle(r.title);
                    setPropDesc(r.description);
                    setIsProposing(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Propose Map Change</span>
                </button>
                <button
                  onClick={() => handleTriage(r.id, 'REJECTED')}
                  className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200"
                >
                  Reject Report
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Sub-drawer: Formulate Proposed Map Change */}
        {isProposing && selectedReport && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-darkCard rounded-card p-6 shadow-float border border-yolBorder dark:border-gray-700">
              <h3 className="text-lg font-bold text-textPrimary dark:text-darkText mb-1">
                Draft Proposed Map Change
              </h3>
              <p className="text-xs text-textSecondary dark:text-darkTextSec mb-4">
                This proposal will be submitted to Administrator review before appearing on the public map.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-textSecondary block mb-1">Change Type</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-xs text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700"
                  >
                    <option value="add_hazard">Hazard Marker</option>
                    <option value="closure">Road Closure</option>
                    <option value="lane_restriction">Lane Restriction / Road Work</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-textSecondary block mb-1">Title</label>
                  <input
                    type="text"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-xs text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-textSecondary block mb-1">Public Description</label>
                  <textarea
                    rows={3}
                    value={propDesc}
                    onChange={(e) => setPropDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-xs text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setIsProposing(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-textSecondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProposeMapChange}
                  className="px-6 py-2 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover"
                >
                  Submit for Admin Approval
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
