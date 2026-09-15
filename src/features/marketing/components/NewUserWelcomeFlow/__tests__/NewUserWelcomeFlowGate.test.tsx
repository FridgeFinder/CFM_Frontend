import { render, screen, waitFor } from '@testing-library/react';
import { useAuthStore } from 'store/useAuthStore';
import { NewUserWelcomeFlowGate } from '../NewUserWelcomeFlowGate';

const NEW_USER_ONBOARDING_KEY = 'ff-new-user-onboarding';

jest.mock('store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../NewUserWelcomeFlow', () => ({
  NewUserWelcomeFlow: ({ open }: { open: boolean }) => (
    <div data-testid="welcome-flow" data-open={String(open)} />
  ),
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('NewUserWelcomeFlowGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('opens flow when user is authenticated and onboarding is pending', async () => {
    window.localStorage.setItem(NEW_USER_ONBOARDING_KEY, 'pending');
    mockUseAuthStore.mockImplementation(
      (selector: (s: { status: string }) => unknown) =>
        selector({ status: 'authenticated' })
    );

    render(<NewUserWelcomeFlowGate />);

    await waitFor(() => {
      expect(screen.getByTestId('welcome-flow')).toHaveAttribute(
        'data-open',
        'true'
      );
    });
  });

  it('keeps flow closed for authenticated users when onboarding is completed', async () => {
    window.localStorage.setItem(NEW_USER_ONBOARDING_KEY, 'completed');
    mockUseAuthStore.mockImplementation(
      (selector: (s: { status: string }) => unknown) =>
        selector({ status: 'authenticated' })
    );

    render(<NewUserWelcomeFlowGate />);

    await waitFor(() => {
      expect(screen.getByTestId('welcome-flow')).toHaveAttribute(
        'data-open',
        'false'
      );
    });
  });

  it('keeps flow closed for unauthenticated users', async () => {
    window.localStorage.setItem(NEW_USER_ONBOARDING_KEY, 'pending');
    mockUseAuthStore.mockImplementation(
      (selector: (s: { status: string }) => unknown) =>
        selector({ status: 'unauthenticated' })
    );

    render(<NewUserWelcomeFlowGate />);

    await waitFor(() => {
      expect(screen.getByTestId('welcome-flow')).toHaveAttribute(
        'data-open',
        'false'
      );
    });
  });
});
