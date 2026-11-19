import React from 'react';
import { CalendarDays, Home, Settings, Users } from 'lucide-react';
import { TabKey } from '../types';

interface BottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

const NAV_ITEMS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'home', label: 'Ana Sayfa', icon: Home },
  { key: 'students', label: 'Kursiyerler', icon: Users },
  { key: 'calendar', label: 'Takvim', icon: CalendarDays },
  { key: 'settings', label: 'Ayarlar', icon: Settings },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Ana menü"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-4 items-center px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-navy-900 dark:text-sky-400'
                  : 'text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
              <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
