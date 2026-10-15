import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface StationCircleProps {
  center: { lat: number; lng: number };
  radius: number;
  strokeColor: string;
  fillColor: string;
  enabled?: boolean;
  highlighted?: boolean;
}

export function StationCircle({
  center,
  radius,
  strokeColor,
  fillColor,
  enabled = true,
  highlighted = false,
}: StationCircleProps) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: highlighted ? '#ef4444' : strokeColor,
      strokeOpacity: enabled ? 0.9 : 0.35,
      strokeWeight: highlighted ? 3 : enabled ? 2 : 1,
      fillColor: highlighted ? '#ef4444' : fillColor,
      fillOpacity: highlighted ? 0.3 : enabled ? 0.18 : 0.06,
      clickable: false,
      zIndex: highlighted ? 10 : 2,
    });

    circleRef.current = circle;

    return () => {
      circle.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
      circleRef.current.setOptions({
        strokeColor: highlighted ? '#ef4444' : strokeColor,
        strokeOpacity: enabled ? 0.9 : 0.35,
        strokeWeight: highlighted ? 3 : enabled ? 2 : 1,
        fillColor: highlighted ? '#ef4444' : fillColor,
        fillOpacity: highlighted ? 0.3 : enabled ? 0.18 : 0.06,
        zIndex: highlighted ? 10 : 2,
      });
    }
  }, [center, radius, strokeColor, fillColor, enabled, highlighted]);

  return null;
}
