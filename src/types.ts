export interface LocationSlot {
  id: string; // 'slot-1' | 'slot-2' | 'slot-3'
  slotNumber: 1 | 2 | 3;
  name: string;
  lat: number | null;
  lng: number | null;
  radiusMeters: number; // 500m
  enabled: boolean;
  vibrateAlert: boolean;
  color: string;
  badgeColor: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface ArrivalState {
  location: LocationSlot;
  distance: number;
  triggeredAt: number;
  acknowledged: boolean;
}
