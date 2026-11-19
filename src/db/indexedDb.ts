import { BackupPayload, Lesson, Student, ThemeMode } from '../types';
import { addDaysISO, generateId, getTodayISO } from '../utils/formatters';

const DB_NAME = 'surucu-takip-db';
const DB_VERSION = 1;
const STORE_STUDENTS = 'students';
const STORE_LESSONS = 'lessons';
const STORE_META = 'meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB bu tarayıcıda desteklenmiyor.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
        db.createObjectStore(STORE_STUDENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_LESSONS)) {
        const lessonStore = db.createObjectStore(STORE_LESSONS, { keyPath: 'id' });
        lessonStore.createIndex('studentId', 'studentId', { unique: false });
        lessonStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Veritabanı açılamadı.'));
  });
}

function txPromise<T>(tx: IDBTransaction, work: () => IDBRequest<T> | void): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    let resultValue: T | undefined;
    try {
      const req = work();
      if (req) {
        req.onsuccess = () => {
          resultValue = req.result;
        };
      }
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(resultValue);
    tx.onerror = () => reject(tx.error ?? new Error('Veritabanı işlemi başarısız oldu.'));
    tx.onabort = () => reject(tx.error ?? new Error('Veritabanı işlemi iptal edildi.'));
  });
}

function buildSampleDataset(): { students: Student[]; lessons: Lesson[] } {
  const today = getTodayISO();
  const now = Date.now();

  const student1Id = generateId();
  const student2Id = generateId();
  const student3Id = generateId();

  const students: Student[] = [
    {
      id: student1Id,
      fullName: 'Ahmet Yılmaz',
      phone: '0532 418 72 90',
      licenseClass: 'B',
      registrationDate: addDaysISO(today, -18),
      totalLessons: 14,
      completedLessons: 9,
      examDate: addDaysISO(today, 3),
      notes: 'Paralel park ve L park çalışması çok iyi. Yokuş kalkışında son tekrar yapılacak.',
      createdAt: now - 3000,
      updatedAt: now - 3000,
    },
    {
      id: student2Id,
      fullName: 'Zeynep Kaya',
      phone: '0544 826 15 34',
      licenseClass: 'B Otomatik',
      registrationDate: addDaysISO(today, -12),
      totalLessons: 12,
      completedLessons: 5,
      examDate: addDaysISO(today, 9),
      notes: 'Kavşak geçişleri ve ayna kontrolü üzerinde durulacak.',
      createdAt: now - 2000,
      updatedAt: now - 2000,
    },
    {
      id: student3Id,
      fullName: 'Murat Demir',
      phone: '0505 719 48 62',
      licenseClass: 'A2',
      registrationDate: addDaysISO(today, -25),
      totalLessons: 10,
      completedLessons: 8,
      examDate: addDaysISO(today, 1),
      notes: 'Slalom ve 8 çizme parkuru hazır. Sınav öncesi son deneme.',
      createdAt: now - 1000,
      updatedAt: now - 1000,
    },
  ];

  const lessons: Lesson[] = [
    {
      id: generateId(),
      studentId: student1Id,
      date: today,
      time: '09:30',
      status: 'completed',
      note: 'Sınav güzergahı tam tur',
      createdAt: now - 500,
      updatedAt: now - 500,
    },
    {
      id: generateId(),
      studentId: student2Id,
      date: today,
      time: '13:30',
      status: 'planned',
      note: 'Şehir içi trafik ve kavşaklar',
      createdAt: now - 400,
      updatedAt: now - 400,
    },
    {
      id: generateId(),
      studentId: student3Id,
      date: today,
      time: '16:00',
      status: 'planned',
      note: 'Sınav alanı son hazırlık',
      createdAt: now - 300,
      updatedAt: now - 300,
    },
    {
      id: generateId(),
      studentId: student1Id,
      date: addDaysISO(today, 1),
      time: '10:00',
      status: 'planned',
      note: 'Yokuş kalkış ve park pratiği',
      createdAt: now - 200,
      updatedAt: now - 200,
    },
    {
      id: generateId(),
      studentId: student2Id,
      date: addDaysISO(today, 2),
      time: '14:30',
      status: 'planned',
      note: 'Geri park ve ani fren çalışması',
      createdAt: now - 100,
      updatedAt: now - 100,
    },
  ];

  return { students, lessons };
}

export async function getMetaValue<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_META, 'readonly');
  const store = tx.objectStore(STORE_META);
  const row = await txPromise<{ key: string; value: T } | undefined>(tx, () => store.get(key));
  return row?.value;
}

export async function setMetaValue<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_META, 'readwrite');
  const store = tx.objectStore(STORE_META);
  await txPromise(tx, () => store.put({ key, value }));
}

export async function getThemePreference(): Promise<ThemeMode | undefined> {
  return getMetaValue<ThemeMode>('theme');
}

export async function saveThemePreference(theme: ThemeMode): Promise<void> {
  await setMetaValue('theme', theme);
}

export async function getAllStudents(): Promise<Student[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_STUDENTS, 'readonly');
  const store = tx.objectStore(STORE_STUDENTS);
  const items = await txPromise<Student[]>(tx, () => store.getAll());
  return items ?? [];
}

export async function getAllLessons(): Promise<Lesson[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, 'readonly');
  const store = tx.objectStore(STORE_LESSONS);
  const items = await txPromise<Lesson[]>(tx, () => store.getAll());
  return items ?? [];
}

export async function initDatabaseAndSeedIfFirstRun(): Promise<{
  students: Student[];
  lessons: Lesson[];
}> {
  const db = await openDB();
  const seeded = await getMetaValue<boolean>('seeded');
  const existingStudents = await getAllStudents();
  const existingLessons = await getAllLessons();

  if (!seeded && existingStudents.length === 0 && existingLessons.length === 0) {
    const sample = buildSampleDataset();
    const tx = db.transaction([STORE_STUDENTS, STORE_LESSONS, STORE_META], 'readwrite');
    const studentStore = tx.objectStore(STORE_STUDENTS);
    const lessonStore = tx.objectStore(STORE_LESSONS);
    const metaStore = tx.objectStore(STORE_META);

    for (const s of sample.students) {
      studentStore.put(s);
    }
    for (const l of sample.lessons) {
      lessonStore.put(l);
    }
    metaStore.put({ key: 'seeded', value: true });
    await txPromise(tx, () => undefined);
    return sample;
  }

  if (!seeded) {
    await setMetaValue('seeded', true);
  }

  return { students: existingStudents, lessons: existingLessons };
}

export async function saveStudent(student: Student): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_STUDENTS, 'readwrite');
  await txPromise(tx, () => tx.objectStore(STORE_STUDENTS).put(student));
}

export async function deleteStudentAndLessons(studentId: string): Promise<void> {
  const db = await openDB();
  const allLessons = await getAllLessons();
  const tx = db.transaction([STORE_STUDENTS, STORE_LESSONS], 'readwrite');
  tx.objectStore(STORE_STUDENTS).delete(studentId);
  const lessonStore = tx.objectStore(STORE_LESSONS);
  for (const lesson of allLessons) {
    if (lesson.studentId === studentId) {
      lessonStore.delete(lesson.id);
    }
  }
  await txPromise(tx, () => undefined);
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_LESSONS, 'readwrite');
  await txPromise(tx, () => tx.objectStore(STORE_LESSONS).put(lesson));
}

export async function saveLessonWithStudent(lesson: Lesson, student: Student): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_LESSONS, STORE_STUDENTS], 'readwrite');
  tx.objectStore(STORE_LESSONS).put(lesson);
  tx.objectStore(STORE_STUDENTS).put(student);
  await txPromise(tx, () => undefined);
}

export async function deleteLessonWithStudent(lessonId: string, updatedStudent?: Student): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_LESSONS, STORE_STUDENTS], 'readwrite');
  tx.objectStore(STORE_LESSONS).delete(lessonId);
  if (updatedStudent) {
    tx.objectStore(STORE_STUDENTS).put(updatedStudent);
  }
  await txPromise(tx, () => undefined);
}

export async function reseedSampleData(): Promise<{ students: Student[]; lessons: Lesson[] }> {
  const sample = buildSampleDataset();
  const db = await openDB();
  const tx = db.transaction([STORE_STUDENTS, STORE_LESSONS, STORE_META], 'readwrite');
  const studentStore = tx.objectStore(STORE_STUDENTS);
  const lessonStore = tx.objectStore(STORE_LESSONS);
  studentStore.clear();
  lessonStore.clear();
  for (const s of sample.students) {
    studentStore.put(s);
  }
  for (const l of sample.lessons) {
    lessonStore.put(l);
  }
  tx.objectStore(STORE_META).put({ key: 'seeded', value: true });
  await txPromise(tx, () => undefined);
  return sample;
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_STUDENTS, STORE_LESSONS, STORE_META], 'readwrite');
  tx.objectStore(STORE_STUDENTS).clear();
  tx.objectStore(STORE_LESSONS).clear();
  tx.objectStore(STORE_META).put({ key: 'seeded', value: true });
  await txPromise(tx, () => undefined);
}

export async function restoreBackupData(
  students: Student[],
  lessons: Lesson[]
): Promise<{ students: Student[]; lessons: Lesson[] }> {
  const db = await openDB();
  const tx = db.transaction([STORE_STUDENTS, STORE_LESSONS, STORE_META], 'readwrite');
  const studentStore = tx.objectStore(STORE_STUDENTS);
  const lessonStore = tx.objectStore(STORE_LESSONS);

  studentStore.clear();
  lessonStore.clear();

  for (const s of students) {
    studentStore.put(s);
  }
  for (const l of lessons) {
    lessonStore.put(l);
  }
  tx.objectStore(STORE_META).put({ key: 'seeded', value: true });
  await txPromise(tx, () => undefined);
  return { students, lessons };
}

export function validateBackupPayload(raw: unknown): BackupPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.students) || !Array.isArray(obj.lessons)) return null;

  const validStudents: Student[] = [];
  for (const item of obj.students) {
    if (!item || typeof item !== 'object') return null;
    const s = item as Record<string, unknown>;
    if (typeof s.id !== 'string' || typeof s.fullName !== 'string' || typeof s.phone !== 'string') {
      return null;
    }
    validStudents.push({
      id: s.id,
      fullName: s.fullName,
      phone: s.phone,
      licenseClass: typeof s.licenseClass === 'string' ? s.licenseClass : 'B',
      registrationDate: typeof s.registrationDate === 'string' ? s.registrationDate : getTodayISO(),
      totalLessons: Math.max(0, Number(s.totalLessons) || 0),
      completedLessons: Math.max(0, Number(s.completedLessons) || 0),
      examDate: typeof s.examDate === 'string' ? s.examDate : '',
      notes: typeof s.notes === 'string' ? s.notes : '',
      createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
      updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : Date.now(),
    });
  }

  const studentIds = new Set(validStudents.map((s) => s.id));
  const validLessons: Lesson[] = [];
  for (const item of obj.lessons) {
    if (!item || typeof item !== 'object') return null;
    const l = item as Record<string, unknown>;
    if (
      typeof l.id !== 'string' ||
      typeof l.studentId !== 'string' ||
      typeof l.date !== 'string' ||
      typeof l.time !== 'string'
    ) {
      return null;
    }
    if (!studentIds.has(l.studentId)) continue;
    validLessons.push({
      id: l.id,
      studentId: l.studentId,
      date: l.date,
      time: l.time,
      status: l.status === 'completed' ? 'completed' : 'planned',
      note: typeof l.note === 'string' ? l.note : '',
      createdAt: typeof l.createdAt === 'number' ? l.createdAt : Date.now(),
      updatedAt: typeof l.updatedAt === 'number' ? l.updatedAt : Date.now(),
    });
  }

  return {
    app: 'surucu-takip',
    version: typeof obj.version === 'number' ? obj.version : 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    students: validStudents,
    lessons: validLessons,
  };
}
