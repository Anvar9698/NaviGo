import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Activity, 
  Users, 
  FileText, 
  X 
} from 'lucide-react';
import { ProposedMapChange, AuditLogEntry, User } from '@yol/shared';

export const AdminConsole: React.FC = () => {
  const { activeTab, setActiveTab, token, user, refreshData, features } = useApp();
  const [proposals, setProposals] = useState<ProposedMapChange[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [adminTab, setAdminTab] = useState<'proposals' | 'features' | 'providers' | 'audit' | 'users'>('proposals');

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [propRes, auditRes, provRes, usrRes] = await Promise.all([
        fetch('/api/v1/editor/map-changes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/audit-log', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/provider-health', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (propRes.ok) {
        const data = await propRes.json();
        setProposals(data.proposals || []);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
      if (provRes.ok) {
        const data = await provRes.json();
        setProviders(data.providers || []);
      }
      if (usrRes.ok) {
        const data = await usrRes.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.warn('Error loading admin data:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && token) {
      fetchAdminData();
    }
  }, [activeTab, token]);

  if (activeTab !== 'admin') return null;

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/map-changes/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Map change published transactionally!');
        fetchAdminData();
        refreshData();
      }
    } catch (e) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please specify rejection reason:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/v1/admin/map-changes/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      alert('Rejection failed');
    }
  };

  const handleRollback = async (featureId: string) => {
    if (!confirm('Are you sure you want to deactivate/rollback this map feature?')) return;
    try {
      const res = await fetch(`/api/v1/admin/features/${featureId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Feature rolled back.');
        refreshData();
      }
    } catch (e) {
      alert('Rollback failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-console-title"
        className="w-full max-w-4xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accentOrange text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-console-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                Administrator Console
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                Map update authorizations, audit trail, provider telemetry & user governance
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

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-yolBorder dark:border-darkBorder overflow-x-auto">
          {[
            { id: 'proposals', label: `Pending Approvals (${proposals.filter(p => p.status === 'PENDING_APPROVAL').length})` },
            { id: 'features', label: `Published Features (${features.length})` },
            { id: 'providers', label: 'Provider Health' },
            { id: 'audit', label: 'Audit Log' },
            { id: 'users', label: 'User Governance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                adminTab === tab.id
                  ? 'bg-blackPill text-white'
                  : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary dark:text-darkTextSec'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {/* 1. Pending Proposals */}
          {adminTab === 'proposals' && (
            <div className="space-y-3">
              {proposals.length === 0 ? (
                <div className="py-12 text-center text-textSecondary">No proposals pending review.</div>
              ) : (
                proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orangeTint text-accentOrange uppercase font-bold">
                          {prop.changeType}
                        </span>
                        <span className="text-xs text-textSecondary">ID: {prop.id}</span>
                      </div>
                      <h4 className="font-bold text-base text-textPrimary dark:text-darkText mt-1">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-textSecondary dark:text-darkTextSec mt-0.5">
                        {prop.description}
                      </p>
                      <div className="text-[11px] text-textSecondary mt-2">
                        Location: {prop.latitude.toFixed(4)}, {prop.longitude.toFixed(4)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {prop.status === 'PENDING_APPROVAL' ? (
                        <>
                          <button
                            onClick={() => handleApprove(prop.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-statusSuccessBg text-statusSuccess border border-green-300 text-xs font-bold hover:bg-green-100"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve & Publish</span>
                          </button>
                          <button
                            onClick={() => handleReject(prop.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-statusDangerBg text-statusDanger border border-red-300 text-xs font-bold hover:bg-red-100"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          prop.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {prop.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Published Features with Rollback */}
          {adminTab === 'features' && (
            <div className="space-y-3">
              {features.map((feat) => (
                <div
                  key={feat.id}
                  className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-accentOrange uppercase">
                      [{feat.source}] {feat.featureType}
                    </span>
                    <h4 className="font-bold text-sm text-textPrimary dark:text-darkText mt-0.5">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-textSecondary dark:text-darkTextSec">
                      {feat.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRollback(feat.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-innerSoftArea hover:bg-statusDangerBg hover:text-statusDanger text-xs font-bold border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 3. Provider Health Telemetry */}
          {adminTab === 'providers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {providers.map((p) => (
                <div
                  key={p.providerName}
                  className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-textPrimary dark:text-darkText">
                      {p.providerName}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'ONLINE'
                        ? 'bg-statusSuccessBg text-statusSuccess'
                        : 'bg-statusWarningBg text-statusWarning'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-textSecondary dark:text-darkTextSec mt-2">
                    {p.message}
                  </p>
                  <div className="flex justify-between text-[11px] text-textSecondary mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Latency: {p.latencyMs}ms</span>
                    <span>Last check: {new Date(p.lastSync).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. Audit Log */}
          {adminTab === 'audit' && (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-start justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-accentOrange uppercase">{log.action}</span>
                    <p className="text-textPrimary dark:text-darkText mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-textSecondary">By {log.actorEmail} ({log.actorRole})</span>
                  </div>
                  <span className="text-[10px] text-textSecondary whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 5. User Governance */}
          {adminTab === 'users' && (
            <div className="space-y-2">
              {usersList.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-textPrimary dark:text-darkText">{u.name}</div>
                    <div className="text-xs text-textSecondary">{u.email}</div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blackPill text-white uppercase">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
