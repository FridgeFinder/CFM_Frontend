import { useEffect, useState } from 'react';
import { FridgeReport } from 'types/domain';

export async function getLatestFridgeReport(
  fridgeId: string,
  signal?: AbortSignal
): Promise<FridgeReport | null> {
  const response = await fetch(
    `/v1/fridges/${encodeURIComponent(fridgeId)}/reports`,
    { headers: { Accept: 'application/json' }, cache: 'no-store', signal }
  );
  if (!response.ok) {
    throw new Error(
      `Could not load the latest fridge report (${response.status}).`
    );
  }
  const reports: FridgeReport[] = await response.json();
  if (!Array.isArray(reports)) {
    throw new Error('The latest fridge report response is invalid.');
  }
  if (
    reports.length > 0 &&
    (!reports[0] || typeof reports[0].condition !== 'string')
  ) {
    throw new Error('The latest fridge report condition is invalid.');
  }
  return reports[0] ?? null;
}

type ReportState =
  | { status: 'loading' }
  | { status: 'success'; report: FridgeReport | null }
  | { status: 'error'; error: string };

export function useLatestFridgeReport(fridgeId: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    fridgeId: string;
    attempt: number;
    state: ReportState;
  } | null>(null);

  useEffect(() => {
    if (!fridgeId) return;
    const controller = new AbortController();
    getLatestFridgeReport(fridgeId, controller.signal).then(
      (report) => {
        if (!controller.signal.aborted) {
          setResult({
            fridgeId,
            attempt,
            state: { status: 'success', report },
          });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            fridgeId,
            attempt,
            state: {
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'Could not load the latest fridge report.',
            },
          });
        }
      }
    );
    return () => controller.abort();
  }, [fridgeId, attempt]);

  const state: ReportState =
    result?.fridgeId === fridgeId && result.attempt === attempt
      ? result.state
      : { status: 'loading' };
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
