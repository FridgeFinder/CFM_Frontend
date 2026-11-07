import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Your Profile | Fridge Finder',
  description: 'View your Fridge Finder profile and community fridge activity.',
  robots: { index: false, follow: true },
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
