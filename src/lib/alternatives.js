import { haversine } from './geo';
import { demandAt, levelOf } from './crowd';

// Rough comparison of other ways to make the same trip, so a passenger who sees a
// crowded metro can decide not to go. These are ESTIMATES from distance and time
// of day only: there is no live bus or traffic data behind them.
const MIN = 60000;

function isPeak(ms) {
  const d = new Date(ms);
  const h = d.getHours() + d.getMinutes() / 60;
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  return !weekend && ((h >= 7 && h < 9.5) || (h >= 17 && h < 19.5));
}

const round5 = (v) => Math.round(v / 5) * 5;

/**
 * Other ways to get from `from` to `to` when leaving at `leaveMs`.
 * Returns [{ id, minutes, arriveMs, costMin, costMax, traffic, crowd }] for the options that make sense.
 */
export function alternatives(from, to, leaveMs) {
  const km = (haversine(from, to) * 1.35) / 1000; // road distance
  const peak = isPeak(leaveMs);
  const out = [];

  // Taxi or ride-hailing: Guangzhou flag fall is about ¥12 for 3 km, then about ¥2.6 per km.
  // Short trips crawl through city streets; long ones use the expressway.
  const share = Math.min(1, Math.max(0, (km - 8) / 20));
  const taxiSpeed = (peak ? 17 : 30) + ((peak ? 38 : 60) - (peak ? 17 : 30)) * share;
  const taxiMin = 4 + (km / taxiSpeed) * 60;
  const taxiCost = km <= 3 ? 12 : 12 + (km - 3) * 2.6;
  out.push({
    id: 'taxi',
    minutes: taxiMin,
    costMin: round5(taxiCost * 0.9),
    costMax: round5(taxiCost * 1.25 + 2),
    traffic: peak ? 'heavy' : 'normal',
  });

  // Bus: wait + walking to and from stops + a winding route at bus speed.
  // Very long trips (e.g. to the airport) are not a normal city-bus journey, so none is offered.
  const busMin = 6 + 7 + ((km * 1.1) / (peak ? 12 : 17)) * 60;
  if (km <= 20) out.push({
    id: 'bus',
    minutes: busMin,
    costMin: 2,
    costMax: 5,
    traffic: peak ? 'heavy' : 'normal',
    crowd: (() => {
      const pct = Math.round(demandAt(leaveMs) * 70);
      const level = levelOf(pct);
      return { pct, level: level.key, status: level.status };
    })(),
  });

  if (km <= 10) {
    out.push({ id: 'bike', minutes: 3 + (km / 13) * 60, costMin: 1, costMax: 3, traffic: null });
  }
  if (km <= 5) {
    out.push({ id: 'walk', minutes: (km / 4.7) * 60, costMin: 0, costMax: 0, traffic: null });
  }

  return out.map((o) => ({ ...o, arriveMs: leaveMs + o.minutes * MIN }));
}
