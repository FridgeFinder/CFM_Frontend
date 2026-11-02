import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ResponsiveAppBar } from '../ResponsiveAppBar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
jest.mock('hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: jest.fn() }),
}));
jest.mock('store/useAuthStore', () => ({
  useAuthStore: () => ({ status: 'unauthenticated', isAdmin: false }),
}));

it.each(['/browse', '/browse/buffalo'])(
  'marks Find a Fridge active on desktop and mobile for %s',
  (pathname) => {
    jest.mocked(usePathname).mockReturnValue(pathname);
    render(<ResponsiveAppBar />);
    expect(screen.getAllByText('Find a Fridge')[0]).toHaveStyle({
      fontWeight: 600,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const labels = screen.getAllByText('Find a Fridge');
    expect(labels).toHaveLength(2);
    labels.forEach((label) => expect(label).toHaveStyle({ fontWeight: 600 }));
  }
);

it('does not mark Find a Fridge active for an unrelated prefix', () => {
  jest.mocked(usePathname).mockReturnValue('/browse-guide');
  render(<ResponsiveAppBar />);
  expect(screen.getAllByText('Find a Fridge')[0]).toHaveStyle({
    fontWeight: 500,
  });
});
