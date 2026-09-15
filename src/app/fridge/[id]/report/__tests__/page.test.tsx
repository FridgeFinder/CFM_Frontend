import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useParams, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockInvalidate = jest.fn();
const mockUpdateFridgeReport = jest.fn();
jest.mock('store/useFridgeStore', () => ({
  useFridgeStore: (
    selector: (s: {
      invalidate: jest.Mock;
      updateFridgeReport: jest.Mock;
    }) => unknown
  ) =>
    selector({
      invalidate: mockInvalidate,
      updateFridgeReport: mockUpdateFridgeReport,
    }),
}));

jest.mock('store/useAuthStore', () => ({
  useAuthStore: (
    selector: (s: {
      user: { uid: string; getIdToken: () => Promise<string> } | null;
      userProfile: { userType: string } | null;
    }) => unknown
  ) =>
    selector({
      user: null,
      userProfile: null,
    }),
  updateCachedUserProfile: jest.fn(),
}));

// Mock the heavy child components — we test the page logic, not the form UI
jest.mock('features/fridge-management', () => ({
  ReportForm: ({
    fridgeId,
    fridgeName,
    cancelTo,
    onSubmit,
  }: {
    fridgeId: string;
    fridgeName?: string;
    cancelTo?: string;
    onSubmit: (data: unknown) => void;
  }) => (
    <div data-testid="report-form">
      <span data-testid="fridge-id">{fridgeId}</span>
      <span data-testid="fridge-name">{fridgeName}</span>
      <span data-testid="cancel-to">{cancelTo}</span>
      <button
        onClick={() =>
          onSubmit({ condition: 'good', foodPercentage: 2, notes: '' })
        }
      >
        submit
      </button>
    </div>
  ),
}));

jest.mock('components/ui', () => ({
  FeedbackCard: ({
    form,
    onClickRetry,
  }: {
    form: string;
    onClickRetry?: () => void;
  }) => (
    <div data-testid="feedback-card">
      <span data-testid="feedback-form">{form}</span>
      {onClickRetry && (
        <button data-testid="retry-btn" onClick={onClickRetry}>
          retry
        </button>
      )}
    </div>
  ),
}));

const mockFetch = jest.fn();
(globalThis as { fetch: jest.Mock }).fetch = mockFetch;

// Import after mocks are in place so fetch is always defined.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: FridgeReportPage } =
  require('../page') as typeof import('../page');

const mockUseParams = useParams as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

const mockSearchParams = (params: Record<string, string | null>) => ({
  get: (key: string) => params[key] ?? null,
});

beforeEach(() => {
  jest.clearAllMocks();
  (globalThis as { fetch: jest.Mock }).fetch = mockFetch;
  mockUseParams.mockReturnValue({ id: 'fridge-42' });
  mockUseSearchParams.mockReturnValue(mockSearchParams({}));
});

describe('initial render — Form state', () => {
  it('renders ReportForm with the fridge id from params', () => {
    render(<FridgeReportPage />);
    expect(screen.getByTestId('report-form')).toBeInTheDocument();
    expect(screen.getByTestId('fridge-id')).toHaveTextContent('fridge-42');
  });

  it('passes fridgeName from the "name" search param', () => {
    mockUseSearchParams.mockReturnValue(
      mockSearchParams({ name: 'The Green Fridge' })
    );
    render(<FridgeReportPage />);
    expect(screen.getByTestId('fridge-name')).toHaveTextContent(
      'The Green Fridge'
    );
  });

  it('passes undefined fridgeName when "name" param is absent', () => {
    render(<FridgeReportPage />);
    expect(screen.getByTestId('fridge-name')).toBeEmptyDOMElement();
  });

  it('renders nothing when fridgeId is empty', () => {
    mockUseParams.mockReturnValue({ id: '' });
    const { container } = render(<FridgeReportPage />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('cancelTo allowlist', () => {
  it('passes /browse through when "from" is /browse', () => {
    mockUseSearchParams.mockReturnValue(mockSearchParams({ from: '/browse' }));
    render(<FridgeReportPage />);
    expect(screen.getByTestId('cancel-to')).toHaveTextContent('/browse');
  });

  it('passes a valid fridge path through', () => {
    mockUseSearchParams.mockReturnValue(
      mockSearchParams({ from: '/fridge/abc123' })
    );
    render(<FridgeReportPage />);
    expect(screen.getByTestId('cancel-to')).toHaveTextContent('/fridge/abc123');
  });

  it('falls back to /browse for an arbitrary external path', () => {
    mockUseSearchParams.mockReturnValue(
      mockSearchParams({ from: 'https://evil.com' })
    );
    render(<FridgeReportPage />);
    expect(screen.getByTestId('cancel-to')).toHaveTextContent('/browse');
  });

  it('falls back to /browse for a path with nested segments', () => {
    mockUseSearchParams.mockReturnValue(
      mockSearchParams({ from: '/fridge/abc/report' })
    );
    render(<FridgeReportPage />);
    expect(screen.getByTestId('cancel-to')).toHaveTextContent('/browse');
  });

  it('falls back to /browse when "from" is absent', () => {
    render(<FridgeReportPage />);
    expect(screen.getByTestId('cancel-to')).toHaveTextContent('/browse');
  });
});

describe('form submission — success', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('shows the FridgeStatusSuccess FeedbackCard after successful submit', async () => {
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
      expect(screen.getByTestId('feedback-form')).toHaveTextContent(
        'FridgeStatusSuccess'
      );
    });
  });

  it('calls invalidate on the fridge store so the next browse visit re-fetches', async () => {
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalledTimes(1);
    });
  });

  it('optimistically patches the fridge report in store after successful submit', async () => {
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mockUpdateFridgeReport).toHaveBeenCalledWith(
        'fridge-42',
        expect.objectContaining({
          fridgeId: 'fridge-42',
          condition: 'good',
          foodPercentage: 2,
        })
      );
    });
  });

  it('POSTs to the correct URL', async () => {
    process.env.NEXT_PUBLIC_FF_API_URL = 'https://api.example.com';
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/fridges/fridge-42/reports',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('includes fridgeId and timestamp in the POST body', async () => {
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.fridgeId).toBe('fridge-42');
      expect(typeof body.timestamp).toBe('string');
    });
  });

  it('promotes Neighbor users to Volunteer after a successful report', async () => {
    process.env.NEXT_PUBLIC_USERS_API_URL = 'https://users.example.com';
    const getIdToken = jest.fn().mockResolvedValue('id-token-abc');
    jest
      .spyOn(require('store/useAuthStore'), 'useAuthStore')
      .mockImplementation(
        (
          selector: (s: {
            user: { uid: string; getIdToken: () => Promise<string> } | null;
            userProfile: { userType: string } | null;
          }) => unknown
        ) =>
          selector({
            user: { uid: 'user-123', getIdToken },
            userProfile: { userType: 'Neighbor' },
          })
      );

    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://users.example.com/v1/users/user-123',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer id-token-abc',
          },
          body: JSON.stringify({ userType: 'Volunteer' }),
        }
      );
    });
  });

  it('does not promote users when userType is not Neighbor', async () => {
    process.env.NEXT_PUBLIC_USERS_API_URL = 'https://users.example.com';
    const getIdToken = jest.fn().mockResolvedValue('id-token-abc');
    jest
      .spyOn(require('store/useAuthStore'), 'useAuthStore')
      .mockImplementation(
        (
          selector: (s: {
            user: { uid: string; getIdToken: () => Promise<string> } | null;
            userProfile: { userType: string } | null;
          }) => unknown
        ) =>
          selector({
            user: { uid: 'user-123', getIdToken },
            userProfile: { userType: 'Volunteer' },
          })
      );

    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/fridges/fridge-42/reports'),
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(mockFetch).not.toHaveBeenCalledWith(
      'https://users.example.com/v1/users/user-123',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

describe('form submission — error', () => {
  it('shows the Error FeedbackCard when the API returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-form')).toHaveTextContent('Error');
    });
  });

  it('does not call invalidate when the submission fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-form')).toHaveTextContent('Error');
    });
    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  it('shows the Error FeedbackCard when the fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-form')).toHaveTextContent('Error');
    });
  });

  it('clicking retry returns to the Form state', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<FridgeReportPage />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('retry-btn').click();
    });

    expect(screen.getByTestId('report-form')).toBeInTheDocument();
  });
});
