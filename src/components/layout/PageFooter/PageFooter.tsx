import React from 'react';
import Image from 'next/image';
import {
  Box,
  Container,
  Stack,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { NextLink } from 'components/ui';

export function PageFooter(): React.ReactElement {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'rgba(0,0,0,0.06)',
        py: { xs: 4, md: 6 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={4}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MuiLink component={NextLink} href="/" aria-label="Go to Home page">
              <Image
                alt="Fridge Finder logo"
                src="/brand/logo.svg"
                width={90}
                height={40}
                style={{ objectFit: 'contain' }}
              />
            </MuiLink>
          </Box>

          <Stack
            direction="row"
            spacing={{ xs: 3, sm: 4 }}
            flexWrap="wrap"
            justifyContent="center"
          >
            <MuiLink
              component={NextLink}
              href="/browse"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'primary.main' } }}
              variant="body2"
              fontWeight={600}
            >
              Map
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/pamphlet/about"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'primary.main' } }}
              variant="body2"
              fontWeight={600}
            >
              About
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/pamphlet/best-practices"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'primary.main' } }}
              variant="body2"
              fontWeight={600}
            >
              Best Practices
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/faqs"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'primary.main' } }}
              variant="body2"
              fontWeight={600}
            >
              FAQs
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/privacy"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'primary.main' } }}
              variant="body2"
              fontWeight={600}
            >
              Privacy
            </MuiLink>
            <MuiLink
              component={NextLink}
              href="/contact"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'primary.main' } }}
              variant="body2"
              fontWeight={600}
            >
              Contact
            </MuiLink>
          </Stack>
        </Stack>

        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', fontWeight: 500 }}
          >
            &copy; 2022-{new Date().getFullYear()} FridgeFinder. All rights
            reserved.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              maxWidth: { xs: '100%', md: 500 },
              textAlign: { xs: 'center', md: 'right' },
              lineHeight: 1.6,
            }}
          >
            We may use cookies to understand how people find and use the site.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
