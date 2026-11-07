import React, { useState } from 'react';
import { 
  Play, 
  MapPin, 
  CheckCircle, 
  ArrowUpRight, 
  Truck, 
  PhoneCall, 
  AlertCircle,
  FileImage,
  Eye,
  X,
  Send
} from 'lucide-react';
import { EmergencyRequest, AmbulanceUnit, AmbulanceStaffBinding, EmergencyServiceType } from '@yol/shared';
import { ambulanceApi } from './ambulanceApi';
import { useApp } from '../context/AppContext';

interface DriverNavigationProps {
  serviceType: EmergencyServiceType;
  binding?: AmbulanceStaffBinding;
  ambulance?: AmbulanceUnit | null;
  assignedRequest?: EmergencyRequest | null;
  onRefresh: () => void;
}

export const DriverNavigation: React.FC<DriverNavigationProps> = ({
  serviceType,
  binding,
  ambulance,
  assignedRequest,
  onRefresh
}) => {
  const { locale, t, features, setFocusedLocation, setSelectedFeature } = useApp();
  const [isActing, setIsActing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  // Terminology
  const serviceLabels = {
    '103': {
      title: locale === 'ru' ? '103 Водитель Скорой Помощи' : locale === 'en' ? '103 Ambulance Driver' : '103 Shoshilinch Tibbiy Haydovchi',
      unitPrefix: locale === 'ru' ? 'Автомобиль скорой помощи' : locale === 'en' ? 'Ambulance vehicle' : 'Tez yordam mashinasi',
      departBtn: locale === 'ru' ? 'ПОЕХАЛИ — НА ВЫЗОВ (GO)' : locale === 'en' ? 'GO — START TRIP' : "OLG'A — YO'LGA CHIQISH (GO)",
      roleName: locale === 'ru' ? 'Водитель-парамедик' : locale === 'en' ? 'Paramedic driver' : 'Shifokor-haydovchi',
      patientHeader: locale === 'ru' ? 'Жалобы пациента:' : locale === 'en' ? 'Patient complaints:' : 'Bemor shikoyati:'
    },
    '102': {
      title: locale === 'ru' ? '102 Водитель Экипажа ППС' : locale === 'en' ? '102 Police Patrol Driver' : '102 IIB Patrul Haydovchisi',
      unitPrefix: locale === 'ru' ? 'Патрульный автомобиль (ППС)' : locale === 'en' ? 'Patrol car (PPA)' : 'Patrul mashinasi (PPA)',
      departBtn: locale === 'ru' ? 'ПОЕХАЛИ — НА МЕСТО (GO)' : locale === 'en' ? 'GO — ON SCENE' : "OLG'A — HODISA JOYIGA CHIQISH (GO)",
      roleName: locale === 'ru' ? 'Сотрудник патруля' : locale === 'en' ? 'Patrol officer' : 'Patrul xodimi',
      patientHeader: locale === 'ru' ? 'Детали происшествия:' : locale === 'en' ? 'Incident details:' : 'Hodisa tafsiloti:'
    },
    '101': {
      title: locale === 'ru' ? '101 Водитель Пожарного Расчета' : locale === 'en' ? '101 Fire & Rescue Driver' : "101 Yong'in-Qutqaruv Ekipaji",
      unitPrefix: locale === 'ru' ? 'Пожарная машина' : locale === 'en' ? 'Fire engine' : "O't o'chirish texnikasi",
      departBtn: locale === 'ru' ? 'ПОЕХАЛИ — НА ТУШЕНИЕ (GO)' : locale === 'en' ? 'GO — FIRE RESPONSE' : "OLG'A — YONG'INGA CHIQISH (GO)",
      roleName: locale === 'ru' ? 'Пожарный-спасатель' : locale === 'en' ? 'Fire rescuer' : "Yong'in-qutqaruvchi",
      patientHeader: locale === 'ru' ? 'Сигнал возгорания:' : locale === 'en' ? 'Fire alarm report:' : "Yong'in xavfi signali:"
    },
    '104': {
      title: locale === 'ru' ? '104 Водитель Аварийной Газовой Службы' : locale === 'en' ? '104 Emergency Gas Crew Driver' : '104 Favqulodda Gaz Avariya Ekipaji',
      unitPrefix: locale === 'ru' ? 'Аварийная машина 104' : locale === 'en' ? '104 Gas vehicle' : '104 Gaz avariya mashinasi',
      departBtn: locale === 'ru' ? 'ПОЕХАЛИ — НА ВЫЗОВ 104 (GO)' : locale === 'en' ? 'GO — GAS RESPONSE' : "OLG'A — GAZ AVARIYASIGA CHIQISH (GO)",
      roleName: locale === 'ru' ? 'Специалист горгаза' : locale === 'en' ? 'Gas technician' : 'Gaz avariya ustasi',
      patientHeader: locale === 'ru' ? 'Детали газовой аварии:' : locale === 'en' ? 'Gas leak details:' : 'Gaz sizib chiqish holati:'
    },
    '1050': {
      title: locale === 'ru' ? '1050 Водитель Спасателей МЧС' : locale === 'en' ? '1050 MES Rescue Driver' : '1050 FVV Maxsus Qutqaruvchi Ekipaj',
      unitPrefix: locale === 'ru' ? 'Спецавтомобиль МЧС' : locale === 'en' ? 'MES rescue vehicle' : 'Maxsus qutqaruv guruhi',
      departBtn: locale === 'ru' ? 'ПОЕХАЛИ — НА СПАСЕНИЕ (GO)' : locale === 'en' ? 'GO — RESCUE RESPONSE' : "OLG'A — QUTQARUVGA CHIQISH (GO)",
      roleName: locale === 'ru' ? 'Спасатель МЧС' : locale === 'en' ? 'MES Rescuer' : 'FVV Qutqaruvchisi',
      patientHeader: locale === 'ru' ? 'Характер происшествия:' : locale === 'en' ? 'Emergency situation:' : 'Favqulodda vaziyat holati:'
    }
  }[serviceType];

  const handleGo = async () => {
    if (!assignedRequest) return;
    const ambId = assignedRequest.assignedAmbulanceId || ambulance?.id || 'unit-1';
    try {
      setIsActing(true);
      await ambulanceApi.driverGo(assignedRequest.id, ambId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsActing(false);
    }
  };

  const handleOnScene = async () => {
    if (!assignedRequest) return;
    const ambId = assignedRequest.assignedAmbulanceId || ambulance?.id || 'unit-1';
    try {
      setIsActing(true);
      await ambulanceApi.driverOnScene(assignedRequest.id, ambId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsActing(false);
    }
  };

  const handleComplete = async () => {
    if (!assignedRequest) return;
    const ambId = assignedRequest.assignedAmbulanceId || ambulance?.id || 'unit-1';
    if (!window.confirm('Chaqiruvni muvaffaqiyatli yakunlashni tasdiqlaysizmi?')) return;
    try {
      setIsActing(true);
      await ambulanceApi.driverComplete(assignedRequest.id, ambId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsActing(false);
    }
  };

  // If request is missing or still pending (waiting for dispatcher approval), show standby + live road problems
  if (!assignedRequest || assignedRequest.status === 'pending') {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-6 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
              {locale === 'ru' ? 'Пока нет назначенных вызовов' : locale === 'en' ? 'No calls currently assigned' : "Hozircha biriktirilgan chaqiruv yo'q"}
            </h2>
            <p className="text-xs text-textSecondary dark:text-darkTextSec mt-1">
              {locale === 'ru' 
                ? `Ваш автомобиль (${ambulance?.plateNumber || `01 ${serviceType} TAA`}) находится в режиме дежурства на базе. Назначенный диспетчером вызов появится здесь автоматически.`
                : locale === 'en'
                ? `Your vehicle (${ambulance?.plateNumber || `01 ${serviceType} TAA`}) is on standby. Incoming calls will appear here immediately.`
                : `Mashinangiz (${ambulance?.plateNumber || `01 ${serviceType} TAA`}) bazada navbatchilik holatida. Dispetcher chaqiruv yo'naltirganda darhol bu yerda ko'rinadi.`}
            </p>
          </div>
          <div className="mt-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300">
            {locale === 'ru' ? 'Статус: Свободен (На дежурстве)' : locale === 'en' ? 'Status: Standby' : `Status: ${ambulance?.status || "Bo'sh (Navbatchilikda)"}`}
          </div>
        </div>

        {/* Live City & Zone Road Problems for Driver Awareness */}
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

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {features.length === 0 ? (
              <div className="text-center py-6 text-xs text-textSecondary">
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
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
              {serviceLabels.unitPrefix} • {ambulance?.plateNumber || assignedRequest.assignedAmbulanceId || `01 ${serviceType} TAA`}
            </span>
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100">
              {locale === 'ru' ? 'Вызов' : locale === 'en' ? 'Call' : 'Chaqiruv'} #{assignedRequest.id.slice(-6).toUpperCase()}
            </h2>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
          assignedRequest.status === 'enroute'
            ? 'bg-red-600 text-white'
            : assignedRequest.status === 'onscene'
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-500 text-white'
        }`}>
          {assignedRequest.status === 'enroute'
            ? (locale === 'ru' ? "В пути (Сирена)" : locale === 'en' ? "En Route (Siren)" : "Yo'lda (Sirena)")
            : assignedRequest.status === 'onscene'
            ? (locale === 'ru' ? "На месте" : locale === 'en' ? "On Scene" : "Manzilda")
            : (locale === 'ru' ? "Новый вызов" : locale === 'en' ? "New Call" : "Kutmoqda (Yangi)")}
        </div>
      </div>

      {/* DISPATCHER STATUS CALLOUT: When newly assigned */}
      {assignedRequest.status === 'assigned' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-black">
            !
          </div>
          <div className="flex-1">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 block">
              {locale === 'ru' ? 'Диспетчер назначил вам новый вызов!' : locale === 'en' ? 'Dispatcher assigned you a new call!' : "Dispetcherdan yangi chaqiruv biriktirildi!"}
            </span>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
              {locale === 'ru' ? 'Ознакомьтесь с деталями происшествия и нажмите кнопку "ПОЕХАЛИ", чтобы начать движение.' : locale === 'en' ? 'Review incident details and click "GO" to start transit.' : 'Bemor/hodisa ma\'lumotlarini ko\'rib chiqing va harakatni boshlash uchun quyidagi "OLG\'A" tugmasini bosing.'}
            </p>
          </div>
        </div>
      )}

      {/* Citizen / Caller Information */}
      <div className="p-4 rounded-card bg-white dark:bg-darkCard border border-yolBorder dark:border-darkBorder shadow-soft flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
          <span className="text-xs font-black text-gray-900 dark:text-gray-100">
            {assignedRequest.citizenName || (locale === 'ru' ? 'Заявитель' : locale === 'en' ? 'Caller' : 'Chaqiruvchi')}
          </span>
          <a
            href={`tel:${assignedRequest.citizenPhone || '+998901234567'}`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{assignedRequest.citizenPhone || '+998 90 123 45 67'}</span>
          </a>
        </div>

        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-gray-100">
          <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
            {serviceLabels.patientHeader}
          </span>
          <p>{assignedRequest.description}</p>
        </div>

        {/* Media Photo / Video Preview */}
        {assignedRequest.mediaUrl && (
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <FileImage className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locale === 'ru' ? 'Доступны фото/видео материалы' : locale === 'en' ? 'Photo/video evidence available' : "Hodisa fotosi / videosi mavjud"}</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMediaUrl(assignedRequest.mediaUrl || null)}
              className="px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black flex items-center gap-1 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{locale === 'ru' ? 'Просмотр' : locale === 'en' ? 'View' : "Ko'rish"}</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
          <span>{locale === 'ru' ? 'Координаты цели:' : locale === 'en' ? 'Destination Coords:' : 'Manzil koordinatasi:'}</span>
          <span>{assignedRequest.lat.toFixed(4)}, {assignedRequest.lon.toFixed(4)}</span>
        </div>
      </div>

      {/* Maneuver Guidance Card (Waze style turn-by-turn) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-float flex flex-col gap-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
          {locale === 'ru' ? 'GPS Навигация экипажа' : locale === 'en' ? 'GPS Unit Navigation' : "Yo'l Navigatsiyasi (GPS)"}
        </span>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-7 h-7 stroke-[3]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black leading-snug">
              {currentStep?.instruction || (locale === 'ru' ? "Следуйте прямо по главной магистрали" : locale === 'en' ? "Continue straight along the avenue" : "Chorraha bo'ylab to'g'riga harakatlaning")}
            </h3>
            <span className="text-xs text-blue-200 font-bold block mt-0.5">
              {locale === 'ru' ? 'Дистанция:' : locale === 'en' ? 'Distance:' : 'Masofa:'} ~{currentStep?.distanceMeters || 650} {locale === 'ru' ? 'м' : locale === 'en' ? 'm' : 'metr'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs font-bold text-blue-100">
          <span>{locale === 'ru' ? 'Прибытие через:' : locale === 'en' ? 'ETA:' : 'Yetib borish vaqti:'} ~{assignedRequest.etaMinutes || 5} {t('emergency.labels.minutes')}</span>
          <span>{locale === 'ru' ? 'Всего:' : locale === 'en' ? 'Total:' : 'Umumiy:'} ~{Math.round((assignedRequest.distanceMeters || 4500) / 100) / 10} km</span>
        </div>
      </div>

      {/* Road Problems & Traffic Jams on Driver Route */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>
              {locale === 'ru' ? 'Пробки и препятствия на пути' : locale === 'en' ? 'Traffic & Hazards Ahead' : "Yo'nalishdagi tirbandlik va muammolar"}
            </span>
          </span>
          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
            +{assignedRequest.trafficDelayMinutes || 6} {t('emergency.labels.minutes')} {locale === 'ru' ? 'экономия' : locale === 'en' ? 'saved' : 'tejaladi'}
          </span>
        </div>
        {assignedRequest.routeIncidents && assignedRequest.routeIncidents.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {assignedRequest.routeIncidents.map(inc => (
              <div key={inc.id} className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-amber-200 dark:border-gray-700 text-xs">
                <div className="font-extrabold text-gray-900 dark:text-gray-100">
                  [{inc.featureType === 'traffic' ? 'Tirbandlik' : inc.featureType === 'roadwork' ? "Yo'l ta'miri" : 'Hodisa'}] {inc.title}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300">
                  {inc.description}
                </div>
              </div>
            ))}
          </div>
        ) : assignedRequest.hazardWarnings && assignedRequest.hazardWarnings.length > 0 ? (
          <div className="flex flex-col gap-1">
            {assignedRequest.hazardWarnings.map((w, idx) => (
              <div key={idx} className="text-xs font-bold text-gray-800 dark:text-gray-200">
                • {w}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {locale === 'ru' ? 'Маршрут свободен (Зеленый коридор)' : locale === 'en' ? 'Route clear (Green Corridor)' : "Yo'l ochiq (Yashil yo'lak faol)"}
          </div>
        )}
      </div>

      {/* Driver Action Control Buttons */}
      <div className="flex flex-col gap-2">
        {assignedRequest.status === 'assigned' && (
          <button
            onClick={handleGo}
            disabled={isActing}
            className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-float transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{locale === 'ru' ? 'ПРИНЯТЬ ВЫЗОВ И ВЫЕХАТЬ (GO)' : locale === 'en' ? 'ACCEPT CALL AND START TRIP (GO)' : "CHAQIRUVNI QABUL QILIB OLG'A YO'LGA TUSHISH (GO)"}</span>
          </button>
        )}

        {assignedRequest.status === 'enroute' && (
          <button
            onClick={handleOnScene}
            disabled={isActing}
            className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-float transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            <span>{locale === 'ru' ? 'ПРИБЫЛИ НА МЕСТО (ON SCENE)' : locale === 'en' ? 'ARRIVED ON SCENE' : 'MANZILGA YETIB KELDIM (ON SCENE)'}</span>
          </button>
        )}

        {assignedRequest.status === 'onscene' && (
          <button
            onClick={handleComplete}
            disabled={isActing}
            className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm shadow-float transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{locale === 'ru' ? 'ЗАВЕРШИТЬ ВЫЗОВ (ВОЗВРАТ НА БАЗУ)' : locale === 'en' ? 'COMPLETE CALL (RETURN TO BASE)' : 'CHAQIRUVNI YAKUNLASH (BAZAGA QAYTISH)'}</span>
          </button>
        )}
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
              Hodisa joyidan olingan dalil
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
