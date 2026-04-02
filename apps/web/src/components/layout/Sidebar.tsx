'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  key: string;
  href?: string;
  icon?: string;
  children?: { key: string; href: string }[];
};

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: 'grid' },
  { key: 'contracts', href: '/dashboard/contracts', icon: 'document' },
  {
    key: 'properties',
    icon: 'building',
    children: [
      { key: 'buildings', href: '/dashboard/buildings' },
      { key: 'floors', href: '/dashboard/floors' },
      { key: 'rooms', href: '/dashboard/rooms' },
    ],
  },
  {
    key: 'meter_management',
    icon: 'activity',
    children: [
      { key: 'meters', href: '/dashboard/meters' },
      { key: 'meter_requests', href: '/dashboard/meter-requests' },
      { key: 'meter_settings', href: '/dashboard/meter-settings' },
    ],
  },
  {
    key: 'services',
    icon: 'server',
    children: [
      { key: 'room_services', href: '/dashboard/room-services' },
      { key: 'service_catalog', href: '/dashboard/services' },
    ],
  },
];

function NavIcon({ type }: { type: string }) {
  switch (type) {
    case 'grid':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
      );
    case 'document':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 5.586L15.414 9A2 2 0 0116 10.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'building':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'server':
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v4a2 2 0 00-2-2"
          />
        </svg>
      );
    case 'activity':
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const [openGroups, setOpenGroups] = useState<string[]>(['properties']); // default open

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    // Strip locale prefix for comparison
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    if (href === '/dashboard') {
      return pathWithoutLocale === '/dashboard';
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white pt-16 transition-transform dark:border-gray-700 dark:bg-gray-800 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto px-3 pb-4 pt-5">
          <ul className="space-y-2 font-medium">
            {navItems.map((item) => {
              if (item.children) {
                const isGroupOpen = openGroups.includes(item.key);
                const isAnyChildActive = item.children.some((child) =>
                  isActive(child.href),
                );
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.key)}
                      className={`group flex w-full items-center rounded-lg p-2 transition-colors ${
                        isAnyChildActive && !isGroupOpen
                          ? 'bg-blue-50/50 text-blue-700 dark:bg-gray-700/50 dark:text-blue-400'
                          : 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                        <NavIcon type={item.icon!} />
                      </span>
                      <span className="ms-3 flex-1 text-left">
                        {t(item.key)}
                      </span>
                      <svg
                        className={`h-4 w-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isGroupOpen && (
                      <ul className="mt-2 space-y-1 py-1 px-2 border-l-2 ml-4 border-gray-100 dark:border-gray-700">
                        {item.children.map((child) => {
                          const active = isActive(child.href);
                          return (
                            <li key={child.key}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className={`flex items-center rounded-lg p-2 text-sm transition-colors ${
                                  active
                                    ? 'bg-blue-50 text-blue-700 font-bold dark:bg-gray-700 dark:text-blue-400'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                }`}
                              >
                                <span className="ms-2">{t(child.key)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const active = isActive(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href!}
                    onClick={onClose}
                    className={`group flex items-center rounded-lg p-2 transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-blue-400'
                        : 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`${
                        active
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'
                      }`}
                    >
                      <NavIcon type={item.icon!} />
                    </span>
                    <span className="ms-3">{t(item.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
