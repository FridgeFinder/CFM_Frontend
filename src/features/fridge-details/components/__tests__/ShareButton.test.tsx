import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShareButton } from '../ShareButton';

describe('ShareButton', () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;
  let promptSpy: jest.SpyInstance;

  beforeEach(() => {
    promptSpy = jest.spyOn(window, 'prompt').mockImplementation(() => null);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    promptSpy.mockRestore();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: originalShare,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
  });

  it('uses navigator.share when available', async () => {
    const shareMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });

    render(<ShareButton fridgeName="Community Fridge" />);

    fireEvent.click(screen.getByLabelText('Click to share this page'));

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledWith({
        title: 'Community Fridge',
        url: window.location.href,
      });
    });
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it('falls back to clipboard when share is unavailable', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    render(<ShareButton fridgeName="Community Fridge" />);

    fireEvent.click(screen.getByLabelText('Click to share this page'));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(window.location.href);
    });
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it('falls back to prompt when share and clipboard are unavailable', async () => {
    render(<ShareButton fridgeName="Community Fridge" />);

    fireEvent.click(screen.getByLabelText('Click to share this page'));

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalledWith(
        'Copy this link:',
        window.location.href
      );
    });
  });

  it('does not prompt when share is cancelled by user', async () => {
    const shareMock = jest
      .fn()
      .mockRejectedValue(new DOMException('User cancelled', 'AbortError'));

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });

    render(<ShareButton fridgeName="Community Fridge" />);

    fireEvent.click(screen.getByLabelText('Click to share this page'));

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalled();
    });
    expect(promptSpy).not.toHaveBeenCalled();
  });
});
