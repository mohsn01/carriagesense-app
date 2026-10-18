// Crowding *estimate* for trains and stations.
//
// There is no free live passenger-count feed, so this models what a regular
// commuter already knows: crowding follows the clock (weekday morning and evening
// peaks, quieter midday and weekends), the direction of travel (towards the city
// centre in the morning, away from it in the evening), and the station (central
// stations and interchanges are busier than the outer ends of the lines).
// Everything is deterministic, so the same train always gets the same answer.
import { STATIONS, SERVICE_BY_ID } from '../data/gzMetro';
import { haversine } from './geo';
import { linesAt, serviceStationsAt } from './network';

const CENTER = { lat: 23.125, lng: 113.3 }; // between the old city and Tianhe
const LINE_FACTOR = { 1: 1.08, 2: 1.05, 3: 1.08, 5: 1.05, 6: 0.92, 8: 0.92 };

const gauss = (h, mu, sigma) => Math.exp(-((h - mu) ** 2) / (2 * sigma * sigma));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function hourOf(ms) {
  const d = new Date(ms);
  return d.getHours() + d.getMinutes() / 60;
}

function isWeekend(ms) {
  const day = new Date(ms).getDay();
  return day === 0 || day === 6;
}

// 0..1: how much passenger demand there is at this moment.
export function demandAt(ms) {
  const h = hourOf(ms);
  if (h < 6 || h >= 23.5) return 0.04;
  if (isWeekend(ms)) {
    return clamp(0.12 + 0.36 * gauss(h, 11.5, 2.6) + 0.42 * gauss(h, 17.5, 2.4), 0, 1);
  }
  const morning = gauss(h, 8.1, 0.85);
  const evening = gauss(h, 18.1, 1.0);
  const midday = 0.38 * gauss(h, 13, 2.6);
  return clamp(0.14 + 0.86 * morning + 0.86 * evening + midday, 0, 1);
}

// +1 in the morning rush towards the centre / the evening rush away from it,
// -1 for the opposite flow. Fades to 0 outside rush hours and at weekends.
function directionTilt(ms, inbound) {
  if (isWeekend(ms)) return 0;
  const h = hourOf(ms);
  const flow = gauss(h, 8.1, 1.2) - gauss(h, 18.1, 1.4);
  return (inbound ? 1 : -1) * flow;
}

function distToCenter(stationId) {
  return haversine(STATIONS[stationId], CENTER);
}

function stationFactor(stationId, isTerminus) {
  const centrality = Math.max(0, 1 - distToCenter(stationId) / 14000);
  const hub = linesAt(stationId).length > 1 ? 0.1 : 0;
  return 0.92 + 0.28 * centrality + hub - (isTerminus ? 0.08 : 0);
}

function hashNoise(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000; // 0..1
}

// ---------------------------------------------------------------------------
// Station readings
// ---------------------------------------------------------------------------
// A reading is a measurement of how crowded a station is *right now*, e.g. from
// a station sensor, gate counts or a transit-agency feed. It overrides the model
// for that station and fades back to the model over time, because a reading says
// little about what the crowd will be like in an hour.
//
//   setStationReading('tiyuxilu', 85)           // from a live feed
//   setStationReading('tiyuxilu', 85, { source: 'demo' })   // simulated, for demos
//   setStationReading('tiyuxilu', null)         // back to the model
//
// source: 'live' | 'demo'. The UI labels demo readings as such.
const readings = new Map(); // stationId -> { pct, setAt, source }
const FADE_MINUTES = { live: 5, demo: 5 };

export const READING_LEVELS = { quiet: 18, moderate: 48, busy: 72, packed: 92 };

export function setStationReading(stationId, pct, { setAt = Date.now(), source = 'live' } = {}) {
  if (pct == null) readings.delete(stationId);
  else readings.set(stationId, { pct: clamp(pct, 0, 100), setAt, source });
}

export function getStationReading(stationId) {
  return readings.get(stationId) || null;
}

export function clearStationReadings() {
  readings.clear();
}

function applyReading(stationId, modelPct, atMs) {
  const r = readings.get(stationId);
  if (!r) return modelPct;
  const minutes = Math.max(0, atMs - r.setAt) / 60000;
  const weight = Math.exp(-minutes / FADE_MINUTES[r.source]);
  return Math.round(clamp(modelPct * (1 - weight) + r.pct * weight, 4, 100));
}

export const LEVELS = [
  { key: 'quiet', max: 35, status: 'clear' },
  { key: 'moderate', max: 60, status: 'moderate' },
  { key: 'busy', max: 82, status: 'crowded' },
  { key: 'packed', max: Infinity, status: 'crowded' },
];

export function levelOf(pct) {
  return LEVELS.find((l) => pct < l.max);
}

/**
 * Estimated load of the train leaving `stationId` on `serviceId` in direction `dir`
 * (+1 along the station list, -1 against it) at `atMs`.
 * Returns { pct, level, status, seat } where pct is "% of capacity, estimated".
 */
export function trainCrowd(serviceId, stationId, dir, atMs, { jitter = true } = {}) {
  const svc = SERVICE_BY_ID[serviceId];
  const idx = svc.stations.indexOf(stationId);
  const next = svc.stations[idx + dir] || svc.stations[idx - dir];
  const inbound = distToCenter(next) < distToCenter(stationId);
  const terminus = idx === 0 || idx === svc.stations.length - 1;

  const base =
    demandAt(atMs) *
    60 *
    stationFactor(stationId, terminus) *
    (LINE_FACTOR[svc.lineId] || 1) *
    (1 + 0.22 * directionTilt(atMs, inbound));
  const noise = jitter ? (hashNoise(`${serviceId}${dir}${Math.round(atMs / 60000)}`) - 0.5) * 0.16 : 0;
  const modelPct = Math.round(clamp(base * (1 + noise), 4, 100));
  const pct = applyReading(stationId, modelPct, atMs);
  const level = levelOf(pct);
  return { pct, level: level.key, status: level.status, seat: pct < 45, adjusted: pct !== modelPct };
}

/** Average crowding across every line and direction at a station. */
export function stationCrowd(stationId, atMs) {
  const loads = [];
  serviceStationsAt(stationId).forEach(({ serviceId, index, length }) => {
    if (index < length - 1) loads.push(trainCrowd(serviceId, stationId, 1, atMs, { jitter: false }).pct);
    if (index > 0) loads.push(trainCrowd(serviceId, stationId, -1, atMs, { jitter: false }).pct);
  });
  const pct = Math.round(loads.reduce((a, b) => a + b, 0) / Math.max(1, loads.length));
  const level = levelOf(pct);
  return { pct, level: level.key, status: level.status };
}

/**
 * Station crowding for the next `hours` in 30 minute steps, plus the rush-hour
 * outlook ("busy until 09:30" / "gets busy around 17:30") and the quietest slot.
 */
export function stationRush(stationId, fromMs, hours = 3) {
  const slots = [];
  for (let i = 0; i <= hours * 2; i++) {
    const ms = fromMs + i * 30 * 60000;
    slots.push({ index: i, ms, ...stationCrowd(stationId, ms) });
  }
  const now = slots[0];
  const isBusy = (s) => s.pct >= 60;
  let outlook;
  if (isBusy(now)) {
    const end = slots.find((s) => !isBusy(s));
    outlook = { kind: 'busyUntil', ms: end ? end.ms : null };
  } else {
    const start = slots.find((s) => isBusy(s));
    outlook = start ? { kind: 'busySoon', ms: start.ms } : { kind: 'quiet', ms: null };
  }
  const quietest = slots.reduce((b, s) => (s.pct < b.pct ? s : b), slots[0]);
  return { slots, now, outlook, quietest, peak: slots.reduce((b, s) => (s.pct > b.pct ? s : b), slots[0]) };
}
