'use client';

import React, { useState, useEffect } from 'react';

interface LocalTimestampProps {
  timestamp: string;
}

export function LocalTimestamp({
  timestamp,
}: LocalTimestampProps): React.ReactElement {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    setFormatted(
      new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [timestamp]);

  return <>{formatted}</>;
}
