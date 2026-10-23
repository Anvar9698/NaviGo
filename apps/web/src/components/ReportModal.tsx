import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldAlert,
  Mic
} from 'lucide-react';
import { ReportCategory, ReportSeverity } from '@yol/shared';

export const ReportModal: React.FC = () => {
  const { 
    isReportingOpen, 
    setIsReportingOpen, 
    t, 
    userCoords, 
    user, 
    token, 
    setIsAuthOpen,
    refreshData 
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<ReportCategory>('damage');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ReportSeverity>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  if (!isReportingOpen) return null;

  const categories: { id: ReportCategory; label: string; icon: string }[] = [
    { id: 'damage', label: t('report.categories.damage'), icon: '🕳️' },
    { id: 'closure', label: t('report.categories.closure'), icon: '⛔' },
    { id: 'construction', label: t('report.categories.construction'), icon: '🚧' },
    { id: 'hazard', label: t('report.categories.hazard'), icon: '⚠️' },
    { id: 'signage', label: t('report.categories.signage'), icon: '🚸' },
    { id: 'transit', label: t('report.categories.transit'), icon: '🚌' },
    { id: 'map_error', label: t('report.categories.map_error'), icon: '🗺️' },
    { id: 'other', label: t('report.categories.other'), icon: '📍' }
  ];

  const handleSubmit = async () => {
    if (!user || !token) {
      setIsAuthOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          title: title || `${category} issue at current location`,
          description,
          latitude: userCoords.lat,
          longitude: userCoords.lon,
          severity
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedReportId(data.report.id);
        refreshData();
      } else {
        alert('Failed to submit report. Please check required fields.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsReportingOpen(false);
    setStep(1);
    setSubmittedReportId(null);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="w-full max-w-xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div>
            <span className="text-xs font-bold text-accentOrange uppercase tracking-wider">
              {t('report.title')}
            </span>
            <h2 id="report-modal-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
              {step === 1 && t('report.step1Title')}
              {step === 2 && t('report.step2Title')}
              {step === 3 && t('report.step3Title')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Banner (Part 6.1) */}
        <div className="flex items-center gap-2.5 p-3 my-4 bg-orangeTint dark:bg-opacity-20 rounded-2xl text-xs font-semibold text-accentOrange border border-orange-200">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{t('report.safetyWarning')}</span>
        </div>

        {/* Success Screen */}
        {submittedReportId ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-statusSuccessBg text-statusSuccess flex items-center justify-center mb-4">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-bold text-textPrimary dark:text-darkText">
              {t('report.successTitle')}
            </h3>
            <p className="text-sm text-textSecondary dark:text-darkTextSec mt-2 max-w-sm">
              {t('report.successDesc')}
            </p>
            <div className="mt-4 px-4 py-2 bg-innerSoftArea dark:bg-gray-800 rounded-full text-xs font-mono font-bold text-textPrimary dark:text-darkText">
              Tracking ID: {submittedReportId}
            </div>
            <button
              onClick={handleClose}
              className="mt-6 px-8 py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: Category Selection */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3 py-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setStep(2);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                      category === cat.id
                        ? 'border-accentOrange bg-orangeTint/20 font-bold shadow-sm'
                        : 'border-yolBorder dark:border-darkBorder bg-innerSoftArea dark:bg-gray-800 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm text-textPrimary dark:text-darkText">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Location & Description */}
            {step === 2 && (
              <div className="flex flex-col gap-4 py-2">
                {/* Location indicator */}
                <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-darkBorder flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-accentOrange" />
                    <div>
                      <div className="text-sm font-bold text-textPrimary dark:text-darkText">
                        {t('report.confirmLocation')}
                      </div>
                      <div className="text-xs text-textSecondary dark:text-darkTextSec font-mono">
                        {userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-statusSuccessBg text-statusSuccess">
                    GPS Accurate
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    Title / Summary
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Deep pothole near right curb"
                    className="w-full p-3 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText focus:outline-none focus:ring-2 focus:ring-accentOrange"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    {t('report.addNote')}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe any safety risks, affected lanes, or landmark..."
                    className="w-full p-3 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText focus:outline-none focus:ring-2 focus:ring-accentOrange"
                  />
                </div>

                {/* Optional Photo Attachment */}
                <div className="p-4 border-2 border-dashed border-yolBorder dark:border-darkBorder rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-accentOrange transition-colors">
                  <Camera className="w-6 h-6 text-textSecondary dark:text-darkTextSec mb-1" />
                  <span className="text-xs font-semibold text-textPrimary dark:text-darkText">
                    {t('report.addPhoto')}
                  </span>
                  <span className="text-[10px] text-textSecondary dark:text-darkTextSec">
                    EXIF & GPS metadata will be automatically removed
                  </span>
                </div>

                {/* Severity */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'urgent'] as ReportSeverity[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverity(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                          severity === lvl
                            ? 'bg-blackPill text-white shadow-sm'
                            : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="flex flex-col gap-4 py-2">
                <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-darkBorder space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">Category:</span>
                    <span className="font-bold text-textPrimary dark:text-darkText capitalize">{category}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">Title:</span>
                    <span className="font-bold text-textPrimary dark:text-darkText">{title || 'Untitled'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">Coordinates:</span>
                    <span className="font-mono text-textPrimary dark:text-darkText">{userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">Urgency:</span>
                    <span className="font-bold uppercase text-accentOrange">{severity}</span>
                  </div>
                </div>

                {!user && (
                  <div className="p-4 rounded-2xl bg-orangeTint/30 border border-accentOrange text-center">
                    <p className="text-xs font-bold text-accentOrange mb-2">
                      Citizen sign-in required to submit and track reports
                    </p>
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-6 py-2 rounded-full bg-accentOrange text-white text-xs font-bold"
                    >
                      Sign In or Register
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-yolBorder dark:border-darkBorder">
              {step > 1 ? (
                <button
                  onClick={() => setStep((step - 1) as any)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText text-sm font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back')}</span>
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((step + 1) as any)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blackPill text-white text-sm font-bold hover:bg-blackPillHover"
                >
                  <span>{t('common.next')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !user}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-blackPill text-white text-base font-bold hover:bg-blackPillHover disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? t('common.loading') : t('report.submitButton')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
