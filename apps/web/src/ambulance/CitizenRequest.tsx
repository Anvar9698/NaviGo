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
  Navigation,
  ArrowUpRight,
  CheckCircle2,
  Check,
  Shield,
  Flame,
  LifeBuoy,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { EmergencyRequest, EmergencySeverity, Hospital, AmbulanceUnit, EmergencyServiceType } from '@yol/shared';
import { ambulanceApi } from './ambulanceApi';
import { useApp } from '../context/AppContext';

interface CitizenRequestProps {
  serviceType: EmergencyServiceType;
  activeRequest?: EmergencyRequest | null;
  assignedAmbulance?: AmbulanceUnit | null;
  hospitals: Hospital[];
  onRefresh: () => void;
}

export const CitizenRequest: React.FC<CitizenRequestProps> = ({
  serviceType,
  activeRequest,
  assignedAmbulance,
  hospitals,
  onRefresh
}) => {
  const { user, userCoords, locale, t, features, setSelectedFeature, setFocusedLocation } = useApp();

  // Initial values per service
  const getDefaultDescription = (type: EmergencyServiceType, loc: string) => {
    if (loc === 'ru') {
      switch (type) {
        case '102':
          return "Общественный порядок нарушен, происходит конфликт.";
        case '101':
          return "Срочный сигнал пожарной опасности.";
        case '104':
          return "В квартире чувствуется резкий запах газа, подозрение на утечку из трубы.";
        case '1050':
          return "Угроза обрушения конструкции здания, требуется спасательный отряд.";
        case '103':
        default:
          return "Пациент 45 лет, острая боль в груди, потеря сознания.";
      }
    }
    if (loc === 'en') {
      switch (type) {
        case '102':
          return "Public disturbance and fight in progress.";
        case '101':
          return "Emergency fire alarm report.";
        case '104':
          return "Strong smell of natural gas inside apartment, suspected pipeline leak.";
        case '1050':
          return "Building structure collapse danger, rescue team requested.";
        case '103':
        default:
          return "Patient 45 y.o., severe chest pain and loss of consciousness.";
      }
    }
    switch (type) {
      case '102':
        return "Jamoat joyida tartibbuzarlik va janjal holati yuz bermoqda.";
      case '101':
        return "Yong'in xavfsizligi bo'yicha tezkor chaqiruv.";
      case '104':
        return "Xonadonda kuchli tabiiy gaz hidi sezilmoqda, gaz quvuridan sizib chiqish xavfi bor.";
      case '1050':
        return "Bino konstruksiyasi xavfli holatda qulash ehtimoli bor, qutqaruv guruhi kerak.";
      case '103':
      default:
        return "Bemor 45 yoshda, ko'krak qafasida o'tkir og'riq va hushdan ketish holati.";
    }
  };

  const [description, setDescription] = useState(() => getDefaultDescription(serviceType, locale));
  const [severity, setSeverity] = useState<EmergencySeverity>(serviceType === '101' ? 1 : 2);
  const [phone, setPhone] = useState('+998 90 123 45 67');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video' | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch description template when serviceType or locale changes
  React.useEffect(() => {
    setDescription(getDefaultDescription(serviceType, locale));
    setSeverity(serviceType === '101' ? 1 : 2);
    setMediaUrl(undefined);
    setMediaType(undefined);
    setErrorMsg(null);
  }, [serviceType, locale]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Fayl hajmi 20MB dan oshmasligi lozim");
      return;
    }

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');

    if (!isVideo && !isImage) {
      alert("Faqat rasm yoki video yuklash mumkin");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isVideo ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceType !== '101' && description.trim().length < 3) {
      setErrorMsg('Iltimos holatni qisqacha tavsiflang (kamida 3 ta belgi).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await ambulanceApi.createRequest({
        lat: userCoords.lat,
        lon: userCoords.lon,
        description: serviceType === '101' ? "Tezkor yong'in signali" : description.trim(),
        severity: serviceType === '101' ? 1 : severity,
        citizenPhone: phone.trim(),
        citizenName: user?.name,
        citizenId: user?.id,
        serviceType,
        mediaUrl,
        mediaType
      });
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    if (!window.confirm('Haqiqatdan ham chaqiruvni bekor qilmoqchimisiz?')) return;

    try {
      setIsCancelling(true);
      await ambulanceApi.cancelRequest(activeRequest.id, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chaqiruvni bekor qilishda xatolik');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResetAndNewCall = async () => {
    if (!activeRequest) return;
    try {
      setIsCancelling(true);
      await ambulanceApi.cancelRequest(activeRequest.id, serviceType);
      onRefresh();
    } catch {
      onRefresh();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCompleteDemo = async () => {
    if (!activeRequest) return;
    try {
      setIsCancelling(true);
      await ambulanceApi.driverComplete(activeRequest.id, activeRequest.assignedAmbulanceId, serviceType);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Yakunlashda xatolik');
    } finally {
      setIsCancelling(false);
    }
  };

  const assignedHospital = hospitals.find(
    h => h.id === activeRequest?.assignedHospitalId || h.id === activeRequest?.targetHospitalId
  );

  const currentStep = activeRequest?.routeSteps?.[0];

  // Visual Styling per service
  const serviceMeta = {
    '103': {
      title: t('emergency.services.103'),
      colorBg: 'bg-red-600',
      colorText: 'text-red-600',
      borderColor: 'border-red-500',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      icon: Truck,
      hotline: '103',
      unitName: locale === 'ru' ? 'Бригада скорой помощи' : locale === 'en' ? 'Ambulance Unit' : 'Tez Yordam Brigadasi',
      arrivedMsg: locale === 'ru' ? 'Врачи прибыли по вашему адресу!' : locale === 'en' ? 'Doctors arrived at your location!' : 'Shifokorlar manzilingizga yetib keldi!'
    },
    '102': {
      title: t('emergency.services.102'),
      colorBg: 'bg-blue-600',
      colorText: 'text-blue-600',
      borderColor: 'border-blue-500',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      icon: Shield,
      hotline: '102',
      unitName: locale === 'ru' ? 'Экипаж ППС' : locale === 'en' ? 'Police Patrol Unit' : 'Patrul-Post Ekipaji',
      arrivedMsg: locale === 'ru' ? 'Сотрудники милиции прибыли на место!' : locale === 'en' ? 'Police officers arrived at location!' : 'Ichki ishlar xodimlari yetib keldi!'
    },
    '101': {
      title: t('emergency.services.101'),
      colorBg: 'bg-rose-700',
      colorText: 'text-rose-700',
      borderColor: 'border-rose-600',
      buttonBg: 'bg-rose-700 hover:bg-rose-800',
      icon: Flame,
      hotline: '101',
      unitName: locale === 'ru' ? 'Пожарно-спасательный расчет' : locale === 'en' ? 'Fire & Rescue Crew' : "O't O'chirish Ekipaji",
      arrivedMsg: locale === 'ru' ? 'Пожарно-спасательный расчет прибыл!' : locale === 'en' ? 'Fire & rescue crew arrived!' : "Yong'in-qutqaruv ekipaji yetib keldi!"
    },
    '104': {
      title: t('emergency.services.104'),
      colorBg: 'bg-teal-600',
      colorText: 'text-teal-600',
      borderColor: 'border-teal-500',
      buttonBg: 'bg-teal-600 hover:bg-teal-700',
      icon: Flame,
      hotline: '104',
      unitName: locale === 'ru' ? 'Аварийная газовая бригада' : locale === 'en' ? 'Emergency Gas Crew' : '104 Gaz Avariya Brigadasi',
      arrivedMsg: locale === 'ru' ? 'Аварийная газовая служба 104 прибыла!' : locale === 'en' ? '104 Emergency Gas Crew arrived!' : '104 Favqulodda gaz avariya brigadasi yetib keldi!'
    },
    '1050': {
      title: t('emergency.services.1050'),
      colorBg: 'bg-amber-600',
      colorText: 'text-amber-600',
      borderColor: 'border-amber-500',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      icon: LifeBuoy,
      hotline: '1050',
      unitName: locale === 'ru' ? 'Спасательный отряд МЧС' : locale === 'en' ? 'MES Rescue Squad' : 'FVV Qutqaruv Guruhi',
      arrivedMsg: locale === 'ru' ? 'Спасатели МЧС прибыли на место!' : locale === 'en' ? 'MES rescuers arrived on scene!' : 'FVV qutqaruvchilari yetib keldi!'
    }
  }[serviceType];

  const ServiceIcon = serviceMeta.icon;

  return (
    <div className="flex flex-col gap-4">
      {/* Hotline Direct Call Bar */}
      <div className={`p-3.5 rounded-card ${serviceMeta.colorBg} text-white shadow-md flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full bg-white ${serviceMeta.colorText} flex items-center justify-center shrink-0 shadow-sm font-black text-sm`}>
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-white/90">
              {locale === 'ru' ? 'Экстренная связь' : locale === 'en' ? 'Emergency Hotline' : 'Shoshilinch aloqa'}
            </div>
            <div className="text-sm font-extrabold text-white">
              {serviceMeta.title}
            </div>
          </div>
        </div>

        <a
          href={`tel:${serviceMeta.hotline}`}
          className={`px-4 py-2 rounded-full bg-white hover:bg-gray-100 ${serviceMeta.colorText} font-black text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>{serviceMeta.hotline}</span>
        </a>
      </div>

      {/* Active Request Live Tracking Card */}
      {activeRequest && !['done', 'cancelled'].includes(activeRequest.status) ? (
        <div className={`p-5 rounded-card bg-white dark:bg-darkCard border-2 ${serviceMeta.borderColor} shadow-float flex flex-col gap-4`}>
          
          {/* Header & Status Badge */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <span className="text-[10px] font-black text-accentOrange uppercase tracking-wider block">
                {serviceMeta.title}
              </span>
              <h2 className="text-lg font-black text-gray-950 dark:text-gray-50">
                #{activeRequest.id.slice(-6).toUpperCase()}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetAndNewCall}
                disabled={isCancelling}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                title={t('emergency.actions.newCall')}
              >
                {t('emergency.actions.newCall')}
              </button>

              <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
              activeRequest.status === 'enroute'
                ? 'bg-red-600 text-white shadow-md'
                : activeRequest.status === 'onscene'
                ? 'bg-emerald-600 text-white shadow-md'
                : activeRequest.status === 'assigned'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-amber-500 text-white shadow-md'
            }`}>
              {activeRequest.status === 'enroute' && <Truck className="w-4 h-4" />}
              {activeRequest.status === 'onscene' && <CheckCircle className="w-4 h-4" />}
              {activeRequest.status === 'assigned' && <Clock className="w-4 h-4" />}
              {activeRequest.status === 'pending' && <Clock className="w-4 h-4" />}
              <span>
                {activeRequest.status === 'pending' && t('emergency.status.pending')}
                {activeRequest.status === 'assigned' && t('emergency.status.assigned')}
                {activeRequest.status === 'enroute' && t('emergency.status.enroute')}
                {activeRequest.status === 'onscene' && t('emergency.status.onscene')}
                {activeRequest.status === 'unassigned' && t('emergency.status.unassigned')}
              </span>
            </div>
          </div>
        </div>

          {/* 4-Step Interactive Timeline */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
              {serviceType} {locale === 'ru' ? 'Этапы вызова' : locale === 'en' ? 'Dispatch Steps' : 'Chaqiruv Bosqichlari'}
            </span>
            <div className="grid grid-cols-4 gap-1 text-[11px] font-extrabold text-center">
              {/* Step 1 */}
              <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 flex flex-col items-center justify-center">
                <Check className="w-3.5 h-3.5 mx-auto text-emerald-700 dark:text-emerald-300" />
                <span className="truncate block">{t('emergency.steps.s1')}</span>
              </div>

              {/* Step 2 */}
              <div className={`p-1.5 rounded-xl border flex flex-col items-center justify-center ${
                ['assigned', 'enroute', 'onscene'].includes(activeRequest.status)
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
              }`}>
                <span className="block text-xs font-bold">
                  {['assigned', 'enroute', 'onscene'].includes(activeRequest.status) ? (
                    <Check className="w-3.5 h-3.5 mx-auto text-emerald-700 dark:text-emerald-300" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 mx-auto" />
                  )}
                </span>
                <span className="truncate block">{t('emergency.steps.s2')}</span>
              </div>

              {/* Step 3 */}
              <div className={`p-1.5 rounded-xl border flex flex-col items-center justify-center ${
                ['enroute', 'onscene'].includes(activeRequest.status)
                  ? 'bg-red-500 text-white border-red-600 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200'
              }`}>
                <span className="block text-xs font-bold">
                  {activeRequest.status === 'enroute' ? (
                    <Truck className="w-3.5 h-3.5 mx-auto text-white" />
                  ) : activeRequest.status === 'onscene' ? (
                    <Check className="w-3.5 h-3.5 mx-auto text-white" />
                  ) : (
                    '3'
                  )}
                </span>
                <span className="truncate block">{t('emergency.steps.s3')}</span>
              </div>

              {/* Step 4 */}
              <div className={`p-1.5 rounded-xl border flex flex-col items-center justify-center ${
                activeRequest.status === 'onscene'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200'
              }`}>
                <span className="block text-xs font-bold">
                  {activeRequest.status === 'onscene' ? <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-white" /> : '4'}
                </span>
                <span className="truncate block">{t('emergency.steps.s4')}</span>
              </div>
            </div>
          </div>

          {/* Caller Details Banner */}
          <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-textSecondary">
              {t('emergency.labels.caller')} <strong className="text-gray-900 dark:text-gray-100">{activeRequest.citizenName || user?.name || (locale === 'ru' ? 'Гражданин (Вы)' : locale === 'en' ? 'Citizen (You)' : 'Fuqaro (Siz)')}</strong>
            </span>
            <span className="text-textSecondary">
              {t('emergency.labels.phone')} <strong className="font-mono text-gray-900 dark:text-gray-100">{activeRequest.citizenPhone || phone}</strong>
            </span>
          </div>

          {/* Assigned / Nearest Unit and Live ETA (Shown immediately on call creation & during transit) */}
          {['pending', 'assigned', 'enroute', 'onscene'].includes(activeRequest.status) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                <span className="text-[10px] font-black text-accentOrange uppercase block">
                  {locale === 'ru' ? 'Расчетное прибытие (ETA)' : locale === 'en' ? 'Estimated Arrival (ETA)' : 'Taxminiy yetib borish vaqti'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {activeRequest.status === 'onscene'
                      ? (locale === 'ru' ? '0 мин' : locale === 'en' ? '0 min' : '0 daqiqa')
                      : `~${activeRequest.etaMinutes || 5} ${t('emergency.labels.minutes')}`}
                  </span>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    ({activeRequest.status === 'onscene' ? '0 km' : `${((activeRequest.distanceMeters || 3800) / 1000).toFixed(1)} km`})
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {activeRequest.status === 'onscene'
                    ? (locale === 'ru' ? 'Сотрудники на месте' : locale === 'en' ? 'Staff on scene' : 'Xodimlar manzilida')
                    : (locale === 'ru'
                      ? `Зеленый коридор: экономия +${activeRequest.trafficDelayMinutes || 6} мин`
                      : locale === 'en'
                      ? `Green corridor: saves +${activeRequest.trafficDelayMinutes || 6} min`
                      : `Yashil yo'lak: +${activeRequest.trafficDelayMinutes || 6} daq vaqt tejaladi`)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase block">
                  {serviceMeta.unitName}
                </span>
                <span className="text-base font-black text-gray-950 dark:text-gray-50 block mt-0.5">
                  {assignedAmbulance?.plateNumber ||
                    (serviceType === '102' ? '01 102 PPA' :
                     serviceType === '101' ? '01 101 FVV' :
                     serviceType === '104' ? '01 104 GAZ' :
                     serviceType === '1050' ? '01 1050 FVV' : '01 103 TAA')}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {activeRequest.status === 'pending'
                    ? (locale === 'ru' ? 'Ближайший свободный экипаж' : locale === 'en' ? 'Nearest available crew' : "Eng yaqin bo'sh ekipaj")
                    : (locale === 'ru' ? 'Дежурный расчет закреплен' : locale === 'en' ? 'Duty squad assigned' : 'Navbatchi brigada biriktirildi')}
                </span>
              </div>
            </div>
          )}

          {/* Road Problems & Traffic Jams along the Emergency Route */}
          {['pending', 'assigned', 'enroute'].includes(activeRequest.status) && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                    {locale === 'ru'
                      ? 'Пробки и проблемы на маршруте'
                      : locale === 'en'
                      ? 'Traffic & Road Issues on Route'
                      : "Yo'nalishdagi tirbandlik va yo'l muammolari"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-black shrink-0">
                  {locale === 'ru' ? 'Сирена / Приоритет' : locale === 'en' ? 'Siren Priority' : "Sirena ustuvorligi"}
                </span>
              </div>

              {(activeRequest.routeIncidents && activeRequest.routeIncidents.length > 0) ? (
                <div className="flex flex-col gap-2">
                  {activeRequest.routeIncidents.map(inc => {
                    const typeBadge =
                      inc.featureType === 'traffic'
                        ? { label: locale === 'ru' ? 'Пробка' : locale === 'en' ? 'Traffic Jam' : 'Tirbandlik', cls: 'bg-amber-500 text-white' }
                        : inc.featureType === 'roadwork'
                        ? { label: locale === 'ru' ? 'Ремонт дороги' : locale === 'en' ? 'Roadwork' : "Yo'l ta'miri", cls: 'bg-orange-600 text-white' }
                        : inc.featureType === 'closure'
                        ? { label: locale === 'ru' ? 'Перекрытие' : locale === 'en' ? 'Closure' : "Yopiq yo'l", cls: 'bg-red-700 text-white' }
                        : { label: locale === 'ru' ? 'ДТП / Опасность' : locale === 'en' ? 'Accident' : 'YTH / Avariya', cls: 'bg-red-600 text-white' };

                    return (
                      <div
                        key={inc.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-gray-900/90 border border-amber-200 dark:border-gray-700 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${typeBadge.cls}`}>
                            {typeBadge.label}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}
                          </span>
                        </div>
                        <div className="font-extrabold text-gray-900 dark:text-gray-100">
                          {inc.title}
                        </div>
                        <div className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                          {inc.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : activeRequest.hazardWarnings && activeRequest.hazardWarnings.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {activeRequest.hazardWarnings.map((w, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-amber-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200">
                      • {w}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {locale === 'ru'
                    ? 'Маршрут свободен, серьезных заторов не обнаружено.'
                    : locale === 'en'
                    ? 'Route is clear, no major congestion detected.'
                    : "Yo'nalish ochiq, jiddiy tirbandlik yoki yopiq yo'llar aniqlanmadi."}
                </div>
              )}
            </div>
          )}

          {/* Turn-by-Turn Guidance Card (Visible while Enroute) */}
          {activeRequest.status === 'enroute' && (
            <div className={`p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 ${serviceMeta.borderColor} text-xs flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-xl ${serviceMeta.colorBg} text-white flex items-center justify-center shrink-0 shadow-md`}>
                <ArrowUpRight className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-black ${serviceMeta.colorText} uppercase tracking-wider block`}>
                  {locale === 'ru' ? 'Навигация экипажа:' : locale === 'en' ? 'Unit Navigation:' : 'Mashina navigatsiyasi:'}
                </span>
                <p className="font-extrabold text-gray-950 dark:text-gray-100 text-sm leading-tight truncate">
                  {currentStep?.instruction || (locale === 'ru' ? "Движение по главной улице к месту вызова" : locale === 'en' ? "Moving along main avenue towards location" : "Shoh ko'cha bo'ylab to'g'riga harakatlanmoqda")}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-700 dark:text-gray-300 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-red-600 inline shrink-0" />
                  <span>{locale === 'ru' ? 'Экипаж движется по карте' : locale === 'en' ? 'Unit moving on map' : 'Xaritada mashina harakatlanmoqda'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Photo/Video attachment preview if present */}
          {activeRequest.mediaUrl && (
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
              <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase block mb-1.5">
                {locale === 'ru' ? 'Прикрепленные материалы (Фото/Видео):' : locale === 'en' ? 'Uploaded Evidence (Photo/Video):' : 'Yuklangan dalil (Foto/Video):'}
              </span>
              {activeRequest.mediaType === 'video' ? (
                <video src={activeRequest.mediaUrl} controls className="max-h-48 rounded-xl w-full object-cover" />
              ) : (
                <img src={activeRequest.mediaUrl} alt="Hodisa rasmi" className="max-h-48 rounded-xl w-full object-cover" />
              )}
            </div>
          )}

          {/* On Scene Arrival Banner */}
          {activeRequest.status === 'onscene' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{serviceMeta.arrivedMsg}</span>
              </div>
              <button
                onClick={handleCompleteDemo}
                disabled={isCancelling}
                className="mt-1 w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{t('emergency.actions.completeCall')}</span>
              </button>
            </div>
          )}

          {/* Station Info */}
          {assignedHospital && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-gray-900 dark:text-gray-100 block truncate">
                  {assignedHospital.name}
                </span>
                <span className="text-[10px] text-gray-600 dark:text-gray-400">
                  {assignedHospital.address || (locale === 'ru' ? 'Городской отдел' : locale === 'en' ? 'City station' : "Shahar bo'limi")}
                </span>
              </div>
            </div>
          )}

          {/* Unassigned Warning & Action to Retry/Create New Call */}
          {activeRequest.status === 'unassigned' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 text-xs flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-amber-900 dark:text-amber-200 text-sm block">
                    {locale === 'ru' ? 'Связь с диспетчером не установлена' : locale === 'en' ? 'Connection to dispatcher timed out' : "Dispetcher bilan aloqa o'rnatilmadi"}
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 text-xs mt-1 leading-relaxed">
                    {locale === 'ru' 
                      ? `Время ожидания ответа диспетчера истекло. Пожалуйста, создайте повторный запрос или позвоните на горячую линию ${serviceMeta.hotline}.`
                      : locale === 'en'
                      ? `Dispatcher response timed out or units are busy. Please retry call or dial ${serviceMeta.hotline} directly.`
                      : `Navbatchi dispetcher qabul qilish vaqti tugadi yoki barcha ekipajlar band. Yangi chaqiruv berishingiz yoki to'g'ridan-to'g'ri ${serviceMeta.hotline} raqamiga qo'ng'iroq qilishingiz mumkin.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleResetAndNewCall}
                  disabled={isCancelling}
                  className={`flex-1 py-2.5 px-4 rounded-full ${serviceMeta.colorBg} hover:opacity-95 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{t('emergency.actions.newCall')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="py-2.5 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{t('common.cancel')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Cancel button */}
          {['pending', 'assigned', 'unassigned'].includes(activeRequest.status) && activeRequest.status !== 'unassigned' && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="mt-1 w-full py-2.5 rounded-full border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{isCancelling ? t('emergency.actions.cancelling') : t('emergency.actions.cancelCall')}</span>
            </button>
          )}
        </div>
      ) : (
        /* Emergency Request Intake Forms */
        <form onSubmit={handleSubmit} className="p-5 rounded-card bg-white dark:bg-darkCard border-2 border-gray-300 dark:border-gray-700 shadow-float flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ServiceIcon className={`w-5 h-5 ${serviceMeta.colorText}`} />
              <h2 className="text-base font-black text-gray-950 dark:text-gray-50">
                {serviceMeta.title} {locale === 'ru' ? '— вызов' : locale === 'en' ? '— Call' : 'chaqirish'}
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 font-medium">
              {locale === 'ru' 
                ? 'Ближайший дежурный экипаж автоматически получит вызов и точные координаты'
                : locale === 'en'
                ? 'Nearest duty crew automatically dispatched with GPS coordinates'
                : "Eng yaqin navbatchi brigadaga avtomatik koordinata va chaqiruv yo'naltiriladi"}
            </p>
          </div>

          {/* Citizen Account Identity Status */}
          {user ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      {t('auth.roles.citizen')}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono block truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                ✓ {t('emergency.labels.activeAccount')}
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
              <span className="text-textSecondary text-[11px]">
                {t('emergency.labels.anonymousCall')}
              </span>
              <span className="text-[10px] font-bold text-accentOrange">
                {t('emergency.labels.canConnectAccount')}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 101 Yong'in: NO description or severity required (Direct 1-click alarm!) */}
          {serviceType === '101' ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-black text-sm">
                <Flame className="w-5 h-5 text-rose-600" />
                <span>{t('emergency.labels.instantSignal')}</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                {t('emergency.labels.fireNotice')}
              </p>
            </div>
          ) : (
            /* 103, 102, 1050: Specific Presets & Description Form */
            <>
              {/* Severity Selector (for 103 and 102) */}
              {serviceType !== '1050' && (
                <div>
                  <label className="text-xs font-extrabold text-gray-900 dark:text-gray-100 block mb-2">
                    {t('emergency.labels.severity')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeverity(1)}
                      className={`p-2.5 rounded-2xl border-2 text-xs font-black flex flex-col items-center gap-1 transition-all ${
                        severity === 1
                          ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400'
                          : 'bg-white dark:bg-gray-800 text-red-600 border-red-300 dark:border-red-900'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>{t('emergency.labels.sev1')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeverity(2)}
                      className={`p-2.5 rounded-2xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        severity === 2
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
                          : 'bg-white dark:bg-gray-800 text-amber-600 border-amber-300 dark:border-amber-900'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{t('emergency.labels.sev2')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeverity(3)}
                      className={`p-2.5 rounded-2xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        severity === 3
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                          : 'bg-white dark:bg-gray-800 text-emerald-600 border-emerald-300 dark:border-emerald-900'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('emergency.labels.sev3')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Service-Specific Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-gray-950 dark:text-gray-100 block">
                    {serviceType === '102'
                      ? t('emergency.labels.details102')
                      : serviceType === '104'
                      ? t('emergency.labels.details104')
                      : serviceType === '1050'
                      ? t('emergency.labels.details1050')
                      : t('emergency.labels.details103')}
                  </label>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {locale === 'ru' ? 'Быстрый выбор:' : locale === 'en' ? 'Quick select:' : 'Tezkor tanlash:'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {serviceType === '104' && (
                    locale === 'ru' ? [
                      { label: "Запах газа в квартире", sev: 1, text: "В квартире чувствуется сильный запах бытового газа, перекрыт кран." },
                      { label: "Угроза угарного газа (ис гази)", sev: 1, text: "Неисправность дымохода отопительного котла, симптомы отравления угарным газом." },
                      { label: "Повреждение уличного газопровода", sev: 1, text: "На улице повреждена газовая труба, слышен свист утечки газа." },
                      { label: "Авария газовой плиты / счетчика", sev: 2, text: "Неисправность газового оборудования или счетчика, требуется аварийная бригада 104." }
                    ] : locale === 'en' ? [
                      { label: "Gas Smell Indoors", sev: 1, text: "Strong smell of natural gas inside the apartment, main valve shut off." },
                      { label: "Carbon Monoxide Risk", sev: 1, text: "Heating chimney malfunction, suspected carbon monoxide hazard." },
                      { label: "Outdoor Pipeline Damage", sev: 1, text: "Street gas pipeline damaged, audible gas leak." },
                      { label: "Gas Stove / Meter Fault", sev: 2, text: "Gas stove or meter malfunction requiring 104 emergency crew." }
                    ] : [
                      { label: "Xonadonda gaz hidi (sizib chiqish)", sev: 1, text: "Xonadonda kuchli tabiiy gaz hidi sezilmoqda, gaz jo'mragi yopildi." },
                      { label: "Is gazi xavfi / Dudburon nosozligi", sev: 1, text: "Isitish qozoni dudburoni nosozligi va is gazi (CO) tarqalishi xavfi." },
                      { label: "Ko'cha gaz quvuri shikastlanishi", sev: 1, text: "Ko'chadagi gaz quvuri shikastlangan, yuqori bosimli gaz sizib chiqmoqda." },
                      { label: "Gaz plitasi / hisoblagich avariyasi", sev: 2, text: "Gaz jihozi yoki hisoblagich ulanish joyidan gaz sizmoqda, 104 brigadasi kerak." }
                    ]
                  ).map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setDescription(p.text);
                        if (p.sev) setSeverity(p.sev as EmergencySeverity);
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-300 text-teal-900 dark:text-teal-200 transition-all active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}

                  {serviceType === '102' && (
                    locale === 'ru' ? [
                      { label: "Драка / Нарушение порядка", text: "В общественном месте происходит драка и нарушение правопорядка." },
                      { label: "ДТП / Столкновение", text: "Произошло дорожно-транспортное происшествие, движение заблокировано." },
                      { label: "Кража / Грабеж", text: "Попытка незаконного завладения чужим имуществом или кража." },
                      { label: "Подозрительные лица", text: "Замечены подозрительные лица, представляющие угрозу окружающим." }
                    ] : locale === 'en' ? [
                      { label: "Brawl / Disturbance", text: "Public disturbance and fight in progress." },
                      { label: "Traffic Accident", text: "Vehicle collision occurred, traffic is blocked." },
                      { label: "Theft / Robbery", text: "Attempted robbery or illegal appropriation of property." },
                      { label: "Suspicious Persons", text: "Suspicious individuals threatening public safety." }
                    ] : [
                      { label: "Janjal / Tartibbuzarlik", text: "Jamoat joyida janjal va tartibbuzarlik holati yuz bermoqda." },
                      { label: "YTH / Avariya", text: "Avtomobillar to'qnashuvi sodir bo'ldi, yo'l harakati to'silgan." },
                      { label: "O'g'rilik / Talash", text: "Shaxsiy mulkni noqonuniy egallash yoki o'g'rilik holati." },
                      { label: "Shubhali shaxslar", text: "Atrofdagilarga xavf tug'diruvchi shubhali shaxslar ko'rildi." }
                    ]
                  ).map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDescription(p.text)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-300 text-blue-900 dark:text-blue-200 transition-all active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}

                  {serviceType === '1050' && (
                    locale === 'ru' ? [
                      { label: "Обрушение здания", text: "Повреждение несущих конструкций здания или угроза обрушения." },
                      { label: "Затопление / Сель", text: "Прорыв стоков или затопление жилых домов водой." },
                      { label: "Застряли в лифте / на высоте", text: "Граждане заблокированы в неисправном лифте или на высоте." },
                      { label: "Техногенная авария", text: "Утечка опасных веществ, хлопок газа или техногенное ЧС." }
                    ] : locale === 'en' ? [
                      { label: "Building Collapse", text: "Structural damage to building or immediate collapse risk." },
                      { label: "Flooding / Mudflow", text: "Flooding or heavy mudflow threatening residential buildings." },
                      { label: "Trapped in Elevator", text: "Citizens trapped inside broken elevator or at heights." },
                      { label: "Industrial Disaster", text: "Gas leak or hazardous industrial accident occurred." }
                    ] : [
                      { label: "Bino / Konstruksiya qulashi", text: "Bino konstruksiyasining shikastlanishi yoki qulash xavfi mavjud." },
                      { label: "Suv toshqini / Sel", text: "Kuchsiz to'g'on yoki yomg'ir suvlari toshib, xonadonlarni suv bosmoqda." },
                      { label: "Liftda / Balandlikda qolish", text: "Fuqarolar nosoz liftda yoki baland bino tomida qolib ketgan." },
                      { label: "Texnogen falokat", text: "Gaz sizib chiqishi, portlash yoki texnogen xavfli hodisa yuz berdi." }
                    ]
                  ).map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDescription(p.text)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300 text-amber-900 dark:text-amber-200 transition-all active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}

                  {serviceType === '103' && (
                    locale === 'ru' ? [
                      { label: "Сердечный приступ (боль в груди)", sev: 1, text: "Острая давящая боль за грудиной у пациента, холодный пот." },
                      { label: "Травма / Падение", sev: 2, text: "Пациент упал и получил травму, не может самостоятельно передвигаться." },
                      { label: "Высокая температура (39.9°C)", sev: 2, text: "Температура тела поднялась до 39.9°C, сильная слабость." },
                      { label: "Острая одышка / удушье", sev: 1, text: "Острая дыхательная недостаточность и потеря сознания." }
                    ] : locale === 'en' ? [
                      { label: "Heart Attack (Chest Pain)", sev: 1, text: "Severe crushing chest pain, cold sweat." },
                      { label: "Injury / Severe Fall", sev: 2, text: "Patient fell and got injured, unable to move." },
                      { label: "High Fever (40°C)", sev: 2, text: "Body temperature rose to 39.9°C with extreme weakness." },
                      { label: "Acute Respiratory Failure", sev: 1, text: "Acute shortness of breath and fainting risk." }
                    ] : [
                      { label: "Yurak xuruji (o'tkir og'riq)", sev: 1, text: "Bemor ko'krak qafasida o'tkir qisuvchi og'riq, sovuq ter bosgan." },
                      { label: "Jarohat / Yiqilish", sev: 2, text: "Bemor yiqilib jarohat olgan, harakatlanish imkonsiz." },
                      { label: "Yuqori tana harorati (40°C)", sev: 2, text: "Tana harorati 39.9°C ga ko'tarilgan, kuchli holsizlik mavjud." },
                      { label: "O'tkir nafas yetishmovchiligi", sev: 1, text: "O'tkir nafas yetishmovchiligi va hushdan ketish xavfi." }
                    ]
                  ).map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setDescription(p.text);
                        if (p.sev) setSeverity(p.sev as EmergencySeverity);
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-800 hover:bg-red-50 border border-gray-300 text-gray-800 dark:text-gray-200 transition-all active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={locale === 'ru' ? "Опишите детали происшествия и ориентиры..." : locale === 'en' ? "Describe situation details and landmarks..." : "Vaziyat tafsiloti va mo'ljalni yozing..."}
                  rows={3}
                  maxLength={500}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-gray-600 dark:border-gray-400 bg-gray-50 dark:bg-gray-900 text-black dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accentOrange placeholder:text-gray-500"
                />
              </div>

              {/* 1050 Photo / Video Upload Section */}
              {serviceType === '1050' && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border-2 border-dashed border-amber-400 dark:border-amber-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>{t('emergency.labels.uploadEvidence')}</span>
                    </label>
                    {mediaUrl && (
                      <button
                        type="button"
                        onClick={() => { setMediaUrl(undefined); setMediaType(undefined); }}
                        className="text-[10px] text-red-600 font-bold hover:underline"
                      >
                        {t('emergency.labels.deleteMedia')}
                      </button>
                    )}
                  </div>

                  {mediaUrl ? (
                    <div className="rounded-xl overflow-hidden border border-amber-300 max-h-40 flex items-center justify-center bg-black">
                      {mediaType === 'video' ? (
                        <video src={mediaUrl} controls className="max-h-40 w-full object-cover" />
                      ) : (
                        <img src={mediaUrl} alt="Hodisa" className="max-h-40 w-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-4 px-2 cursor-pointer rounded-xl bg-white dark:bg-gray-900 border border-amber-200 dark:border-gray-700 hover:bg-amber-100/50 transition-colors">
                      <ImageIcon className="w-6 h-6 text-amber-600 mb-1" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {t('emergency.labels.selectMedia')}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {t('emergency.labels.selectMediaDesc')}
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </>
          )}

          {/* Phone Number Input */}
          <div>
            <label className="text-xs font-black text-gray-950 dark:text-gray-100 block mb-1.5">
              {t('emergency.labels.phoneInput')}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-gray-600 dark:border-gray-400 bg-gray-50 dark:bg-gray-900 text-black dark:text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-accentOrange placeholder:text-gray-500"
            />
          </div>

          {/* Location details */}
          <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accentOrange shrink-0" />
              <div>
                <span className="font-black text-gray-900 dark:text-gray-100 block">{t('emergency.labels.coordsGps')}</span>
                <span className="text-[10px] text-gray-700 dark:text-gray-300 font-mono font-bold">
                  {userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-black">
              {t('emergency.labels.gpsActive')}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-full ${serviceMeta.buttonBg} active:scale-98 text-white font-black text-sm shadow-float transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <ServiceIcon className="w-5 h-5" />
            <span>
              {isSubmitting
                ? (locale === 'ru' ? 'Отправка...' : locale === 'en' ? 'Sending...' : 'Yuborilmoqda...')
                : serviceType === '101'
                ? (locale === 'ru' ? "ВЫЗОВ ПОЖАРНОЙ СЛУЖБЫ 101 (SOS)" : locale === 'en' ? "CALL FIRE SERVICE 101 (SOS)" : "101 YONG'IN XAVFSIZLIGINI CHAQIRISH (SOS)")
                : (locale === 'ru' ? `Вызвать ${serviceMeta.title} (SOS)` : locale === 'en' ? `Emergency Call ${serviceMeta.title} (SOS)` : `${serviceMeta.title}ni chaqirish (SOS)`)}
            </span>
          </button>

          {/* Live Road Problems Near Caller */}
          {features.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{locale === 'ru' ? 'Дорожная обстановка вокруг' : locale === 'en' ? 'Road Conditions Nearby' : "Atrofdagi yo'l muammolari"} ({features.length})</span>
                </span>
                <span className="text-[10px] text-textSecondary font-bold">Jonli</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {features.slice(0, 5).map(f => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setFocusedLocation({ lat: f.latitude, lon: f.longitude });
                      setSelectedFeature(f);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer hover:border-amber-400 flex items-center justify-between transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black mr-1 text-white ${
                        f.featureType === 'accident' ? 'bg-rose-600' :
                        f.featureType === 'traffic' ? 'bg-amber-500' :
                        f.featureType === 'closure' ? 'bg-red-700' : 'bg-amber-600'
                      }`}>
                        {f.featureType === 'accident' ? 'YTH' :
                         f.featureType === 'traffic' ? 'Tirbandlik' :
                         f.featureType === 'closure' ? 'Yopiq' : "Ta'mir"}
                      </span>
                      <span>{f.title}</span>
                    </div>
                    <span className="text-[10px] text-accentOrange shrink-0 font-black flex items-center gap-0.5">
                      <span>Ko'rish</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
