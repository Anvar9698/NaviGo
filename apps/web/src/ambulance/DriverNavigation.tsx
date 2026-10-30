import React, { useState } from 'react';
import { 
  Play, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowUpLeft, 
  ArrowUp, 
  Flag,
  RotateCcw,
  Navigation,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { EmergencyRequest, AmbulanceUnit, AmbulanceStaffBinding } from '@yol/shared';
import { ambulanceApi } from './ambulanceApi';

interface DriverNavigationProps {
  binding?: AmbulanceStaffBinding;
  ambulance?: AmbulanceUnit | null;
  assignedRequest?: EmergencyRequest | null;
  onRefresh: () => void;
}

export const DriverNavigation: React.FC<DriverNavigationProps> = ({
  binding,
  ambulance,
  assignedRequest,
  onRefresh
}) => {
  const [isActing, setIsActing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleGo = async () => {
    if (!assignedRequest || !ambulance) return;
    try {
      setIsActing(true);
      await ambulanceApi.driverGo(assignedRequest.id, ambulance.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsActing(false);
    }
  };

  const handleOnScene = async () => {
    if (!assignedRequest || !ambulance) return;
    try {
      setIsActing(true);
      await ambulanceApi.driverOnScene(assignedRequest.id, ambulance.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsActing(false);
    }
  };

  const handleComplete = async () => {
    if (!assignedRequest || !ambulance) return;
    if (!window.confirm('Chaqiruvni muvaffaqiyatli yakunlashni tasdiqlaysizmi?')) return;
    try {
      setIsActing(true);
      await ambulanceApi.driverComplete(assignedRequest.id, ambulance.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsActing(false);
    }
  };

  if (!assignedRequest) {
    return (
      <div className="p-6 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center text-2xl">
          🚑
        </div>
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
            Hozircha biriktirilgan chaqiruv yo'q
          </h2>
          <p className="text-xs text-textSecondary dark:text-darkTextSec mt-1">
            Mashinangiz ({ambulance?.plateNumber || '103'}) bazada bo'sh holatda turibdi. Dispetcher chaqiruv berganda darhol bu yerda ko'rinadi.
          </p>
        </div>
        <div className="mt-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300">
          Status: {ambulance?.status || 'Bo\'sh'}
        </div>
      </div>
    );
  }

  const steps = assignedRequest.routeSteps || [];
  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Unit & Request Header */}
      <div className="p-4 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            🚑
          </div>
          <div>
            <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
              Ekipaj • {ambulance?.plateNumber}
            </span>
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100">
              Chaqiruv #{assignedRequest.id.slice(4, 10).toUpperCase()}
            </h2>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
          assignedRequest.status === 'enroute'
            ? 'bg-red-600 text-white animate-pulse'
            : assignedRequest.status === 'onscene'
            ? 'bg-blue-600 text-white'
            : 'bg-amber-500 text-white'
        }`}>
          {assignedRequest.status === 'assigned' && 'Marshrut tayyor'}
          {assignedRequest.status === 'enroute' && 'Yo\'lda (SOS)'}
          {assignedRequest.status === 'onscene' && 'Manzilda'}
        </span>
      </div>

      {/* Road Hazard Alerts along Route */}
      {assignedRequest.hazardWarnings && assignedRequest.hazardWarnings.length > 0 && (
        <div className="p-3.5 rounded-card bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-amber-900 dark:text-amber-200 block uppercase tracking-wide">
              Yo'ldagi to'siq yoki ta'mirlash xabari:
            </span>
            <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 mt-1 space-y-0.5 font-medium">
              {assignedRequest.hazardWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mode 1: Assigned (Ready for Preview & GO) */}
      {assignedRequest.status === 'assigned' && (
        <div className="p-5 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-textSecondary uppercase block">Masofa & Vaqt</span>
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100">
                ~{assignedRequest.etaMinutes || 6} daqiqa{' '}
                <span className="text-sm font-semibold text-textSecondary">
                  ({((assignedRequest.distanceMeters || 3000) / 1000).toFixed(1)} km)
                </span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-full bg-orangeTint flex items-center justify-center text-accentOrange text-xl">
              🎯
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 text-xs">
            <span className="font-bold text-accentOrange block mb-1">Bemor holati:</span>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
              {assignedRequest.description}
            </p>
          </div>

          {/* Big Waze-style GO Button */}
          <button
            onClick={handleGo}
            disabled={isActing}
            className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-lg shadow-float flex items-center justify-center gap-3 transition-all"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>YO'LGA CHIQISH (GO)</span>
          </button>
        </div>
      )}

      {/* Mode 2: En Route (Turn-by-turn Navigation HUD) */}
      {assignedRequest.status === 'enroute' && (
        <div className="flex flex-col gap-3">
          {/* Main Turn Banner */}
          <div className="p-4 rounded-card bg-blackPill text-white shadow-float border border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accentOrange text-white flex items-center justify-center shrink-0">
                {currentStep?.maneuverType === 'turn-right' ? (
                  <ArrowUpRight className="w-7 h-7 stroke-[3]" />
                ) : currentStep?.maneuverType === 'turn-left' ? (
                  <ArrowUpLeft className="w-7 h-7 stroke-[3]" />
                ) : (
                  <ArrowUp className="w-7 h-7 stroke-[3]" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-orange-300 uppercase tracking-wider block">
                  Keyingi burilish • {currentStep?.distanceMeters || 150}m
                </span>
                <div className="text-base font-extrabold leading-tight">
                  {currentStep?.instruction || 'To\'g\'riga davom eting'}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Navigation */}
          {steps.length > 1 && (
            <div className="flex items-center justify-between px-2 text-xs font-bold text-textSecondary">
              <button
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-40"
              >
                ◀ Oldingi
              </button>
              <span>{currentStepIndex + 1} / {steps.length} qadam</span>
              <button
                onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex >= steps.length - 1}
                className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-40"
              >
                Keyingi ▶
              </button>
            </div>
          )}

          {/* Arrived On Scene Button */}
          <button
            onClick={handleOnScene}
            disabled={isActing}
            className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all mt-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>YETIB KELDIK (MANZILDA)</span>
          </button>
        </div>
      )}

      {/* Mode 3: On Scene (At Patient -> Close Call) */}
      {assignedRequest.status === 'onscene' && (
        <div className="p-5 rounded-card bg-white dark:bg-darkCard border-2 border-blue-500 shadow-soft flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl">
            🩺
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
              Shifokorlar bemor huzurida
            </h3>
            <p className="text-xs text-textSecondary mt-1">
              Bemorga tibbiy yordam ko'rsatilgach yoki statsionarga yetkazilgach, chaqiruvni yakunlang.
            </p>
          </div>

          <button
            onClick={handleComplete}
            disabled={isActing}
            className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base shadow-float flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>CHAQIRUVNI YAKUNLASH (BO'SHATISH)</span>
          </button>
        </div>
      )}
    </div>
  );
};
