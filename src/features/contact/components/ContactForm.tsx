'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Stack,
  TextField,
  Typography,
  Paper,
  Box,
} from '@mui/material';
import { contactSchema, ContactFormData } from '../schemas/contact.schema';

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  initialValues?: Partial<ContactFormData>;
}

export function ContactForm({
  onSubmit,
  initialValues,
}: ContactFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      ...initialValues,
    },
  });

  const router = useRouter();

  function handleCancel() {
    if (
      typeof window !== 'undefined' &&
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    ) {
      router.back();
    } else {
      router.push('/');
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        pt: { xs: 4, md: 6 },
        pb: { xs: 4, md: 10 },
        px: { xs: 2, sm: 4 },
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          maxWidth: 650,
          width: '100%',
        }}
      >
        <Stack spacing={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                color: 'text.primary',
                mb: 2,
              }}
            >
              Contact Us
            </Typography>
            <Typography variant="body1">
              Got a question or feedback? We'd love to hear from you.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack direction="column" spacing={4} mx={4} mb={4}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={{ backgroundColor: 'background.paper' }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Stack>
              <TextField
                fullWidth
                label="Subject"
                variant="outlined"
                {...register('subject')}
                error={!!errors.subject}
                helperText={errors.subject?.message}
                sx={{ backgroundColor: 'background.paper' }}
              />
              <TextField
                fullWidth
                label="Message"
                variant="outlined"
                multiline
                rows={6}
                {...register('message')}
                error={!!errors.message}
                helperText={errors.message?.message}
                sx={{ backgroundColor: 'background.paper' }}
              />
              <Stack
                direction="row"
                justifyContent="space-between"
                spacing={4}
                pt={4}
              >
                <Button
                  aria-label="Click to go back"
                  variant="outlined"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  aria-label="Click to send an email to Fridge Finder"
                  variant="contained"
                  type="submit"
                >
                  Send Message
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
