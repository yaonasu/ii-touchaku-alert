import React from 'react';
import { LocationSlot, UserLocation } from '../types';
import { calculateDistanceMeters, formatDistance } from '../utils/geo';
import { Bell, BellOff, Navigation, ChevronRight, MapPin } from 'lucide-react';

interface StationCardProps {
  location: LocationSlot;
  userLocation: UserLocation | null;
  onEdit: () => void;
  onToggleEnabled: () => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  location,
  userLocation,
  onEdit,
  onToggleEnabled,
}) => {
  const isSet = location.lat !== null && location.lng !== null;

  const distance =
    isSet && userLocation
      ? calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          location.lat as number,
          location.lng as number
        )
      : null;

  const isInsideRadius = distance !== null && distance <= location.radiusMeters;
  const isApproaching = distance !== null && distance > location.radiusMeters && distance <= 1500;

  return (
    <div
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
      className={`rounded-2xl border transition-all duration-200 p-4 shadow-xs relative overflow-hidden cursor-pointer select-none group ${
        !isSet
          ? 'border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
          : location.enabled
          ? isInsideRadius
            ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400 animate-pulse'
            : isApproaching
            ? 'border-amber-400 bg-amber-50/50 hover:border-amber-500'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0"
            style={{ backgroundColor: location.color }}
          >
            #{location.slotNumber}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-base leading-tight truncate">
              {location.name || `地点 ${location.slotNumber}`}
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              {isSet ? (
                <>半径 500m でバイブ通知</>
              ) : (
                <span className="text-blue-600 font-medium flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  タップして地点を設定
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Toggle Switch (Only active if location is set) */}
        {isSet ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEnabled();
            }}
            title={location.enabled ? 'バイブ通知有効（クリックで停止）' : 'バイブ通知停止中（クリックで有効化）'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              location.enabled
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {location.enabled ? (
              <>
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>ON</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span>OFF</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center text-slate-400 group-hover:text-blue-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Distance Meter (Only if set) */}
      {isSet ? (
        <div className="mt-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">現在地からの距離:</span>
          </div>

          {distance !== null ? (
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold font-mono px-2 py-0.5 rounded-md ${
                  isInsideRadius
                    ? 'bg-emerald-600 text-white animate-bounce'
                    : isApproaching
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {formatDistance(distance)}
              </span>
              {isInsideRadius && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  圏内到達!
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">現在地取得中...</span>
          )}
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>未設定</span>
          <span className="text-blue-600 text-[11px] font-medium group-hover:underline">
            設定を開く &rarr;
          </span>
        </div>
      )}
    </div>
  );
};
