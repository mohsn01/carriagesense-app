import { setStationReading } from './crowd';

// Optional live crowd feed. Set VITE_CROWD_API_URL (e.g. in a .env file) to an
// endpoint that returns the latest station readings as JSON:
//
//   [ { "station": "tiyuxilu", "pct": 78, "ts": 1760000000000 }, ... ]
//
//   station  id from src/data/gzMetro.js
//   pct      0-100, how full the station/platform is right now
//   ts       when it was measured (epoch ms); optional, defaults to now
//
// Each reading is applied exactly like the demo sensor, but marked as 'live',
// and eases back to the timetable/pattern model if the feed stops updating.
// With no URL configured, nothing runs and the app uses the model alone.
export function startCrowdFeed(onUpdate, intervalMs = 30000) {
  const url = import.meta.env.VITE_CROWD_API_URL;
  if (!url) return () => {};

  let stopped = false;
  async function poll() {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const rows = await res.json();
      rows.forEach((r) => {
        if (typeof r.station === 'string' && Number.isFinite(r.pct)) {
          setStationReading(r.station, r.pct, { setAt: r.ts || Date.now(), source: 'live' });
        }
      });
      if (!stopped) onUpdate();
    } catch {
      /* feed unavailable: keep using the model */
    }
  }
  poll();
  const id = setInterval(poll, intervalMs);
  return () => {
    stopped = true;
    clearInterval(id);
  };
}
