import React from 'react';
import Link, { LinkProps } from 'next/link';

export interface NextLinkProps extends Omit<LinkProps, 'href'> {
  href: LinkProps['href'];
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function NextLinkComponent(
  props: NextLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {
    href,
    prefetch = false,
    replace,
    scroll,
    shallow,
    locale,
    children,
    ...rest
  } = props;

  return (
    <Link
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      locale={locale}
      ref={ref}
      {...rest}
    >
      {children}
    </Link>
  );
}

export const NextLink = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  NextLinkComponent
);

NextLink.displayName = 'NextLink';
