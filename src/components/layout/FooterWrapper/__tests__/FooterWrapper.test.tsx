import React from 'react';
import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { FooterWrapper } from '../FooterWrapper';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('../../PageFooter/PageFooter', () => ({
  PageFooter: () => <div data-testid="page-footer" />,
}));

const mockUsePathname = usePathname as jest.Mock;

describe('FooterWrapper', () => {
  it.each([
    ['/browse'],
    ['/auth/login'],
    ['/auth/callback'],
    ['/user/notifications'],
    ['/fridge/123/notifications'],
  ])('renders nothing for %s', (pathname) => {
    mockUsePathname.mockReturnValue(pathname);

    const { container } = render(<FooterWrapper />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when pathname is null', () => {
    mockUsePathname.mockReturnValue(null);

    const { container } = render(<FooterWrapper />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders PageFooter for the home page', () => {
    mockUsePathname.mockReturnValue('/');

    const { getByTestId } = render(<FooterWrapper />);

    expect(getByTestId('page-footer')).toBeInTheDocument();
  });

  it('renders PageFooter for other pages', () => {
    mockUsePathname.mockReturnValue('/contact');

    const { getByTestId } = render(<FooterWrapper />);

    expect(getByTestId('page-footer')).toBeInTheDocument();
  });
});
