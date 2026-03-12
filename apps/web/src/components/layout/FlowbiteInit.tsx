'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initFlowbite } from 'flowbite';

export function FlowbiteInit() {
  const pathname = usePathname();

  useEffect(() => {
    // Re-initialize Flowbite on every route change for SPA navigation
    initFlowbite();
  }, [pathname]);

  return null;
}
