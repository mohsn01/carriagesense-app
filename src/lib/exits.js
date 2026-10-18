import { bearing, compass, haversine, walkMetres } from './geo';

// Station exits are looked up live from OpenStreetMap (railway=subway_entrance
// nodes carry the exit letter in `ref`). If the lookup fails or the station has
// no mapped exits, the planner falls back to a compass direction.
const memory = new Map();

// Public Overpass servers are often busy, so try a couple of mirrors with a short timeout.
const OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const TIMEOUT_MS = 8000;

async function queryOverpass(query, signal) {
  let lastError = new Error('Exit lookup failed');
  for (const base of OVERPASS) {
    try {
      const timeout = AbortSignal.timeout(TIMEOUT_MS);
      const res = await fetch(`${base}?data=${encodeURIComponent(query)}`, {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      if (res.ok) return await res.json();
      lastError = new Error(`Exit lookup failed (${res.status})`);
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

function cacheKey(station) {
  return `cs-exits-${station.id}`;
}

export async function fetchExits(station, signal) {
  if (memory.has(station.id)) return memory.get(station.id);
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey(station)) || 'null');
    if (cached) {
      memory.set(station.id, cached);
      return cached;
    }
  } catch {
    /* ignore unreadable cache */
  }

  const query = `[out:json][timeout:10];node["railway"="subway_entrance"](around:260,${station.lat},${station.lng});out body;`;
  const json = await queryOverpass(query, signal);
  const exits = (json.elements || [])
    .map((n) => {
      const raw = (n.tags?.ref || n.tags?.name || '').toString();
      const ref = raw.match(/[A-Za-z]\d*/)?.[0]?.toUpperCase();
      return ref ? { ref, lat: n.lat, lng: n.lon } : null;
    })
    .filter(Boolean);

  memory.set(station.id, exits);
  try {
    localStorage.setItem(cacheKey(station), JSON.stringify(exits));
  } catch {
    /* cache is optional */
  }
  return exits;
}

/**
 * Best way out of `station` to reach `destination`.
 * Returns { ref|null, direction, walkMeters } — ref is the exit letter when known.
 */
export function chooseExit(station, destination, exits) {
  const direction = compass(bearing(station, destination));
  if (exits?.length) {
    let best = exits[0];
    let bestD = haversine(best, destination);
    exits.forEach((e) => {
      const d = haversine(e, destination);
      if (d < bestD) {
        best = e;
        bestD = d;
      }
    });
    return {
      ref: best.ref,
      direction: compass(bearing(station, best)),
      walkMeters: bestD * 1.3,
    };
  }
  return { ref: null, direction, walkMeters: walkMetres(station, destination) };
}
