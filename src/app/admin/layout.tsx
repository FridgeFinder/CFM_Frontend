'use client';

import React, { useEffect } from 'react';
import {
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
} from '@mui/material';
import {
  AddLocationAltOutlined as AddLocationAltOutlinedIcon,
  ContactPageOutlined as ContactPageOutlinedIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { NextLink } from 'components/ui';
import { useAuthStore } from 'store/useAuthStore';
import { designColor } from 'theme/palette';

const adminDashboardOptions = [
  {
    label: 'Add Fridge',
    href: '/admin/add-fridge',
    icon: AddLocationAltOutlinedIcon,
  },
  {
    label: 'Contact Log',
    href: '/admin/contact-log',
    icon: ContactPageOutlinedIcon,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((state) => state.status);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const customClaimsStatus = useAuthStore((state) => state.customClaimsStatus);
  const selectedOption = adminDashboardOptions.find(
    (option) => pathname === option.href
  );

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/auth/signin');
      return;
    }

    if (
      authStatus === 'authenticated' &&
      customClaimsStatus !== 'loading' &&
      !isAdmin
    ) {
      router.replace('/');
    }
  }, [authStatus, customClaimsStatus, isAdmin, router]);

  if (
    authStatus === 'loading' ||
    (authStatus === 'authenticated' && customClaimsStatus === 'loading')
  ) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (authStatus !== 'authenticated' || !isAdmin) {
    return <Box sx={{ minHeight: '70vh' }} />;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: { xs: 'calc(100svh - 60px)', md: 'calc(100svh - 72px)' },
        bgcolor: designColor.white,
      }}
    >
      <Box
        component="nav"
        aria-label="Admin dashboard options"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: designColor.borderGray,
          px: 2,
          py: 3,
        }}
      >
        <List disablePadding>
          {adminDashboardOptions.map(({ label, href, icon: Icon }) => {
            const isSelected = pathname === href;

            return (
              <ListItemButton
                key={href}
                component={NextLink}
                href={href}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: isSelected ? designColor.blue.dark : 'text.primary',
                  '&.Mui-selected': {
                    bgcolor: designColor.blue.pale,
                    color: designColor.blue.dark,
                    '&:hover': { bgcolor: designColor.blue.pale },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected
                      ? designColor.blue.dark
                      : 'text.secondary',
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 700 : 600,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box
        component="nav"
        aria-label="Admin dashboard options"
        sx={{
          display: { xs: 'block', md: 'none' },
          borderBottom: '1px solid',
          borderColor: designColor.borderGray,
          bgcolor: designColor.white,
        }}
      >
        <Tabs
          value={selectedOption?.href ?? false}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Admin dashboard options"
          sx={{
            px: 1,
            '& .MuiTab-root': {
              minHeight: 52,
              textTransform: 'none',
              fontWeight: 700,
            },
          }}
        >
          {adminDashboardOptions.map(({ label, href, icon: Icon }) => (
            <Tab
              key={href}
              component={NextLink}
              href={href}
              value={href}
              icon={<Icon fontSize="small" />}
              iconPosition="start"
              label={label}
            />
          ))}
        </Tabs>
      </Box>

      <Box component="section" sx={{ flexGrow: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
