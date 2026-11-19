import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MessageCircle,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Lesson, Student } from '../types';
import {
  formatExamCountdown,
  formatPhoneDisplay,
  formatTurkishDate,
  getDaysUntilExam,
  getWhatsAppUrl,
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface StudentDetailModalProps {
  student: Student | null;
  lessons: Lesson[];
  onClose: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => Promise<void> | void;
  onAdjustCompletedCount: (studentId: string, delta: number) => Promise<void> | void;
  onAddLesson: (studentId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onToggleLessonStatus: (lesson: Lesson) => Promise<void> | void;
  onDeleteLesson: (lesson: Lesson) => Promise<void> | void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  lessons,
  onClose,
  onEditStudent,
  onDeleteStudent,
  onAdjustCompletedCount,
  onAddLesson,
  onEditLesson,
  onToggleLessonStatus,
  onDeleteLesson,
}) => {
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  if (!student) return null;

  const remaining = Math.max(0, student.totalLessons - student.completedLessons);
  const progressPct =
    student.totalLessons > 0
      ? Math.min(100, Math.round((student.completedLessons / student.totalLessons) * 100))
      : 0;
  const daysLeft = getDaysUntilExam(student.examDate);
  const waUrl = getWhatsAppUrl(student.phone);

  const studentLessons = lessons
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-detail-title"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="min-w-0">
              <h2
                id="student-detail-title"
                className="truncate text-xl font-bold text-navy-900 dark:text-white"
              >
                {student.fullName}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-navy-800 dark:text-sky-400">
                  {student.licenseClass} Sınıfı
                </span>
                <span aria-hidden="true"> · </span>
                <span>Kayıt: {formatTurkishDate(student.registrationDate)}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditStudent(student)}
                aria-label="Kursiyeri düzenle"
                title="Düzenle"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-navy-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteStudent(true)}
                aria-label="Kursiyeri sil"
                title="Sil"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* WhatsApp & Exam Strip */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-emerald-900 transition hover:bg-emerald-100/80 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/70"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      WhatsApp ile Mesaj Gönder
                    </span>
                    <span className="block truncate text-base font-bold tabular-nums">
                      {formatPhoneDisplay(student.phone)}
                    </span>
                  </div>
                  <MessageCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                </a>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="block text-xs text-slate-500">Telefon</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {student.phone}
                  </span>
                </div>
              )}

              <div className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                <div>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Direksiyon Sınavı
                  </span>
                  <span className="block text-base font-bold text-navy-900 dark:text-white">
                    {student.examDate ? formatTurkishDate(student.examDate) : 'Tarih girilmedi'}
                  </span>
                  {student.examDate && (
                    <span
                      className={`text-xs font-semibold ${
                        daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {formatExamCountdown(daysLeft)}
                    </span>
                  )}
                </div>
                <Calendar className="h-5 w-5 shrink-0 text-navy-700 dark:text-sky-400" />
              </div>
            </div>

            {/* Completed Lessons Counter with +1 / -1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                    Eğitim İlerlemesi
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-600 tabular-nums dark:text-slate-300">
                    Toplam <strong className="text-navy-900 dark:text-white">{student.totalLessons}</strong>
                    {' · '}
                    Tamamlanan <strong className="text-emerald-700 dark:text-emerald-400">{student.completedLessons}</strong>
                    {' · '}
                    Kalan <strong className="text-navy-900 dark:text-sky-400">{remaining}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onAdjustCompletedCount(student.id, -1)}
                    disabled={student.completedLessons <= 0}
                    aria-label="Tamamlanan eğitimi 1 azalt"
                    title="Geri al (-1)"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Minus className="h-4 w-4" />
                    <span>1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onAdjustCompletedCount(student.id, 1)}
                    aria-label="Tamamlanan eğitimi 1 artır"
                    title="Tamamlanan ekle (+1)"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl bg-navy-900 px-3.5 text-sm font-bold text-white transition hover:bg-navy-800 active:scale-[0.98] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                  >
                    <Plus className="h-4 w-4" />
                    <span>1</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-navy-900 transition-all duration-300 dark:bg-sky-400"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Notes */}
            {student.notes && (
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="text-sm font-bold text-navy-900 dark:text-white">Eğitmen Notları</h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {student.notes}
                </p>
              </div>
            )}

            {/* Individual Lesson Schedule */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">
                    Bireysel Eğitim Takvimi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Planlanmış dersleri buradan ekleyip tamamlandı olarak işaretleyebilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddLesson(student.id)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 whitespace-nowrap shrink-0 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                >
                  <Plus className="h-4 w-4" />
                  <span>Eğitim Ekle</span>
                </button>
              </div>

              {studentLessons.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Bu kursiyer için henüz kayıtlı eğitim saati bulunmuyor.
                </div>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {studentLessons.map((lesson) => {
                    const isCompleted = lesson.status === 'completed';
                    return (
                      <div
                        key={lesson.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-navy-900 dark:text-white">
                            <span>{formatTurkishDate(lesson.date)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{lesson.time}</span>
                          </div>
                          {lesson.note && (
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                              {lesson.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => void onToggleLessonStatus(lesson)}
                            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Tamamlandı</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                <span>Planlandı</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditLesson(lesson)}
                            aria-label="Eğitimi düzenle"
                            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLessonToDelete(lesson)}
                            aria-label="Eğitimi sil"
                            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteStudent}
        title="Kursiyeri Sil"
        description={`${student.fullName} adlı kursiyer ve kendisine ait tüm eğitim kayıtları kalıcı olarak silinecek. Devam etmek istiyor musunuz?`}
        confirmLabel="Evet, Sil"
        destructive
        onCancel={() => setConfirmDeleteStudent(false)}
        onConfirm={() => {
          setConfirmDeleteStudent(false);
          void onDeleteStudent(student.id);
          onClose();
        }}
      />

      <ConfirmModal
        open={!!lessonToDelete}
        title="Eğitim Kaydını Sil"
        description={
          lessonToDelete?.status === 'completed'
            ? 'Bu eğitim “Tamamlandı” olarak işaretli. Silindiğinde kursiyerin tamamlanan eğitim sayısı 1 azaltılacaktır. Silinsin mi?'
            : 'Bu planlanmış eğitim kaydı silinecek. Devam etmek istiyor musunuz?'
        }
        confirmLabel="Sil"
        destructive
        onCancel={() => setLessonToDelete(null)}
        onConfirm={() => {
          if (lessonToDelete) {
            void onDeleteLesson(lessonToDelete);
          }
          setLessonToDelete(null);
        }}
      />
    </>
  );
};
