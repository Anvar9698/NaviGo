import React, { useState } from 'react';
import { 
  PhoneCall, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  MapPin, 
  ShieldAlert, 
  XCircle,
  Truck,
  Building2,
  Navigation
} from 'lucide-react';
import { EmergencyRequest, EmergencySeverity, Hospital, AmbulanceUnit } from '@yol/shared';
import { ambulanceApi } from './ambulanceApi';
import { useApp } from '../context/AppContext';

interface CitizenRequestProps {
  activeRequest?: EmergencyRequest | null;
  assignedAmbulance?: AmbulanceUnit | null;
  hospitals: Hospital[];
  onRefresh: () => void;
}

export const CitizenRequest: React.FC<CitizenRequestProps> = ({
  activeRequest,
  assignedAmbulance,
  hospitals,
  onRefresh
}) => {
  const { userCoords, t } = useApp();
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<EmergencySeverity>(1);
  const [phone, setPhone] = useState('+998 ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 3) {
      setErrorMsg('Iltimos bemor holatini qisqacha tavsiflang (kamida 3 ta belgi).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await ambulanceApi.createRequest({
        lat: userCoords.lat,
        lon: userCoords.lon,
        description: description.trim(),
        severity,
        citizenPhone: phone.trim()
      });
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    if (!window.confirm('Haqiqatdan ham tez yordam chaqiruvini bekor qilmoqchimisiz?')) return;

    try {
      setIsCancelling(true);
      await ambulanceApi.cancelRequest(activeRequest.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chaqiruvni bekor qilishda xatolik');
    } finally {
      setIsCancelling(false);
    }
  };

  const assignedHospital = hospitals.find(
    h => h.id === activeRequest?.assignedHospitalId || h.id === activeRequest?.targetHospitalId
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 103 Emergency Hotline Call Out */}
      <div className="p-4 rounded-card bg-red-50 dark:bg-red-950/40 border-2 border-red-500 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
              Favqulodda bevosita aloqa
            </div>
            <div className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              Tez tibbiy yordam dispetcheri
            </div>
          </div>
        </div>
        <a
          href="tel:103"
          className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>103</span>
        </a>
      </div>

      {/* Active Request Live Tracking Card */}
      {activeRequest ? (
        <div className="p-5 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
                Chaqiruv holati
              </span>
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
                #{activeRequest.id.slice(4, 10).toUpperCase()}
              </h2>
            </div>

            <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
              activeRequest.status === 'enroute'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse'
                : activeRequest.status === 'onscene'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : activeRequest.status === 'assigned'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
            }`}>
              {activeRequest.status === 'enroute' && <Truck className="w-3.5 h-3.5 animate-bounce" />}
              {activeRequest.status === 'onscene' && <CheckCircle className="w-3.5 h-3.5" />}
              {activeRequest.status === 'pending' && <Clock className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {activeRequest.status === 'pending' && 'Shifoxonaga uzatilmoqda...'}
                {activeRequest.status === 'assigned' && 'Mashina biriktirildi'}
                {activeRequest.status === 'enroute' && 'Tez yordam yo\'lda!'}
                {activeRequest.status === 'onscene' && 'Yetib keldi'}
                {activeRequest.status === 'unassigned' && 'Band (103 ga qo\'ng\'iroq qiling)'}
              </span>
            </div>
          </div>

          {/* Assigned Ambulance and ETA details */}
          {activeRequest.status === 'enroute' || activeRequest.status === 'assigned' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800">
                <span className="text-[10px] font-bold text-textSecondary uppercase block">Taxminiy kelish</span>
                <span className="text-xl font-black text-accentOrange">
                  ~{activeRequest.etaMinutes || 8} daqiqa
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800">
                <span className="text-[10px] font-bold text-textSecondary uppercase block">Mashina raqami</span>
                <span className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                  {assignedAmbulance?.plateNumber || '103 Ekipaj'}
                </span>
              </div>
            </div>
          ) : null}

          {/* Hospital info */}
          {assignedHospital && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">
                  {assignedHospital.name}
                </span>
                <span className="text-[10px] text-textSecondary">
                  {assignedHospital.address || 'Markaziy shoshilinch yordam punkti'}
                </span>
              </div>
            </div>
          )}

          {/* Hazard warnings if route passes roadworks or closures */}
          {activeRequest.hazardWarnings && activeRequest.hazardWarnings.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 dark:text-amber-200 leading-tight">
                <span className="font-bold">Yo'l ogohlantirishi: </span>
                {activeRequest.hazardWarnings.join('; ')}
              </div>
            </div>
          )}

          {/* Cancel button */}
          {['pending', 'assigned'].includes(activeRequest.status) && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="mt-2 w-full py-2.5 rounded-full border border-red-300 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{isCancelling ? 'Bekor qilinmoqda...' : 'Chaqiruvni bekor qilish'}</span>
            </button>
          )}
        </div>
      ) : (
        /* Emergency Request Submission Form */
        <form onSubmit={handleSubmit} className="p-5 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col gap-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
              Tez tibbiy yordam chaqirish
            </h2>
            <p className="text-xs text-textSecondary dark:text-darkTextSec mt-0.5">
              Eng yaqin bo'sh brigadaga avtomatik marshrut va chaqiruv yo'naltiriladi
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Severity Selector */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
              Holat darajasi:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity(1)}
                className={`p-2.5 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all ${
                  severity === 1
                    ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400'
                    : 'bg-white dark:bg-gray-800 text-red-600 border-red-200 dark:border-red-900/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>1 - Hayotiy xavf</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity(2)}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  severity === 2
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
                    : 'bg-white dark:bg-gray-800 text-amber-600 border-amber-200 dark:border-amber-900/50'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>2 - Og'ir holat</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity(3)}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  severity === 3
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white dark:bg-gray-800 text-emerald-600 border-emerald-200 dark:border-emerald-900/50'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>3 - Shoshilinch emas</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Bemor holati va alomatlari:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masalan: 45 yoshli erkak, hushidan ketdi, ko'krak qafasida o'tkir og'riq..."
              rows={3}
              maxLength={500}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border border-yolBorder dark:border-gray-700 bg-innerSoftArea dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-accentOrange transition-all"
            />
            <div className="flex justify-between items-center text-[10px] text-textSecondary mt-1">
              <span>Shifokorga ko'rsatiladigan ma'lumot</span>
              <span>{description.length}/500</span>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Bog'lanish uchun telefon:
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-3.5 py-2 rounded-2xl border border-yolBorder dark:border-gray-700 bg-innerSoftArea dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accentOrange"
            />
          </div>

          {/* Location details */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accentOrange shrink-0" />
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-200 block">Chaqiruv manzili</span>
                <span className="text-[10px] text-textSecondary font-mono">
                  {userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold">
              GPS faol
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>{isSubmitting ? 'Chaqiruv yuborilmoqda...' : 'Tez yordam chaqirish'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
