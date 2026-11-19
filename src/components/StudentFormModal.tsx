import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Student } from '../types';
import { getTodayISO } from '../utils/formatters';

interface StudentFormModalProps {
  open: boolean;
  initialStudent?: Student | null;
  onClose: () => void;
  onSave: (data: {
    fullName: string;
    phone: string;
    licenseClass: string;
    registrationDate: string;
    totalLessons: number;
    completedLessons: number;
    examDate: string;
    notes: string;
  }) => Promise<void> | void;
}

const LICENSE_PRESETS = ['B', 'B Otomatik', 'A2', 'A1', 'A', 'C', 'D'];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  open,
  initialStudent,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseClass, setLicenseClass] = useState('B');
  const [registrationDate, setRegistrationDate] = useState(getTodayISO());
  const [totalLessons, setTotalLessons] = useState('14');
  const [completedLessons, setCompletedLessons] = useState('0');
  const [examDate, setExamDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialStudent) {
      setFullName(initialStudent.fullName);
      setPhone(initialStudent.phone);
      setLicenseClass(initialStudent.licenseClass || 'B');
      setRegistrationDate(initialStudent.registrationDate || getTodayISO());
      setTotalLessons(String(initialStudent.totalLessons));
      setCompletedLessons(String(initialStudent.completedLessons));
      setExamDate(initialStudent.examDate || '');
      setNotes(initialStudent.notes || '');
    } else {
      setFullName('');
      setPhone('');
      setLicenseClass('B');
      setRegistrationDate(getTodayISO());
      setTotalLessons('14');
      setCompletedLessons('0');
      setExamDate('');
      setNotes('');
    }
    setError('');
  }, [open, initialStudent]);

  if (!open) return null;

  const parsedTotal = Math.max(0, parseInt(totalLessons, 10) || 0);
  const parsedCompleted = Math.max(0, parseInt(completedLessons, 10) || 0);
  const remainingPreview = Math.max(0, parsedTotal - parsedCompleted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedLicense = licenseClass.trim() || 'B';

    if (!trimmedName) {
      setError('Lütfen kursiyerin ad ve soyadını girin.');
      return;
    }
    if (!trimmedPhone) {
      setError('Lütfen telefon numarasını girin.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        fullName: trimmedName,
        phone: trimmedPhone,
        licenseClass: trimmedLicense,
        registrationDate: registrationDate || getTodayISO(),
        totalLessons: parsedTotal,
        completedLessons: parsedCompleted,
        examDate: examDate.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch {
      setError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700" />
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2
            id="student-form-title"
            className="text-lg font-bold text-navy-900 dark:text-white"
          >
            {initialStudent ? 'Kursiyeri Düzenle' : 'Yeni Kursiyer Ekle'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
              Ad Soyad *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Örn. Ayşe Demir"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400 dark:focus:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
              Telefon Numarası *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Örn. 0532 123 45 67"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400 dark:focus:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
              Ehliyet Sınıfı
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {LICENSE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLicenseClass(preset)}
                  className={`min-h-[40px] rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    licenseClass === preset
                      ? 'bg-navy-900 text-white dark:bg-sky-500 dark:text-slate-950'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={licenseClass}
              onChange={(e) => setLicenseClass(e.target.value)}
              placeholder="Farklı sınıf yazabilirsiniz (ör. CE)"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400 dark:focus:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                Kayıt Tarihi
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                Direksiyon Sınav Tarihi
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-900 dark:text-slate-200">
                Toplam Eğitim
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={totalLessons}
                onChange={(e) => setTotalLessons(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold tabular-nums text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 dark:text-slate-200">
                Tamamlanan
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={completedLessons}
                onChange={(e) => setCompletedLessons(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold tabular-nums text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Kalan Eğitim
              </span>
              <div className="mt-1.5 flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-base font-bold tabular-nums text-navy-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-sky-400">
                {remainingPreview}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
              Notlar
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gelişim durumu, dikkat edilecek konular, buluşma noktası..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400 dark:focus:bg-slate-900"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            >
              {saving ? 'Kaydediliyor...' : initialStudent ? 'Değişiklikleri Kaydet' : 'Kursiyeri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
