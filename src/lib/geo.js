// Small geodesy helpers (WGS-84, metres).
const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Initial bearing a -> b in degrees (0 = north, clockwise).
export function bearing(a, b) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function compass(bearingDeg) {
  return COMPASS[Math.round(bearingDeg / 45) % 8];
}

export function lerp(a, b, f) {
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}

// Street distance is longer than the crow flies; 1.3 is a common urban factor.
export const STREET_FACTOR = 1.3;
export const WALK_M_PER_MIN = 78; // ~4.7 km/h

export function walkMinutes(metres) {
  return (metres * STREET_FACTOR) / WALK_M_PER_MIN;
}

export function walkMetres(a, b) {
  return haversine(a, b) * STREET_FACTOR;
}

// Total length of a polyline of {lat,lng} points.
export function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i]);
  return total;
}

// Point at fraction f (0..1) along a polyline.
export function pointAlong(points, f) {
  if (points.length === 1) return points[0];
  const target = Math.max(0, Math.min(1, f)) * pathLength(points);
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = haversine(points[i - 1], points[i]);
    if (acc + seg >= target) return lerp(points[i - 1], points[i], seg === 0 ? 0 : (target - acc) / seg);
    acc += seg;
  }
  return points[points.length - 1];
}

export function fmtDistance(metres) {
  if (metres < 950) return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function fmtClock(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// True when `ms` falls on a later calendar day than `refMs` (e.g. the first train tomorrow).
export function isNextDay(ms, refMs) {
  const a = new Date(ms);
  const b = new Date(refMs);
  return a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth() || a.getDate() !== b.getDate();
}
