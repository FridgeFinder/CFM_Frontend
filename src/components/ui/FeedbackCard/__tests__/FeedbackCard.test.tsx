import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackCard } from '../FeedbackCard';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe('FeedbackCard — EmailSuccess', () => {
  it('renders the success heading', () => {
    render(<FeedbackCard form="EmailSuccess" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Success!');
  });

  it('renders the correct body text', () => {
    render(<FeedbackCard form="EmailSuccess" />);
    expect(screen.getByText('Your email was sent.')).toBeInTheDocument();
  });

  it('renders the email success image', () => {
    render(<FeedbackCard form="EmailSuccess" />);
    expect(screen.getByAltText('Email success image')).toBeInTheDocument();
  });

  it('renders a "BACK TO HOME" link pointing to /', () => {
    render(<FeedbackCard form="EmailSuccess" />);
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveTextContent('BACK TO HOME');
  });
});

describe('FeedbackCard — FridgeStatusSuccess', () => {
  it('renders the success heading', () => {
    render(<FeedbackCard form="FridgeStatusSuccess" slug="/fridge/abc123" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Success!');
  });

  it('renders the correct body text', () => {
    render(<FeedbackCard form="FridgeStatusSuccess" slug="/fridge/abc123" />);
    expect(
      screen.getByText('You have successfully submitted a status report!')
    ).toBeInTheDocument();
  });

  it('renders the happy fridge image', () => {
    render(<FeedbackCard form="FridgeStatusSuccess" slug="/fridge/abc123" />);
    expect(screen.getByAltText('Happy fridge image')).toBeInTheDocument();
  });

  it('renders a "GO TO FRIDGE" link pointing to the slug', () => {
    render(<FeedbackCard form="FridgeStatusSuccess" slug="/fridge/abc123" />);
    const link = screen.getByRole('link', { name: /go to fridge/i });
    expect(link).toHaveAttribute('href', '/fridge/abc123');
    expect(link).toHaveTextContent('GO TO FRIDGE');
  });

  it('slug defaults to empty string when omitted', () => {
    render(<FeedbackCard form="FridgeStatusSuccess" />);
    // With slug='', ButtonLink href is '' — the button still renders with title text
    expect(screen.getByText('GO TO FRIDGE')).toBeInTheDocument();
  });
});

describe('FeedbackCard — Error', () => {
  it('renders the error heading', () => {
    render(<FeedbackCard form="Error" onClickRetry={jest.fn()} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Error!');
  });

  it('renders the correct body text', () => {
    render(<FeedbackCard form="Error" onClickRetry={jest.fn()} />);
    expect(
      screen.getByText('Action required. Error processing request.')
    ).toBeInTheDocument();
  });

  it('renders the error image', () => {
    render(<FeedbackCard form="Error" onClickRetry={jest.fn()} />);
    expect(screen.getByAltText('Email error image')).toBeInTheDocument();
  });

  it('calls onClickRetry when "TRY AGAIN" is clicked', () => {
    const onClickRetry = jest.fn();
    render(<FeedbackCard form="Error" onClickRetry={onClickRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onClickRetry).toHaveBeenCalledTimes(1);
  });

  it('renders a button (not a link) for the retry action', () => {
    render(<FeedbackCard form="Error" onClickRetry={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /try again/i })
    ).not.toBeInTheDocument();
  });
});

describe('FeedbackCard — CreateFridge', () => {
  it('renders the success heading', () => {
    render(<FeedbackCard form="CreateFridge" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Success!');
  });

  it('renders the correct body text', () => {
    render(<FeedbackCard form="CreateFridge" />);
    expect(
      screen.getByText('You have successfully added a fridge listing!')
    ).toBeInTheDocument();
  });

  it('renders both "GO TO FRIDGE" and "EDIT FRIDGE" links', () => {
    render(<FeedbackCard form="CreateFridge" />);
    expect(
      screen.getByRole('link', { name: /go to fridge/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /edit fridge/i })
    ).toBeInTheDocument();
  });
});
