export type LicenseClass =
  | 'B'
  | 'B Otomatik'
  | 'A1'
  | 'A2'
  | 'A'
  | 'C'
  | 'CE'
  | 'D'
  | 'DE'
  | string;

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  licenseClass: LicenseClass;
  registrationDate: string; // YYYY-MM-DD
  totalLessons: number;
  completedLessons: number;
  examDate: string; // YYYY-MM-DD or ''
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export type LessonStatus = 'planned' | 'completed';

export interface Lesson {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: LessonStatus;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export type TabKey = 'home' | 'students' | 'calendar' | 'settings';

export type ThemeMode = 'light' | 'dark';

export interface BackupPayload {
  app: 'surucu-takip';
  version: number;
  exportedAt: string;
  students: Student[];
  lessons: Lesson[];
}
