import React, { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, Plus, UserPlus, X } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { CalendarView } from './components/CalendarView';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LessonFormModal } from './components/LessonFormModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsView } from './components/SettingsView';
import { StudentDetailModal } from './components/StudentDetailModal';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentsView } from './components/StudentsView';
import {
  clearAllData,
  deleteLessonWithStudent,
  deleteStudentAndLessons,
  getThemePreference,
  initDatabaseAndSeedIfFirstRun,
  reseedSampleData,
  restoreBackupData,
  saveLesson,
  saveLessonWithStudent,
  saveStudent,
  saveThemePreference,
} from './db/indexedDb';
import { Lesson, LessonStatus, Student, TabKey, ThemeMode } from './types';
import { generateId, getTodayISO } from './utils/formatters';

const THEME_STORAGE_KEY = 'surucu-takip-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & sheets state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonLockedStudentId, setLessonLockedStudentId] = useState<string | undefined>(undefined);
  const [lessonInitialDate, setLessonInitialDate] = useState<string | undefined>(undefined);

  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Sync theme to documentElement & meta theme-color
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#09172E' : '#0F274A');
    }
  }, [theme]);

  // Initialize IndexedDB & theme preference
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ students: initialStudents, lessons: initialLessons }, savedTheme] =
          await Promise.all([initDatabaseAndSeedIfFirstRun(), getThemePreference()]);
        if (cancelled) return;
        setStudents(initialStudents);
        setLessons(initialLessons);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
      } catch {
        if (!cancelled) {
          notify('Yerel veritabanı yüklenirken bir sorun oluştu.', 'error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const handleSetTheme = async (next: ThemeMode) => {
    setTheme(next);
    try {
      await saveThemePreference(next);
    } catch {
      // ignore
    }
  };

  const handleToggleTheme = () => {
    void handleSetTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Student CRUD
  const handleOpenAddStudent = () => {
    setFabMenuOpen(false);
    setEditingStudent(null);
    setStudentFormOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentFormOpen(true);
  };

  const handleSaveStudent = async (data: {
    fullName: string;
    phone: string;
    licenseClass: string;
    registrationDate: string;
    totalLessons: number;
    completedLessons: number;
    examDate: string;
    notes: string;
  }) => {
    const now = Date.now();
    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        ...data,
        updatedAt: now,
      };
      await saveStudent(updated);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      notify('Kursiyer bilgileri güncellendi.');
    } else {
      const created: Student = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await saveStudent(created);
      setStudents((prev) => [created, ...prev]);
      notify('Yeni kursiyer eklendi.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudentAndLessons(studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setLessons((prev) => prev.filter((l) => l.studentId !== studentId));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
    notify('Kursiyer silindi.');
  };

  const handleAdjustCompletedCount = async (studentId: string, delta: number) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    const nextCompleted = Math.max(0, target.completedLessons + delta);
    if (nextCompleted === target.completedLessons) return;
    const updated: Student = {
      ...target,
      completedLessons: nextCompleted,
      updatedAt: Date.now(),
    };
    await saveStudent(updated);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Lesson CRUD
  const handleOpenAddLesson = (options?: { studentId?: string; date?: string }) => {
    setFabMenuOpen(false);
    setEditingLesson(null);
    setLessonLockedStudentId(options?.studentId);
    setLessonInitialDate(options?.date || getTodayISO());
    setLessonFormOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonLockedStudentId(lesson.studentId);
    setLessonInitialDate(lesson.date);
    setLessonFormOpen(true);
  };

  const handleSaveLesson = async (data: {
    studentId: string;
    date: string;
    time: string;
    status: LessonStatus;
    note: string;
  }) => {
    const now = Date.now();
    const student = students.find((s) => s.id === data.studentId);
    if (!student) return;

    if (editingLesson) {
      const oldStatus = editingLesson.status;
      const newStatus = data.status;
      const updatedLesson: Lesson = {
        ...editingLesson,
        date: data.date,
        time: data.time,
        status: newStatus,
        note: data.note,
        updatedAt: now,
      };

      let countDelta = 0;
      if (oldStatus === 'planned' && newStatus === 'completed') countDelta = 1;
      if (oldStatus === 'completed' && newStatus === 'planned') countDelta = -1;

      if (countDelta !== 0) {
        const updatedStudent: Student = {
          ...student,
          completedLessons: Math.max(0, student.completedLessons + countDelta),
          updatedAt: now,
        };
        await saveLessonWithStudent(updatedLesson, updatedStudent);
        setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
      } else {
        await saveLesson(updatedLesson);
      }
      setLessons((prev) => prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)));
      notify('Eğitim kaydı güncellendi.');
    } else {
      const createdLesson: Lesson = {
        id: generateId(),
        studentId: data.studentId,
        date: data.date,
        time: data.time,
        status: data.status,
        note: data.note,
        createdAt: now,
        updatedAt: now,
      };

      if (data.status === 'completed') {
        const updatedStudent: Student = {
          ...student,
          completedLessons: student.completedLessons + 1,
          updatedAt: now,
        };
        await saveLessonWithStudent(createdLesson, updatedStudent);
        setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
      } else {
        await saveLesson(createdLesson);
      }
      setLessons((prev) => [...prev, createdLesson]);
      notify('Eğitim takvime eklendi.');
    }
  };

  const handleToggleLessonStatus = async (lesson: Lesson) => {
    const now = Date.now();
    const nextStatus: LessonStatus = lesson.status === 'completed' ? 'planned' : 'completed';
    const delta = nextStatus === 'completed' ? 1 : -1;
    const updatedLesson: Lesson = {
      ...lesson,
      status: nextStatus,
      updatedAt: now,
    };

    const student = students.find((s) => s.id === lesson.studentId);
    if (student) {
      const updatedStudent: Student = {
        ...student,
        completedLessons: Math.max(0, student.completedLessons + delta),
        updatedAt: now,
      };
      await saveLessonWithStudent(updatedLesson, updatedStudent);
      setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    } else {
      await saveLesson(updatedLesson);
    }

    setLessons((prev) => prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)));
    notify(nextStatus === 'completed' ? 'Eğitim tamamlandı olarak işaretlendi.' : 'Eğitim planlandı durumuna alındı.');
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    let updatedStudent: Student | undefined;
    if (lesson.status === 'completed') {
      const student = students.find((s) => s.id === lesson.studentId);
      if (student) {
        updatedStudent = {
          ...student,
          completedLessons: Math.max(0, student.completedLessons - 1),
          updatedAt: Date.now(),
        };
      }
    }

    await deleteLessonWithStudent(lesson.id, updatedStudent);
    setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    if (updatedStudent) {
      setStudents((prev) => prev.map((s) => (s.id === updatedStudent!.id ? updatedStudent! : s)));
    }
    notify('Eğitim kaydı silindi.');
  };

  // Backup / Reset
  const handleRestoreBackup = async (nextStudents: Student[], nextLessons: Lesson[]) => {
    const result = await restoreBackupData(nextStudents, nextLessons);
    setStudents(result.students);
    setLessons(result.lessons);
    setSelectedStudentId(null);
    notify(`${result.students.length} kursiyer ve ${result.lessons.length} eğitim geri yüklendi.`);
  };

  const handleReseedSample = async () => {
    const sample = await reseedSampleData();
    setStudents(sample.students);
    setLessons(sample.lessons);
    setSelectedStudentId(null);
    notify('Örnek veriler yüklendi.');
  };

  const handleClearAll = async () => {
    await clearAllData();
    setStudents([]);
    setLessons([]);
    setSelectedStudentId(null);
    notify('Tüm veriler cihazdan silindi.');
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                students={students}
                lessons={lessons}
                onNavigateTab={setActiveTab}
                onSelectStudent={(s) => setSelectedStudentId(s.id)}
                onToggleLessonStatus={handleToggleLessonStatus}
                onQuickAddLesson={() => handleOpenAddLesson()}
                onQuickAddStudent={handleOpenAddStudent}
              />
            )}

            {activeTab === 'students' && (
              <StudentsView
                students={students}
                onAddStudent={handleOpenAddStudent}
                onSelectStudent={(s) => setSelectedStudentId(s.id)}
                onAdjustCompletedCount={handleAdjustCompletedCount}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                students={students}
                lessons={lessons}
                onAddLesson={(dateISO) => handleOpenAddLesson({ date: dateISO })}
                onEditLesson={handleOpenEditLesson}
                onToggleLessonStatus={handleToggleLessonStatus}
                onDeleteLesson={handleDeleteLesson}
                onSelectStudent={(s) => setSelectedStudentId(s.id)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                theme={theme}
                onSetTheme={(next) => void handleSetTheme(next)}
                students={students}
                lessons={lessons}
                onRestoreBackup={handleRestoreBackup}
                onReseedSample={handleReseedSample}
                onClearAll={handleClearAll}
                onNotify={notify}
              />
            )}
          </>
        )}
      </main>

      {/* Quick Add (+) Floating Action Button */}
      {fabMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/25 backdrop-blur-[1px]"
          onClick={() => setFabMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2 sm:right-6">
        {fabMenuOpen && (
          <div className="flex flex-col items-end gap-2 pb-1">
            <button
              type="button"
              onClick={() => handleOpenAddLesson()}
              className="flex min-h-[44px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-lg transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <CalendarPlus className="h-4 w-4 text-navy-800 dark:text-sky-400" />
              <span>Eğitim Planla</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddStudent}
              className="flex min-h-[44px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-lg transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <UserPlus className="h-4 w-4 text-navy-800 dark:text-sky-400" />
              <span>Yeni Kursiyer Ekle</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFabMenuOpen((prev) => !prev)}
          aria-label={fabMenuOpen ? 'Hızlı menüyü kapat' : 'Hızlı ekle'}
          aria-expanded={fabMenuOpen}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-xl shadow-navy-900/25 transition-transform hover:bg-navy-800 active:scale-95 dark:bg-sky-500 dark:text-slate-950 dark:shadow-sky-500/20 dark:hover:bg-sky-400"
        >
          {fabMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      <OfflineIndicator />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-lg transition ${
            toast.tone === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-navy-900 text-white dark:bg-sky-500 dark:text-slate-950'
          }`}
        >
          {toast.message}
        </div>
      )}

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <StudentDetailModal
        student={selectedStudent}
        lessons={lessons}
        onClose={() => setSelectedStudentId(null)}
        onEditStudent={handleOpenEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onAdjustCompletedCount={handleAdjustCompletedCount}
        onAddLesson={(studentId) => handleOpenAddLesson({ studentId })}
        onEditLesson={handleOpenEditLesson}
        onToggleLessonStatus={handleToggleLessonStatus}
        onDeleteLesson={handleDeleteLesson}
      />

      <StudentFormModal
        open={studentFormOpen}
        initialStudent={editingStudent}
        onClose={() => {
          setStudentFormOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
      />

      <LessonFormModal
        open={lessonFormOpen}
        students={students}
        lockedStudentId={lessonLockedStudentId}
        initialDate={lessonInitialDate}
        initialLesson={editingLesson}
        onClose={() => {
          setLessonFormOpen(false);
          setEditingLesson(null);
        }}
        onSave={handleSaveLesson}
      />
    </div>
  );
}
