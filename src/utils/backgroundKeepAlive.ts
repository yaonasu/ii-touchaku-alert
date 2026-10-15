/**
 * Background Keep-Alive Engine for Web & PWA
 *
 * Browsers typically suspend JavaScript timers and GPS watching when the screen is locked
 * or when the user switches to another app.
 * By running an active HTML5 Audio playback stream (silent PCM track) and MediaSession,
 * mobile browsers (Android Chrome, iOS Safari) keep the process alive in the background!
 */

// 1-second silent WAV file encoded in Base64
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==';

let keepAliveAudio: HTMLAudioElement | null = null;
let wakeLockSentinel: any = null;

export interface BackgroundKeepAliveState {
  isActive: boolean;
  hasWakeLock: boolean;
  hasAudioKeepAlive: boolean;
  error?: string;
}

/**
 * Start background keep-alive using silent audio playback & screen WakeLock
 */
export async function startBackgroundKeepAlive(): Promise<BackgroundKeepAliveState> {
  let audioStarted = false;
  let wakeLockAcquired = false;
  let errorMessage: string | undefined;

  // 1. Silent HTML5 Audio playback to keep background thread running
  try {
    if (!keepAliveAudio) {
      keepAliveAudio = new Audio(SILENT_WAV_BASE64);
      keepAliveAudio.loop = true;
      keepAliveAudio.volume = 0.01; // inaudible
    }
    await keepAliveAudio.play();
    audioStarted = true;

    // Register MediaSession so Android/iOS display a persistent audio control
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'ii-到着通知監視中',
        artist: 'GPS半径500m到着監視',
        album: 'バックグラウンド動作中',
      });
      navigator.mediaSession.playbackState = 'playing';

      // Keep playing even if lock screen controls are touched
      navigator.mediaSession.setActionHandler('play', () => {
        keepAliveAudio?.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // user paused
      });
    }
  } catch (err: any) {
    console.warn('Silent audio keep-alive start failed:', err);
    errorMessage = 'バックグラウンド音声の開始にユーザー操作が必要です。';
  }

  // 2. Request WakeLock (Screen stay-on)
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockAcquired = true;
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } catch (err) {
      console.warn('WakeLock request failed:', err);
    }
  }

  return {
    isActive: audioStarted || wakeLockAcquired,
    hasAudioKeepAlive: audioStarted,
    hasWakeLock: wakeLockAcquired,
    error: errorMessage,
  };
}

/**
 * Stop background keep-alive
 */
export async function stopBackgroundKeepAlive(): Promise<void> {
  if (keepAliveAudio) {
    try {
      keepAliveAudio.pause();
      keepAliveAudio.currentTime = 0;
    } catch {
      // ignore
    }
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
  }

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}
