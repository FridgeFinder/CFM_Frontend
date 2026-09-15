import React from 'react';
import { Metadata } from 'next';
import {
  Box,
  Container,
  Link as MuiLink,
  List,
  ListItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { designColor } from 'theme/palette';

export const metadata: Metadata = {
  title: 'Fridge Finder: Privacy Policy',
  description:
    'Privacy Policy for Fridge Finder website and mobile app, including data practices, rights, and contact details.',
};

const sectionTitleSx = {
  mt: { xs: 4, md: 4.5 },
  mb: 1.35,
  fontSize: { xs: '1.25rem', md: '1.4rem' },
  fontWeight: 700,
  lineHeight: 1.35,
  ml: 0,
  pl: 0,
  textAlign: 'left',
  textIndent: 0,
};

const subTitleSx = {
  mt: 3,
  mb: 1.8,
  fontSize: { xs: '1.02rem', md: '1.08rem' },
  fontWeight: 700,
  ml: 0,
  pl: 0,
  textAlign: 'left',
  textIndent: 0,
};

const bodySx = {
  lineHeight: 1.72,
  fontSize: { xs: '0.99rem', md: '1rem' },
  color: 'text.secondary',
};

const quietBodySx = {
  lineHeight: 1.7,
  fontSize: '0.93rem',
  color: 'text.secondary',
};

type PolicyDetail = {
  label: React.ReactNode;
  details?: React.ReactNode[];
};

type KeyValueItem = {
  label: string;
  value: React.ReactNode;
};

type PolicyTableRow = {
  dataType: string;
  details: React.ReactNode;
  legalBasis?: React.ReactNode;
  linkedToIdentity?: React.ReactNode;
};

function BulletList({
  items,
  nested = false,
  ordered = false,
}: {
  items: React.ReactNode[];
  nested?: boolean;
  ordered?: boolean;
}): React.ReactElement {
  return (
    <List
      disablePadding
      sx={{
        pl: nested ? 4.75 : 3.25,
        my: 1,
        listStyleType: ordered ? 'decimal' : 'disc',
        listStylePosition: 'outside',
      }}
    >
      {items.map((item, index) => (
        <ListItem
          key={index}
          sx={{
            display: 'list-item',
            py: 0.28,
            px: 0,
            '&::marker': { color: 'text.disabled' },
          }}
        >
          <Typography sx={nested ? quietBodySx : bodySx}>{item}</Typography>
        </ListItem>
      ))}
    </List>
  );
}

function StructuredList({
  items,
}: {
  items: PolicyDetail[];
}): React.ReactElement {
  return (
    <List
      disablePadding
      sx={{
        pl: 3.25,
        my: 1.2,
        listStyleType: 'disc',
        listStylePosition: 'outside',
      }}
    >
      {items.map((item, index) => (
        <ListItem
          key={index}
          sx={{
            display: 'list-item',
            py: 0.45,
            px: 0,
            alignItems: 'flex-start',
            '&::marker': { color: 'text.disabled' },
          }}
        >
          <Box>
            <Typography sx={bodySx}>{item.label}</Typography>
            {item.details && item.details.length > 0 ? (
              <BulletList items={item.details} nested />
            ) : null}
          </Box>
        </ListItem>
      ))}
    </List>
  );
}

function TocList({ items }: { items: React.ReactNode[] }): React.ReactElement {
  return (
    <Box
      component="ol"
      sx={{
        pl: 8,
        my: 1.1,
        listStylePosition: 'outside',
      }}
    >
      {items.map((item, index) => (
        <Box key={index} component="li" sx={{ py: 0.28, pl: 0 }}>
          <Typography sx={bodySx}>{item}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function KeyValueRows({
  items,
}: {
  items: KeyValueItem[];
}): React.ReactElement {
  return (
    <Stack spacing={0.75} sx={{ mt: 1.1 }}>
      {items.map((item) => (
        <Typography key={item.label} sx={bodySx}>
          <strong>{item.label}:</strong> {item.value}
        </Typography>
      ))}
    </Stack>
  );
}

function PolicyDataTable({
  rows,
}: {
  rows: PolicyTableRow[];
}): React.ReactElement {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        mt: 1.1,
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 2,
        overflowX: 'auto',
      }}
    >
      <Table size="small" sx={{ minWidth: 680 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
            <TableCell sx={{ fontWeight: 700, width: '25%' }}>
              Data Type
            </TableCell>
            <TableCell sx={{ fontWeight: 700, width: '43%' }}>
              What We Collect and Why
            </TableCell>
            <TableCell sx={{ fontWeight: 700, width: '22%' }}>
              Legal Basis (GDPR)
            </TableCell>
            <TableCell sx={{ fontWeight: 700, width: '10%' }}>
              Linked to Identity
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.dataType}>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Typography
                  sx={{
                    ...quietBodySx,
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {row.dataType}
                </Typography>
              </TableCell>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Typography sx={quietBodySx}>{row.details}</Typography>
              </TableCell>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Typography sx={quietBodySx}>
                  {row.legalBasis ?? 'N/A'}
                </Typography>
              </TableCell>
              <TableCell sx={{ verticalAlign: 'top' }}>
                <Typography sx={quietBodySx}>
                  {row.linkedToIdentity ?? 'N/A'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ExternalPolicyLink({
  href,
  label,
}: {
  href: string;
  label: string;
}): React.ReactElement {
  return (
    <MuiLink href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </MuiLink>
  );
}

export default function PrivacyPage(): React.ReactElement {
  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: 'background.default',
        color: 'text.primary',
        px: 2,
      }}
    >
      <Container maxWidth={false} sx={{ py: { xs: 5, md: 8 } }}>
        <Box sx={{ maxWidth: '72ch', mx: 'auto' }}>
          <Stack spacing={1.25} sx={{ mb: 3 }}>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, fontWeight: 750 }}
            >
              Privacy Policy for FridgeFinder
            </Typography>
            <Typography sx={bodySx}>Last Updated: July 4, 2026</Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.2, md: 2.6 },
              mb: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(45, 84, 54, 0.14)',
              backgroundColor: designColor.blue.pale,
              // 'rgba(244, 250, 245, 0.95)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.55 }}>
              A quick note from our team
            </Typography>
            <Typography sx={bodySx}>
              We built this policy to be straightforward and respectful of our
              community. We collect only what we need to run Fridge Finder, we
              never sell your data, and we avoid unnecessary tracking.
            </Typography>
          </Paper>

          <Typography sx={bodySx}>
            Fridge Finder ("we", "our", or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our website at{' '}
            <MuiLink
              href="https://fridgefinder.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              fridgefinder.app
            </MuiLink>{' '}
            and our mobile application (together, the "Services"). By using
            Fridge Finder, you agree to the collection and use of information in
            accordance with this policy.
          </Typography>

          <Typography variant="h5" sx={sectionTitleSx}>
            Contact Information
          </Typography>
          <KeyValueRows
            items={[
              { label: 'Organization', value: 'FridgeFinder' },
              { label: 'Email', value: 'fridgefinderapp@gmail.com' },
              { label: 'Website', value: 'fridgefinder.app' },
            ]}
          />

          <Typography variant="h5" sx={sectionTitleSx}>
            Privacy-First Approach
          </Typography>
          <BulletList
            items={[
              'We collect only the minimum data necessary to operate Fridge Finder.',
              'We do not sell, rent, or trade personal information.',
              'Mobile app: we do not use analytics SDKs, advertising networks, or behavioral tracking.',
              'Website: we may use limited website analytics to understand page usage and improve performance.',
              'Mobile location is processed for map and notification features and is not stored as location history on our servers.',
            ]}
          />

          <Typography variant="h5" sx={sectionTitleSx}>
            In This Policy
          </Typography>
          <TocList
            items={[
              <MuiLink href="#information-we-collect" underline="hover">
                Information We Collect
              </MuiLink>,
              <MuiLink href="#what-we-do-not-collect" underline="hover">
                What We Do Not Collect
              </MuiLink>,
              <MuiLink href="#how-we-use-your-information" underline="hover">
                How We Use Your Information
              </MuiLink>,
              <MuiLink
                href="#third-party-service-providers-and-data-sharing"
                underline="hover"
              >
                Third-Party Service Providers and Data Sharing
              </MuiLink>,
              <MuiLink href="#data-security" underline="hover">
                Data Security
              </MuiLink>,
              <MuiLink href="#data-retention-and-deletion" underline="hover">
                Data Retention and Deletion
              </MuiLink>,
              <MuiLink href="#your-privacy-rights" underline="hover">
                Your Privacy Rights
              </MuiLink>,
              <MuiLink href="#app-permissions-explained" underline="hover">
                App Permissions Explained
              </MuiLink>,
              <MuiLink href="#childrens-privacy-coppa" underline="hover">
                Children&apos;s Privacy (COPPA)
              </MuiLink>,
              <MuiLink
                href="#international-users-and-data-transfers"
                underline="hover"
              >
                International Users and Data Transfers
              </MuiLink>,
              <MuiLink
                href="#us-state-privacy-rights-ccpacpra"
                underline="hover"
              >
                U.S. State Privacy Rights (CCPA/CPRA)
              </MuiLink>,
              <MuiLink href="#european-users-gdpr" underline="hover">
                European Users (GDPR)
              </MuiLink>,
              <MuiLink href="#changes-to-this-policy" underline="hover">
                Changes to This Policy
              </MuiLink>,
            ]}
          />

          <Typography
            id="information-we-collect"
            variant="h5"
            sx={sectionTitleSx}
          >
            1. Information We Collect
          </Typography>
          <Typography sx={bodySx}>
            We collect only the information required to provide and improve our
            services.
          </Typography>

          <Typography variant="h6" sx={subTitleSx}>
            1.1 Account Information
          </Typography>
          <PolicyDataTable
            rows={[
              {
                dataType: 'Phone number or email address',
                details:
                  'Used for account authentication through Firebase Authentication.',
                legalBasis: 'Performance of contract.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Username',
                details: 'Your chosen display name in the app and website.',
                legalBasis: 'Performance of contract.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'User Type',
                details: 'User Type displayed in profile (Neighbor/Volunteer).',
                legalBasis: 'Performance of contract.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Zip Code',
                details: 'Optional field used for internal reporting.',
                legalBasis: 'Legitimate interest.',
                linkedToIdentity: 'Yes',
              },
            ]}
          />

          <Typography variant="h6" sx={subTitleSx}>
            1.2 Location Data
          </Typography>
          <PolicyDataTable
            rows={[
              {
                dataType: 'Mobile precise location',
                details:
                  'Used to show nearby fridges, calculate distances, and support optional volunteer geofencing notifications. We do not retain location as historical tracking.',
                legalBasis:
                  'Legitimate interest, with consent for optional background geofencing.',
                linkedToIdentity: 'No location history stored',
              },
              {
                dataType: 'Website map location (browser permission)',
                details:
                  'Used only in-session when you choose a map feature like "Find my location". Not used for tracking profiles.',
                legalBasis: 'Consent via browser permission.',
                linkedToIdentity: 'No',
              },
            ]}
          />
          <Typography
            sx={{
              ...quietBodySx,
              mt: 1.1,
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Your controls
          </Typography>
          <BulletList
            nested
            items={[
              <>
                <strong>Permission choice:</strong> You can deny location
                permissions and still use core features with reduced location
                functionality.
              </>,
              <>
                <strong>Device settings:</strong> You can disable background
                location or all location access at any time.
              </>,
            ]}
          />

          <Typography variant="h6" sx={subTitleSx}>
            1.3 Photos and User-Generated Content
          </Typography>
          <PolicyDataTable
            rows={[
              {
                dataType: 'Photos (optional)',
                details:
                  'Optional uploads included in status reports. Photos may be processed (for example, compressed and metadata minimized) before storage.',
                legalBasis: 'Consent (voluntary upload).',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Text notes (optional)',
                details:
                  'Optional notes submitted with reports. Content is visible in fridge profiles for community operations.',
                legalBasis: 'Consent (voluntary submission).',
                linkedToIdentity: 'Yes',
              },
            ]}
          />

          <Typography variant="h6" sx={subTitleSx}>
            1.4 Device and Technical Information
          </Typography>
          <PolicyDataTable
            rows={[
              {
                dataType: 'FCM token',
                details: 'Used to deliver push notifications to your device.',
                legalBasis: 'Legitimate interest.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Device and app metadata',
                details:
                  'Device type, operating system version, and app version used for compatibility and reliability.',
                legalBasis: 'Legitimate interest.',
                linkedToIdentity: 'No',
              },
            ]}
          />

          <Typography variant="h6" sx={subTitleSx}>
            1.5 Notification and Follow Data
          </Typography>
          <PolicyDataTable
            rows={[
              {
                dataType: 'Followed fridges',
                details: 'Which fridges you follow for updates.',
                legalBasis: 'Performance of contract.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Notification preferences',
                details: 'Your selected notification settings and categories.',
                legalBasis: 'Performance of contract.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Status reports and engagement',
                details: 'Reports, contribution history, and volunteer points.',
                legalBasis: 'Performance of contract.',
                linkedToIdentity: 'Yes',
              },
              {
                dataType: 'Last login time',
                details: 'Used for account activity and security monitoring.',
                legalBasis: 'Legitimate interest.',
                linkedToIdentity: 'Yes',
              },
            ]}
          />

          <Typography variant="h6" sx={subTitleSx}>
            1.6 Website Analytics and Cookies
          </Typography>
          <PolicyDataTable
            rows={[
              {
                dataType: 'Website analytics events',
                details:
                  'May use google analytics to measure page visits and usability trends.',
                legalBasis:
                  'Consent or legitimate interest depending on region and applicable law.',
                linkedToIdentity: 'No',
              },
              {
                dataType: 'Cookies / local browser storage',
                details:
                  'Used for preferences and basic website functionality. You can control this in browser settings.',
                legalBasis:
                  'Legitimate interest (essential), consent where required.',
                linkedToIdentity: 'No',
              },
            ]}
          />

          <Typography variant="h6" sx={subTitleSx}>
            1.7 Local Device Storage
          </Typography>
          <BulletList
            items={[
              'The website and app may store preferences locally (for example, map settings or theme choices).',
              'This local data helps remember your settings and can be cleared by clearing browser/app storage or uninstalling the app.',
            ]}
          />

          <Typography
            id="what-we-do-not-collect"
            variant="h5"
            sx={sectionTitleSx}
          >
            2. What We Do Not Collect
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1, mb: 0.8 }}
          >
            <Typography
              sx={{
                ...quietBodySx,
                px: 1,
                py: 0.35,
                borderRadius: 999,
                backgroundColor: designColor.blue.pale,
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              [ No Data Selling ]
            </Typography>
            <Typography
              sx={{
                ...quietBodySx,
                px: 1,
                py: 0.35,
                borderRadius: 999,
                backgroundColor: designColor.blue.pale,
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              [ No Cross-App Tracking ]
            </Typography>
            <Typography
              sx={{
                ...quietBodySx,
                px: 1,
                py: 0.35,
                borderRadius: 999,
                backgroundColor: designColor.blue.pale,
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              [ No Contact Harvesting ]
            </Typography>
          </Stack>
          <BulletList
            items={[
              'No sale of personal data.',
              'No collection of contact lists, call logs, microphone recordings, or clipboard contents for Fridge Finder operations.',
              'No collection of sensitive categories such as racial or ethnic origin, political opinions, religious beliefs, or biometric identifiers for app functionality.',
              'No cross-app tracking by us for ad targeting.',
            ]}
          />

          <Typography
            id="how-we-use-your-information"
            variant="h5"
            sx={sectionTitleSx}
          >
            3. How We Use Your Information
          </Typography>
          <BulletList
            items={[
              'Provide and maintain website and mobile app functionality.',
              'Authenticate users and secure accounts.',
              'Show nearby fridges and relevant status updates.',
              'Send notifications according to your preferences.',
              'Process community reports and optional photo submissions.',
              'Improve product quality, reliability, and support response.',
              'Comply with legal obligations and prevent abuse or fraud.',
            ]}
          />

          <Typography
            id="third-party-service-providers-and-data-sharing"
            variant="h5"
            sx={sectionTitleSx}
          >
            4. Third-Party Service Providers and Data Sharing
          </Typography>
          <Typography sx={bodySx}>
            We do not sell personal data. We share data with providers only as
            necessary to operate the Services.
          </Typography>
          <StructuredList
            items={[
              {
                label: 'Core service providers:',
                details: [
                  'Firebase: authentication, database, push notifications, cloud functions.',
                  'Google Sign-In: optional OAuth authentication.',
                  'MapTiler: map tile display requests.',
                  'AWS S3 (optional): photo storage.',
                  'Google Analytics (website only): aggregate website usage measurement.',
                ],
              },
            ]}
          />
          <Typography sx={bodySx}>
            Third-party privacy notices:{' '}
            <ExternalPolicyLink
              href="https://policies.google.com/privacy"
              label="Google Privacy Policy"
            />
            ,{' '}
            <ExternalPolicyLink
              href="https://www.maptiler.com/privacy-policy/"
              label="MapTiler Privacy Policy"
            />
            ,{' '}
            <ExternalPolicyLink
              href="https://aws.amazon.com/privacy/"
              label="AWS Privacy Notice"
            />
            .
          </Typography>
          <Typography sx={bodySx}>
            We may also disclose information when legally required, to protect
            rights and safety, to enforce our terms, or with your explicit
            consent.
          </Typography>

          <Typography id="data-security" variant="h5" sx={sectionTitleSx}>
            5. Data Security
          </Typography>
          <BulletList
            items={[
              'Encryption in transit (HTTPS/TLS).',
              'Managed security controls from infrastructure providers (for example, Firebase and cloud storage controls).',
              'Access controls and authentication enforcement.',
              'Ongoing updates and security patching practices.',
              'If a reportable breach occurs, we will provide notices as required by law.',
            ]}
          />

          <Typography
            id="data-retention-and-deletion"
            variant="h5"
            sx={sectionTitleSx}
          >
            6. Data Retention and Deletion
          </Typography>
          <BulletList
            items={[
              'Account data is retained while your account is active. When you delete your account, your data is removed unless legal obligations require otherwise.',
              'Location history is not retained as an ongoing historical tracking log by us.',
              'Notification tokens are retained as needed for active notification delivery.',
              'Community reports and photos may remain for community history and service continuity; where feasible, identifying account links may be removed after account deletion.',
              'You can delete your account directly in the mobile app through Profile > Settings > Delete Account.',
            ]}
          />

          <Typography id="your-privacy-rights" variant="h5" sx={sectionTitleSx}>
            7. Your Privacy Rights
          </Typography>
          <Typography sx={bodySx}>
            You can access, correct, or delete your personal data at any time
            using your account settings. Users in certain regions may have
            additional formal legal protections regarding how their data is
            handled.
          </Typography>
          <StructuredList
            items={[
              {
                label: 'Rights commonly available:',
                details: [
                  'Access and correction: review and update account details where available in product settings.',
                  'Deletion: request account and personal data deletion subject to legal exceptions.',
                  'Notification opt-out: disable app notifications in-app or via device settings.',
                  'Withdraw consent: revoke optional permissions (such as location) in device or browser settings.',
                ],
              },
              {
                label:
                  'Response window: we target responses within 30 days, or up to 45 days where law permits.',
              },
            ]}
          />

          <Typography
            id="app-permissions-explained"
            variant="h5"
            sx={sectionTitleSx}
          >
            8. App Permissions Explained
          </Typography>
          <Typography sx={bodySx}>
            The mobile app may request permissions such as Location, Camera,
            Photo Library access, and Notifications. You can deny or revoke
            permissions at any time in your device settings.
          </Typography>

          <Typography
            id="childrens-privacy-coppa"
            variant="h5"
            sx={sectionTitleSx}
          >
            9. Children&apos;s Privacy (COPPA)
          </Typography>
          <Typography sx={bodySx}>
            Fridge Finder is not directed to children under 13, and we do not
            knowingly collect personal information from children under 13. If
            you believe a child provided personal data, contact us at
            fridgefinderapp@gmail.com so we can investigate and delete data
            where required.
          </Typography>

          <Typography
            id="international-users-and-data-transfers"
            variant="h5"
            sx={sectionTitleSx}
          >
            10. International Users and Data Transfers
          </Typography>
          <Typography sx={bodySx}>
            If you access the Services outside the United States, your data may
            be processed in the United States or other countries where our
            providers operate. For applicable regions, transfer safeguards (such
            as Standard Contractual Clauses) may be used by processors.
          </Typography>

          <Typography
            id="us-state-privacy-rights-ccpacpra"
            variant="h5"
            sx={sectionTitleSx}
          >
            11. U.S. State Privacy Rights (CCPA/CPRA)
          </Typography>
          <Typography sx={bodySx}>
            California residents and residents of other U.S. states with privacy
            laws may have rights to know, delete, correct, and opt out of
            certain data uses. To submit a request, email
            fridgefinderapp@gmail.com with the subject line "Privacy Request".
          </Typography>

          <Typography id="european-users-gdpr" variant="h5" sx={sectionTitleSx}>
            12. European Users (GDPR)
          </Typography>
          <Typography sx={bodySx}>
            For EEA, UK, and Swiss residents, GDPR rights may include access,
            rectification, erasure, restriction, portability, objection, and
            withdrawal of consent. You may also lodge a complaint with your
            local data protection authority.
          </Typography>

          <Typography
            id="changes-to-this-policy"
            variant="h5"
            sx={sectionTitleSx}
          >
            13. Changes to This Policy
          </Typography>
          <BulletList
            items={[
              'We may update this policy to reflect legal, product, or operational changes.',
              'We will update the Last Updated date at the top of this page.',
              'For material changes, we may provide additional notice in-product or on our website.',
            ]}
          />

          <Typography variant="h5" sx={sectionTitleSx}>
            Privacy Summary
          </Typography>
          <KeyValueRows
            items={[
              {
                label: 'Data approach',
                value: 'Minimal collection focused on core service operations.',
              },
              {
                label: 'Data sales',
                value: 'None. We do not sell personal information.',
              },
              {
                label: 'Behavioral tracking',
                value: 'Not used in the mobile app.',
              },
              {
                label: 'Website analytics',
                value: 'Limited usage for performance and usability insights.',
              },
              { label: 'Contact', value: 'fridgefinderapp@gmail.com' },
            ]}
          />

          <Typography sx={{ ...bodySx, mt: 4.5, fontSize: '0.9rem' }}>
            © 2026 FridgeFinder. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
