'use client';

import * as React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-surface">
      <TopNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="mt-16 p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}
