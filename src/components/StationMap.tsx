import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { LocationSlot, UserLocation } from '../types';
import { StationCircle } from './StationCircle';
import { calculateDistanceMeters, formatDistance } from '../utils/geo';
import { Crosshair, Maximize2, Navigation } from 'lucide-react';

interface StationMapProps {
  apiKey: string;
  locations: LocationSlot[];
  userLocation: UserLocation | null;
  selectedSlot: 1 | 2 | 3 | null;
  onSelectSlot: (slot: 1 | 2 | 3) => void;
  onEditLocation: (location: LocationSlot) => void;
}

// Helper to pan map camera
function MapCameraController({
  targetCenter,
}: {
  targetCenter: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter) return;
    map.panTo(targetCenter);
    map.setZoom(15);
  }, [map, targetCenter]);

  return null;
}

export const StationMap: React.FC<StationMapProps> = ({
  apiKey,
  locations,
  userLocation,
  selectedSlot,
  onSelectSlot,
  onEditLocation,
}) => {
  // Always default to user's current GPS location if available, otherwise Tokyo
  const defaultCenter = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: 35.6812, lng: 139.7671 };

  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Pan to user location when GPS becomes available
  useEffect(() => {
    if (userLocation && !panTarget) {
      setPanTarget({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [userLocation]);

  const handleCenterOnUser = () => {
    if (userLocation) {
      setPanTarget({ lat: userLocation.lat, lng: userLocation.lng });
    } else {
      alert('現在地がまだ取得できていません。位置情報の許可をご確認ください。');
    }
  };

  const handleFitAllLocations = () => {
    if (typeof google === 'undefined' || !google.maps) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;

    locations.forEach((s) => {
      if (s.lat !== null && s.lng !== null) {
        bounds.extend({ lat: s.lat, lng: s.lng });
        hasPoint = true;
      }
    });

    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      hasPoint = true;
    }

    if (hasPoint) {
      const center = bounds.getCenter();
      setPanTarget({ lat: center.lat(), lng: center.lng() });
    }
  };

  const setLocations = locations.filter(
    (l) => l.lat !== null && l.lng !== null
  ) as Array<LocationSlot & { lat: number; lng: number }>;

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-inner border border-slate-200 bg-slate-100">
      <APIProvider apiKey={apiKey} language="ja" region="JP">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <MapCameraController targetCenter={panTarget} />

          {/* 500m Circles for set locations */}
          {setLocations.map((s) => (
            <StationCircle
              key={`circle-${s.id}`}
              center={{ lat: s.lat, lng: s.lng }}
              radius={s.radiusMeters}
              strokeColor={s.color}
              fillColor={s.color}
              enabled={s.enabled}
              highlighted={selectedSlot === s.slotNumber}
            />
          ))}

          {/* AdvancedMarkers for set locations */}
          {setLocations.map((s) => {
            const dist = userLocation
              ? calculateDistanceMeters(userLocation.lat, userLocation.lng, s.lat, s.lng)
              : null;
            const isInside = dist !== null && dist <= s.radiusMeters;

            return (
              <AdvancedMarker
                key={`marker-${s.id}`}
                position={{ lat: s.lat, lng: s.lng }}
                title={`地点 #${s.slotNumber}: ${s.name}`}
                onClick={() => {
                  onSelectSlot(s.slotNumber);
                  onEditLocation(s);
                }}
              >
                <div className="relative flex flex-col items-center cursor-pointer group">
                  {/* Location label bubble */}
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md transition-transform group-hover:scale-110 flex items-center gap-1.5 whitespace-nowrap mb-1 ${
                      isInside
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 animate-pulse'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: s.color }}
                    />
                    <span>#{s.slotNumber} {s.name}</span>
                    {dist !== null && (
                      <span className="text-[10px] opacity-75 font-mono">
                        ({formatDistance(dist)})
                      </span>
                    )}
                  </div>

                  {/* Marker Pin */}
                  <Pin
                    background={s.color}
                    glyphColor="#ffffff"
                    borderColor="#ffffff"
                    scale={selectedSlot === s.slotNumber ? 1.25 : 1.05}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* User Current Location Marker */}
          {userLocation && (
            <AdvancedMarker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              title="現在地"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-8 h-8 rounded-full bg-blue-500 opacity-60 animate-ping" />
                <div className="relative w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Floating Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleCenterOnUser}
          title="現在地へ移動"
          className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Crosshair className="w-5 h-5 text-blue-600" />
        </button>

        <button
          onClick={handleFitAllLocations}
          title="全地点を表示"
          className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Maximize2 className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 現在地
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border border-blue-600 bg-blue-100 inline-block" /> 半径500m圏
        </span>
      </div>
    </div>
  );
};
