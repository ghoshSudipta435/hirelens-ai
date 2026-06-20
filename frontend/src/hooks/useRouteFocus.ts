'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function useRouteFocus() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [pathname]);

  return ref;
}
