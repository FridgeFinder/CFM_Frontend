'use client';

import { use } from 'react';
import { FridgeNotificationsForm } from 'features/fridge-notifications';

interface NotificationsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string; from?: string }>;
}

export default function NotificationsPage({
  params,
  searchParams,
}: NotificationsPageProps) {
  const { id } = use(params);
  const { name, from } = use(searchParams);

  return (
    <FridgeNotificationsForm fridgeId={id} fridgeName={name} from={from} />
  );
}
