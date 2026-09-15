'use client';

import React from 'react';
import { Button, ButtonProps, SxProps, Theme } from '@mui/material';
import Link, { LinkProps as NextLinkProps } from 'next/link';

interface ButtonLinkProps extends Omit<ButtonProps, 'href' | 'component'> {
  title: string;
  to: NextLinkProps['href'];
  'aria-label': string;
  variant: 'outlined' | 'contained';
  sx?: SxProps<Theme>;
}

export function ButtonLink(props: ButtonLinkProps): React.ReactElement {
  const { title, to, sx = {}, ...buttonProps } = props;

  return (
    <Button
      {...(buttonProps as ButtonProps<'a'>)}
      component={Link}
      href={to as string}
      sx={{ flexShrink: 0, whiteSpace: 'nowrap', ...sx }}
    >
      {title}
    </Button>
  );
}
