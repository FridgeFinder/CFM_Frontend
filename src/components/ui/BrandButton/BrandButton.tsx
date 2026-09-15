'use client';

import { Button, ButtonProps } from '@mui/material';
import { designColor } from 'theme/palette';

export function BrandButton({ sx, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="contained"
      sx={{
        borderRadius: 3,
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: `0 4px 12px ${designColor.blue.shadow}`,
        '&:hover': { boxShadow: `0 6px 16px ${designColor.blue.shadowHover}` },
        '&.Mui-disabled': {
          boxShadow: 'none',
          bgcolor: designColor.blue.disabled,
          color: '#fff',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
