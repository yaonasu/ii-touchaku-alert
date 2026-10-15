/**
 * Vibration & Web Notification Manager (Vibration Only)
 */

let vibrationInterval: number | null = null;

/**
 * Trigger repeating vibration pulses (Android / Mobile supported browsers)
 */
export function startRepeatingVibration(): void {
  stopRepeatingVibration();

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Vibrate pattern: 500ms vibrate, 250ms pause, 500ms vibrate, 250ms pause, 800ms vibrate
      navigator.vibrate([500, 250, 500, 250, 800]);
    } catch {
      // Ignore vibration error if blocked
    }

    // Repeat vibration every 3 seconds until stopped
    vibrationInterval = window.setInterval(() => {
      try {
        navigator.vibrate([500, 250, 500, 250, 800]);
      } catch {
        // ignore
      }
    }, 3000);
  }
}

/**
 * Stop repeating vibration
 */
export function stopRepeatingVibration(): void {
  if (vibrationInterval !== null) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
}

/**
 * Send Web Notification with vibration
 */
export async function sendWebNotification(
  stationName: string,
  distance: number
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification('📳 ii-到着通知（バイブ中）', {
        body: `まもなく「${stationName}」に到着します！（現在地から約${Math.round(distance)}m）`,
        tag: `station-arrival-${stationName}`,
        requireInteraction: true,
      });
    } catch (e) {
      console.warn('Failed to display notification:', e);
    }
  }
}
