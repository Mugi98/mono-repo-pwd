'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[PWA] SW registered'))
        .catch((err) => console.error('[PWA] SW registration failed', err));
    }
  }, []);

  return null;
}
