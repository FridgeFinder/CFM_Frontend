import React from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { ButtonLink } from 'components/ui';

interface ParagraphCardProps {
  variant: 'h2' | 'h3';
  img: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  title: string;
  text: string;
  link: string;
  buttonTitle?: string;
  buttonSx?: object;
  imgMaxWidth?: number;
}

export function ParagraphCard({
  variant,
  img,
  title,
  text,
  link,
  buttonTitle = 'Learn More',
  buttonSx,
  imgMaxWidth,
}: ParagraphCardProps): React.ReactElement {
  if (variant === 'h2') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          textAlign: { xs: 'center', md: 'left' },
          backgroundColor: 'transparent',
          p: { xs: 0, md: 5 },
        }}
      >
        <Box
          sx={{ display: { xs: 'block', md: 'none' }, width: '100%', mb: 2 }}
        >
          <Typography variant="h2">{title}</Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: imgMaxWidth ?? 400, mx: 'auto' }}>
          <Image
            src={img.src}
            alt={img.alt}
            width={img.width}
            height={img.height}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </Box>

        <Box
          sx={{
            flex: { md: 1.5 },
            ml: { xs: 0, md: 6 },
            mt: { xs: 3, md: 0 },
            p: 0,
          }}
        >
          <Typography
            variant="h2"
            sx={{ display: { xs: 'none', md: 'block' }, pb: 1 }}
          >
            {title}
          </Typography>
          <Typography variant="body1">{text}</Typography>
          <ButtonLink
            to={link}
            variant="outlined"
            aria-label={buttonTitle}
            sx={{
              width: '100%',
              maxWidth: '345px',
              mt: 4,
              textTransform: 'none',
              fontWeight: 600,
              '&.MuiButton-outlined': { border: 'none' },
              '&:hover': { opacity: 0.9 },
              ...buttonSx,
            }}
            title={buttonTitle}
          />
        </Box>
      </Box>
    );
  } else {
    return (
      <Box
        sx={{
          textAlign: { xs: 'center', md: 'left' },
          backgroundColor: 'transparent',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 0, md: 2 },
        }}
      >
        <Box sx={{ flexShrink: 0, textAlign: 'center', mb: 2 }}>
          <Image
            src={img.src}
            alt={img.alt}
            width={img.width}
            height={img.height}
            style={{
              width: '100%',
              maxWidth: imgMaxWidth ? `${imgMaxWidth}px` : '160px',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </Box>

        <Box sx={{ py: 2, px: 0, flexGrow: 1 }}>
          <Typography variant="h3" pb={2} fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {text}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <ButtonLink
            to={link}
            variant="outlined"
            aria-label={buttonTitle}
            sx={{
              width: '100%',
              mt: 'auto',
              textTransform: 'none',
              fontWeight: 600,
              '&.MuiButton-outlined': { border: 'none' },
              '&:hover': { opacity: 0.9 },
              ...buttonSx,
            }}
            title={buttonTitle}
          />
        </Box>
      </Box>
    );
  }
}
