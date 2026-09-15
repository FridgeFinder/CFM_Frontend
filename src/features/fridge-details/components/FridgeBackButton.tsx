'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { BackLinkButton } from 'components/shared/BackLinkButton';

export function FridgeBackButton(): React.ReactElement {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');

  return (
    <BackLinkButton
      label={from === 'my-fridges' ? 'Go to My Fridges' : 'Go to Map'}
      href={from === 'my-fridges' ? '/my-fridges' : '/browse'}
    />
  );
}
