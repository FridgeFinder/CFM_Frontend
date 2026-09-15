'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  MailOutline as MailIcon,
} from '@mui/icons-material';
import { designColor } from 'theme/palette';
import { BrandButton } from 'components/ui';
import { useLinkEmail } from '../hooks/useLinkEmail';

interface LinkEmailModalProps {
  open: boolean;
  onClose: () => void;
  /** Current page path so the callback can redirect back after linking. */
  returnPath?: string;
}

export function LinkEmailModal({
  open,
  onClose,
  returnPath,
}: LinkEmailModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [emailInput, setEmailInput] = useState('');
  const { sendLinkEmail, status, error, reset } = useLinkEmail();

  const handleClose = () => {
    reset();
    setEmailInput('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendLinkEmail(emailInput, returnPath);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, p: 1 } }}
    >
      <DialogContent sx={{ px: 3, pt: 3, pb: 4 }}>
        {/* Close button */}
        <Box display="flex" justifyContent="flex-end" mt={1.5} mb={0.5}>
          <IconButton
            onClick={handleClose}
            aria-label="Close"
            sx={{
              color: designColor.mutedText,
              bgcolor: 'rgba(0,0,0,0.08)',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.15)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {status !== 'success' ? (
          <>
            {/* Icon + heading */}
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mb={3}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#EEF3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <MailIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} textAlign="center">
                Add your email
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                mt={1}
              >
                Enter your email to receive email notifications. We'll send a
                verification link to confirm it.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="Email address"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                autoFocus
                fullWidth
                disabled={status === 'loading'}
              />
              <BrandButton
                type="submit"
                fullWidth
                disabled={status === 'loading'}
                startIcon={
                  status === 'loading' ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
                sx={{ py: 1.5, fontSize: '0.95rem' }}
              >
                Send verification link
              </BrandButton>
            </Box>
          </>
        ) : (
          /* "Check inbox" state */
          <Box display="flex" flexDirection="column" alignItems="center" py={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <MailIcon sx={{ color: '#2E7D32', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} textAlign="center" mb={1}>
              Check your inbox
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              We sent a verification link to{' '}
              <Box component="span" fontWeight={600}>
                {emailInput}
              </Box>
              . Click the link to finish adding your email.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: designColor.lightSilver,
                color: designColor.neroGray,
              }}
            >
              Done
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
