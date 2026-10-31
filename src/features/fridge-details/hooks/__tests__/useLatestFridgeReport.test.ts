import { act, renderHook, waitFor } from '@testing-library/react';
import {
  getLatestFridgeReport,
  useLatestFridgeReport,
} from '../useLatestFridgeReport';

const mockFetch = jest.fn();
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
});

it.each(['ghost', 'good', 'dirty', 'out of order'])(
  'loads the current %s condition uncached',
  async (condition) => {
    const report = {
      fridgeId: 'fridge-1',
      timestamp: '2026-10-30',
      condition,
      foodPercentage: 0,
    };
    mockFetch.mockResolvedValue({ ok: true, json: async () => [report] });
    const { result } = renderHook(() => useLatestFridgeReport('fridge-1'));
    expect(result.current.status).toBe('loading');
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: 'success', report })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      '/v1/fridges/fridge-1/reports',
      expect.objectContaining({
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      })
    );
  }
);

it('distinguishes no reports from a failure', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
  const { result } = renderHook(() => useLatestFridgeReport('fridge-1'));
  await waitFor(() =>
    expect(result.current).toMatchObject({ status: 'success', report: null })
  );
});

it('surfaces a failed lookup and retries', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
  const { result } = renderHook(() => useLatestFridgeReport('fridge-1'));
  await waitFor(() => expect(result.current.status).toBe('error'));
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
  act(() => result.current.retry());
  expect(result.current.status).toBe('loading');
  await waitFor(() =>
    expect(result.current).toMatchObject({ status: 'success', report: null })
  );
});

it.each([{}, [null], [{ fridgeId: 'fridge-1' }]])(
  'rejects an invalid response: %j',
  async (response) => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => response });
    await expect(getLatestFridgeReport('fridge-1')).rejects.toThrow(/invalid/i);
  }
);

it('ignores stale responses after changing fridge IDs and aborts on unmount', async () => {
  let resolveOld!: (value: unknown) => void;
  mockFetch.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveOld = resolve;
    })
  );
  const { result, rerender, unmount } = renderHook(
    ({ id }) => useLatestFridgeReport(id),
    { initialProps: { id: 'old' } }
  );
  const oldSignal: AbortSignal = mockFetch.mock.calls[0][1].signal;
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
  rerender({ id: 'new' });
  expect(oldSignal.aborted).toBe(true);
  await waitFor(() =>
    expect(result.current).toMatchObject({ status: 'success', report: null })
  );
  await act(async () =>
    resolveOld({ ok: true, json: async () => [{ condition: 'ghost' }] })
  );
  expect(result.current).toMatchObject({ status: 'success', report: null });
  const newSignal: AbortSignal = mockFetch.mock.calls[1][1].signal;
  unmount();
  expect(newSignal.aborted).toBe(true);
});
