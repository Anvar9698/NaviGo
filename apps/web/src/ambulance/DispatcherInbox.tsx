import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  Truck, 
  Building2,
  ShieldAlert, 
  MapPin, 
  Plus, 
  Trash2, 
  Send, 
  PhoneCall,
  Shield,
  Flame,
  LifeBuoy,
  Eye,
  FileImage
} from 'lucide-react';
import { EmergencyRequest, AmbulanceUnit, Hospital, AmbulanceStaffBinding, EmergencyServiceType } from '@yol/shared';
import { ambulanceApi } from './ambulanceApi';
import { useApp } from '../context/AppContext';

function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface DispatcherInboxProps {
  serviceType: EmergencyServiceType;
  binding?: AmbulanceStaffBinding;
  hospitals: Hospital[];
  ambulances: AmbulanceUnit[];
  pendingRequests?: EmergencyRequest[];
  activeRequest?: EmergencyRequest | null;
  onRefresh: () => void;
}

export const DispatcherInbox: React.FC<DispatcherInboxProps> = ({
  serviceType,
  binding,
  hospitals,
  ambulances,
  pendingRequests = [],
  activeRequest,
  onRefresh
}) => {
  const { locale, t, features, setFocusedLocation, setSelectedFeature } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [selectedAmbulanceByReq, setSelectedAmbulanceByReq] = useState<Record<string, string>>({});
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  
  // Add Unit Form State
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const defaultPlate =
    serviceType === '102' ? '01 103 PPA' :
    serviceType === '101' ? '01 103 FVV' :
    serviceType === '104' ? '01 107 GAZ' :
    serviceType === '1050' ? '01 1052 FVV' : '01 105 TAA';
  const [newPlateNumber, setNewPlateNumber] = useState(defaultPlate);
  const [isSavingUnit, setIsSavingUnit] = useState(false);

  // Terminology
  const serviceLabels = {
    '103': {
      title: locale === 'ru' ? '103 Диспетчерская Скорой Помощи' : locale === 'en' ? '103 Ambulance Dispatch' : '103 Tez Yordam Dispetcher Boshqaruvi',
      unitName: locale === 'ru' ? 'Автомобиль скорой помощи' : locale === 'en' ? 'Ambulance vehicle' : 'Tez Yordam Mashinasi',
      fleetTitle: locale === 'ru' ? 'Автопарк скорой помощи' : locale === 'en' ? 'Ambulance fleet' : 'Tez yordam avtoparki',
      stationTitle: locale === 'ru' ? 'Станция скорой помощи' : locale === 'en' ? 'Ambulance station' : 'Shoshilinch shifoxona'
    },
    '102': {
      title: locale === 'ru' ? '102 Диспетчерская Дежурной Части МВД' : locale === 'en' ? '102 Police Patrol Dispatch' : '102 Ichki Ishlar Dispetcher Boshqaruvi',
      unitName: locale === 'ru' ? 'Патрульный автомобиль (ППС)' : locale === 'en' ? 'Police patrol vehicle' : 'Patrul Mashinasi (PPA)',
      fleetTitle: locale === 'ru' ? 'Автопарк экипажей ППС' : locale === 'en' ? 'Police patrol fleet' : 'IIB Patrul avtoparki',
      stationTitle: locale === 'ru' ? 'Дежурная часть МВД' : locale === 'en' ? 'Police command post' : 'IIB Navbatchilik qismi'
    },
    '101': {
      title: locale === 'ru' ? '101 Диспетчерская Пожарной Охраны' : locale === 'en' ? '101 Fire & Rescue Dispatch' : "101 Yong'in Xavfsizligi Dispetcheri",
      unitName: locale === 'ru' ? 'Пожарная автоцистерна' : locale === 'en' ? 'Fire engine' : "O't O'chirish Mashinasi",
      fleetTitle: locale === 'ru' ? 'Пожарно-спасательная техника' : locale === 'en' ? 'Fire & rescue vehicles' : "O't o'chirish texnikalari",
      stationTitle: locale === 'ru' ? 'Пожарная часть МЧС' : locale === 'en' ? 'Fire department' : "FVB Yong'in-qutqaruv qismi"
    },
    '104': {
      title: locale === 'ru' ? '104 Аварийно-Диспетчерская Служба Газа' : locale === 'en' ? '104 Emergency Gas Dispatch' : '104 Favqulodda Gaz Xizmati Dispetcheri',
      unitName: locale === 'ru' ? 'Аварийная газовая машина' : locale === 'en' ? 'Emergency gas vehicle' : 'Gaz Avariya Mashinasi',
      fleetTitle: locale === 'ru' ? 'Аварийные бригады 104' : locale === 'en' ? '104 Emergency gas fleet' : '104 Gaz avariya avtoparki',
      stationTitle: locale === 'ru' ? 'Центр аварийной газовой службы' : locale === 'en' ? 'Emergency gas station' : 'Hududgaz avariya markazi'
    },
    '1050': {
      title: locale === 'ru' ? '1050 Диспетчер Спасательной Службы МЧС' : locale === 'en' ? '1050 MES Rescue Dispatch' : '1050 FVV Maxsus Qutqaruv Dispetcheri',
      unitName: locale === 'ru' ? 'Спецавтомобиль МЧС' : locale === 'en' ? 'MES rescue vehicle' : 'Maxsus Qutqaruv Guruhi',
      fleetTitle: locale === 'ru' ? 'Техника спасателей МЧС' : locale === 'en' ? 'MES rescue vehicles' : 'FVV Qutqaruv texnikalari',
      stationTitle: locale === 'ru' ? 'Центр спасения МЧС' : locale === 'en' ? 'MES rescue center' : 'FVV Qutqaruv markazi'
    }
  }[serviceType];

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

  const handleSendToDriver = async (requestId: string, defaultAmbId?: string) => {
    const chosenAmbulanceId = selectedAmbulanceByReq[requestId] || defaultAmbId || ambulances.find(a => a.status === 'free')?.id;
    try {
      setProcessingId(requestId);
      await ambulanceApi.acceptRequest(requestId, binding?.hospitalId, chosenAmbulanceId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Haydovchiga yuborishda xatolik');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!window.confirm("Chaqiruvni boshqa navbatchi bo'limga yo'naltirishni tasdiqlaysizmi?")) return;
    try {
      setProcessingId(requestId);
      await ambulanceApi.declineRequest(requestId, binding?.hospitalId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chaqiruvni rad etishda xatolik');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlateNumber.trim()) return;

    try {
      setIsSavingUnit(true);
      const hospitalId = binding?.hospitalId || hospitals[0]?.id || 'station-1';
      const hosp = hospitals.find(h => h.id === hospitalId);
      await ambulanceApi.addAmbulance({
        plateNumber: newPlateNumber.trim(),
        hospitalId,
        lat: hosp?.lat || 41.2721,
        lon: hosp?.lon || 69.2155,
        status: 'free'
      }, serviceType);
      setIsAddingUnit(false);
      setNewPlateNumber('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Mashina qo'shishda xatolik");
    } finally {
      setIsSavingUnit(false);
    }
  };

  const handleDeleteAmbulance = async (ambulanceId: string, plateNumber: string) => {
    if (!window.confirm(`Haqiqatdan ham ${plateNumber} raqamli mashinani o'chirmoqchimisiz?`)) {
      return;
    }

    try {
      await ambulanceApi.deleteAmbulance(ambulanceId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Mashinani o'chirishda xatolik");
    }
  };

  const freeAmbulances = ambulances.filter(a => a.status === 'free');

  return (
    <div className="flex flex-col gap-4">
      {/* Dispatcher Station Header */}
      <div className="p-4 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              {serviceLabels.title}
            </h2>
            <span className="text-[10px] text-textSecondary dark:text-darkTextSec font-bold block">
              {locale === 'ru' ? `Свободно машин: ${freeAmbulances.length} из ${ambulances.length}` : locale === 'en' ? `Available units: ${freeAmbulances.length} / ${ambulances.length}` : `Bo'sh mashinalar: ${freeAmbulances.length} / ${ambulances.length} ta`}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAddingUnit(!isAddingUnit)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{locale === 'ru' ? 'Добавить машину' : locale === 'en' ? 'Add Unit' : "Mashina qo'shish"}</span>
        </button>
      </div>

      {/* Add New Vehicle Form */}
      {isAddingUnit && (
        <form onSubmit={handleCreateAmbulance} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-blue-400 dark:border-blue-600 flex flex-col gap-3">
          <span className="text-xs font-black text-gray-900 dark:text-gray-100">
            {locale === 'ru' ? `Добавить новый ${serviceLabels.unitName}:` : locale === 'en' ? `Add new ${serviceLabels.unitName}:` : `Yangi ${serviceLabels.unitName} qo'shish:`}
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlateNumber}
              onChange={(e) => setNewPlateNumber(e.target.value)}
              placeholder={locale === 'ru' ? "Гос. номер (например: 01 102 PPA)" : locale === 'en' ? "Plate number (e.g. 01 102 PPA)" : "Davlat raqami (masalan: 01 102 PPA)"}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-xs"
              required
            />
            <button
              type="submit"
              disabled={isSavingUnit}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              {isSavingUnit ? (locale === 'ru' ? 'Сохранение...' : locale === 'en' ? 'Saving...' : 'Saqlanmoqda...') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingUnit(false)}
              className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Fleet Vehicles Status Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder">
        <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
          {serviceLabels.fleetTitle} ({ambulances.length} {locale === 'ru' ? 'ед.' : locale === 'en' ? 'units' : 'ta'})
        </span>
        <div className="flex flex-wrap gap-2">
          {ambulances.map(a => (
            <div
              key={a.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                a.status === 'free'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                  : a.status === 'enroute'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{a.plateNumber}</span>
              <span className="text-[10px] opacity-75">
                ({a.status === 'free' ? (locale === 'ru' ? 'Свободен' : locale === 'en' ? 'Free' : "Bo'sh") : a.status === 'enroute' ? (locale === 'ru' ? 'В пути' : locale === 'en' ? 'En Route' : "Yo'lda") : a.status})
              </span>
              <button
                type="button"
                onClick={() => handleDeleteAmbulance(a.id, a.plateNumber)}
                title={locale === 'ru' ? "Удалить" : locale === 'en' ? "Delete" : "O'chirish"}
                className="ml-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Incoming Emergency Calls Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-textSecondary dark:text-darkTextSec">
            {locale === 'ru' ? `Входящие экстренные вызовы (${pendingRequests.length})` : locale === 'en' ? `Incoming Emergency Calls (${pendingRequests.length})` : `Kelib tushgan yangi chaqiruvlar (${pendingRequests.length})`}
          </h3>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-6 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft text-center text-xs text-textSecondary dark:text-darkTextSec font-medium">
            {locale === 'ru' ? 'На данный момент новых входящих вызовов нет. Вызовы от граждан появятся здесь автоматически.' : locale === 'en' ? 'No incoming calls at this moment. Citizen emergency calls will appear here immediately.' : "Ayni paytda yangi navbatchi chaqiruvlar yo'q. Fuqaro chaqiruv berganda bu yerda darhol paydo bo'ladi."}
          </div>
        ) : (
          pendingRequests.map(req => {
            const timeLeft = timeRemaining[req.id] ?? 60;
            const isProcessing = processingId === req.id;
            const chosenAmbulanceId = selectedAmbulanceByReq[req.id] || freeAmbulances[0]?.id || ambulances[0]?.id;

            return (
              <div
                key={req.id}
                className="p-4 rounded-card bg-white dark:bg-darkCard border-2 border-red-500 shadow-float flex flex-col gap-3"
              >
                {/* Header & Severity */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-xs">
                      #{req.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                      {req.citizenName || (locale === 'ru' ? 'Гражданин' : locale === 'en' ? 'Citizen' : 'Fuqaro')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>
                </div>

                {/* Patient / Incident description */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-gray-100">
                  <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                    {locale === 'ru' ? 'Описание ситуации / Жалоба:' : locale === 'en' ? 'Incident description / Complaint:' : 'Chaqiruv shikoyati / Vaziyat:'}
                  </span>
                  <p>{req.description}</p>
                </div>

                {/* Photo/Video Evidence Thumbnail (Especially for 1050) */}
                {req.mediaUrl && (
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <FileImage className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{locale === 'ru' ? 'Прикрепленные материалы с места ЧС' : locale === 'en' ? 'Evidence from scene (Photo/Video)' : 'Hodisa joyidan olingan dalil (Foto/Video)'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewMediaUrl(req.mediaUrl || null)}
                      className="px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{locale === 'ru' ? 'Смотреть' : locale === 'en' ? 'View' : "Ko'rish"}</span>
                    </button>
                  </div>
                )}

                {/* Phone & Location */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-800 dark:text-gray-200">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    <span>{req.citizenPhone || '+998 90 123 45 67'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 font-mono text-[11px] font-bold text-gray-800 dark:text-gray-200">
                    <MapPin className="w-3.5 h-3.5 text-accentOrange" />
                    <span>{req.lat.toFixed(4)}, {req.lon.toFixed(4)}</span>
                  </div>
                </div>

                {/* ETA & Route Traffic / Road Problems Summary for Dispatcher */}
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between font-black text-amber-900 dark:text-amber-200">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {locale === 'ru' ? 'Прибытие и маршрут:' : locale === 'en' ? 'ETA & Route Status:' : "Taxminiy yetib borish va yo'l holati:"}
                      </span>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300">
                      ~{req.etaMinutes || 5} {t('emergency.labels.minutes')} ({((req.distanceMeters || 3800) / 1000).toFixed(1)} km)
                    </span>
                  </div>
                  {req.routeIncidents && req.routeIncidents.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {req.routeIncidents.slice(0, 2).map(inc => (
                        <div key={inc.id} className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                          • [{inc.featureType === 'traffic' ? 'Tirbandlik' : inc.featureType === 'roadwork' ? "Yo'l ta'miri" : 'Hodisa'}] {inc.title}
                        </div>
                      ))}
                    </div>
                  ) : req.hazardWarnings && req.hazardWarnings.length > 0 ? (
                    <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                      • {req.hazardWarnings[0]}
                    </div>
                  ) : null}
                </div>

                {/* Select Vehicle to Dispatch */}
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <label className="text-xs font-black text-blue-950 dark:text-blue-100 block mb-1.5">
                    {locale === 'ru' ? 'Выберите экипаж для вызова:' : locale === 'en' ? 'Select crew unit for dispatch:' : 'Marshrut uchun mashina tanlang:'}
                  </label>
                  <select
                    value={chosenAmbulanceId}
                    onChange={(e) => setSelectedAmbulanceByReq({ ...selectedAmbulanceByReq, [req.id]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-xs"
                  >
                    {ambulances.map(a => {
                      const dist = calcDistanceKm(a.lat, a.lon, req.lat, req.lon);
                      return (
                        <option key={a.id} value={a.id}>
                          {a.plateNumber} — {a.status === 'free' ? (locale === 'ru' ? 'Свободен' : locale === 'en' ? 'Free' : 'Bo\'sh') : a.status} (~{dist} km)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Action Buttons: Accept & Send to Driver, or Decline */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleSendToDriver(req.id, chosenAmbulanceId)}
                    disabled={isProcessing}
                    className="py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isProcessing ? (locale === 'ru' ? 'Отправка...' : locale === 'en' ? 'Sending...' : 'Yuborilmoqda...') : (locale === 'ru' ? 'Направить экипажу' : locale === 'en' ? 'Dispatch to crew' : 'Haydovchiga yo\'naltirish')}</span>
                  </button>

                  <button
                    onClick={() => handleDecline(req.id)}
                    disabled={isProcessing}
                    className="py-2.5 rounded-full border border-red-400 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>{locale === 'ru' ? 'Перенаправить' : locale === 'en' ? 'Re-route' : "Boshqa bo'limga"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live City & Zone Road Problems for Dispatcher Situational Awareness */}
      <div className="p-4 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                {locale === 'ru' ? 'Дорожные проблемы и заторы' : locale === 'en' ? 'Live Road Hazards & Traffic' : "Yo'ldagi muammolar va tirbandlik"}
              </h3>
              <span className="text-[10px] text-textSecondary dark:text-darkTextSec font-bold">
                {features.length} ta xavf va tirbandlik aniqlangan
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-black">
            JONLI
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {features.length === 0 ? (
            <div className="text-center py-4 text-xs text-textSecondary">
              Hududda jiddiy tirbandlik yoki yo'l ta'miri yo'q
            </div>
          ) : (
            features.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800/90 border border-yolBorder dark:border-gray-700 flex flex-col gap-1.5 hover:border-amber-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                    item.featureType === 'accident' ? 'bg-rose-600' :
                    item.featureType === 'traffic' ? 'bg-amber-500' :
                    item.featureType === 'closure' ? 'bg-red-700' : 'bg-amber-600'
                  }`}>
                    {item.featureType === 'accident' ? 'YTH / Avariya' :
                     item.featureType === 'traffic' ? 'Tirbandlik' :
                     item.featureType === 'closure' ? "Yopiq yo'l" : "Yo'l ta'miri"}
                  </span>
                  <span className="text-[10px] text-textSecondary font-bold">
                    {item.severity === 'high' || item.severity === 'urgent' ? 'Yuqori xavf' : "O'rtacha"}
                  </span>
                </div>
                <div className="text-xs font-black text-gray-900 dark:text-gray-100 leading-snug">
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-[11px] text-textSecondary dark:text-darkTextSec line-clamp-2">
                    {item.description}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
                  <span className="text-[10px] font-mono text-textSecondary">
                    {item.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedLocation({ lat: item.latitude, lon: item.longitude });
                      setSelectedFeature(item);
                    }}
                    className="text-[11px] font-black text-accentOrange hover:underline flex items-center gap-1"
                  >
                    <span>Xaritada ko'rish</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Media Modal Preview */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white dark:bg-gray-900 rounded-3xl p-4 overflow-hidden border border-gray-700 shadow-2xl">
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-3">
              {locale === 'ru' ? 'Фото/видео с места происшествия' : locale === 'en' ? 'Evidence from scene' : 'Hodisa joyidan olingan dalil'}
            </h3>
            {previewMediaUrl.includes('video') ? (
              <video src={previewMediaUrl} controls autoPlay className="max-h-[70vh] w-full rounded-2xl object-contain bg-black" />
            ) : (
              <img src={previewMediaUrl} alt="Hodisa rasmi" className="max-h-[70vh] w-full rounded-2xl object-contain bg-black" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
