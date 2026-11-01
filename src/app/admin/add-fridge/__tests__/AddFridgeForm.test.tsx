import React from 'react';
import '@testing-library/jest-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { AddFridgeForm } from '../AddFridgeForm';

const mockFetch = jest.fn();
const originalFetch = global.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalGetContext = Object.getOwnPropertyDescriptor(
  HTMLCanvasElement.prototype,
  'getContext'
);
jest.mock('store/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: { getIdToken: () => Promise<string> };
    }) => unknown
  ) => selector({ user: { getIdToken: async () => 'admin-token' } }),
}));

const defaults = {
  name: 'Test Fridge',
  street: '123 Main Street',
  city: 'New York',
  state: 'NY',
  country: 'US',
  zip: '10001',
  geoLat: 40.7,
  geoLng: -73.9,
  email: '',
  instagram: '',
  website: '',
  notes: '',
};

describe('AddFridgeForm shared photo picker', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(global, 'Image').mockImplementation(() => {
      const image = document.createElement('img');
      Object.defineProperty(image, 'src', {
        set: () => queueMicrotask(() => image.dispatchEvent(new Event('load'))),
      });
      return image;
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: jest.fn(() => ({ drawImage: jest.fn() })),
    });
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => {
        callback(new Blob(['webp'], { type: 'image/webp' }));
      });
  });
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    if (originalGetContext) {
      Object.defineProperty(
        HTMLCanvasElement.prototype,
        'getContext',
        originalGetContext
      );
    }
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('converts the chosen image to WebP and uploads it before creating a fridge', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ photoUrl: 'https://example.com/upload.webp' }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'test-fridge' }),
    });
    const onSuccess = jest.fn();
    render(<AddFridgeForm defaultValues={defaults} onSuccess={onSuccess} />);
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose fridge photo'), {
      target: { files: [file] },
    });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview');
    fireEvent.click(screen.getByRole('button', { name: 'Add Fridge' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('test-fridge'));
    expect(mockFetch.mock.calls[0][0]).toBe('/v1/photo');
    const upload = mockFetch.mock.calls[0][1];
    expect(upload.method).toBe('POST');
    expect(upload.headers).toEqual({ 'Content-Type': 'image/webp' });
    expect(upload.body).toBeInstanceOf(File);
    expect(upload.body.name).toBe('photo.webp');
    expect(upload.body.type).toBe('image/webp');
    expect(mockFetch.mock.calls[1][0]).toBe('/v1/fridges/');
    expect(JSON.parse(mockFetch.mock.calls[1][1].body).photoUrl).toBe(
      'https://example.com/upload.webp'
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps the photo selection and does not create a fridge after upload failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    render(<AddFridgeForm defaultValues={defaults} />);
    fireEvent.drop(
      screen.getByRole('button', { name: 'Click or drag a photo here' }),
      {
        dataTransfer: {
          files: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })],
        },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Fridge' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to upload photo (500)'
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview');
  });

  it('still preloads the initial Freedge image into the shared picker', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['photo'], { type: 'image/jpeg' }),
    });
    render(
      <AddFridgeForm
        defaultValues={defaults}
        initialPhotoUrl="https://example.com/freedge.jpg"
      />
    );
    expect(screen.getByText('Loading existing photo...')).toBeInTheDocument();
    expect(await screen.findByRole('img')).toHaveAttribute(
      'src',
      'blob:preview'
    );
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/freedge.jpg');
    expect(
      screen.getByRole('button', { name: 'Click or drag a photo here' })
    ).toHaveAttribute('aria-disabled', 'false');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('allows selecting via keyboard, rejects non-images and supports removal', () => {
    render(<AddFridgeForm defaultValues={defaults} />);
    const input = screen.getByLabelText('Choose fridge photo');
    const click = jest.spyOn(input, 'click');
    const picker = screen.getByRole('button', {
      name: 'Click or drag a photo here',
    });
    fireEvent.keyDown(picker, { key: 'Enter' });
    expect(click).toHaveBeenCalledTimes(1);
    fireEvent.change(input, {
      target: {
        files: [new File(['text'], 'notes.txt', { type: 'text/plain' })],
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please choose an image file.'
    );
    fireEvent.change(input, {
      target: {
        files: [new File(['photo'], 'photo.png', { type: 'image/png' })],
      },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove uploaded photo' })
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});
