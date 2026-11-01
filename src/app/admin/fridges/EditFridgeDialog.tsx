'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  addFridgeSchema,
  uploadFridgePhoto,
} from '../add-fridge/AddFridgeForm';
import { FridgePhotoPicker } from '../add-fridge/FridgePhotoPicker';
import { designColor } from 'theme/palette';
import { useAuthStore } from 'store/useAuthStore';
import { useFridgeStore } from 'store/useFridgeStore';
import type { ApiFridge, FridgePatch } from 'types/domain';
import { apiClient } from 'utils/api-client';

const schema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(110),
  locationName: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zip: z.string(),
  geoLat: addFridgeSchema.shape.geoLat,
  geoLng: addFridgeSchema.shape.geoLng,
  maintainerName: z.string(),
  organization: z.string(),
  phone: z.string(),
  email: addFridgeSchema.shape.email,
  instagram: addFridgeSchema.shape.instagram,
  website: addFridgeSchema.shape.website,
  notes: z.string().max(700, 'Notes must be at most 700 characters'),
});
const photoUrlSchema = addFridgeSchema.shape.website.max(2048);

type FormData = z.infer<typeof schema>;
const locationFields = [
  ['locationName', 'Location Name'],
  ['street', 'Street'],
  ['city', 'City'],
  ['state', 'State'],
  ['country', 'Country'],
  ['zip', 'ZIP'],
] as const;
const maintainerFields = [
  ['maintainerName', 'Maintainer Name'],
  ['organization', 'Organization'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['instagram', 'Instagram'],
  ['website', 'Website'],
] as const;

export function EditFridgeDialog({
  fridge,
  onClose,
  onSaved,
}: {
  fridge: ApiFridge;
  onClose: () => void;
  onSaved: (fridge: ApiFridge) => void;
}): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const defaults: FormData = {
    name: fridge.name,
    locationName: fridge.location?.name ?? '',
    street: fridge.location?.street ?? '',
    city: fridge.location?.city ?? '',
    state: fridge.location?.state ?? '',
    country: fridge.location?.country ?? '',
    zip: fridge.location?.zip ?? '',
    geoLat: fridge.location?.geoLat ?? NaN,
    geoLng: fridge.location?.geoLng ?? NaN,
    maintainerName: fridge.maintainer?.name ?? '',
    organization: fridge.maintainer?.organization ?? '',
    phone: fridge.maintainer?.phone ?? '',
    email: fridge.maintainer?.email ?? '',
    instagram: fridge.maintainer?.instagram ?? '',
    website: fridge.maintainer?.website ?? '',
    notes: fridge.notes ?? '',
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function selectPhoto(file: File) {
    setErrorMessage('');
    setUploadedPhotoUrl(null);
    setPhotoFile(file);
    setPhotoRemoved(false);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    setErrorMessage('');
    setPhotoFile(null);
    setUploadedPhotoUrl(null);
    setPhotoPreviewUrl(null);
    setPhotoRemoved(Boolean(fridge.photoUrl));
  }

  async function save(values: FormData) {
    setErrorMessage('');
    const patch: FridgePatch = {};
    if (values.name !== defaults.name) patch.name = values.name;
    if (values.notes !== defaults.notes) patch.notes = values.notes || null;
    if (photoRemoved) patch.photoUrl = null;
    if (
      locationFields.some(([key]) => values[key] !== defaults[key]) ||
      values.geoLat !== defaults.geoLat ||
      values.geoLng !== defaults.geoLng
    ) {
      patch.location = {
        ...fridge.location,
        name: values.locationName,
        street: values.street,
        city: values.city,
        state: values.state,
        country: values.country,
        zip: values.zip,
        geoLat: values.geoLat,
        geoLng: values.geoLng,
      };
    }
    if (maintainerFields.some(([key]) => values[key] !== defaults[key])) {
      patch.maintainer = maintainerFields.every(([key]) => !values[key])
        ? null
        : {
            ...fridge.maintainer,
            name: values.maintainerName,
            organization: values.organization,
            phone: values.phone,
            email: values.email,
            instagram: values.instagram,
            website: values.website,
          };
    }
    if (!Object.keys(patch).length && !photoFile) {
      setErrorMessage('No changes to save.');
      return;
    }
    if (!user) {
      setErrorMessage('Please sign in again before editing a fridge.');
      return;
    }
    try {
      const idToken = await user.getIdToken();
      if (photoFile) {
        let uploadedUrl = uploadedPhotoUrl;
        if (!uploadedUrl) {
          setIsUploadingPhoto(true);
          const url = await uploadFridgePhoto(photoFile);
          const result = photoUrlSchema.safeParse(url);
          if (!result.success || !result.data) {
            throw new Error('Photo upload returned an invalid photo URL.');
          }
          uploadedUrl = result.data;
          setUploadedPhotoUrl(uploadedUrl);
          setIsUploadingPhoto(false);
        }
        patch.photoUrl = uploadedUrl;
      }
      const updated = await apiClient.patchFridge(fridge.id, patch, idToken);
      if (updated.id !== fridge.id || typeof updated.name !== 'string') {
        throw new Error(
          'The API returned an invalid updated fridge. Reload the page before retrying.'
        );
      }
      useFridgeStore.getState().invalidate();
      onSaved({ ...fridge, ...updated });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update the fridge.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      aria-labelledby="edit-fridge-title"
    >
      <DialogTitle
        id="edit-fridge-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Edit Fridge
        <IconButton
          aria-label="Close"
          size="small"
          onClick={onClose}
          disabled={isSubmitting}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(save)} noValidate>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Alert severity="info" role="note">
              Updated information may take up to an hour to appear on the public
              fridge profile.
            </Alert>
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              Fridge ID: {fridge.id}
            </Typography>
            <Box
              component="fieldset"
              disabled={isSubmitting}
              sx={{ border: 0, p: 0, m: 0 }}
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
                  previewUrl={
                    photoPreviewUrl ||
                    (photoRemoved ? null : fridge.photoUrl) ||
                    null
                  }
                  disabled={isSubmitting}
                  loading={isUploadingPhoto}
                  onSelect={selectPhoto}
                  onRemove={removePhoto}
                  onError={setErrorMessage}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Location
                </Typography>
                {locationFields.slice(0, 2).map(([key, label]) => (
                  <TextField
                    key={key}
                    label={label}
                    fullWidth
                    {...register(key)}
                    error={!!errors[key]}
                    helperText={errors[key]?.message}
                  />
                ))}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {locationFields.slice(2).map(([key, label]) => (
                    <TextField
                      key={key}
                      label={label}
                      fullWidth
                      {...register(key)}
                      error={!!errors[key]}
                      helperText={errors[key]?.message}
                    />
                  ))}
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {(['geoLat', 'geoLng'] as const).map((key) => (
                    <TextField
                      key={key}
                      label={key === 'geoLat' ? 'Latitude' : 'Longitude'}
                      type="number"
                      fullWidth
                      slotProps={{ htmlInput: { step: 'any' } }}
                      {...register(key, { valueAsNumber: true })}
                      error={!!errors[key]}
                      helperText={errors[key]?.message}
                    />
                  ))}
                </Stack>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Maintainer
                </Typography>
                {maintainerFields.slice(0, 4).map(([key, label]) => (
                  <TextField
                    key={key}
                    label={label}
                    fullWidth
                    {...register(key)}
                    error={!!errors[key]}
                    helperText={errors[key]?.message}
                  />
                ))}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {maintainerFields.slice(4).map(([key, label]) => (
                    <TextField
                      key={key}
                      label={label}
                      fullWidth
                      {...register(key)}
                      error={!!errors[key]}
                      helperText={errors[key]?.message}
                    />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Leave all maintainer fields blank to remove the maintainer.
                </Typography>
                <TextField
                  label="Fridge Notes"
                  multiline
                  minRows={4}
                  fullWidth
                  {...register('notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    pt: 1,
                    gap: 2,
                  }}
                >
                  <Button onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      isSubmitting || (!isDirty && !photoFile && !photoRemoved)
                    }
                    sx={{
                      borderRadius: '999px',
                      px: 5,
                      bgcolor: designColor.blue.dark,
                      fontWeight: 700,
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
