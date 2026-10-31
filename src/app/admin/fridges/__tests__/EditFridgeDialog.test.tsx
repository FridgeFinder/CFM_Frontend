import React from 'react';
import '@testing-library/jest-dom';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { EditFridgeDialog } from '../EditFridgeDialog';
import type { ApiFridge } from 'types/domain';

const mockToken = jest.fn();
const mockFetch = jest.fn();
const mockInvalidate = jest.fn();
const mockUploadPhoto = jest.fn();
const originalFetch = global.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
jest.mock('../../add-fridge/AddFridgeForm', () => ({
  ...jest.requireActual('../../add-fridge/AddFridgeForm'),
  uploadFridgePhoto: (...args: unknown[]) => mockUploadPhoto(...args),
}));
let signedIn = true;
jest.mock('store/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: { getIdToken: typeof mockToken } | null;
    }) => unknown
  ) => selector({ user: signedIn ? { getIdToken: mockToken } : null }),
}));
jest.mock('store/useFridgeStore', () => ({
  useFridgeStore: { getState: () => ({ invalidate: mockInvalidate }) },
}));

const fridge: ApiFridge = {
  id: 'fridge & family',
  name: 'Original Fridge',
  verified: true,
  location: {
    name: 'Cafe',
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'US',
    geoLat: 40.7,
    geoLng: -73.9,
  },
  maintainer: {
    name: 'Jane',
    organization: 'Neighbors',
    phone: '123',
    email: 'jane@example.com',
    instagram: 'https://instagram.com/fridge',
    website: 'https://example.com',
  },
  notes: 'Fridge notes',
  photoUrl: 'https://example.com/photo.jpg',
  latestFridgeReport: {
    fridgeId: 'fridge & family',
    timestamp: '2026-10-30T12:00:00Z',
    condition: 'good',
    foodPercentage: 2,
    notes: 'Report notes',
  },
};

describe('EditFridgeDialog', () => {
  const onClose = jest.fn();
  const onSaved = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    signedIn = true;
    global.fetch = mockFetch;
    URL.createObjectURL = jest.fn(() => 'blob:photo-preview');
    URL.revokeObjectURL = jest.fn();
    mockUploadPhoto
      .mockReset()
      .mockResolvedValue('https://example.com/uploaded.webp');
    mockToken.mockResolvedValue('admin-token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...fridge, name: 'Renamed Fridge' }),
    });
  });
  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
  const open = () =>
    render(
      <EditFridgeDialog fridge={fridge} onClose={onClose} onSaved={onSaved} />
    );
  const change = (label: string, value: string) =>
    fireEvent.change(screen.getByRole('textbox', { name: label }), {
      target: { value },
    });
  const submit = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  const payload = () => JSON.parse(mockFetch.mock.calls[0][1].body);

  it('prefills fridge details, disables unchanged saving, and cancels without a request', () => {
    open();
    expect(screen.getByRole('note')).toHaveTextContent(
      'Updated information may take up to an hour to appear on the public fridge profile.'
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      fridge.name
    );
    expect(screen.getByRole('textbox', { name: 'Fridge Notes' })).toHaveValue(
      'Fridge notes'
    );
    expect(screen.getByRole('textbox', { name: 'Country' })).toHaveValue('US');
    expect(
      screen.getByRole('textbox', { name: 'Maintainer Name' })
    ).toHaveValue('Jane');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    expect(
      screen.queryByRole('textbox', { name: 'Photo URL' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Selected fridge upload preview' })
    ).toHaveAttribute('src', fridge.photoUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('uploads a selected image before PATCH and displays a local preview', async () => {
    open();
    const file = new File(['image'], 'fridge.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose fridge photo'), {
      target: { files: [file] },
    });
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'blob:photo-preview'
    );
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockUploadPhoto).toHaveBeenCalledWith(file);
    expect(payload()).toEqual({
      photoUrl: 'https://example.com/uploaded.webp',
    });
  });

  it('clears the existing photo with an explicit null PATCH when X is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...fridge, photoUrl: null }),
    });
    open();
    expect(screen.getByRole('img')).toHaveAttribute('src', fridge.photoUrl);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove uploaded photo' })
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({ photoUrl: null });
    expect(onSaved.mock.calls[0][0].photoUrl).toBeNull();
    expect(mockUploadPhoto).not.toHaveBeenCalled();
  });

  it('supports dropping a photo and clearing the existing photo', async () => {
    const view = open();
    fireEvent.drop(
      screen.getByRole('button', { name: 'Click or drag a photo here' }),
      {
        dataTransfer: {
          files: [new File(['image'], 'photo.jpg', { type: 'image/jpeg' })],
        },
      }
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'blob:photo-preview'
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove uploaded photo' })
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({ photoUrl: null });
    expect(mockUploadPhoto).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview');
    view.unmount();
  });

  it('rejects non-image files without replacing the existing preview', () => {
    open();
    fireEvent.change(screen.getByLabelText('Choose fridge photo'), {
      target: {
        files: [new File(['text'], 'notes.txt', { type: 'text/plain' })],
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please choose an image file.'
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', fridge.photoUrl);
    expect(mockUploadPhoto).not.toHaveBeenCalled();
  });

  it('retains the selected image after upload failures and skips PATCH', async () => {
    mockUploadPhoto.mockRejectedValueOnce(
      new Error('Failed to upload photo (500)')
    );
    open();
    fireEvent.change(screen.getByLabelText('Choose fridge photo'), {
      target: {
        files: [new File(['image'], 'fridge.png', { type: 'image/png' })],
      },
    });
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to upload photo (500)'
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'blob:photo-preview'
    );
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
  });

  it('reuses an uploaded photo when retrying a failed PATCH', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });
    open();
    fireEvent.change(screen.getByLabelText('Choose fridge photo'), {
      target: {
        files: [new File(['image'], 'fridge.png', { type: 'image/png' })],
      },
    });
    submit();
    await screen.findByRole('alert');
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('reports broken image URLs without preventing an unrelated edit', async () => {
    open();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not display the fridge photo'
    );
    change('Name', 'Renamed Fridge');
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({ name: 'Renamed Fridge' });
  });

  it('PATCHes only changed fields with authorization and preserves the original ID', async () => {
    open();
    change('Name', 'Renamed Fridge');
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockFetch).toHaveBeenCalledWith(
      '/v1/fridges/fridge%20%26%20family',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    );
    expect(payload()).toEqual({ name: 'Renamed Fridge' });
    expect(onSaved.mock.calls[0][0].id).toBe(fridge.id);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    expect(mockUploadPhoto).not.toHaveBeenCalled();
  });

  it('replaces a complete location and maintainer without dropping untouched nested fields', async () => {
    open();
    change('Street', '456 New Street');
    change('Email', 'new@example.com');
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({
      location: { ...fridge.location, street: '456 New Street' },
      maintainer: { ...fridge.maintainer, email: 'new@example.com' },
    });
  });

  it('clears nullable fields using null and never sends status report fields', async () => {
    open();
    [
      'Fridge Notes',
      'Maintainer Name',
      'Organization',
      'Phone',
      'Email',
      'Instagram',
      'Website',
    ].forEach((label) => change(label, ''));
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove uploaded photo' })
    );
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({
      notes: null,
      photoUrl: null,
      maintainer: null,
    });
  });

  it.each([
    ['Name', 'ab'],
    ['Name', ' '.repeat(3)],
    ['Name', 'a'.repeat(111)],
    ['Fridge Notes', 'a'.repeat(701)],
  ])('validates %s without issuing a request', async (label, value) => {
    open();
    change(label, value);
    submit();
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: label })).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([3, 110])(
    'accepts a name of exactly %s characters',
    async (length) => {
      open();
      change('Name', 'a'.repeat(length));
      submit();
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(payload()).toEqual({ name: 'a'.repeat(length) });
    }
  );

  it.each(['not-a-url', `https://example.com/${'a'.repeat(2030)}`])(
    'rejects an invalid uploaded photo URL without PATCHing',
    async (url) => {
      mockUploadPhoto.mockResolvedValueOnce(url);
      open();
      fireEvent.change(screen.getByLabelText('Choose fridge photo'), {
        target: {
          files: [new File(['image'], 'photo.png', { type: 'image/png' })],
        },
      });
      submit();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Photo upload returned an invalid photo URL.'
      );
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it('accepts exactly 700 note characters', async () => {
    open();
    change('Fridge Notes', 'a'.repeat(700));
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({ notes: 'a'.repeat(700) });
  });

  it.each([
    ['Latitude', '91'],
    ['Longitude', '-181'],
  ])('rejects out-of-range %s', async (label, value) => {
    open();
    fireEvent.change(screen.getByRole('spinbutton', { name: label }), {
      target: { value },
    });
    submit();
    await waitFor(() =>
      expect(screen.getByRole('spinbutton', { name: label })).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('can edit a fridge with previously cleared fields', async () => {
    render(
      <EditFridgeDialog
        fridge={{ ...fridge, maintainer: null, notes: null, photoUrl: null }}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Fridge Notes' })).toHaveValue(
      ''
    );
    change('Name', 'Renamed Fridge');
    submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(payload()).toEqual({ name: 'Renamed Fridge' });
  });

  it('surfaces token errors without issuing an unauthenticated request', async () => {
    mockToken.mockRejectedValueOnce(new Error('Session expired'));
    open();
    change('Name', 'Renamed Fridge');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Session expired'
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each([400, 404, 500])(
    'keeps edits and surfaces API error %s',
    async (status) => {
      mockFetch.mockResolvedValue({
        ok: false,
        status,
        statusText: `Error ${status}`,
      });
      open();
      change('Name', 'Renamed Fridge');
      submit();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        `Error ${status}`
      );
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Renamed Fridge'
      );
      expect(onSaved).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    }
  );

  it('requires a signed-in admin session', async () => {
    signedIn = false;
    open();
    change('Name', 'Renamed Fridge');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please sign in again'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('prevents closing or duplicate submissions while saving', async () => {
    let resolve!: (value: unknown) => void;
    mockFetch.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    open();
    change('Name', 'Renamed Fridge');
    submit();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await act(async () =>
      resolve({ ok: true, json: async () => ({ ...fridge }) })
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
