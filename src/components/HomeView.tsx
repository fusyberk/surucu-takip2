import React, { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Lesson, Student, TabKey } from '../types';
import {
  formatExamCountdown,
  formatTurkishDate,
  getDaysUntilExam,
  getTodayISO,
} from '../utils/formatters';

interface HomeViewProps {
  students: Student[];
  lessons: Lesson[];
  onNavigateTab: (tab: TabKey) => void;
  onSelectStudent: (student: Student) => void;
  onToggleLessonStatus: (lesson: Lesson) => Promise<void> | void;
  onQuickAddLesson: () => void;
  onQuickAddStudent: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  students,
  lessons,
  onNavigateTab,
  onSelectStudent,
  onToggleLessonStatus,
  onQuickAddLesson,
  onQuickAddStudent,
}) => {
  const today = getTodayISO();

  const studentMap = new Map<string, Student>();
  for (const s of students) {
    studentMap.set(s.id, s);
  }

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => {
    const remaining = Math.max(0, s.totalLessons - s.completedLessons);
    const days = getDaysUntilExam(s.examDate, today);
    return remaining > 0 || (days !== null && days >= 0);
  }).length;

  const todayLessons = lessons
    .filter((l) => l.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const [expandedExamDates, setExpandedExamDates] = useState<Record<string, boolean>>({});

  const upcomingExams = students
    .filter((s) => {
      if (!s.examDate) return false;
      const days = getDaysUntilExam(s.examDate, today);
      return days !== null && days >= 0;
    })
    .sort((a, b) => a.examDate.localeCompare(b.examDate));

  const groupedUpcomingExams = useMemo(() => {
    const groups = new Map<string, Student[]>();
    for (const student of upcomingExams) {
      const list = groups.get(student.examDate);
      if (list) {
        list.push(student);
      } else {
        groups.set(student.examDate, [student]);
      }
    }
    return Array.from(groups.entries()).map(([date, list]) => ({
      date,
      daysLeft: getDaysUntilExam(date, today),
      students: list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr-TR')),
    }));
  }, [upcomingExams, today]);

  const toggleExamDate = (date: string) => {
    setExpandedExamDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const summaryCards = [
    {
      label: 'Toplam Kursiyer',
      value: totalStudents,
      icon: Users,
      onClick: () => onNavigateTab('students'),
    },
    {
      label: 'Aktif Kursiyer',
      value: activeStudents,
      icon: GraduationCap,
      onClick: () => onNavigateTab('students'),
    },
    {
      label: 'Bugün Eğitim',
      value: todayLessons.length,
      icon: Clock,
      onClick: () => onNavigateTab('calendar'),
    },
    {
      label: 'Yaklaşan Sınav',
      value: upcomingExams.length,
      icon: CalendarCheck,
      onClick: () => onNavigateTab('calendar'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting / Date Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            {formatTurkishDate(today, 'full')}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Günlük Özet
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={onQuickAddLesson}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Eğitim Planla
          </button>
          <button
            type="button"
            onClick={onQuickAddStudent}
            className="min-h-[44px] rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            Yeni Kursiyer
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <section aria-label="Özet metrikler" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-navy-700/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                  {card.label}
                </span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900 dark:bg-slate-800 dark:text-sky-400">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-navy-900 dark:text-white">
                {card.value}
              </div>
            </button>
          );
        })}
      </section>

      {/* Main Two Columns: Bugünkü Eğitimler & Yaklaşan Sınavlar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bugünkü Eğitimler */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                Bugünkü Eğitimler
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Durum etiketine dokunarak dersi tamamlandı işaretleyebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-navy-800 hover:bg-slate-100 whitespace-nowrap shrink-0 dark:text-sky-400 dark:hover:bg-slate-800"
            >
              <span>Takvim</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {todayLessons.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Bugün için planlanmış eğitim bulunmuyor.
              </p>
              <button
                type="button"
                onClick={onQuickAddLesson}
                className="mt-3 min-h-[44px] rounded-xl bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950"
              >
                Bugüne Eğitim Planla
              </button>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {todayLessons.map((lesson) => {
                const student = studentMap.get(lesson.studentId);
                if (!student) return null;
                const isCompleted = lesson.status === 'completed';

                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectStudent(student)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-navy-50 font-mono text-sm font-bold tabular-nums text-navy-900 dark:bg-slate-800 dark:text-sky-400">
                        {lesson.time}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy-900 dark:text-white">
                          {student.fullName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {student.licenseClass}
                          {lesson.note ? ` · ${lesson.note}` : ''}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void onToggleLessonStatus(lesson)}
                      className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border border-slate-200 bg-slate-50 text-navy-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
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
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Yaklaşan Sınavlar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                Yaklaşan Sınavlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tarihe dokunarak sınava girecek kursiyerleri listeleyebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('students')}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-navy-800 hover:bg-slate-100 whitespace-nowrap shrink-0 dark:text-sky-400 dark:hover:bg-slate-800"
            >
              <span>Kursiyerler</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {groupedUpcomingExams.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Yaklaşan direksiyon sınavı kaydı bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {groupedUpcomingExams.map((group) => {
                const isExpanded = !!expandedExamDates[group.date];
                const isUrgent = group.daysLeft !== null && group.daysLeft <= 3;

                return (
                  <div
                    key={group.date}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 transition-colors dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExamDate(group.date)}
                      aria-expanded={isExpanded}
                      className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold tabular-nums text-navy-900 dark:text-white">
                          {formatTurkishDate(group.date)}
                          <span aria-hidden="true"> - </span>
                          <span
                            className={
                              isUrgent
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-navy-700 dark:text-sky-400'
                            }
                          >
                            {formatExamCountdown(group.daysLeft)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
                          {group.students.length} kursiyer sınava girecek
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-xl px-2.5 py-1 text-xs font-bold tabular-nums whitespace-nowrap ${
                            isUrgent
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-white text-navy-900 dark:bg-slate-900 dark:text-sky-400'
                          }`}
                        >
                          {group.students.length} kişi
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-slate-200/70 border-t border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                        {group.students.map((student) => {
                          const remainingLessons = Math.max(
                            0,
                            student.totalLessons - student.completedLessons
                          );
                          return (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => onSelectStudent(student)}
                              className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                                  {student.fullName}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-slate-500 tabular-nums dark:text-slate-400">
                                  {student.licenseClass} Sınıfı · Tamamlanan {student.completedLessons}/{student.totalLessons} · Kalan {remainingLessons} ders
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Offline Info Card */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900 dark:bg-slate-800 dark:text-sky-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Verileriniz cihazda saklanıyor. İnternet bağlantısı gerekmez.
        </p>
      </div>
    </div>
  );
};
