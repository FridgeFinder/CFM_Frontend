'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightMode';
import ComputerIcon from '@mui/icons-material/Computer';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from 'config/firebase';
import { SuccessToast } from 'components/ui';
import {
  clearUserProfileCache,
  updateCachedUserProfile,
  useAuthStore,
} from 'store/useAuthStore';
import { useFollowingStore } from 'store/useFollowingStore';
import { designColor } from 'theme/palette';

type ThemeMode = 'light' | 'dark' | 'system';
type NotificationSettingKey = 'emailNotificationEnabled';
type NotificationSettingsOverride = Partial<
  Record<NotificationSettingKey, boolean>
>;
type PendingNotificationSettings = Partial<
  Record<NotificationSettingKey, boolean>
>;

type SettingsItem = {
  key: 'account' | 'notifications' | 'appearance' | 'privacy' | 'help';
  label: string;
  description: string;
  icon: React.ElementType;
};

const SETTINGS_SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: 'Account',
    items: [
      {
        key: 'account',
        icon: PersonOutlineIcon,
        label: 'Account',
        description: 'Email, phone, delete account',
      },
      {
        key: 'notifications',
        icon: NotificationsNoneIcon,
        label: 'Notifications',
        description: 'Email preferences',
      },
      // TODO: Re-enable appearance settings when implemented
      // {
      //   key: 'appearance',
      //   icon: DarkModeOutlinedIcon,
      //   label: 'Appearance',
      //   description: 'Theme & display',
      // },
    ],
  },
  {
    title: 'Support',
    items: [
      // TODO: Re-enable privacy settings when implemented
      // {
      //   key: 'privacy',
      //   icon: ShieldOutlinedIcon,
      //   label: 'Privacy',
      //   description: 'Data & visibility settings',
      // },
      {
        key: 'help',
        icon: HelpOutlineIcon,
        label: 'Help & Feedback',
        description: 'FAQs and contact us',
      },
    ],
  },
];

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { mode: 'light', label: 'Light', icon: LightModeIcon },
  { mode: 'dark', label: 'Dark', icon: DarkModeOutlinedIcon },
  { mode: 'system', label: 'System', icon: ComputerIcon },
];

const settingsPageColors = {
  pageBg: designColor.white,
  cardBg: designColor.white,
  cardBorder: designColor.borderGray,
  cardBorderHover: designColor.lightSilver,
  cardShadow: '0 1px 2px rgba(0,0,0,0.04)',
  sectionTitle: designColor.mutedText,
  itemLabel: designColor.neroGray,
  itemDescription: designColor.secondaryText,
  iconChipBg: designColor.whiteSmoke,
  iconChipColor: designColor.secondaryText,
  iconChipActiveBg: designColor.blue.pale,
  iconChipActiveColor: designColor.blue.dark,
  chevronColor: designColor.magneticGray,
  rowHover: designColor.whiteSmoke,
  panelBg: designColor.whiteSmoke,
  signOutBg: designColor.white,
  signOutHover: designColor.whiteSmoke,
  backLinkColor: designColor.blue.interactive,
  dangerText: designColor.red.danger,
  dangerChipBg: '#fff3f3',
  dangerButtonBg: '#fff0f0',
  dangerButtonBorder: '#f4cccc',
  dangerButtonHoverBg: '#ffe7e7',
  dangerButtonHoverBorder: '#f0bcbc',
  themeOptionActiveBg: designColor.blue.pale,
  themeOptionInactiveBorder: designColor.borderGray,
};

export default function SettingsPage(): React.ReactElement {
  const router = useRouter();
  const USERS_API_URL = process.env.NEXT_PUBLIC_USERS_API_URL;
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const userProfile = useAuthStore((state) => state.userProfile);
  const resetFollowing = useFollowingStore((state) => state.reset);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('system');
  const [notificationOverrides, setNotificationOverrides] =
    useState<NotificationSettingsOverride>({});
  const [pendingSettings, setPendingSettings] =
    useState<PendingNotificationSettings>({});
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated' && !user) {
      router.replace('/auth/signin');
    }
  }, [authStatus, router, user]);

  useEffect(() => {
    const fetchUserProfile = useAuthStore.getState().fetchUserProfile;
    if (authStatus === 'authenticated' && user) {
      void fetchUserProfile(user);
    }
  }, [authStatus, user]);

  if (authStatus !== 'authenticated' || !user) {
    return (
      <Box
        sx={{ minHeight: '100vh', backgroundColor: settingsPageColors.pageBg }}
      />
    );
  }

  const accountEmail = userProfile?.email ?? user?.email ?? null;
  const accountPhoneNumber =
    userProfile?.phoneNumber ?? user?.phoneNumber ?? null;
  const profileSettings = userProfile?.settings;
  const emailNotificationEnabled =
    notificationOverrides.emailNotificationEnabled ??
    Boolean(profileSettings?.emailNotificationEnabled);

  const showSuccessToast = (message: string): void => {
    setSuccessToastMessage(message);
    setSuccessToastOpen(true);
  };

  const showErrorSnackbar = (message: string): void => {
    setErrorSnackbarMessage(message);
    setErrorSnackbarOpen(true);
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      resetFollowing();
      await signOut(getFirebaseAuth());
      router.push('/');
    } catch {
      showErrorSnackbar('Could not sign out right now. Please try again.');
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (!user) {
      showErrorSnackbar('Please sign in to delete your account.');
      return;
    }

    if (!USERS_API_URL) {
      showErrorSnackbar('Account deletion is unavailable right now.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${USERS_API_URL}/v1/users/${user.uid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete account (${response.status})`);
      }

      resetFollowing();
      if (user) {
        clearUserProfileCache(user.uid);
      }
      useAuthStore.setState({ userProfile: null, userProfileStatus: 'idle' });
      await signOut(getFirebaseAuth());
      setDeleteConfirmOpen(false);
      router.replace('/auth/signin');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not delete account right now. Please try again.';

      showErrorSnackbar(message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const updateNotificationSetting = async (
    key: NotificationSettingKey,
    value: boolean
  ): Promise<void> => {
    if (!user) {
      showErrorSnackbar('Please sign in to update notification settings.');
      return;
    }

    if (!USERS_API_URL) {
      showErrorSnackbar('Notification settings are unavailable right now.');
      return;
    }

    setPendingSettings((prev) => ({ ...prev, [key]: true }));
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${USERS_API_URL}/v1/users/${user.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          settings: {
            [key]: value,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings (${response.status})`);
      }

      const settingLabel = 'Email Notifications';
      const settingState = value ? 'Enabled' : 'Disabled';
      showSuccessToast(`${settingLabel} ${settingState}`);
      updateCachedUserProfile(user.uid, {
        settings: {
          ...(userProfile?.settings ?? {}),
          [key]: value,
        },
      });
    } catch (error) {
      const fallbackMessage =
        'Could not update email notifications. Please try again.';

      showErrorSnackbar(
        error instanceof Error ? error.message : fallbackMessage
      );

      setNotificationOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setPendingSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: settingsPageColors.pageBg,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 520 },
          mx: 'auto',
          px: { xs: 3, sm: 4, md: 4 },
          pt: { xs: 4, sm: 5, md: 5 },
          pb: 10,
        }}
      >
        <Button
          component={NextLink}
          href="/profile"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          sx={{
            color: settingsPageColors.backLinkColor,
            textTransform: 'none',
            px: 0,
            minWidth: 0,
            mb: { xs: 1 },
            fontSize: { xs: '0.875rem', md: '0.88rem' },
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            },
          }}
        >
          Back to Profile
        </Button>

        <Typography
          sx={{
            fontSize: { xs: '1.25rem', md: '1.32rem' },
            color: settingsPageColors.itemLabel,
            mb: { xs: 5, md: 5.25 },
            fontWeight: 550,
          }}
        >
          Settings
        </Typography>

        {SETTINGS_SECTIONS.map((section) => (
          <Box key={section.title} sx={{ mb: { xs: 5, md: 5.5 } }}>
            <Typography
              sx={{
                fontSize: { xs: '0.75rem', md: '0.8rem' },
                color: settingsPageColors.sectionTitle,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                mb: { xs: 2, md: 2.5 },
                fontWeight: 550,
              }}
            >
              {section.title}
            </Typography>

            <Box
              sx={{
                backgroundColor: settingsPageColors.cardBg,
                border: `1px solid ${settingsPageColors.cardBorder}`,
                borderRadius: { xs: 3, md: 3.5 },
                boxShadow: settingsPageColors.cardShadow,
                overflow: 'hidden',
              }}
            >
              {section.items.map((item, index) => {
                const isAccount = item.key === 'account';
                const isNotifications = item.key === 'notifications';
                const isAppearance = item.key === 'appearance';
                const isHelp = item.key === 'help';
                const isExpanded =
                  (isAppearance && appearanceOpen) ||
                  (isAccount && accountOpen) ||
                  (isNotifications && notificationsOpen) ||
                  (isHelp && helpOpen);
                const showDivider =
                  index < section.items.length - 1 && !isExpanded;
                const ItemIcon = item.icon;

                return (
                  <Box key={item.key}>
                    <Button
                      fullWidth
                      type="button"
                      onClick={
                        isAccount
                          ? () => setAccountOpen((prev) => !prev)
                          : isNotifications
                            ? () => setNotificationsOpen((prev) => !prev)
                            : isAppearance
                              ? () => setAppearanceOpen((prev) => !prev)
                              : isHelp
                                ? () => setHelpOpen((prev) => !prev)
                                : undefined
                      }
                      sx={{
                        borderRadius: 0,
                        textTransform: 'none',
                        px: { xs: 3, md: 3.25 },
                        py: { xs: 2.25, md: 2.4 },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: settingsPageColors.itemLabel,
                        fontWeight: 400,
                        '&:hover': {
                          backgroundColor: settingsPageColors.rowHover,
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={{ xs: 3, md: 3 }}
                        alignItems="center"
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: { xs: 40 },
                            height: { xs: 40 },
                            borderRadius: '50%',
                            backgroundColor: isExpanded
                              ? settingsPageColors.iconChipActiveBg
                              : settingsPageColors.iconChipBg,
                            color: isExpanded
                              ? settingsPageColors.iconChipActiveColor
                              : settingsPageColors.iconChipColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ItemIcon sx={{ fontSize: { xs: 19 } }} />
                        </Box>
                        <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                          <Typography
                            sx={{
                              fontSize: { xs: '0.9rem', md: '0.96rem' },
                              lineHeight: 1.2,
                              fontWeight: 500,
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: { xs: '0.75rem', md: '0.8rem' },
                              color: settingsPageColors.itemDescription,
                              whiteSpace: 'normal',
                              fontWeight: 575,
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                      </Stack>

                      <ChevronRightIcon
                        sx={{
                          color: settingsPageColors.chevronColor,
                          fontSize: { xs: 18, md: 20 },
                          transition: 'transform 0.2s ease',
                          transform:
                            (isAppearance && appearanceOpen) ||
                            (isAccount && accountOpen) ||
                            (isNotifications && notificationsOpen) ||
                            (isHelp && helpOpen)
                              ? 'rotate(90deg)'
                              : 'rotate(0deg)',
                        }}
                      />
                    </Button>

                    {isNotifications && notificationsOpen && (
                      <Box
                        sx={{
                          px: { xs: 3.5, md: 4 },
                          pb: { xs: 3.5, md: 4 },
                          pt: { xs: 2, md: 2.25 },
                          backgroundColor: settingsPageColors.panelBg,
                        }}
                      >
                        <Stack spacing={1.25}>
                          <NotificationToggleRow
                            label="Email notifications"
                            checked={emailNotificationEnabled}
                            disabled={Boolean(
                              pendingSettings.emailNotificationEnabled
                            )}
                            onChange={(checked) => {
                              setNotificationOverrides((prev) => ({
                                ...prev,
                                emailNotificationEnabled: checked,
                              }));
                              void updateNotificationSetting(
                                'emailNotificationEnabled',
                                checked
                              );
                            }}
                          />
                        </Stack>
                      </Box>
                    )}

                    {isAccount && accountOpen && (
                      <Box
                        sx={{
                          px: { xs: 3.5, md: 4 },
                          pb: { xs: 3.5, md: 4 },
                          pt: { xs: 2, md: 2.25 },
                          backgroundColor: settingsPageColors.panelBg,
                        }}
                      >
                        <Stack spacing={1.5}>
                          {accountEmail ? (
                            <AccountField label="Email" value={accountEmail} />
                          ) : null}
                          {accountPhoneNumber ? (
                            <AccountField
                              label="Phone number"
                              value={accountPhoneNumber}
                            />
                          ) : null}

                          <Box sx={{ pt: { xs: 0.5, md: 1.5 } }}>
                            <Button
                              type="button"
                              onClick={() => setDeleteConfirmOpen(true)}
                              sx={{
                                justifyContent: 'flex-start',
                                gap: 1.25,
                                px: 0,
                                py: 0.75,
                                borderRadius: 0,
                                border: 'none',
                                backgroundColor: 'transparent',
                                textTransform: 'none',
                                color: settingsPageColors.dangerText,
                                fontWeight: 500,
                                alignItems: 'center',
                                alignSelf: 'flex-start',
                                width: 'fit-content',
                                minWidth: 0,
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  color: settingsPageColors.dangerText,
                                },
                              }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              <Typography
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.8rem' },
                                  fontWeight: 600,
                                  lineHeight: 1.2,
                                  textAlign: 'left',
                                }}
                              >
                                Delete Account
                              </Typography>
                            </Button>
                          </Box>
                        </Stack>
                      </Box>
                    )}

                    {isHelp && helpOpen && (
                      <Box
                        sx={{
                          px: { xs: 3.5, md: 4 },
                          pb: { xs: 3.5, md: 4 },
                          pt: { xs: 2, md: 2.25 },
                          backgroundColor: settingsPageColors.panelBg,
                        }}
                      >
                        <Stack spacing={1.1} alignItems="flex-start">
                          <HelpFeedbackLink href="/faqs" label="FAQs" />
                          <HelpFeedbackLink
                            href="/contact"
                            label="Contact Us"
                          />
                        </Stack>
                      </Box>
                    )}

                    {showDivider && (
                      <Divider
                        sx={{
                          borderColor: settingsPageColors.cardBorder,
                          mx: 0,
                        }}
                      />
                    )}

                    {isAppearance && appearanceOpen && (
                      <Box
                        sx={{
                          px: { xs: 3, md: 3.25 },
                          pb: { xs: 3, md: 3.25 },
                          pt: { xs: 1.5, md: 2 },
                          backgroundColor: settingsPageColors.panelBg,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.78rem' },
                            color: settingsPageColors.sectionTitle,
                            mb: 1.5,
                            fontWeight: 500,
                          }}
                        >
                          Choose your preferred theme
                        </Typography>

                        <Stack direction="row" spacing={1}>
                          {THEME_OPTIONS.map((option) => {
                            const ModeIcon = option.icon;
                            const active = selectedTheme === option.mode;

                            return (
                              <Button
                                key={option.mode}
                                onClick={() => setSelectedTheme(option.mode)}
                                type="button"
                                sx={{
                                  flex: 1,
                                  py: { xs: 1.5, md: 1.6 },
                                  borderRadius: { xs: 2, md: 2.25 },
                                  borderWidth: 2,
                                  borderStyle: 'solid',
                                  borderColor: active
                                    ? designColor.blue.dark
                                    : settingsPageColors.themeOptionInactiveBorder,
                                  backgroundColor: active
                                    ? settingsPageColors.themeOptionActiveBg
                                    : settingsPageColors.cardBg,
                                  color: active
                                    ? designColor.blue.dark
                                    : designColor.secondaryText,
                                  textTransform: 'none',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  '&:hover': {
                                    borderColor: active
                                      ? designColor.blue.dark
                                      : settingsPageColors.chevronColor,
                                    backgroundColor: active
                                      ? settingsPageColors.themeOptionActiveBg
                                      : settingsPageColors.cardBg,
                                  },
                                }}
                              >
                                <ModeIcon
                                  sx={{ fontSize: { xs: 20, md: 21 } }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: { xs: '0.75rem', md: '0.78rem' },
                                  }}
                                >
                                  {option.label}
                                </Typography>
                              </Button>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}

        <Button
          fullWidth
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          sx={{
            mt: { xs: 2, md: 2.5 },
            backgroundColor: settingsPageColors.signOutBg,
            border: `1px solid ${settingsPageColors.cardBorder}`,
            borderRadius: { xs: 3, md: 3.5 },
            boxShadow: settingsPageColors.cardShadow,
            px: { xs: 3, md: 3.25 },
            py: { xs: 2.25, md: 2.4 },
            justifyContent: 'flex-start',
            gap: { xs: 1.5, md: 1.7 },
            textTransform: 'none',
            fontWeight: 400,
            '&:hover': {
              backgroundColor: settingsPageColors.signOutHover,
            },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, md: 42 },
              height: { xs: 36, md: 42 },
              borderRadius: '50%',
              backgroundColor: settingsPageColors.dangerChipBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogoutIcon
              sx={{
                fontSize: { xs: 20, md: 21 },
                color: settingsPageColors.dangerText,
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', md: '0.95rem' },
              color: settingsPageColors.dangerText,
              fontWeight: 500,
            }}
          >
            Sign Out
          </Typography>
        </Button>
      </Box>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        slotProps={{
          paper: {
            sx: {
              width: '100%',
              maxWidth: 420,
              borderRadius: 4,
              border: `1px solid ${settingsPageColors.cardBorder}`,
              backgroundColor: settingsPageColors.cardBg,
              overflow: 'hidden',
              boxShadow: '0 18px 60px rgba(0, 0, 0, 0.14)',
            },
          },
        }}
      >
        <DialogTitle
          id="delete-account-title"
          sx={{
            px: { xs: 4, md: 4.5 },
            pt: { xs: 4, md: 4.5 },
            pb: 2,
            textAlign: 'center',
            fontSize: { xs: '1.2rem', md: '1.28rem' },
            fontWeight: 700,
            color: settingsPageColors.itemLabel,
          }}
        >
          Delete Account?
        </DialogTitle>
        <DialogContent
          sx={{ px: { xs: 4, md: 4.5 }, pt: 1, pb: { xs: 3.5, md: 4 } }}
        >
          <DialogContentText
            id="delete-account-description"
            sx={{
              textAlign: 'center',
              color: settingsPageColors.sectionTitle,
              fontSize: '0.9rem',
              lineHeight: 1.55,
              mb: 0,
            }}
          >
            Deleting your account is irreversible. All your account data will be
            permanently deleted. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 4, md: 4.5 },
            pb: { xs: 4, md: 4.5 },
            pt: 1,
            justifyContent: 'center',
            gap: 1.25,
          }}
        >
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            type="button"
            disabled={isDeletingAccount}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 0.65,
              minHeight: 38,
              minWidth: 118,
              fontSize: '0.92rem',
              textTransform: 'none',
              color: settingsPageColors.itemLabel,
              border: `1px solid ${settingsPageColors.cardBorder}`,
              backgroundColor: settingsPageColors.cardBg,
              '&:hover': {
                backgroundColor: settingsPageColors.rowHover,
                borderColor: settingsPageColors.cardBorderHover,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleDeleteAccount();
            }}
            type="button"
            disabled={isDeletingAccount}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 0.65,
              minHeight: 38,
              minWidth: 118,
              fontSize: '0.92rem',
              textTransform: 'none',
              color: settingsPageColors.dangerText,
              backgroundColor: settingsPageColors.dangerButtonBg,
              border: `1px solid ${settingsPageColors.dangerButtonBorder}`,
              '&:hover': {
                backgroundColor: settingsPageColors.dangerButtonHoverBg,
                borderColor: settingsPageColors.dangerButtonHoverBorder,
              },
            }}
          >
            {isDeletingAccount ? 'Deleting...' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessToast
        open={successToastOpen}
        onClose={() => setSuccessToastOpen(false)}
        message={successToastMessage}
      />

      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setErrorSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorSnackbarOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorSnackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function NotificationToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}): React.ReactElement {
  return (
    <Box
      sx={{
        border: `1px solid ${settingsPageColors.cardBorder}`,
        borderRadius: { xs: 2, md: 2.25 },
        backgroundColor: settingsPageColors.cardBg,
        px: { xs: 2.25, md: 2.5 },
        py: { xs: 1.5, md: 1.75 },
      }}
    >
      <FormControlLabel
        sx={{
          m: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        control={
          <Switch
            checked={checked}
            disabled={disabled}
            onChange={(_, next) => onChange(next)}
          />
        }
        label={
          <Typography
            sx={{
              fontSize: { xs: '0.82rem', md: '0.88rem' },
              color: settingsPageColors.itemLabel,
              fontWeight: 500,
            }}
          >
            {label}
          </Typography>
        }
        labelPlacement="start"
      />
    </Box>
  );
}

function HelpFeedbackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}): React.ReactElement {
  return (
    <Typography
      component={NextLink}
      href={href}
      sx={{
        color: settingsPageColors.backLinkColor,
        fontSize: { xs: '1rem' },
        px: 5,
        py: 1,
        fontWeight: 600,
        lineHeight: 1.35,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      }}
    >
      {label}
    </Typography>
  );
}

function AccountField({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.75 }}
      >
        <Typography
          sx={{
            fontSize: { xs: '0.7rem', md: '0.72rem' },
            color: settingsPageColors.sectionTitle,
            letterSpacing: '0.08em',
            fontWeight: 550,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Box
        sx={{
          border: `1px solid ${settingsPageColors.cardBorder}`,
          borderRadius: { xs: 2, md: 2.25 },
          backgroundColor: settingsPageColors.panelBg,
          px: { xs: 2.75, md: 3.25 },
          py: { xs: 1.5, md: 1.75 },
          cursor: 'default',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '0.85rem', md: '0.88rem' },
            color: settingsPageColors.itemLabel,
            fontWeight: 500,
            wordBreak: 'break-word',
            letterSpacing: '0.01em',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
