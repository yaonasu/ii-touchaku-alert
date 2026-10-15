import React, { useState, useEffect, useRef } from 'react';
import { LocationSlot, UserLocation, ArrivalState } from './types';
import { INITIAL_LOCATIONS } from './utils/presetStations';
import { calculateDistanceMeters } from './utils/geo';
import { sendWebNotification, startRepeatingVibration, stopRepeatingVibration } from './utils/audio';
import { StationMap } from './components/StationMap';
import { StationCard } from './components/StationCard';
import { StationEditModal } from './components/StationEditModal';
import { ArrivalAlertModal } from './components/ArrivalAlertModal';
import { startBackgroundKeepAlive, stopBackgroundKeepAlive } from './utils/backgroundKeepAlive';
import {
  Train,
  Radio,
  Compass,
  Layers,
  Info,
} from 'lucide-react';

const STORAGE_KEY = 'location_arrival_alert_slots_v3';
const MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDIhQsROqT95vZiIkma-IlksZeshVp1lYo';

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // 3 Location Slots (Stored in localStorage, default empty)
  const [locations, setLocations] = useState<LocationSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_LOCATIONS;
  });

  // Real GPS Location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // UI state
  const [editingLocation, setEditingLocation] = useState<LocationSlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3 | null>(1);
  const [arrivalAlert, setArrivalAlert] = useState<ArrivalState | null>(null);
  const [snoozeMap, setSnoozeMap] = useState<Record<string, number>>({});
  const [isKeepAliveActive, setIsKeepAliveActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'stations'>('map');

  const watchIdRef = useRef<number | null>(null);

  // Save locations on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [locations]);

  // Demo key quota tap listener
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Request notifications permission quietly on mount if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Toggle Background GPS Keep-Alive
  const handleToggleKeepAlive = async () => {
    if (!isKeepAliveActive) {
      const res = await startBackgroundKeepAlive();
      if (res.isActive) {
        setIsKeepAliveActive(true);
      }
    } else {
      await stopBackgroundKeepAlive();
      setIsKeepAliveActive(false);
    }
  };

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        console.warn('GPS error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Evaluate Arrival Condition: Within 500m radius of any enabled set location
  useEffect(() => {
    if (!userLocation) return;

    const now = Date.now();

    for (const loc of locations) {
      if (!loc.enabled || loc.lat === null || loc.lng === null) continue;

      const snoozedUntil = snoozeMap[loc.id] || 0;
      if (now < snoozedUntil) continue;

      const dist = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        loc.lat,
        loc.lng
      );

      // Trigger if within 500m
      if (dist <= loc.radiusMeters) {
        if (!arrivalAlert || arrivalAlert.location.id !== loc.id) {
          setArrivalAlert({
            location: loc,
            distance: dist,
            triggeredAt: now,
            acknowledged: false,
          });

          // Trigger continuous vibration and web notification
          startRepeatingVibration();
          sendWebNotification(loc.name, dist);
        }
        break;
      }
    }
  }, [userLocation, locations, snoozeMap, arrivalAlert]);

  // Toggle location enabled
  const handleToggleLocationEnabled = (id: string) => {
    setLocations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Save location configuration
  const handleSaveLocation = (updated: LocationSlot) => {
    setLocations((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingLocation(null);
  };

  // Dismiss arrival alert
  const handleDismissAlert = () => {
    stopRepeatingVibration();
    if (arrivalAlert) {
      setSnoozeMap((prev) => ({
        ...prev,
        [arrivalAlert.location.id]: Date.now() + 15 * 60 * 1000,
      }));
    }
    setArrivalAlert(null);
  };

  // Snooze arrival alert
  const handleSnoozeAlert = (minutes: number) => {
    stopRepeatingVibration();
    if (arrivalAlert) {
      setSnoozeMap((prev) => ({
        ...prev,
        [arrivalAlert.location.id]: Date.now() + minutes * 60 * 1000,
      }));
    }
    setArrivalAlert(null);
  };

  const enabledCount = locations.filter((s) => s.enabled && s.lat !== null).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Demo Key Quota Exceeded Banner (Section 8 Case A Mandate) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Top Navigation Bar (Clean title without "半径500mバイブ通知" badge, without bell icon) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="ii-到着通知"
              className="w-10 h-10 rounded-2xl shadow-md object-cover border border-slate-200"
            />
            <div>
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                ii-到着通知
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                3箇所の地点を設定し、半径500m以内に入るとバイブレーションでお知らせ
              </p>
            </div>
          </div>

          {/* Quick Header Action: GPS Monitor Toggle Only */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleKeepAlive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isKeepAliveActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="GPSバックグラウンド監視のON/OFF（画面オフや他アプリ操作中も監視）"
            >
              <Radio className={`w-3.5 h-3.5 ${isKeepAliveActive ? 'animate-pulse text-white' : 'text-slate-500'}`} />
              <span>{isKeepAliveActive ? 'GPS監視ON' : 'GPS監視OFF'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher: "現在地" and "設定地点" */}
        <div className="flex border-t border-slate-200 lg:hidden">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'map'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            現在地
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'stations'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            設定地点（3箇所）
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] inline-flex items-center justify-center">
              {enabledCount}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex-1 flex flex-col gap-4">
        {/* Split Layout: Left Location Cards, Right Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[560px]">
          {/* Location Slots Sidebar (3箇所設定) */}
          <div
            className={`lg:col-span-5 flex flex-col gap-3.5 ${
              activeTab === 'stations' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* 3 Location Cards (Touching block opens setting) */}
            <div className="space-y-3">
              {locations.map((loc) => (
                <StationCard
                  key={loc.id}
                  location={loc}
                  userLocation={userLocation}
                  onEdit={() => setEditingLocation(loc)}
                  onToggleEnabled={() => handleToggleLocationEnabled(loc.id)}
                />
              ))}
            </div>

            {/* Guide Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 mt-auto">
              <div className="font-bold flex items-center gap-1.5 text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                乗り過ごしアラートの使い方
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <li>各地点のブロックを<strong>タッチすると設定画面（地図）</strong>が開き、位置を指定できます。</li>
                <li>電車に乗ったら右上の<strong>「GPS監視ON」</strong>にしておくと、他アプリ操作中や画面オフでも裏で監視します。</li>
                <li>設定した地点の<strong>半径500m以内</strong>に入ると、バイブレーションでお知らせします。</li>
              </ul>
            </div>
          </div>

          {/* Map View Area (Always shows user location as default) */}
          <div
            className={`lg:col-span-7 flex flex-col ${
              activeTab === 'map' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="h-[480px] sm:h-[580px] lg:h-full w-full">
              <StationMap
                apiKey={MAPS_API_KEY}
                locations={locations}
                userLocation={userLocation}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => setSelectedSlot(slot)}
                onEditLocation={(loc) => setEditingLocation(loc)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Location Edit Modal (Embedded Map Configuration with Save button at top right) */}
      {editingLocation && (
        <StationEditModal
          location={editingLocation}
          userLocation={userLocation}
          apiKey={MAPS_API_KEY}
          onSave={handleSaveLocation}
          onClose={() => setEditingLocation(null)}
        />
      )}

      {/* Arrival Fullscreen Alert Modal (Vibration Notification) */}
      {arrivalAlert && (
        <ArrivalAlertModal
          location={arrivalAlert.location}
          currentDistance={arrivalAlert.distance}
          onDismiss={handleDismissAlert}
          onSnooze={handleSnoozeAlert}
        />
      )}
    </div>
  );
}
