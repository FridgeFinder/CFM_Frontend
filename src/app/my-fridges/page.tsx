import React from 'react';
import { Metadata } from 'next';
import { MyFridgesPage } from 'features/fridge-notifications/components/MyFridgesPage';

export const metadata: Metadata = {
  title: 'Fridge Finder: My Fridges',
  description: 'Community fridges you follow',
};

export default function MyFridges(): React.ReactElement {
  return <MyFridgesPage />;
}
