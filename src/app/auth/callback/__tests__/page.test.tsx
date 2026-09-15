import React from 'react';
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useEmailAuth, SIGN_IN_RETURN_KEY } from 'features/auth';
import AuthCallbackPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('features/auth', () => ({
  useEmailAuth: jest.fn(),
  SIGN_IN_RETURN_KEY: 'ff-signin-return',
}));

const mockReplace = jest.fn();
const mockConfirmSignIn = jest.fn();
const mockUseRouter = useRouter as jest.Mock;
const mockUseEmailAuth = useEmailAuth as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockUseRouter.mockReturnValue({ replace: mockReplace });
});

describe('auto sign-in on mount', () => {
  it('calls confirmSignIn automatically with no arguments', async () => {
    mockUseEmailAuth.mockReturnValue({
      confirmSignIn: mockConfirmSignIn.mockResolvedValue('loading'),
      status: 'loading',
      error: null,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockConfirmSignIn).toHaveBeenCalledWith();
    });
  });

  it('redirects to the stored return path on success', async () => {
    localStorage.setItem('ff-signin-return', '/fridge/123');
    mockUseEmailAuth.mockReturnValue({
      confirmSignIn: mockConfirmSignIn.mockResolvedValue('success'),
      status: 'success',
      error: null,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/fridge/123');
    });
    expect(localStorage.getItem('ff-signin-return')).toBeNull();
  });

  it('redirects to / when no return path is stored', async () => {
    mockUseEmailAuth.mockReturnValue({
      confirmSignIn: mockConfirmSignIn.mockResolvedValue('success'),
      status: 'success',
      error: null,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows the email input form when result is needs-email', async () => {
    mockUseEmailAuth.mockReturnValue({
      confirmSignIn: mockConfirmSignIn.mockResolvedValue('needs-email'),
      status: 'idle',
      error: null,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: /email address/i })
      ).toBeInTheDocument();
    });
  });
});

describe('error state', () => {
  it('renders an error alert when the hook reports an error', () => {
    mockUseEmailAuth.mockReturnValue({
      confirmSignIn: mockConfirmSignIn.mockResolvedValue('error'),
      status: 'error',
      error: 'This sign-in link has expired.',
    });

    render(<AuthCallbackPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This sign-in link has expired.'
    );
  });
});

describe('email form submission', () => {
  const renderWithNeedsEmail = async () => {
    mockUseEmailAuth.mockReturnValue({
      confirmSignIn: mockConfirmSignIn
        .mockResolvedValueOnce('needs-email')
        .mockResolvedValueOnce('success'),
      status: 'idle',
      error: null,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: /email address/i })
      ).toBeInTheDocument();
    });
  };

  it('calls confirmSignIn with the entered email on submit', async () => {
    await renderWithNeedsEmail();

    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockConfirmSignIn).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('redirects to the stored return path after successful form submit', async () => {
    localStorage.setItem('ff-signin-return', '/profile');
    await renderWithNeedsEmail();

    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/profile');
    });
    expect(localStorage.getItem('ff-signin-return')).toBeNull();
  });

  it('redirects to / when no return path is stored after form submit', async () => {
    await renderWithNeedsEmail();

    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
