import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  Search,
  UserPlus,
} from 'lucide-react';
import { Student } from '../types';
import {
  formatExamCountdown,
  formatPhoneDisplay,
  formatTurkishDate,
  getDaysUntilExam,
  getTodayISO,
  getWhatsAppUrl,
} from '../utils/formatters';

interface StudentsViewProps {
  students: Student[];
  onAddStudent: () => void;
  onSelectStudent: (student: Student) => void;
  onAdjustCompletedCount: (studentId: string, delta: number) => Promise<void> | void;
}

type StudentFilter = 'all' | 'active' | 'exam' | 'finished';

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onAddStudent,
  onSelectStudent,
  onAdjustCompletedCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StudentFilter>('all');
  const today = getTodayISO();

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return students
      .filter((s) => {
        if (q) {
          const matches =
            s.fullName.toLocaleLowerCase('tr-TR').includes(q) ||
            s.phone.toLocaleLowerCase('tr-TR').includes(q) ||
            s.licenseClass.toLocaleLowerCase('tr-TR').includes(q);
          if (!matches) return false;
        }

        const remaining = Math.max(0, s.totalLessons - s.completedLessons);
        const examDays = getDaysUntilExam(s.examDate, today);

        if (filter === 'active') return remaining > 0;
        if (filter === 'exam') return examDays !== null && examDays >= 0;
        if (filter === 'finished') return remaining === 0;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [students, searchQuery, filter, today]);

  const filters: { key: StudentFilter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'active', label: 'Aktif' },
    { key: 'exam', label: 'Sınavı Olan' },
    { key: 'finished', label: 'Eğitimi Biten' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Kursiyerler
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 tabular-nums dark:text-slate-400">
            Toplam {students.length} kayıtlı kursiyer
          </p>
        </div>

        <button
          type="button"
          onClick={onAddStudent}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 active:scale-[0.98] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          <UserPlus className="h-4 w-4" />
          <span>Yeni Kursiyer</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ad soyad, telefon veya ehliyet sınıfı ara..."
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-navy-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filter === item.key
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student Cards */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-navy-900 dark:text-white">
            {students.length === 0
              ? 'Henüz kayıtlı kursiyeriniz yok'
              : 'Arama kriterine uyan kursiyer bulunamadı'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {students.length === 0
              ? 'Yeni bir kursiyer ekleyerek direksiyon eğitimlerini takip etmeye başlayın.'
              : 'Farklı bir arama kelimesi deneyebilir veya filtreyi temizleyebilirsiniz.'}
          </p>
          {students.length === 0 && (
            <button
              type="button"
              onClick={onAddStudent}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950"
            >
              <UserPlus className="h-4 w-4" />
              <span>İlk Kursiyeri Ekle</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredStudents.map((student) => {
            const remaining = Math.max(0, student.totalLessons - student.completedLessons);
            const pct =
              student.totalLessons > 0
                ? Math.min(100, Math.round((student.completedLessons / student.totalLessons) * 100))
                : 0;
            const examDays = getDaysUntilExam(student.examDate, today);
            const waUrl = getWhatsAppUrl(student.phone);

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStudent(student);
                  }
                }}
                className="flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-navy-700/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-navy-900 dark:text-white">
                        {student.fullName}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-navy-800 dark:text-sky-400">
                          {student.licenseClass} Sınıfı
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>Kayıt: {formatTurkishDate(student.registrationDate)}</span>
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  </div>

                  {/* Lesson counts + quick +1/-1 */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-sm tabular-nums text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-navy-900 dark:text-white">
                        {student.completedLessons}
                      </span>
                      <span> / {student.totalLessons} ders</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-semibold text-navy-800 dark:text-sky-400">
                        {remaining} kalan
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => void onAdjustCompletedCount(student.id, -1)}
                        disabled={student.completedLessons <= 0}
                        aria-label={`${student.fullName} tamamlanan eğitimi 1 azalt`}
                        title="Geri al (-1)"
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void onAdjustCompletedCount(student.id, 1)}
                        aria-label={`${student.fullName} tamamlanan eğitimi 1 artır`}
                        title="Tamamlanan artır (+1)"
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-navy-900 text-white transition hover:bg-navy-800 active:scale-[0.97] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-navy-900 transition-all duration-300 dark:bg-sky-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer Row: WhatsApp + Exam */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 tabular-nums dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatPhoneDisplay(student.phone)}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">{student.phone}</span>
                  )}

                  {student.examDate && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 tabular-nums dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-navy-700 dark:text-sky-400" />
                      <span>
                        {formatTurkishDate(student.examDate)} · {formatExamCountdown(examDays)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
