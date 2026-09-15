'use client';

import { useEffect, useState } from 'react';
import { NEW_USER_ONBOARDING_KEY } from 'features/auth/utils/registerNewUser';
import { useAuthStore } from 'store/useAuthStore';
import { NewUserWelcomeFlow } from './NewUserWelcomeFlow';

export function NewUserWelcomeFlowGate(): React.ReactElement {
  const authStatus = useAuthStore((state) => state.status);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      setOpen(false);
      return;
    }

    const onboardingState = window.localStorage.getItem(
      NEW_USER_ONBOARDING_KEY
    );
    setOpen(onboardingState === 'pending');
  }, [authStatus]);

  return <NewUserWelcomeFlow open={open} onClose={() => setOpen(false)} />;
}
