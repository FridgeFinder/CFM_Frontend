import React from 'react';
import { Box, Divider, Skeleton, Stack } from '@mui/material';

export function FridgeSkeleton() {
  return (
    <>
      <Box sx={{ maxWidth: 896, mx: 'auto', width: '100%' }}>
        <Stack
          direction="column"
          spacing={3}
          px={2}
          pt={2}
          mb={{ xs: '72px', md: 4 }}
        >
          {/* Back to map */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton
              variant="circular"
              width={20}
              height={20}
              sx={{ mr: 1 }}
            />
            <Skeleton variant="text" width={90} height={24} />
          </Box>

          {/* Name + address */}
          <Box>
            <Skeleton variant="text" width="65%" height={42} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="80%" height={24} />
          </Box>

          {/* Fridge hero image */}
          <Skeleton
            variant="rectangular"
            width="100%"
            sx={{
              maxHeight: { xs: 325, md: 350 },
              aspectRatio: '1 / 1.1',
              borderRadius: '20px',
            }}
          />

          {/* Action buttons: Follow + Directions + Share */}
          <Stack direction="row" gap={1}>
            <Skeleton
              variant="rounded"
              width="40%"
              height={42}
              sx={{ borderRadius: '999px' }}
            />
            <Skeleton
              variant="rounded"
              width="40%"
              height={42}
              sx={{ borderRadius: '999px' }}
            />
            <Skeleton
              variant="rounded"
              width="18%"
              height={42}
              sx={{ borderRadius: '999px' }}
            />
          </Stack>

          <Divider sx={{ opacity: 0.2 }} />

          {/* Report info rows (date, condition, food level) */}
          {[60, 55, 50].map((w, i) => (
            <Box
              key={i}
              sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <Skeleton
                variant="circular"
                width={24}
                height={24}
                sx={{ flexShrink: 0 }}
              />
              <Skeleton variant="text" width={`${w}%`} height={24} />
            </Box>
          ))}

          {/* Report photo */}
          <Skeleton
            variant="rectangular"
            width="100%"
            sx={{
              maxHeight: { xs: 325, md: 350 },
              aspectRatio: '1 / 1.1',
              borderRadius: '20px',
            }}
          />

          <Divider sx={{ opacity: 0.2 }} />

          {/* Details + social info lines (notes, instagram, website) */}
          {[70, 55, 45].map((w, i) => (
            <Box
              key={i}
              sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <Skeleton
                variant="circular"
                width={24}
                height={24}
                sx={{ flexShrink: 0 }}
              />
              <Skeleton variant="text" width={`${w}%`} height={24} />
            </Box>
          ))}
        </Stack>

        {/* Desktop Update Status button */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, px: 2, mb: 4 }}>
          <Skeleton
            variant="rounded"
            width="100%"
            height={42}
            sx={{ borderRadius: '999px' }}
          />
        </Box>
      </Box>

      {/* Mobile sticky Update Status button */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.12)',
          px: 2,
          py: 1.5,
          zIndex: 40,
        }}
      >
        <Skeleton
          variant="rounded"
          width="100%"
          height={42}
          sx={{ borderRadius: '999px' }}
        />
      </Box>
    </>
  );
}
