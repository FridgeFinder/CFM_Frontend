export interface Location {
  street: string;
  city: string;
  state: string;
  zip: string;
  geoLat: number;
  geoLng: number;
  name?: string;
}

export interface Maintainer {
  instagram?: string;
  website?: string;
  email?: string;
}

export interface FridgeReport {
  fridgeId: string;
  timestamp: string;
  epochTimestamp?: string;
  condition: 'good' | 'dirty' | 'out of order' | 'ghost' | string;
  foodPercentage: number;
  photoUrl?: string;
  notes?: string;
}

export interface Fridge {
  id: string;
  name: string;
  verified: boolean;
  location: Location;
  maintainer: Maintainer;
  photoUrl?: string;
  notes?: string;
  tags?: string[];
  last_edited?: string;
  report: FridgeReport | null;
}

export interface ApiFridge extends Omit<Fridge, 'report'> {
  latestFridgeReport?: FridgeReport;
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface UserFridgeNotificationPreferences {
  dirty: boolean;
  outOfOrder: boolean;
  noFood: boolean;
  hasFood: boolean;
}

export interface ContactTypePreferences {
  email: UserFridgeNotificationPreferences;
  device: UserFridgeNotificationPreferences;
}

export interface UserFridgeNotification {
  userId: string;
  fridgeId: string;
  contactTypePreferences: ContactTypePreferences;
}
