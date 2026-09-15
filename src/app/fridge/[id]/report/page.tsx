'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FeedbackCard } from 'components/ui';
import { promoteNeighborToVolunteer } from 'features/auth/utils/promoteNeighborToVolunteer';
import { ReportForm, ReportFormData } from 'features/fridge-management';
import { useFridgeStore } from 'store/useFridgeStore';
import { useAuthStore } from 'store/useAuthStore';
import { FridgeReport } from 'types/domain';

enum DisplayStatus {
  Form = 0,
  Success = 1,
  Error = 2,
}

export default function FridgeReportPage(): React.ReactElement {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>(
    DisplayStatus.Form
  );
  const invalidateFridges = useFridgeStore((s) => s.invalidate);
  const updateFridgeReport = useFridgeStore((s) => s.updateFridgeReport);
  const user = useAuthStore((s) => s.user);
  const userProfile = useAuthStore((s) => s.userProfile);
  const params = useParams();
  const searchParams = useSearchParams();
  const fridgeId = (params?.id ?? '') as string;
  const fromParam = searchParams?.get('from') ?? '';
  const isAllowedFrom =
    fromParam === '/browse' ||
    fromParam === '/my-fridges' ||
    /^\/fridge\/[^/]+$/.test(fromParam);
  const cancelTo = isAllowedFrom ? fromParam : '/browse';
  const fridgeName = searchParams?.get('name') ?? undefined;

  const postReportUrl = `${process.env.NEXT_PUBLIC_FF_API_URL}/v1/fridges/${fridgeId}/reports`;

  async function handleSubmit(values: ReportFormData) {
    try {
      const payload = {
        ...values,
        fridgeId,
        timestamp: new Date().toISOString(),
        ...(user?.uid ? { userId: user.uid } : {}),
      };

      const response = await fetch(postReportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const optimisticReport: FridgeReport = {
          fridgeId,
          timestamp: payload.timestamp,
          condition: values.condition,
          foodPercentage: values.foodPercentage,
          ...(values.notes ? { notes: values.notes } : {}),
        };

        updateFridgeReport(fridgeId, optimisticReport);
        invalidateFridges();
        void promoteNeighborToVolunteer(user, userProfile?.userType);
        setDisplayStatus(DisplayStatus.Success);
      } else {
        setDisplayStatus(DisplayStatus.Error);
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      setDisplayStatus(DisplayStatus.Error);
    }
  }

  function renderContent(): React.ReactNode {
    switch (displayStatus) {
      case DisplayStatus.Form:
        return (
          <ReportForm
            fridgeId={fridgeId}
            fridgeName={fridgeName}
            onSubmit={handleSubmit}
            cancelTo={cancelTo}
          />
        );
      case DisplayStatus.Success:
        return (
          <FeedbackCard
            form="FridgeStatusSuccess"
            slug={`/fridge/${fridgeId}`}
          />
        );
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

  return <>{fridgeId && renderContent()}</>;
}
