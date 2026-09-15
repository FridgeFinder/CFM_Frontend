'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Stack,
  StepContent,
  StepLabel,
  TextField,
} from '@mui/material';
import { fridgeSchema, FridgeFormData } from '../schemas/fridge.schema';

interface FridgeFormProps {
  handleBack: () => void;
  onSubmit: (data: FridgeFormData) => void;
  initialValues?: Partial<FridgeFormData>;
}

export function FridgeForm({
  handleBack,
  onSubmit,
  initialValues,
}: FridgeFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FridgeFormData>({
    resolver: zodResolver(fridgeSchema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      state: 'NY',
      zip: '',
      notes: '',
      ...initialValues,
    },
  });

  return (
    <>
      <StepLabel>Fridge Location Information</StepLabel>
      <StepContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack
            direction="column"
            spacing={3}
            mx={{ xs: 0, sm: 4 }}
            mt={2}
            mb={4}
          >
            <TextField
              label="Name of Fridge"
              variant="outlined"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Street"
              variant="outlined"
              {...register('street')}
              error={!!errors.street}
              helperText={errors.street?.message}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                variant="outlined"
                fullWidth
                {...register('city')}
                error={!!errors.city}
                helperText={errors.city?.message}
              />
              <TextField
                label="State"
                variant="outlined"
                sx={{ width: '100px' }}
                {...register('state')}
                error={!!errors.state}
                helperText={errors.state?.message}
              />
            </Stack>
            <TextField
              label="Zip Code"
              variant="outlined"
              {...register('zip')}
              error={!!errors.zip}
              helperText={errors.zip?.message}
            />
            <TextField
              label="Fridge Notes"
              variant="outlined"
              multiline
              rows={4}
              {...register('notes')}
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
            <Stack
              direction={{ md: 'row-reverse', xs: 'column' }}
              justifyContent="space-between"
              spacing={4}
              pt={4}
            >
              <Button
                aria-label="Click to continue to the next panel"
                variant="contained"
                type="submit"
                sx={{ width: { md: '345px', xs: '100%' } }}
              >
                Continue
              </Button>
              <Button
                aria-label="Click to return to the previous panel"
                variant="outlined"
                onClick={handleBack}
                sx={{ width: { md: '345px', xs: '100%' } }}
              >
                Back
              </Button>
            </Stack>
          </Stack>
        </form>
      </StepContent>
    </>
  );
}
