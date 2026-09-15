import { designColor } from 'theme/palette';

export const subtextSx = {
  fontWeight: 500,
  display: 'block',
  textAlign: 'center',
  lineHeight: 1.6,
  color: designColor.mutedText,
  fontSize: { xs: '0.8rem', md: '0.825rem' },
  mt: 6,
};

export const authCardSx = {
  borderRadius: 4,
  py: { xs: 5, sm: 6 },
  px: { xs: 4, sm: 5 },
  mx: { xs: 2 },
  borderColor: designColor.borderSubtle,
};

export const tryAgainButtonSx = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'primary.main',
  p: 0,
  minWidth: 0,
  textTransform: 'none',
  verticalAlign: 'baseline',
  '&:hover': { bgcolor: 'transparent', color: 'primary.dark' },
};
