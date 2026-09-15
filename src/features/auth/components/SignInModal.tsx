'use client';

import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { designColor } from 'theme/palette';
import { SignInForm } from './SignInForm';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  /** Path to return to after a successful in-page sign-in (Google / phone).
   *  Also stored in localStorage so magic-link and email callbacks can redirect back. */
  returnPath?: string;
}

export function SignInModal({ open, onClose, returnPath }: SignInModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // Full-screen on mobile, centered sheet on desktop
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            pt: 1,
            pb: 2,
            // Full height + full width on mobile
            m: { xs: 0, sm: 4 },
            width: { xs: '100%', sm: 560 },
            maxWidth: { xs: '100%', sm: 560 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
            '& .MuiDialogContent-root': { px: { xs: 3, sm: 5 }, pt: 0 },
          },
        },
      }}
    >
      <DialogContent>
        {/* Close button */}
        <Box display="flex" justifyContent="flex-end" mt={4} mb={0.5}>
          <IconButton
            onClick={onClose}
            aria-label="Close sign-in"
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

        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
          <SignInForm onSuccess={onClose} returnPath={returnPath} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
