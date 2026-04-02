'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LogOut } from 'lucide-react';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

export function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const t = useTranslations('Sidebar');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            {/* Hamburger menu button */}
            <button
              onClick={onMenuToggle}
              type="button"
              className="inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                />
              </svg>
            </button>

            {/* Brand */}
            <span className="ml-2 self-center whitespace-nowrap text-xl font-bold dark:text-white lg:ml-0">
              NHATROSO
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LocaleSwitcher />

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-95 shadow-sm"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
