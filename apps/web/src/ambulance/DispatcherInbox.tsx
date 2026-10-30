import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Truck, 
  Activity, 
  Building2,
  ShieldAlert,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { EmergencyRequest, AmbulanceUnit, Hospital, AmbulanceStaffBinding } from '@yol/shared';
import { ambulanceApi } from './ambulanceApi';

interface DispatcherInboxProps {
  binding?: AmbulanceStaffBinding;
  hospitals: Hospital[];
  ambulances: AmbulanceUnit[];
  pendingRequests?: EmergencyRequest[];
  activeRequest?: EmergencyRequest | null;
  onRefresh: () => void;
}

export const DispatcherInbox: React.FC<DispatcherInboxProps> = ({
  binding,
  hospitals,
  ambulances,
  pendingRequests = [],
  activeRequest,
  onRefresh
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Countdown timers for pending calls (60s acceptance timeout)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updated: Record<string, number> = {};

      pendingRequests.forEach(req => {
        if (req.timeoutAt) {
          const diffMs = new Date(req.timeoutAt).getTime() - now;
          updated[req.id] = Math.max(0, Math.round(diffMs / 1000));
        }
      });

      setTimeRemaining(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRequests]);

  const handleAccept = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await ambulanceApi.acceptRequest(requestId, binding?.hospitalId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chaqiruvni qabul qilishda xatolik');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!window.confirm('Chaqiruvni boshqa yaqin shifoxonaga yo\'naltirishni tasdiqlaysizmi?')) return;
    try {
      setProcessingId(requestId);
      await ambulanceApi.declineRequest(requestId, binding?.hospitalId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chaqiruvni rad etishda xatolik');
    } finally {
      setProcessingId(null);
    }
  };

  const currentHospital = hospitals.find(h => h.id === binding?.hospitalId);
  const freeAmbulancesCount = ambulances.filter(a => a.status === 'free').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Hospital Station Status Bar */}
      <div className="p-4 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
              Dispetcherlik punkti
            </span>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
              {currentHospital?.name || 'Toshkent Tez Yordam Markazi'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-bold text-textSecondary uppercase block">Bo'sh mashinalar</span>
            <span className="font-black text-sm text-emerald-600">
              {freeAmbulancesCount} / {ambulances.length}
            </span>
          </div>
          <button
            onClick={onRefresh}
            title="Yangilash"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-textSecondary"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pending Emergency Calls Inbox */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Kelib tushgan chaqiruvlar ({pendingRequests.length})</span>
          </h2>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold animate-pulse">
              Zudlik bilan qabul qiling
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-6 rounded-card bg-innerSoftArea dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            <p className="text-xs font-semibold text-textSecondary">
              Hozirda yangi kutilayotgan chaqiruvlar yo'q
            </p>
          </div>
        ) : (
          pendingRequests.map(req => {
            const secondsLeft = timeRemaining[req.id] ?? 60;
            const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 60) * 100));

            return (
              <div
                key={req.id}
                className="p-4 rounded-card bg-white dark:bg-darkCard border-2 border-red-500 shadow-md flex flex-col gap-3 animate-fade-in"
              >
                {/* Header & Severity */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900 dark:text-gray-100">
                        #{req.id.slice(4, 10).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        req.severity === 1
                          ? 'bg-red-600 text-white'
                          : req.severity === 2
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        Daraja {req.severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-textSecondary block mt-0.5 font-semibold">
                      Fuqaro: {req.citizenName} {req.citizenPhone ? `• ${req.citizenPhone}` : ''}
                    </span>
                  </div>

                  {/* 60s Acceptance Countdown */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{secondsLeft}s</span>
                  </div>
                </div>

                {/* Acceptance Timer Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Description and Location */}
                <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200">
                  <span className="font-bold text-accentOrange block mb-0.5">Tavsif:</span>
                  <p className="line-clamp-2 leading-relaxed">{req.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-textSecondary font-mono">
                    <MapPin className="w-3.5 h-3.5 text-accentOrange shrink-0" />
                    <span>{req.lat.toFixed(4)}, {req.lon.toFixed(4)}</span>
                  </div>
                </div>

                {/* Accept & Decline Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={processingId === req.id || freeAmbulancesCount === 0}
                    className="py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{processingId === req.id ? 'Qabul qilinmoqda...' : 'Qabul qilish (Eng yaqin)'}</span>
                  </button>

                  <button
                    onClick={() => handleDecline(req.id)}
                    disabled={processingId === req.id}
                    className="py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-textSecondary hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Boshqaga uzatish</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fleet Overview Table */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
          <Truck className="w-4 h-4 text-accentOrange" />
          <span>Shifoxona avtoparki ({ambulances.length})</span>
        </h2>

        <div className="bg-white dark:bg-darkCard rounded-card border border-yolBorder dark:border-darkBorder overflow-hidden shadow-soft">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {ambulances.map(amb => (
              <div key={amb.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-sm">
                    🚑
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-900 dark:text-gray-100 block">
                      {amb.plateNumber}
                    </span>
                    <span className="text-[10px] text-textSecondary font-mono">
                      {amb.id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                    amb.status === 'free'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : amb.status === 'enroute'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 animate-pulse'
                      : amb.status === 'onscene'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {amb.status}
                  </span>
                  {amb.currentRequestId && (
                    <span className="text-[10px] text-textSecondary block mt-0.5">
                      Chaqiruv: #{amb.currentRequestId.slice(4, 8)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
