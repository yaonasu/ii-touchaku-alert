import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  MapMouseEvent,
  useMap,
} from '@vis.gl/react-google-maps';
import { LocationSlot, UserLocation } from '../types';
import { StationCircle } from './StationCircle';
import { X, Check, Smartphone, Search } from 'lucide-react';

interface StationEditModalProps {
  location: LocationSlot;
  userLocation: UserLocation | null;
  apiKey: string;
  onSave: (updated: LocationSlot) => void;
  onClose: () => void;
}

// Inner helper to pan modal map
function ModalMapPanHelper({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
  }, [map, target]);
  return null;
}

export const StationEditModal: React.FC<StationEditModalProps> = ({
  location,
  userLocation,
  apiKey,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(location.name);

  // Default position: if location already set -> location position; if not -> userLocation or Tokyo
  const defaultInitialCenter =
    location.lat !== null && location.lng !== null
      ? { lat: location.lat, lng: location.lng }
      : userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 35.6812, lng: 139.7671 };

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    location.lat !== null && location.lng !== null
      ? { lat: location.lat, lng: location.lng }
      : null
  );

  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [enabled, setEnabled] = useState(location.enabled || (location.lat === null));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Map click inside modal to position the location
  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const { lat, lng } = e.detail.latLng;
    setPosition({ lat, lng });
  };

  // Search geocode inside modal
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      setIsSearching(true);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
        setIsSearching(false);
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          setPosition({ lat, lng });
          setPanTarget({ lat, lng });

          // Auto-suggest name if empty or generic
          const placeName =
            results[0].address_components?.find((c: any) =>
              c.types?.includes('point_of_interest') || c.types?.includes('transit_station')
            )?.long_name || results[0].formatted_address?.split(',')[0] || searchQuery;

          if (!name || name.startsWith('地点') || name === location.name) {
            setName(placeName);
          }
          setSearchQuery('');
        } else {
          alert(`「${searchQuery}」が見つかりませんでした。別の名称を入力するか、地図上をタップしてください。`);
        }
      });
    }
  };

  const handleSave = () => {
    if (!position) {
      alert('地図上をタップして地点の位置を指定してください。');
      return;
    }

    onSave({
      ...location,
      name: name.trim() || `地点 ${location.slotNumber}`,
      lat: position.lat,
      lng: position.lng,
      radiusMeters: 500,
      vibrateAlert: true,
      enabled: true, // Auto-enable when set and saved
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header with Save Button placed immediately left of X close button */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span
              className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs"
              style={{ backgroundColor: location.color }}
            >
              #{location.slotNumber}
            </span>
            <h2 className="text-base font-extrabold text-slate-800">
              地点 #{location.slotNumber} の設定
            </h2>
          </div>

          {/* Action buttons at top right: Save on the left, X on the right */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Location Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              地点名・目的地の名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 自宅、会社、目的地点など"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-sm"
            />
          </div>

          {/* Map Area */}
          <div>
            {/* Search input above map */}
            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名称や住所で地図を移動..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
                className="w-full pl-9 pr-16 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50"
              >
                {isSearching ? '検索中' : '移動'}
              </button>
            </div>

            {/* Embedded Map Container */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
              <APIProvider apiKey={apiKey} language="ja" region="JP">
                <Map
                  defaultCenter={defaultInitialCenter}
                  defaultZoom={position ? 15 : 14}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  onClick={handleMapClick}
                  className="w-full h-full"
                >
                  <ModalMapPanHelper target={panTarget} />

                  {/* 500m radius circle around position if selected */}
                  {position && (
                    <StationCircle
                      center={position}
                      radius={500}
                      strokeColor={location.color}
                      fillColor={location.color}
                      enabled={true}
                      highlighted={true}
                    />
                  )}

                  {/* Marker */}
                  {position && (
                    <AdvancedMarker
                      position={position}
                      title={name || `地点 #${location.slotNumber}`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-900 border border-slate-200 shadow-sm whitespace-nowrap mb-0.5">
                          {name || `地点 #${location.slotNumber}`}
                        </div>
                        <Pin
                          background={location.color}
                          glyphColor="#ffffff"
                          borderColor="#ffffff"
                          scale={1.15}
                        />
                      </div>
                    </AdvancedMarker>
                  )}
                </Map>
              </APIProvider>

              {/* Guide Overlay Badge */}
              <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex justify-center">
                <span className="bg-slate-900/80 text-white px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-xs shadow-xs text-center">
                  👆 地図上をタップすると位置が設定され、半径500mの円が表示されます
                </span>
              </div>
            </div>
          </div>

          {/* Alarm Enabled Toggle */}
          <div className="pt-1">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    到着時にバイブレーションで通知する
                  </div>
                  <div className="text-[11px] text-slate-500">
                    設定地点の半径500m以内に入った瞬間にスマホが振動します
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
