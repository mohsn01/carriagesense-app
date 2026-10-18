import { useCallback, useEffect, useRef, useState } from 'react';

// Live device position via the standard Geolocation API. It works in browsers
// (HTTPS or localhost) and inside the Android app (the WebView prompts for the
// location permission declared in AndroidManifest.xml).
export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', fix: null });
  const watchId = useRef(null);

  const start = useCallback(() => {
    if (watchId.current != null) return;
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, status: 'unavailable' }));
      return;
    }
    setState((s) => ({ ...s, status: s.fix ? s.status : 'asking' }));
    watchId.current = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          status: 'live',
          fix: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            ts: pos.timestamp,
          },
        }),
      (err) => {
        // Permission denied is final; other errors (timeout, no signal) can recover.
        if (err.code === 1) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
          setState((s) => ({ ...s, status: 'denied' }));
        } else {
          setState((s) => ({ ...s, status: s.fix ? 'live' : 'error' }));
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }, []);

  const stop = useCallback(() => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setState({ status: 'idle', fix: null });
  }, []);

  useEffect(
    () => () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    },
    []
  );

  return { ...state, start, stop };
}
