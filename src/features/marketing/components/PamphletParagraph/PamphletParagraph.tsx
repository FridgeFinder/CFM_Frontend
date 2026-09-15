import React from 'react';
import Image from 'next/image';
import { Box, Divider, Typography, SxProps, Theme } from '@mui/material';
import { ButtonLink } from 'components/ui';
import { SoftWrap } from 'components/ui';
import { applyAlpha, designColor } from 'theme/palette';

interface ResponsiveImageProps {
  src: string;
  alt?: string;
  attribution?: string | null;
}

function ResponsiveImage({
  src,
  alt = '',
  attribution = null,
}: ResponsiveImageProps): React.ReactElement | null {
  if (!src) {
    return null;
  }
  return (
    <Box sx={{ mt: 7, mb: 7 }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 2',
          height: { xs: 200, sm: 400, lg: 500 },
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          style={{ objectFit: 'cover', borderRadius: '8px' }}
          sizes="100vw"
        />
      </Box>
      {attribution && (
        <Typography
          variant="body1"
          sx={{
            fontStyle: 'italic',
            textAlign: 'right',
            color: 'text.secondary',
            mt: 1,
            fontSize: '1rem !important',
          }}
        >
          {'Photo: ' + attribution}
        </Typography>
      )}
    </Box>
  );
}

export interface PamphletParagraphProps {
  title?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  img?: ResponsiveImageProps;
  body?: string[]; // Kept for backwards compatibility if needed elsewhere
  button?: {
    to: string | object;
    'aria-label': string;
    title: string;
    variant?: 'outlined' | 'contained';
  };
  hasDivider?: boolean;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
}

const sxParagraphMargin = {
  mb: 7,
  width: '100%',
  maxWidth: 900,
  mx: 'auto',
  px: { xs: 3, sm: 6 },
  textAlign: 'left' as const,
  boxSizing: 'border-box' as const,
};

function DividerGrey(): React.ReactElement {
  return (
    <Divider sx={{ borderColor: applyAlpha('22', designColor.neroGray) }} />
  );
}

export function PamphletParagraph({
  title,
  variant = 'h2',
  img,
  body,
  button,
  hasDivider = false,
  sx = {},
  children,
}: PamphletParagraphProps): React.ReactElement {
  return (
    <Box sx={{ ...sxParagraphMargin, ...sx }}>
      {hasDivider && <DividerGrey />}

      {img && <ResponsiveImage {...img} />}

      {title && (
        <Typography sx={{ mt: 7, mb: 7 }} variant={variant}>
          <SoftWrap text={title} />
        </Typography>
      )}

      {children}

      {body &&
        body.map((val, index) => (
          <Typography
            variant="body1"
            key={`${index}_PamphletParagraph`}
            sx={{ lineHeight: 1.7, mb: 2 }}
          >
            {val}
          </Typography>
        ))}

      {button && (
        <Box textAlign="center" sx={{ mt: 7 }}>
          <ButtonLink
            variant={button.variant || 'contained'}
            to={button.to}
            aria-label={button['aria-label']}
            title={button.title}
          />
        </Box>
      )}
    </Box>
  );
}
