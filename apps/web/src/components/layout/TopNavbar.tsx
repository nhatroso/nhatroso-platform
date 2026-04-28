'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Icons } from '@/components/icons';
import { Navbar, Button, NavbarBrand } from 'flowbite-react';

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
    <Navbar
      fluid
      className="fixed left-0 right-0 top-0 z-50 border-b border-gray-border bg-gray-card px-3 py-3 lg:px-5 lg:pl-3"
    >
      <div className="flex items-center justify-start">
        <button
          onClick={onMenuToggle}
          type="button"
          className="inline-flex items-center rounded-lg p-2 text-gray-muted hover:bg-gray-surface focus:outline-none focus:ring-2 focus:ring-gray-border lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Icons.Menu className="h-6 w-6" />
        </button>

        <NavbarBrand href="/" className="ml-2 lg:ml-0">
          <span className="self-center whitespace-nowrap text-h2 font-bold text-gray-text">
            NHATROSO
          </span>
        </NavbarBrand>
      </div>

      <div className="flex items-center gap-4">
        <LocaleSwitcher />

        <div className="h-4 w-px bg-gray-border hidden sm:block" />

        <Button
          color="failure"
          size="xs"
          onClick={handleLogout}
          className="shadow-sm transition-all active:scale-95"
        >
          <Icons.Logout className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline font-bold">{t('logout')}</span>
        </Button>
      </div>
    </Navbar>
  );
}
