import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/icon.svg"
            alt="Sürücü Takip simgesi"
            className="h-8 w-8 rounded-lg shadow-xs"
            referrerPolicy="no-referrer"
          />
          <span className="text-lg font-bold tracking-tight text-navy-900 whitespace-nowrap dark:text-white">
            Sürücü Takip
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="header" />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç'}
            title={theme === 'light' ? 'Koyu Tema' : 'Açık Tema'}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-navy-900 transition-colors hover:bg-slate-100 active:scale-[0.98] whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4 text-navy-900" />
                <span className="hidden sm:inline">Koyu Tema</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Açık Tema</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
