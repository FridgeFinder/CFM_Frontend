'use client';

import { useEffect } from 'react';
import { initAuthListener } from 'store/useAuthStore';

export function AuthProvider() {
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []);

  return null;
}
