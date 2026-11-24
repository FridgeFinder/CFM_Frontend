'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocationOnOutlined } from '@mui/icons-material';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from 'store/useAuthStore';
import { designColor } from 'theme/palette';
import { FridgePhotoPicker } from './FridgePhotoPicker';

const FRIDGES_API_URL = '/v1/fridges/';
const PHOTO_API_URL = '/v1/photo';

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => <Typography>Loading map...</Typography>,
});

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || z.url().safeParse(value).success, {
    message: 'Enter a valid URL',
  });
const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    message: 'Enter a valid email address',
  });

export const addFridgeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  street: z.string().trim().min(5, 'Street must be at least 5 characters'),
  city: z.string().trim().min(2, 'City must be at least 2 characters'),
  state: z.string().trim().length(2, 'State must be a 2-letter code'),
  country: z.string().trim().min(2, 'Country must be at least 2 characters'),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code format'),
  geoLat: z.number().min(-90, 'Latitude must be at least -90').max(90),
  geoLng: z.number().min(-180, 'Longitude must be at least -180').max(180),
  email: optionalEmailSchema,
  instagram: optionalUrlSchema,
  website: optionalUrlSchema,
  notes: z.string().trim(),
});

export type AddFridgeFormData = z.infer<typeof addFridgeSchema>;

const baseDefaultValues: AddFridgeFormData = {
  name: '',
  street: '',
  city: '',
  state: '',
  country: '',
  zip: '',
  geoLat: 0,
  geoLng: 0,
  email: '',
  instagram: '',
  website: '',
  notes: '',
};

function buildAddFridgePayload(
  values: AddFridgeFormData,
  photoUrl: string | null
) {
  return {
    name: values.name,
    ...(photoUrl ? { photoUrl } : {}),
    location: {
      street: values.street,
      city: values.city,
      state: values.state.toUpperCase(),
      country: values.country,
      zip: values.zip,
      geoLat: values.geoLat,
      geoLng: values.geoLng,
    },
    maintainer: {
      email: values.email,
      instagram: values.instagram,
      website: values.website,
    },
    notes: values.notes,
  };
}

function convertImageToWebp(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not prepare the image for upload.'));
        return;
      }

      context.drawImage(image, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            reject(new Error('Could not convert the image to WebP.'));
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp',
            })
          );
        },
        'image/webp',
        0.9
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load the selected image.'));
    };

    image.src = objectUrl;
  });
}

export async function uploadFridgePhoto(file: File): Promise<string> {
  const webpFile = await convertImageToWebp(file);
  const response = await fetch(PHOTO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp' },
    body: webpFile,
  });
  if (!response.ok) {
    throw new Error(`Failed to upload photo (${response.status})`);
  }
  const data: { photoUrl?: unknown } = await response.json();
  if (typeof data.photoUrl !== 'string' || !data.photoUrl) {
    throw new Error('Photo upload did not return a photo URL.');
  }
  return data.photoUrl;
}

interface AddFridgeFormProps {
  defaultValues?: Partial<AddFridgeFormData>;
  initialPhotoUrl?: string;
  onSuccess?: (createdFridgeId: string) => void;
}

export function AddFridgeForm({
  defaultValues,
  initialPhotoUrl,
  onSuccess,
}: AddFridgeFormProps): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [lookupVersion, setLookupVersion] = useState(0);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const lookupAbortRef = useRef<AbortController | null>(null);
  const [loadedInitialPhotoUrl, setLoadedInitialPhotoUrl] = useState<
    string | null
  >(null);
  const isLoadingInitialPhoto = Boolean(
    initialPhotoUrl && loadedInitialPhotoUrl !== initialPhotoUrl
  );
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddFridgeFormData>({
    resolver: zodResolver(addFridgeSchema),
    defaultValues: { ...baseDefaultValues, ...defaultValues },
  });

  const [geoLat, geoLng] = useWatch({
    control,
    name: ['geoLat', 'geoLng'],
  });
  const mapPosition = useMemo<[number, number] | null>(() => {
    if (
      !Number.isFinite(geoLat) ||
      !Number.isFinite(geoLng) ||
      geoLat < -90 ||
      geoLat > 90 ||
      geoLng < -180 ||
      geoLng > 180 ||
      (!hasSelectedLocation && geoLat === 0 && geoLng === 0)
    ) {
      return null;
    }
    return [geoLat, geoLng];
  }, [geoLat, geoLng, hasSelectedLocation]);

  useEffect(() => () => lookupAbortRef.current?.abort(), []);

  function selectLocation([lat, lng]: [number, number]): void {
    setValue('geoLat', lat, { shouldDirty: true, shouldValidate: true });
    setValue('geoLng', lng, { shouldDirty: true, shouldValidate: true });
    setHasSelectedLocation(true);
  }

  async function lookupAddress(): Promise<void> {
    const fields = ['street', 'city', 'state', 'zip', 'country'] as const;
    const address = fields.map((field) => getValues(field).trim());
    if (!address[0] || (!address[1] && !address[3])) {
      setLocationError(
        'Enter a street and a city or ZIP before looking up the address.'
      );
      return;
    }

    const initialCoordinates = [getValues('geoLat'), getValues('geoLng')];
    const controller = new AbortController();
    lookupAbortRef.current = controller;
    setLocationError('');
    setIsLookingUp(true);
    try {
      const params = new URLSearchParams({
        q: address.filter(Boolean).join(', '),
        format: 'jsonv2',
        limit: '1',
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { signal: controller.signal }
      );
      if (!response.ok) {
        throw new Error(`Address lookup failed (${response.status}).`);
      }
      const results: unknown = await response.json();
      if (controller.signal.aborted) {
        return;
      }
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('No location found. Check the address and try again.');
      }
      const result = results[0] as { lat?: unknown; lon?: unknown };
      const lat =
        typeof result?.lat === 'string' && result.lat.trim()
          ? Number(result.lat)
          : NaN;
      const lng =
        typeof result?.lon === 'string' && result.lon.trim()
          ? Number(result.lon)
          : NaN;
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        throw new Error('Address lookup returned invalid coordinates.');
      }
      if (
        fields.some(
          (field, index) => getValues(field).trim() !== address[index]
        ) ||
        !Object.is(getValues('geoLat'), initialCoordinates[0]) ||
        !Object.is(getValues('geoLng'), initialCoordinates[1])
      ) {
        throw new Error(
          'Address or coordinates changed during lookup. Please search again.'
        );
      }
      selectLocation([lat, lng]);
      setLookupVersion((version) => version + 1);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLocationError(
          error instanceof Error
            ? error.message
            : 'Address lookup failed. Please try again.'
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        lookupAbortRef.current = null;
        setIsLookingUp(false);
      }
    }
  }

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  function handlePhotoFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose an image file.');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');
    setPhotoFile(file);
    setPhotoPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return URL.createObjectURL(file);
    });
  }

  useEffect(() => {
    if (!initialPhotoUrl) {
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        const response = await fetch(initialPhotoUrl);
        if (!response.ok) {
          throw new Error(`Failed to download photo (${response.status})`);
        }

        const blob = await response.blob();
        if (isCancelled) {
          return;
        }

        if (!blob.type.startsWith('image/')) {
          throw new Error('Downloaded file is not an image.');
        }

        const extensionMatch = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(
          initialPhotoUrl
        );
        const fileName = `existing-photo.${extensionMatch?.[1] ?? 'jpg'}`;
        handlePhotoFile(new File([blob], fileName, { type: blob.type }));
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load existing photo:', error);
          setErrorMessage(
            'Could not load the existing photo automatically. You can upload one manually.'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadedInitialPhotoUrl(initialPhotoUrl);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [initialPhotoUrl]);

  function handleRemovePhoto(): void {
    setPhotoFile(null);
    setPhotoPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return null;
    });
  }

  async function onSubmit(values: AddFridgeFormData): Promise<void> {
    setSuccessMessage('');
    setErrorMessage('');

    if (!user) {
      setErrorMessage('Please sign in again before adding a fridge.');
      return;
    }

    try {
      setIsUploadingPhoto(Boolean(photoFile));
      const uploadedPhotoUrl = photoFile
        ? await uploadFridgePhoto(photoFile)
        : null;
      const idToken = await user.getIdToken();
      const response = await fetch(FRIDGES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(buildAddFridgePayload(values, uploadedPhotoUrl)),
      });

      if (!response.ok) {
        throw new Error(`Failed to add fridge (${response.status})`);
      }

      const data = (await response.json()) as { id?: string };

      setSuccessMessage('Fridge added.');
      handleRemovePhoto();
      lookupAbortRef.current?.abort();
      lookupAbortRef.current = null;
      setIsLookingUp(false);
      setLocationError('');
      setHasSelectedLocation(false);
      reset();
      if (data.id) {
        onSuccess?.(data.id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not add the fridge. Please try again.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <Stack spacing={3}>
      {successMessage && <Alert severity="success">{successMessage}</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Box
        component="form"
        onSubmit={(event) => {
          if (isLookingUp) {
            event.preventDefault();
            return;
          }
          void handleSubmit(onSubmit)(event);
        }}
        noValidate
      >
        <Stack spacing={3}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Fridge Info
          </Typography>
          <TextField
            label="Name"
            fullWidth
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <FridgePhotoPicker
            previewUrl={photoPreviewUrl}
            disabled={isSubmitting || isUploadingPhoto}
            loading={isUploadingPhoto || isLoadingInitialPhoto}
            onSelect={handlePhotoFile}
            onRemove={handleRemovePhoto}
            onError={setErrorMessage}
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
            Location
          </Typography>
          <TextField
            label="Street"
            placeholder="245 Lark Street"
            fullWidth
            {...register('street')}
            error={!!errors.street}
            helperText={errors.street?.message}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="City"
              placeholder="Albany"
              fullWidth
              {...register('city')}
              error={!!errors.city}
              helperText={errors.city?.message}
            />
            <TextField
              label="State"
              placeholder="NY"
              fullWidth
              {...register('state')}
              error={!!errors.state}
              helperText={errors.state?.message}
              sx={{ maxWidth: { sm: 120 } }}
            />
            <TextField
              label="Country"
              placeholder="US"
              fullWidth
              {...register('country')}
              error={!!errors.country}
              helperText={errors.country?.message}
              sx={{ maxWidth: { sm: 160 } }}
            />
            <TextField
              label="ZIP"
              placeholder="12210"
              fullWidth
              {...register('zip')}
              error={!!errors.zip}
              helperText={errors.zip?.message}
              sx={{ maxWidth: { sm: 160 } }}
            />
          </Stack>

          <Box>
            <Button
              type="button"
              variant="contained"
              startIcon={<LocationOnOutlined />}
              onClick={lookupAddress}
              disabled={isLookingUp || isSubmitting}
              sx={{
                borderRadius: '999px',
                px: 5,
                bgcolor: designColor.blue.dark,
                fontWeight: 700,
              }}
            >
              {isLookingUp
                ? 'Looking up address...'
                : 'Get coordinates from address'}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Click the map to adjust the pin, or enter coordinates below.
            </Typography>
            {locationError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {locationError}
              </Alert>
            )}
          </Box>
          <LocationMap
            position={mapPosition}
            lookupVersion={lookupVersion}
            onSelect={selectLocation}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Latitude"
              placeholder="40.7000279"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register('geoLat', { valueAsNumber: true })}
              error={!!errors.geoLat}
              helperText={errors.geoLat?.message}
            />
            <TextField
              label="Longitude"
              placeholder="-73.9027766"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register('geoLng', { valueAsNumber: true })}
              error={!!errors.geoLng}
              helperText={errors.geoLng?.message}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
            Maintainer
          </Typography>
          <TextField
            label="Email"
            placeholder="hello@example.com"
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Instagram"
              placeholder="https://www.instagram.com/freefoodfridgealbany"
              fullWidth
              {...register('instagram')}
              error={!!errors.instagram}
              helperText={errors.instagram?.message}
            />
            <TextField
              label="Website"
              placeholder="https://freefoodfridgealbany.com"
              fullWidth
              {...register('website')}
              error={!!errors.website}
              helperText={errors.website?.message}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
            Notes
          </Typography>
          <TextField
            label="Notes"
            multiline
            minRows={4}
            fullWidth
            {...register('notes')}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || isUploadingPhoto || isLookingUp}
              sx={{
                borderRadius: '999px',
                px: 5,
                bgcolor: designColor.blue.dark,
                fontWeight: 700,
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Fridge'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
