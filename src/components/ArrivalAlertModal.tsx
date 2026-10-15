import React, { useEffect } from 'react';
import { LocationSlot } from '../types';
import { formatDistance } from '../utils/geo';
import { startRepeatingVibration, stopRepeatingVibration } from '../utils/audio';
import { Smartphone, CheckCircle, Clock } from 'lucide-react';

interface ArrivalAlertModalProps {
  location: LocationSlot;
  currentDistance: number;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const ArrivalAlertModal: React.FC<ArrivalAlertModalProps> = ({
  location,
  currentDistance,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    // Start repeating vibration
    startRepeatingVibration();

    return () => {
      stopRepeatingVibration();
    };
  }, [location]);

  const handleDismiss = () => {
    stopRepeatingVibration();
    onDismiss();
  };

  const handleSnooze = (minutes: number) => {
    stopRepeatingVibration();
    onSnooze(minutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-emerald-500 animate-in zoom-in-95 text-center p-6 sm:p-8 relative">
        {/* Pulsing vibration icon */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg animate-pulse">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
          半径500m到達・バイブ作動中
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          まもなく「{location.name}」
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          設定地点の半径 <strong className="text-emerald-700">{location.radiusMeters}m</strong> 圏内に到着しました。
        </p>

        {/* Distance Display */}
        <div className="mt-4 py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 inline-block w-full">
          <div className="text-xs text-emerald-800 font-medium">現在地からの直線距離</div>
          <div className="text-3xl font-black text-emerald-900 font-mono mt-0.5">
            約 {formatDistance(currentDistance)}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          乗り過ごしにご注意ください。お荷物をお確かめの上、降車の準備をしてください。
        </p>

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleDismiss}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            バイブを止める（到着確認）
          </button>

          <button
            onClick={() => handleSnooze(3)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            3分間スヌーズ（再バイブ）
          </button>
        </div>
      </div>
    </div>
  );
};
