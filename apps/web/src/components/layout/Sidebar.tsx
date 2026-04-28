'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icons, LucideIcon } from '@/components/icons';
import {
  Sidebar,
  SidebarItems,
  SidebarItemGroup,
  SidebarCollapse,
  SidebarItem,
} from 'flowbite-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  key: string;
  href?: string;
  icon: LucideIcon;
  children?: { key: string; href: string }[];
};

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: Icons.Dashboard },
  { key: 'contracts', href: '/dashboard/contracts', icon: Icons.Contract },
  {
    key: 'invoices',
    icon: Icons.Invoice,
    children: [
      { key: 'invoice_list', href: '/dashboard/invoices' },
      { key: 'auto_invoices', href: '/dashboard/invoices/automation' },
    ],
  },
  {
    key: 'properties',
    icon: Icons.Property,
    children: [
      { key: 'buildings', href: '/dashboard/buildings' },
      { key: 'floors', href: '/dashboard/buildings/floors' },
      { key: 'rooms', href: '/dashboard/buildings/rooms' },
    ],
  },
  {
    key: 'meter_management',
    icon: Icons.Meter,
    children: [
      { key: 'meter_readings', href: '/dashboard/meters/readings' },
      { key: 'meter_requests', href: '/dashboard/meters/requests' },
      { key: 'meter_settings', href: '/dashboard/meters/settings' },
    ],
  },
  {
    key: 'services',
    icon: Icons.Service,
    children: [
      { key: 'room_services', href: '/dashboard/services/room-services' },
      { key: 'service_catalog', href: '/dashboard/services' },
    ],
  },
];

export function SidebarComponent({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  const isActive = (href?: string) => {
    if (!href) return false;
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    if (pathWithoutLocale === href) return true;
    if (href === '/dashboard' && pathWithoutLocale !== '/dashboard')
      return false;
    return pathWithoutLocale.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-strong/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <Sidebar
        aria-label="Sidebar navigation"
        className={`fixed left-0 top-0 z-40 h-screen w-64 pt-16 transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarItems>
          <SidebarItemGroup>
            {navItems.map((item) => {
              if (item.children) {
                const isAnyChildActive = item.children.some((child) =>
                  isActive(child.href),
                );
                return (
                  <SidebarCollapse
                    key={item.key}
                    icon={item.icon}
                    label={t(item.key)}
                    open={true}
                    className={
                      isAnyChildActive ? 'bg-primary-light text-primary' : ''
                    }
                  >
                    {item.children.map((child) => (
                      <SidebarItem
                        key={child.key}
                        as={Link}
                        href={child.href}
                        onClick={onClose}
                        active={isActive(child.href)}
                      >
                        {t(child.key)}
                      </SidebarItem>
                    ))}
                  </SidebarCollapse>
                );
              }

              return (
                <SidebarItem
                  key={item.key}
                  as={Link}
                  href={item.href}
                  icon={item.icon}
                  onClick={onClose}
                  active={isActive(item.href)}
                >
                  {t(item.key)}
                </SidebarItem>
              );
            })}
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>
    </>
  );
}

export { SidebarComponent as Sidebar };
