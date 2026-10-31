export interface Location {
  street: string;
  city: string;
  state: string;
  zip: string;
  geoLat: number;
  geoLng: number;
  name?: string;
  country?: string;
}

export interface Maintainer {
  name?: string;
  organization?: string;
  phone?: string;
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

export type FlaggedFridgeReportStatus =
  | 'none'
  | 'deleted'
  | 'not_inappropriate'
  | 'not_harmful';

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

export interface ApiFridge extends Omit<
  Fridge,
  'report' | 'maintainer' | 'notes' | 'photoUrl'
> {
  maintainer: Maintainer | null;
  notes?: string | null;
  photoUrl?: string | null;
  latestFridgeReport?: FridgeReport;
}

export interface FridgePatch {
  name?: string;
  location?: Location;
  maintainer?: Maintainer | null;
  notes?: string | null;
  photoUrl?: string | null;
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
