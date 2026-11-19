import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          Uygulama cihazınıza kurulmuş durumda (çevrimdışı kullanıma hazır).
        </div>
      );
    }
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'header'
            ? 'inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800 active:scale-[0.98] whitespace-nowrap shrink-0 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400'
            : 'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 active:scale-[0.98] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400'
        }
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Uygulamayı Yükle</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'header'
              ? 'inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-900 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
              : 'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
          }
        >
          <Share className="h-4 w-4 shrink-0" />
          <span>Ana Ekrana Ekle</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-xs sm:items-center"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                  iPhone / iPad Kurulumu
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Kapat"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <li>
                  1. Safari alt menüsündeki <strong className="font-semibold text-navy-900 dark:text-white">Paylaş</strong> simgesine dokunun.
                </li>
                <li>
                  2. Aşağı kaydırıp <strong className="font-semibold text-navy-900 dark:text-white">Ana Ekrana Ekle</strong> seçeneğini seçin.
                </li>
                <li>
                  3. Sağ üstten <strong className="font-semibold text-navy-900 dark:text-white">Ekle</strong> butonuna dokunun.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 min-h-[44px] w-full rounded-xl bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 dark:bg-sky-500 dark:text-slate-950"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'settings') {
    return (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Tarayıcı menüsünden <span className="font-semibold text-navy-900 dark:text-slate-200">“Uygulamayı yükle”</span> veya <span className="font-semibold text-navy-900 dark:text-slate-200">“Ana ekrana ekle”</span> seçeneğini kullanarak cihazınıza kurabilirsiniz.
      </p>
    );
  }

  return null;
};
