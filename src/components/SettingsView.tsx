import React, { useRef, useState } from 'react';
import {
  Download,
  Moon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { validateBackupPayload } from '../db/indexedDb';
import { BackupPayload, Lesson, Student, ThemeMode } from '../types';
import { getTodayISO } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  students: Student[];
  lessons: Lesson[];
  onRestoreBackup: (students: Student[], lessons: Lesson[]) => Promise<void>;
  onReseedSample: () => Promise<void>;
  onClearAll: () => Promise<void>;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onSetTheme,
  students,
  lessons,
  onRestoreBackup,
  onReseedSample,
  onClearAll,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupPayload | null>(null);
  const [confirmReseed, setConfirmReseed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExportJson = () => {
    const payload: BackupPayload = {
      app: 'surucu-takip',
      version: 1,
      exportedAt: new Date().toISOString(),
      students,
      lessons,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surucu-takip-yedek-${getTodayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('Yedek dosyası indirildi.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const validated = validateBackupPayload(parsed);
      if (!validated) {
        onNotify('Geçersiz yedek dosyası. Lütfen Sürücü Takip JSON dosyası seçin.', 'error');
        return;
      }
      setPendingRestore(validated);
    } catch {
      onNotify('Dosya okunamadı. Geçerli bir JSON yedek dosyası seçin.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
          Ayarlar
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Görünüm, yedekleme ve cihaz verisi yönetimi
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Theme Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-navy-900 dark:text-white">Görünüm</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Açık veya koyu tema tercihiniz cihazınızda saklanır.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                theme === 'light'
                  ? 'bg-white text-navy-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Açık Tema</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-navy-900 text-white shadow-xs dark:bg-slate-950 dark:text-sky-400'
                  : 'text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Koyu Tema</span>
            </button>
          </div>
        </section>

        {/* PWA Installation */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-5 w-5 text-navy-900 dark:text-sky-400" />
            <h2 className="text-base font-bold text-navy-900 dark:text-white">
              Cihaza Kurulum (PWA)
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ana ekrana ekleyerek internet bağlantısı olmadan uygulama gibi kullanabilirsiniz.
          </p>
          <div className="mt-4">
            <PWAInstallButton variant="settings" />
          </div>
        </section>

        {/* Backup & Restore */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-navy-900 dark:text-white">
            Yedekleme ve Geri Yükleme
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 tabular-nums dark:text-slate-400">
            Şu anda cihazınızda {students.length} kursiyer ve {lessons.length} eğitim kaydı bulunuyor.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>JSON Dışa Aktar</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span>JSON Geri Yükle</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
          </div>
        </section>

        {/* Sample Data & Reset */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-navy-900 dark:text-white">
            Örnek Veriler ve Temizleme
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Uygulamayı test etmek için örnek kayıtları yükleyebilir veya tüm kayıtları temizleyebilirsiniz.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setConfirmReseed(true)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Örnek Veri Yükle</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Tüm Verileri Sil</span>
            </button>
          </div>
        </section>
      </div>

      {/* Offline Privacy Notice */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900 dark:bg-slate-800 dark:text-sky-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Verileriniz cihazda saklanıyor. İnternet bağlantısı gerekmez.
        </p>
      </div>

      {/* Confirmations */}
      <ConfirmModal
        open={!!pendingRestore}
        title="Yedekten Geri Yükle"
        description={
          pendingRestore
            ? `Seçilen yedekte ${pendingRestore.students.length} kursiyer ve ${pendingRestore.lessons.length} eğitim kaydı var. Mevcut verileriniz bu yedekle değiştirilecek. Onaylıyor musunuz?`
            : ''
        }
        confirmLabel="Evet, Geri Yükle"
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => {
          if (pendingRestore) {
            void onRestoreBackup(pendingRestore.students, pendingRestore.lessons);
          }
          setPendingRestore(null);
        }}
      />

      <ConfirmModal
        open={confirmReseed}
        title="Örnek Verileri Yükle"
        description="Mevcut veriler temizlenip yerine 3 örnek kursiyer, bugüne ait dersler ve yaklaşan sınav kayıtları eklenecek. Devam edilsin mi?"
        confirmLabel="Örnek Verileri Yükle"
        onCancel={() => setConfirmReseed(false)}
        onConfirm={() => {
          setConfirmReseed(false);
          void onReseedSample();
        }}
      />

      <ConfirmModal
        open={confirmClear}
        title="Tüm Verileri Sil"
        description="Cihazınızdaki tüm kursiyer ve eğitim kayıtları kalıcı olarak silinecek. Önce JSON yedeği almanız önerilir. Devam etmek istiyor musunuz?"
        confirmLabel="Tümünü Sil"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          void onClearAll();
        }}
      />
    </div>
  );
};
