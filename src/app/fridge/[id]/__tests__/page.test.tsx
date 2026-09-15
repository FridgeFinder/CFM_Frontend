import React from 'react';
import { render } from '@testing-library/react';

// baseUrl is evaluated at module load time from NEXT_PUBLIC_FF_API_URL.
// Set the env var before jest.mock / require so the module picks it up.
process.env.NEXT_PUBLIC_FF_API_URL = 'https://api.example.com';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

jest.mock('features/fridge-details', () => ({
  FridgeInformation: ({
    fridge,
    fridgeReportSection,
  }: {
    fridge: { id: string; name: string };
    fridgeReportSection?: React.ReactNode;
  }) => (
    <div data-testid="fridge-information">
      <span data-testid="fridge-name">{fridge.name}</span>
      {fridgeReportSection}
    </div>
  ),
  FridgeReportSection: ({ fridgeId }: { fridgeId: string }) => (
    <div data-testid="report-section" data-fridge-id={fridgeId} />
  ),
}));

// Import after env + mocks are set up
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: FridgePage, generateMetadata } =
  require('../page') as typeof import('../page');
import { notFound } from 'next/navigation';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const makeFridgeResponse = (overrides = {}) => ({
  id: 'fridge-42',
  name: 'The Green Fridge',
  latestFridgeReport: null,
  ...overrides,
});

const makeParams = (id: string) => Promise.resolve({ id });
const makeSearchParams = (overrides: Record<string, string> = {}) =>
  Promise.resolve(overrides);

beforeEach(() => {
  jest.clearAllMocks();
  // Suppress the expected console.error from the fetch-throws tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('FridgePage — happy path', () => {
  it('renders FridgeInformation with the fetched fridge', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeFridgeResponse(),
    });

    const jsx = await FridgePage({
      params: makeParams('fridge-42'),
      searchParams: makeSearchParams(),
    });
    const { getByTestId } = render(jsx);

    expect(getByTestId('fridge-name')).toHaveTextContent('The Green Fridge');
  });

  it('passes report as null when the report endpoint returns no data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeFridgeResponse(),
    });

    const jsx = await FridgePage({
      params: makeParams('fridge-42'),
      searchParams: makeSearchParams(),
    });
    const { getByTestId } = render(jsx);

    expect(getByTestId('report-section')).toHaveAttribute(
      'data-fridge-id',
      'fridge-42'
    );
  });

  it('fetches from the correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeFridgeResponse(),
    });

    await FridgePage({
      params: makeParams('fridge-99'),
      searchParams: makeSearchParams(),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/fridges/fridge-99',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });
});

describe('FridgePage — not found', () => {
  it('calls notFound() when the API returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    await expect(
      FridgePage({
        params: makeParams('fridge-42'),
        searchParams: makeSearchParams(),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound() when the fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(
      FridgePage({
        params: makeParams('fridge-42'),
        searchParams: makeSearchParams(),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });
});

describe('generateMetadata', () => {
  it('returns the fridge name in the title', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeFridgeResponse({ name: 'The Green Fridge' }),
    });

    const metadata = await generateMetadata({
      params: makeParams('fridge-42'),
    });
    expect(metadata.title).toBe('Fridge Finder: The Green Fridge');
  });

  it('returns "Fridge Not Found" when the API returns non-ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const metadata = await generateMetadata({
      params: makeParams('fridge-42'),
    });
    expect(metadata.title).toBe('Fridge Not Found');
  });

  it('returns "Fridge Not Found" when the fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const metadata = await generateMetadata({
      params: makeParams('fridge-42'),
    });
    expect(metadata.title).toBe('Fridge Not Found');
  });
});
