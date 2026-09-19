'use client';

import React, { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from 'store/useAuthStore';
import { designColor } from 'theme/palette';

const FRIDGES_API_URL = '/v1/fridges/';
const PHOTO_API_URL = '/v1/photo';

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

const addFridgeSchema = z.object({
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

type AddFridgeFormData = z.infer<typeof addFridgeSchema>;

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

export default function AddFridgePage(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddFridgeFormData>({
    resolver: zodResolver(addFridgeSchema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      state: '',
      country: '',
      zip: '',
      email: '',
      instagram: '',
      website: '',
      notes: '',
    },
  });

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

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      handlePhotoFile(file);
    }
  }

  function handlePhotoDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDraggingPhoto(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handlePhotoFile(file);
    }
  }

  function handleDropzoneKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      photoInputRef.current?.click();
    }
  }

  function handleRemovePhoto(): void {
    setPhotoFile(null);
    setPhotoPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return null;
    });
  }

  async function uploadPhoto(file: File): Promise<string> {
    const webpFile = await convertImageToWebp(file);
    const response = await fetch(PHOTO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/webp',
      },
      body: webpFile,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload photo (${response.status})`);
    }

    const data = (await response.json()) as { photoUrl?: string };
    if (!data.photoUrl) {
      throw new Error('Photo upload did not return a photo URL.');
    }

    return data.photoUrl;
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
      const uploadedPhotoUrl = photoFile ? await uploadPhoto(photoFile) : null;
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

      setSuccessMessage('Fridge added.');
      handleRemovePhoto();
      reset();
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
    <Box sx={{ width: '100%', px: { xs: 2, sm: 4 }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ width: '100%', maxWidth: 760 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Add Fridge
            </Typography>
          </Box>

          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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

              <Box
                role="button"
                tabIndex={0}
                aria-label="Click or drag a photo here"
                onClick={() => photoInputRef.current?.click()}
                onKeyDown={handleDropzoneKeyDown}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={handlePhotoDrop}
                sx={{
                  position: 'relative',
                  width: '100%',
                  minHeight: { xs: 180, sm: 220 },
                  borderRadius: 2,
                  border: '1.5px dashed',
                  borderColor: isDraggingPhoto
                    ? designColor.blue.dark
                    : designColor.borderGray,
                  bgcolor: isDraggingPhoto ? designColor.blue.pale : 'grey.50',
                  overflow: 'hidden',
                  cursor:
                    isUploadingPhoto || isSubmitting ? 'default' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  transition:
                    'border-color 0.2s ease, background-color 0.2s ease',
                }}
              >
                {photoPreviewUrl && (
                  <Box
                    component="img"
                    src={photoPreviewUrl}
                    alt="Selected fridge upload preview"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      bgcolor: designColor.whiteSmoke,
                    }}
                  />
                )}
                {!photoPreviewUrl && (
                  <Typography
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    Click or drag a photo here
                  </Typography>
                )}
                {photoPreviewUrl && (
                  <IconButton
                    aria-label="Remove uploaded photo"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemovePhoto();
                    }}
                    disabled={isSubmitting}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      bgcolor: designColor.red.danger,
                      color: designColor.white,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      '&:hover': { bgcolor: '#E54F4F' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                {isUploadingPhoto && (
                  <LinearProgress
                    sx={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
                  />
                )}
                <Box
                  component="input"
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isUploadingPhoto || isSubmitting}
                  sx={{ display: 'none' }}
                />
              </Box>

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
                  disabled={isSubmitting || isUploadingPhoto}
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
      </Box>
    </Box>
  );
}
