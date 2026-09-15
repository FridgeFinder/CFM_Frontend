'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeedbackCard } from 'components/ui';
import { ContactForm, ContactFormData } from 'features/contact';

enum DisplayStatus {
  Form = 0,
  Success = 1,
  Error = 2,
}

function ContactPageContent(): React.ReactElement {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>(
    DisplayStatus.Form
  );
  const searchParams = useSearchParams();
  const subject = searchParams?.get('subject') || '';

  const fridgeUrl = `/v1/contact/`;

  async function handleSubmit(values: ContactFormData) {
    try {
      const response = await fetch(fridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setDisplayStatus(DisplayStatus.Success);
      } else {
        setDisplayStatus(DisplayStatus.Error);
      }
    } catch (error) {
      console.error('Failed to send contact email:', error);
      setDisplayStatus(DisplayStatus.Error);
    }
  }

  function renderContent(): React.ReactNode {
    switch (displayStatus) {
      case DisplayStatus.Form:
        return (
          <ContactForm onSubmit={handleSubmit} initialValues={{ subject }} />
        );
      case DisplayStatus.Success:
        return <FeedbackCard form="EmailSuccess" />;
      case DisplayStatus.Error:
        return (
          <FeedbackCard
            form="Error"
            onClickRetry={() => setDisplayStatus(DisplayStatus.Form)}
          />
        );
      default:
        return null;
    }
  }

  return <>{renderContent()}</>;
}

export default function ContactPage(): React.ReactElement {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactPageContent />
    </Suspense>
  );
}
