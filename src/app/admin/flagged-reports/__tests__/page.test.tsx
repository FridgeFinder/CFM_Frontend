import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import FlaggedReportsPage from '../page';

const mockCollection = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockOrderBy = jest.fn();
const mockQuery = jest.fn();
const mockOnSnapshot = jest.fn();
const mockUnsubscribe = jest.fn();
const mockServerTimestamp = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetIdToken = jest.fn();
const mockFetch = jest.fn();
const originalFetch = global.fetch;

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => mockCollection(...args),
    deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    query: (...args: unknown[]) => mockQuery(...args),
    serverTimestamp: () => mockServerTimestamp(),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  };
});

jest.mock('config/firebase', () => ({
  getFirebaseFirestore: () => 'firestore',
}));

jest.mock('store/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: { getIdToken: () => Promise<string> };
    }) => unknown
  ) => selector({ user: { getIdToken: mockGetIdToken } }),
}));

interface MockReportSnapshot {
  docs: Array<{
    id: string;
    data: () => Record<string, unknown>;
  }>;
}

describe('FlaggedReportsPage', () => {
  let reportSnapshot: ((snapshot: MockReportSnapshot) => void) | undefined;
  let reportError: ((error: Error) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockUpdateDoc.mockReset().mockResolvedValue(undefined);
    global.fetch = mockFetch as typeof fetch;
    mockCollection.mockReturnValue('flagged-reports-collection');
    mockDoc.mockReturnValue('flagged-report-document');
    mockOrderBy.mockReturnValue('created-at-desc');
    mockQuery.mockReturnValue('flagged-reports-query');
    mockGetIdToken.mockResolvedValue('admin-token');
    mockServerTimestamp.mockReturnValue('server-timestamp');
    mockOnSnapshot.mockImplementation(
      (
        _query: unknown,
        onNext: (snapshot: MockReportSnapshot) => void,
        onError: (error: Error) => void
      ) => {
        reportSnapshot = onNext;
        reportError = onError;
        return mockUnsubscribe;
      }
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('shows reports newest first from the admin-only collection', async () => {
    const createdAt = Timestamp.fromDate(new Date('2026-10-16T12:00:00Z'));
    render(<FlaggedReportsPage />);

    expect(mockCollection).toHaveBeenCalledWith(
      'firestore',
      'FlaggedFridgeReports'
    );
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockQuery).toHaveBeenCalledWith(
      'flagged-reports-collection',
      'created-at-desc'
    );

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                epochTimestamp: '1791889200',
                condition: 'good',
                foodPercentage: 2,
                notes: 'Needs restocking.\nPlease check the produce.',
                photoUrl: 'https://images.example.com/report.jpg',
              },
              createdAt,
            }),
          },
        ],
      });
    });

    expect(screen.getByText('Flagged Reports')).toBeTruthy();
    expect(screen.getByText('Inaccurate')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toBe(
      'None'
    );
    const fridgeProfileLink = screen.getByRole('link', {
      name: 'greenpointfridge',
    });
    expect(fridgeProfileLink.getAttribute('href')).toBe(
      '/fridge/greenpointfridge'
    );
    expect(fridgeProfileLink.getAttribute('target')).toBe('_blank');
    expect(screen.getByText('good')).toBeTruthy();
    expect(screen.getByText('Many Items (2/3)')).toBeTruthy();
    expect(screen.getByText(/Needs restocking/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Open photo' }).getAttribute('href')
    ).toBe('https://images.example.com/report.jpg');
    expect(screen.getByText('Epoch: 1791889200')).toBeTruthy();
    expect(screen.queryByText('flag-123')).toBeNull();
    expect(
      screen.getByRole('columnheader', { name: 'Fridge Report Timestamp' })
    ).toBeTruthy();
    expect(
      screen.getByText(
        new Date('2026-10-13T11:00:00Z').toLocaleString(undefined, {
          timeZone: 'UTC',
          timeZoneName: 'short',
        })
      )
    ).toBeTruthy();
    expect(
      screen.getByRole('columnheader', { name: 'Flagged at (UTC)' })
    ).toBeTruthy();
    expect(
      screen.getByText(
        createdAt.toDate().toLocaleString(undefined, {
          timeZone: 'UTC',
          timeZoneName: 'short',
        })
      )
    ).toBeTruthy();
  });

  it('updates an admin-selected moderation status', async () => {
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                condition: 'good',
                foodPercentage: 2,
              },
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Not Harmful' }));

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith('flagged-report-document', {
        status: 'not_harmful',
      });
    });
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toBe(
      'Not Harmful'
    );
    expect(
      await screen.findByText('Flag status updated to Not Harmful.')
    ).toBeTruthy();
  });

  it('surfaces moderation status update failures', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Not Inappropriate' }));

    expect(
      await screen.findByText('Could not update flag status: permission-denied')
    ).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toBe(
      'None'
    );
  });

  it('marks report details as unavailable for older flags without a snapshot', async () => {
    const createdAt = Timestamp.fromDate(new Date('2026-10-16T12:00:00Z'));
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'legacy-flag',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'harmful',
              createdAt,
            }),
          },
        ],
      });
    });

    expect(
      screen.getByText('Details unavailable for this older flag')
    ).toBeTruthy();
  });

  it('shows a hyphen when a report has no notes', async () => {
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-without-notes',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'harmful',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                condition: 'good',
                foodPercentage: 1,
                notes: '',
              },
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    expect(screen.getByRole('cell', { name: '-' })).toBeTruthy();
  });

  it('deletes a flag only after confirmation', async () => {
    const createdAt = Timestamp.fromDate(new Date('2026-10-16T12:00:00Z'));
    mockDeleteDoc.mockResolvedValueOnce(undefined);
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              createdAt,
            }),
          },
        ],
      });
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete flag for greenpointfridge' })
    );
    expect(
      screen.getByRole('dialog', { name: 'Delete flagged report?' })
    ).toBeTruthy();
    expect(mockDeleteDoc).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete flag' }));

    await waitFor(() => {
      expect(mockDoc).toHaveBeenCalledWith(
        'firestore',
        'FlaggedFridgeReports',
        'flag-123'
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith('flagged-report-document');
    });
    expect(await screen.findByText('Flagged report deleted.')).toBeTruthy();
  });

  it('surfaces delete failures and leaves the confirmation available', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDeleteDoc.mockRejectedValueOnce(new Error('permission-denied'));
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete flag for greenpointfridge' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete flag' }));

    expect(
      await screen.findByText(
        'Could not delete flagged report: permission-denied'
      )
    ).toBeTruthy();
    expect(
      screen.getByRole('dialog', { name: 'Delete flagged report?' })
    ).toBeTruthy();
  });

  it('deletes the fridge report through the authenticated API and marks the flag', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                epochTimestamp: '1791889200',
                condition: 'good',
                foodPercentage: 2,
              },
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete fridge report for greenpointfridge',
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'Delete Fridge Report?' })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Fridge Report' })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/v1/fridges/greenpointfridge/reports/1791889200',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer admin-token' },
        }
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith('flagged-report-document', {
        status: 'deleted',
        reportDeletedAt: 'server-timestamp',
      });
    });
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);
    expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
    expect(mockDeleteDoc).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Fridge report deleted. Status set to Deleted.')
    ).toBeTruthy();
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Delete Fridge Report?' })
      ).toBeNull();
    });
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toBe(
      'Deleted'
    );
  });

  it('does not update Firestore if the fridge report API delete fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                epochTimestamp: '1791889200',
                condition: 'good',
                foodPercentage: 2,
              },
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete fridge report for greenpointfridge',
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Fridge Report' })
    );

    expect(
      await screen.findByText(
        'Could not delete fridge report: API request failed (500)'
      )
    ).toBeTruthy();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'Delete Fridge Report?' })
    ).toBeTruthy();
  });

  it('surfaces a partial failure if the API deletes but Firestore cannot be marked', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    mockUpdateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                epochTimestamp: '1791889200',
                condition: 'good',
                foodPercentage: 2,
              },
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete fridge report for greenpointfridge',
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Fridge Report' })
    );

    expect(
      await screen.findByText(
        'Fridge report was deleted, but its Firestore status could not be updated: permission-denied'
      )
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toBe(
        'Deleted'
      );
    });
    expect(
      screen.queryByRole('button', {
        name: 'Delete fridge report for greenpointfridge',
      })
    ).toBeNull();
  });

  it('disables API deletion when the flag has no epoch timestamp', async () => {
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'legacy-flag',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'harmful',
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    expect(
      screen
        .getByRole('button', {
          name: 'Delete fridge report for greenpointfridge',
        })
        .hasAttribute('disabled')
    ).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows a deleted status instead of offering another API delete', async () => {
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportSnapshot?.({
        docs: [
          {
            id: 'flag-123',
            data: () => ({
              fridgeId: 'greenpointfridge',
              reportTimestamp: '2026-10-13T11:00:00Z',
              reason: 'inaccurate',
              report: {
                fridgeId: 'greenpointfridge',
                timestamp: '2026-10-13T11:00:00Z',
                epochTimestamp: '1791889200',
                condition: 'good',
                foodPercentage: 2,
              },
              reportDeletedAt: Timestamp.fromDate(
                new Date('2026-10-16T12:00:00Z')
              ),
              createdAt: Timestamp.fromDate(new Date('2026-10-16T12:00:00Z')),
            }),
          },
        ],
      });
    });

    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toBe(
      'Deleted'
    );
    expect(
      screen.queryByRole('button', {
        name: 'Delete fridge report for greenpointfridge',
      })
    ).toBeNull();
  });

  it('surfaces Firestore listener failures', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<FlaggedReportsPage />);

    await act(async () => {
      reportError?.(new Error('permission-denied'));
    });

    expect(
      screen.getByText(
        'Could not load flagged reports from Firestore: permission-denied'
      )
    ).toBeTruthy();
  });
});
