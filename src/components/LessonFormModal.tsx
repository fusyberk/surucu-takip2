import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Lesson, LessonStatus, Student } from '../types';
import { getTodayISO } from '../utils/formatters';

interface LessonFormModalProps {
  open: boolean;
  students: Student[];
  lockedStudentId?: string;
  initialDate?: string;
  initialLesson?: Lesson | null;
  onClose: () => void;
  onSave: (data: {
    studentId: string;
    date: string;
    time: string;
    status: LessonStatus;
    note: string;
  }) => Promise<void> | void;
}

export const LessonFormModal: React.FC<LessonFormModalProps> = ({
  open,
  students,
  lockedStudentId,
  initialDate,
  initialLesson,
  onClose,
  onSave,
}) => {
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [time, setTime] = useState('10:00');
  const [status, setStatus] = useState<LessonStatus>('planned');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialLesson) {
      setStudentId(initialLesson.studentId);
      setDate(initialLesson.date);
      setTime(initialLesson.time);
      setStatus(initialLesson.status);
      setNote(initialLesson.note || '');
    } else {
      setStudentId(lockedStudentId || students[0]?.id || '');
      setDate(initialDate || getTodayISO());
      setTime('10:00');
      setStatus('planned');
      setNote('');
    }
    setError('');
  }, [open, initialLesson, lockedStudentId, initialDate, students]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError('Lütfen bir kursiyer seçin.');
      return;
    }
    if (!date) {
      setError('Lütfen eğitim tarihini seçin.');
      return;
    }
    if (!time) {
      setError('Lütfen eğitim saatini seçin.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        studentId,
        date,
        time,
        status,
        note: note.trim(),
      });
      onClose();
    } catch {
      setError('Eğitim kaydedilirken bir hata oluştu.');
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
        aria-labelledby="lesson-form-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700" />
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2
            id="lesson-form-title"
            className="text-lg font-bold text-navy-900 dark:text-white"
          >
            {initialLesson ? 'Eğitimi Düzenle' : 'Eğitim Planla'}
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {students.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              Eğitim planlamak için önce en az bir kursiyer eklemelisiniz.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                  Kursiyer
                </label>
                <select
                  value={studentId}
                  disabled={!!lockedStudentId || !!initialLesson}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white disabled:opacity-75 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.licenseClass})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                    Saat
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono tabular-nums text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <span className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                  Durum
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatus('planned')}
                    className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      status === 'planned'
                        ? 'bg-white text-navy-900 shadow-xs dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Planlandı
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('completed')}
                    className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      status === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                        : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Tamamlandı
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Yalnızca “Tamamlandı” olarak işaretlenen eğitimler tamamlanan ders sayısına eklenir.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-900 dark:text-slate-200">
                  Ders Notu (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn. Paralel park çalışması"
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-navy-700 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400"
                />
              </div>
            </>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              İptal
            </button>
            {students.length > 0 && (
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
              >
                {saving ? 'Kaydediliyor...' : initialLesson ? 'Güncelle' : 'Eğitimi Kaydet'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
