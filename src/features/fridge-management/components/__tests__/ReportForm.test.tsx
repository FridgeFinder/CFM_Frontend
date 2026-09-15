import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportForm } from '../ReportForm';

// MUI Slider is complex to interact with via JSDOM — mock it with a plain input
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Slider: ({
      onChange,
      value,
      'aria-label': ariaLabel,
    }: {
      onChange: (e: unknown, val: number) => void;
      value: number;
      'aria-label': string;
    }) => (
      <input
        type="range"
        aria-label={ariaLabel}
        min={0}
        max={3}
        value={value}
        onChange={(e) => onChange(e, Number(e.target.value))}
      />
    ),
  };
});

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

// Stub out the pin icon — we only care about the label text in these tests
jest.mock('theme/icons', () => ({
  MapLegendPinLocationIcon: () => null,
}));

const defaultProps = {
  fridgeId: 'fridge-42',
  onSubmit: jest.fn(),
  cancelTo: '/browse',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('rendering', () => {
  it('renders the page heading', () => {
    render(<ReportForm {...defaultProps} />);
    expect(
      screen.getByRole('heading', { name: /fridge status report/i })
    ).toBeInTheDocument();
  });

  it('shows fridgeName when provided', () => {
    render(<ReportForm {...defaultProps} fridgeName="The Green Fridge" />);
    expect(screen.getByText('The Green Fridge')).toBeInTheDocument();
  });

  it('falls back to fridgeId when fridgeName is omitted', () => {
    render(<ReportForm {...defaultProps} />);
    expect(screen.getByText('fridge-42')).toBeInTheDocument();
  });

  it('renders all four condition radio options', () => {
    render(<ReportForm {...defaultProps} />);
    expect(
      screen.getByRole('radio', { name: /fridge is in good condition/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /fridge needs repairs/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /fridge needs cleaning/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /fridge is not at location/i })
    ).toBeInTheDocument();
  });

  it('defaults condition to "good"', () => {
    render(<ReportForm {...defaultProps} />);
    expect(
      screen.getByRole('radio', { name: /fridge is in good condition/i })
    ).toBeChecked();
  });

  it('renders the food-level slider', () => {
    render(<ReportForm {...defaultProps} />);
    expect(
      screen.getByRole('slider', { name: /amount of food/i })
    ).toBeInTheDocument();
  });

  it('renders the notes textarea', () => {
    render(<ReportForm {...defaultProps} />);
    expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument();
  });

  it('renders the Cancel link pointing to cancelTo', () => {
    render(<ReportForm {...defaultProps} cancelTo="/fridge/abc" />);
    expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute(
      'href',
      '/fridge/abc'
    );
  });

  it('renders the Confirm submit button', () => {
    render(<ReportForm {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /submit status update/i })
    ).toBeInTheDocument();
  });
});

describe('initialValues', () => {
  it('pre-selects the provided condition', () => {
    render(
      <ReportForm {...defaultProps} initialValues={{ condition: 'dirty' }} />
    );
    expect(
      screen.getByRole('radio', { name: /fridge needs cleaning/i })
    ).toBeChecked();
  });

  it('pre-fills notes', async () => {
    render(
      <ReportForm
        {...defaultProps}
        initialValues={{ notes: 'Needs more food' }}
      />
    );
    expect(screen.getByRole('textbox', { name: /notes/i })).toHaveValue(
      'Needs more food'
    );
  });
});

describe('form submission', () => {
  it('calls onSubmit with the correct values on confirm', async () => {
    const onSubmit = jest.fn();
    render(<ReportForm {...defaultProps} onSubmit={onSubmit} />);

    // Change condition
    fireEvent.click(
      screen.getByRole('radio', { name: /fridge needs cleaning/i })
    );

    // Change food level
    fireEvent.change(screen.getByRole('slider', { name: /amount of food/i }), {
      target: { value: '2' },
    });

    // Add notes
    fireEvent.change(screen.getByRole('textbox', { name: /notes/i }), {
      target: { value: 'Stocked today' },
    });

    // Submit
    fireEvent.click(
      screen.getByRole('button', { name: /submit status update/i })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        condition: 'dirty',
        foodPercentage: 2,
        notes: 'Stocked today',
      });
    });
  });

  it('submits with default values without any interaction', async () => {
    const onSubmit = jest.fn();
    render(<ReportForm {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole('button', { name: /submit status update/i })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        condition: 'good',
        foodPercentage: 0,
      });
    });
  });
});
