import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { Lesson, Student } from '../types';
import {
  addDaysISO,
  formatTurkishDate,
  getDayNumber,
  getMondayOfWeekISO,
  getTodayISO,
  getWeekdayLong,
  getWeekdayShort,
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface CalendarViewProps {
  students: Student[];
  lessons: Lesson[];
  onAddLesson: (dateISO: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onToggleLessonStatus: (lesson: Lesson) => Promise<void> | void;
  onDeleteLesson: (lesson: Lesson) => Promise<void> | void;
  onSelectStudent: (student: Student) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  students,
  lessons,
  onAddLesson,
  onEditLesson,
  onToggleLessonStatus,
  onDeleteLesson,
  onSelectStudent,
}) => {
  const today = getTodayISO();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(today);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    for (const s of students) map.set(s.id, s);
    return map;
  }, [students]);

  const dateStrip = useMemo(() => {
    const days: string[] = [];
    for (let offset = -2; offset <= 11; offset += 1) {
      days.push(addDaysISO(today, offset));
    }
    return days;
  }, [today]);

  const lessonsByDateCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of lessons) {
      counts.set(l.date, (counts.get(l.date) ?? 0) + 1);
    }
    return counts;
  }, [lessons]);

  const selectedDayLessons = useMemo(() => {
    return lessons
      .filter((l) => l.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [lessons, selectedDate]);

  const selectedDayExams = useMemo(() => {
    return students.filter((s) => s.examDate === selectedDate);
  }, [students, selectedDate]);

  const upcomingAllLessons = useMemo(() => {
    return lessons
      .filter((l) => l.date >= today)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [lessons, today]);

  const weekDates = useMemo(() => {
    const monday = getMondayOfWeekISO(selectedDate);
    return Array.from({ length: 7 }, (_, idx) => addDaysISO(monday, idx));
  }, [selectedDate]);

  const weeklyLessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const dateISO of weekDates) {
      map.set(dateISO, []);
    }
    for (const lesson of lessons) {
      const bucket = map.get(lesson.date);
      if (bucket) {
        bucket.push(lesson);
      }
    }
    for (const [dateISO, list] of map.entries()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
      map.set(dateISO, list);
    }
    return map;
  }, [lessons, weekDates]);

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher: Günlük / Haftalık Tablo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Eğitim Takvimi
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {viewMode === 'daily'
              ? formatTurkishDate(selectedDate, 'full')
              : `${formatTurkishDate(weekDates[0])} – ${formatTurkishDate(weekDates[6])}`}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Takvim görünümü"
          className="inline-flex items-center gap-1 rounded-xl bg-slate-200/75 p-1 dark:bg-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'daily'}
            onClick={() => setViewMode('daily')}
            className={`min-h-[40px] rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              viewMode === 'daily'
                ? 'bg-white text-navy-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Günlük
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'weekly'}
            onClick={() => setViewMode('weekly')}
            className={`min-h-[40px] rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              viewMode === 'weekly'
                ? 'bg-white text-navy-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Haftalık Tablo
          </button>
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <div className="space-y-4">
          {/* Week navigation controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(addDaysISO(weekDates[0], -7))}
                aria-label="Önceki hafta"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-navy-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Bu Hafta
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(addDaysISO(weekDates[0], 7))}
                aria-label="Sonraki hafta"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-navy-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              İsimler eğitim saatine göre en erken dersten en sona sıralıdır.
            </p>
          </div>

          {/* 7-Column Monday to Sunday Table */}
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[840px] grid-cols-7 gap-2.5 lg:min-w-0">
              {weekDates.map((dateISO) => {
                const isToday = dateISO === today;
                const dayLessons = weeklyLessonsByDate.get(dateISO) ?? [];

                return (
                  <div
                    key={dateISO}
                    className={`flex min-h-[300px] flex-col justify-between rounded-2xl border bg-white p-2.5 dark:bg-slate-900 ${
                      isToday
                        ? 'border-navy-900 dark:border-sky-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div
                        className={`rounded-xl px-2 py-2 text-center ${
                          isToday
                            ? 'bg-navy-900 text-white dark:bg-sky-500 dark:text-slate-950'
                            : 'bg-slate-50 text-navy-900 dark:bg-slate-800/70 dark:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {getWeekdayLong(dateISO)}
                        </div>
                        <div
                          className={`mt-0.5 text-[11px] font-medium tabular-nums ${
                            isToday
                              ? 'text-white/85 dark:text-slate-900/85'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {formatTurkishDate(dateISO).replace(/\s\d{4}$/, '')}
                        </div>
                      </div>

                      {/* Ordered Student Name Cards (NO time shown) */}
                      <div className="mt-2.5 space-y-1.5">
                        {dayLessons.map((lesson) => {
                          const student = studentMap.get(lesson.studentId);
                          if (!student) return null;
                          const isCompleted = lesson.status === 'completed';

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => onSelectStudent(student)}
                              className={`flex min-h-[42px] w-full items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition hover:border-navy-700/50 dark:hover:border-sky-400/50 ${
                                isCompleted
                                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                                  : 'border-slate-200 bg-slate-50 text-navy-900 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100'
                              }`}
                            >
                              <span className="truncate">{student.fullName}</span>
                              {isCompleted && (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick "+" Button at bottom of column */}
                    <button
                      type="button"
                      onClick={() => onAddLesson(dateISO)}
                      aria-label={`${formatTurkishDate(dateISO)} için eğitim ekle`}
                      title={`${getWeekdayLong(dateISO)} gününe eğitim ekle`}
                      className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 text-navy-900 transition hover:border-navy-900 hover:bg-navy-50 dark:border-slate-700 dark:bg-slate-800/40 dark:text-sky-400 dark:hover:border-sky-400 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedDate !== today && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Bugün
              </button>
            )}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              aria-label="Tarih seç"
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => onAddLesson(selectedDate)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              <span>Eğitim Ekle</span>
            </button>
          </div>

          {/* Horizontal Date Scroller */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dateStrip.map((dateISO) => {
              const isSelected = dateISO === selectedDate;
              const isToday = dateISO === today;
              const count = lessonsByDateCount.get(dateISO) ?? 0;

              return (
                <button
                  key={dateISO}
                  type="button"
                  onClick={() => setSelectedDate(dateISO)}
                  className={`flex min-h-[68px] min-w-[60px] shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 transition ${
                    isSelected
                      ? 'border-navy-900 bg-navy-900 text-white dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-navy-700/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      isSelected
                        ? 'text-white/80 dark:text-slate-900/80'
                        : isToday
                        ? 'font-bold text-navy-800 dark:text-sky-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isToday ? 'Bugün' : getWeekdayShort(dateISO)}
                  </span>
                  <span className="mt-0.5 text-lg font-bold tabular-nums">
                    {getDayNumber(dateISO)}
                  </span>
                  <span
                    className={`mt-0.5 text-[10px] font-semibold tabular-nums ${
                      isSelected
                        ? 'text-sky-200 dark:text-slate-900'
                        : count > 0
                        ? 'text-navy-700 dark:text-sky-400'
                        : 'text-transparent'
                    }`}
                  >
                    {count > 0 ? `${count} ders` : '0'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Selected Day Schedule */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Seçili Günün Programı
            </h2>
            <span className="text-xs font-semibold text-slate-500 tabular-nums dark:text-slate-400">
              {selectedDayLessons.length} eğitim
            </span>
          </div>

          {selectedDayExams.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/40">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <CalendarIcon className="h-4 w-4" />
                <span>Bu Günde Direksiyon Sınavı Olanlar</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {selectedDayExams.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStudent(st)}
                    className="block w-full text-left text-sm font-semibold text-amber-950 underline-offset-2 hover:underline dark:text-amber-100"
                  >
                    {st.fullName} ({st.licenseClass})
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDayLessons.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {formatTurkishDate(selectedDate)} tarihinde kayıtlı eğitim yok.
              </p>
              <button
                type="button"
                onClick={() => onAddLesson(selectedDate)}
                className="mt-3 min-h-[44px] rounded-xl bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950"
              >
                Bu Güne Eğitim Ekle
              </button>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {selectedDayLessons.map((lesson) => {
                const student = studentMap.get(lesson.studentId);
                if (!student) return null;
                const isCompleted = lesson.status === 'completed';

                return (
                  <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
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

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => void onToggleLessonStatus(lesson)}
                        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'border border-slate-200 bg-slate-50 text-navy-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
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
        </section>

        {/* All Upcoming Lessons Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Tüm Yaklaşan Eğitimler
            </h2>
            <span className="text-xs font-semibold text-slate-500 tabular-nums dark:text-slate-400">
              {upcomingAllLessons.length} kayıt
            </span>
          </div>

          {upcomingAllLessons.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Bugün ve sonrası için kayıtlı eğitim bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingAllLessons.map((lesson) => {
                const student = studentMap.get(lesson.studentId);
                if (!student) return null;
                const isCompleted = lesson.status === 'completed';

                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDate(lesson.date)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-bold text-navy-900 dark:text-white">
                        {student.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {lesson.date === today ? 'Bugün' : formatTurkishDate(lesson.date)} ·{' '}
                        <span className="font-mono font-semibold">{lesson.time}</span>
                        {lesson.note ? ` · ${lesson.note}` : ''}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => void onToggleLessonStatus(lesson)}
                      className={`inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border border-slate-200 bg-slate-50 text-navy-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isCompleted ? 'Tamamlandı' : 'Planlandı'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
          </div>
        </>
      )}

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
    </div>
  );
};
