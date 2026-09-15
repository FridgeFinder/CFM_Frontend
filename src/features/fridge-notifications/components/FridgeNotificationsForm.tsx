'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { LinkEmailModal, SignInModal } from 'features/auth';
import { NewUserWelcomeFlowGate } from 'features/marketing';
import { BrandButton, SuccessToast } from 'components/ui';
import { BackLinkButton } from 'components/shared/BackLinkButton';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import {
  PhoneAndroid as PhoneIcon,
  MailOutline as MailIcon,
} from '@mui/icons-material';
import {
  UserFridgeNotificationPreferences,
  ContactTypePreferences,
} from 'types/domain';
import { useAuthStore } from 'store/useAuthStore';
import { designColor } from 'theme/palette';
import { useFridgeNotifications } from '../hooks/useFridgeNotifications';
import { getBackDestination } from '../utils/getBackDestination';

interface FridgeNotificationsFormProps {
  fridgeId: string;
  fridgeName?: string;
  from?: string;
}

type FormValues = {
  email: UserFridgeNotificationPreferences;
  device: UserFridgeNotificationPreferences;
};

const EMPTY_CHANNEL: UserFridgeNotificationPreferences = {
  outOfOrder: false,
  dirty: false,
  noFood: false,
  hasFood: false,
};

const NOTIFICATION_ROWS: {
  label: string;
  description: string;
  field: keyof UserFridgeNotificationPreferences;
}[] = [
  {
    label: 'Needs Repairs',
    description: 'Alert me when repairs are needed',
    field: 'outOfOrder',
  },
  {
    label: 'Needs Cleaning',
    description: 'Alert me when cleaning is needed',
    field: 'dirty',
  },
  {
    label: 'Out of Food',
    description: 'Alert me when food runs out',
    field: 'noFood',
  },
  {
    label: 'New Food Added',
    description: 'Alert me when food is restocked',
    field: 'hasFood',
  },
];

const contactTypeButtonSx = (active: boolean) => ({
  width: 40,
  height: 40,
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: active ? designColor.blue.interactive : designColor.lightSilver,
  bgcolor: active ? designColor.blue.interactive : 'background.paper',
  color: active ? designColor.white : designColor.mutedText,
  transition: 'all 0.15s ease',
  '&:hover': {
    bgcolor: active ? designColor.blue.interactive : designColor.whiteSmoke,
    borderColor: designColor.blue.interactive,
  },
});

function ContactTypeHeader({ name }: { name: string }) {
  return (
    <Box width={40} textAlign="center">
      <Typography
        variant="caption"
        fontWeight={600}
        color="text.secondary"
        sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
      >
        {name}
      </Typography>
    </Box>
  );
}

export function FridgeNotificationsForm({
  fridgeId,
  fridgeName,
  from,
}: FridgeNotificationsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const [linkEmailOpen, setLinkEmailOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false); //NOTE: consider renaming, why does it need a state? could it be set directly from the save function instead of an effect?
  const [unfollowToastOpen, setUnfollowToastOpen] = useState(false);
  const {
    status,
    isInitializing,
    isFollowing,
    savedPreferences,
    error,
    save,
    unfollow,
  } = useFridgeNotifications(fridgeId); //TODO: consider moving authStatus and user into the hook since they're so closely tied to the logic there

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      email: { ...EMPTY_CHANNEL },
      device: { ...EMPTY_CHANNEL },
    },
  });

  //Curious what this would look like if set directly from the functions instead of an effect — would it cause any issues if save/unfollow were called multiple times in a row?
  useEffect(() => {
    if (status === 'success') setToastOpen(true);
  }, [status]);

  useEffect(() => {
    if (savedPreferences) {
      reset({
        email: savedPreferences.contactTypePreferences.email,
        device: savedPreferences.contactTypePreferences.device,
      });
    }
  }, [savedPreferences, reset]);

  const onSubmit = async (values: FormValues) => {
    const preferences: ContactTypePreferences = {
      email: values.email,
      device: values.device,
    };
    await save(preferences);
  };

  const handleUnfollow = async () => {
    const ok = await unfollow();
    if (ok) {
      reset({ email: { ...EMPTY_CHANNEL }, device: { ...EMPTY_CHANNEL } });
      setUnfollowToastOpen(true);
    }
  };

  const isPageLoading =
    authStatus === 'loading' ||
    (authStatus === 'authenticated' && isInitializing);

  if (isPageLoading) {
    return (
      <Box sx={{ pt: 8, alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayName = fridgeName ?? fridgeId;

  const backDestination = getBackDestination(from, fridgeId);

  return (
    <Box>
      <Box
        component="main"
        sx={{
          maxWidth: 600,
          width: '100%',
          mx: 'auto',
          px: 2,
          py: { xs: 2, md: 4 },
        }}
      >
        {/* Back link */}
        <BackLinkButton
          label={backDestination.label}
          href={backDestination.href}
        />

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Page header */}
        <Box textAlign="left" mt={0} mb={2}>
          <Typography
            variant="h3"
            fontWeight={600}
            color={designColor.neroGray}
            sx={{ mt: 0, mb: 0.5 }}
          >
            Notification Preferences
          </Typography>
          {/* A diffent color perhaps?  */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {displayName}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Column headers */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={2}
            pb={0.5}
            mt={1}
          >
            <Box flex={1} />
            <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
              <ContactTypeHeader name="Push" />
              <ContactTypeHeader name="Email" />
            </Box>
          </Box>

          {/* Notification rows */}
          {NOTIFICATION_ROWS.map(({ label, description, field }) => (
            <Box
              key={field}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 3,
              }}
            >
              <Box flex={1} minWidth={0} pr={1}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={designColor.neroGray}
                  sx={{ lineHeight: 1.3 }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: { md: '0.9rem' } }}
                >
                  {description}
                </Typography>
              </Box>

              <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                {/* Push / Device toggle */}
                <Controller
                  control={control}
                  name={`device.${field}`}
                  render={({ field: f }) => (
                    <IconButton
                      onClick={() => {
                        if (authStatus === 'unauthenticated') {
                          setSignInOpen(true);
                          return;
                        }
                        f.onChange(!f.value);
                      }}
                      aria-label={`Toggle push notifications for ${label}`}
                      sx={contactTypeButtonSx(f.value)}
                    >
                      <PhoneIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                />

                {/* Email toggle — intercepts if user has no email yet */}
                <Controller
                  control={control}
                  name={`email.${field}`}
                  render={({ field: f }) => (
                    <IconButton
                      onClick={() => {
                        if (authStatus === 'unauthenticated') {
                          setSignInOpen(true);
                          return;
                        }
                        if (!user?.email) {
                          setLinkEmailOpen(true);
                          return;
                        }
                        f.onChange(!f.value);
                      }}
                      aria-label={`Toggle email notifications for ${label}`}
                      sx={contactTypeButtonSx(f.value)}
                    >
                      <MailIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                />
              </Box>
            </Box>
          ))}

          {/* Action buttons */}
          <Box display="flex" gap={1.5} mt={3}>
            <Button
              variant="text"
              onClick={() => router.push(backDestination.href)}
              sx={{
                flex: 1,
                py: 1.75,
                borderRadius: 3,
                fontWeight: 600,
                fontSize: { xs: '0.95rem', md: '1rem' },
                textTransform: 'none',
                bgcolor: designColor.whiteSmoke,
                color: designColor.secondaryText, //Consider #555 here
                border: `1px solid ${designColor.borderGray}`,
                boxShadow: 'none',
                transition: 'background-color 0.2s ease, color 0.2s ease',
                '&:hover': {
                  bgcolor: designColor.borderGray,
                  color: designColor.neroGray,
                  border: `1px solid ${designColor.borderGray}`,
                  boxShadow: 'none',
                },
              }}
            >
              Cancel
            </Button>

            <BrandButton
              type="button"
              disabled={status === 'loading'}
              onClick={() => {
                if (authStatus === 'unauthenticated') {
                  setSignInOpen(true);
                  return;
                }
                handleSubmit(onSubmit)();
              }}
              startIcon={
                status === 'loading' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
              sx={{
                flex: 1,
                py: 1.75,
                fontSize: { xs: '0.95rem', md: '1rem' },
              }}
            >
              {isFollowing ? 'Save' : 'Follow'}
            </BrandButton>
          </Box>

          {isFollowing && (
            <Box display="flex" justifyContent="center" mt={1.5}>
              <Button
                variant="text"
                onClick={handleUnfollow}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', md: '0.9rem' },
                  color: designColor.red.danger,
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                Unfollow Fridge
              </Button>
            </Box>
          )}
        </Box>

        <LinkEmailModal
          open={linkEmailOpen}
          onClose={() => setLinkEmailOpen(false)}
          returnPath={pathname ?? undefined}
        />

        <SignInModal
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
          returnPath={pathname ?? undefined}
        />

        <NewUserWelcomeFlowGate />

        <SuccessToast
          open={toastOpen}
          onClose={() => setToastOpen(false)}
          message="Notifications saved"
        />
        <SuccessToast
          open={unfollowToastOpen}
          onClose={() => setUnfollowToastOpen(false)}
          message="Unfollowed successfully"
        />
      </Box>
    </Box>
  );
}
