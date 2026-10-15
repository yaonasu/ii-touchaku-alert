import { LocationSlot } from '../types';

export const INITIAL_LOCATIONS: LocationSlot[] = [
  {
    id: 'slot-1',
    slotNumber: 1,
    name: '地点 1',
    lat: null,
    lng: null,
    radiusMeters: 500,
    enabled: false,
    vibrateAlert: true,
    color: '#2563eb', // blue
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'slot-2',
    slotNumber: 2,
    name: '地点 2',
    lat: null,
    lng: null,
    radiusMeters: 500,
    enabled: false,
    vibrateAlert: true,
    color: '#059669', // emerald
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'slot-3',
    slotNumber: 3,
    name: '地点 3',
    lat: null,
    lng: null,
    radiusMeters: 500,
    enabled: false,
    vibrateAlert: true,
    color: '#9333ea', // purple
    badgeColor: 'bg-purple-600 text-white',
  },
];
