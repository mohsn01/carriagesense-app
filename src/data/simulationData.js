// Single source of truth for simulated crowding data.
// Swap `generateSnapshot` for a real feed by keeping the same shape:
// { lines: [...], stations: [...], train: {...} }

export const LINES = [
  {
    id: 'red',
    name: { en: 'Red Line', zh: '红线' },
    color: '#e5484d',
    stations: ['RD1', 'RD2', 'RD3', 'RD4', 'RD5', 'RD6'],
  },
  {
    id: 'blue',
    name: { en: 'Blue Line', zh: '蓝线' },
    color: '#3b82f6',
    stations: ['BL1', 'BL2', 'BL3', 'BL4', 'BL5'],
  },
  {
    id: 'green',
    name: { en: 'Green Line', zh: '绿线' },
    color: '#22c55e',
    stations: ['GR1', 'GR2', 'GR3', 'GR4', 'GR5', 'GR6', 'GR7'],
  },
];

export const STATIONS = {
  RD1: { id: 'RD1', name: { en: 'Harbour Point', zh: '海港角' }, line: 'red' },
  RD2: { id: 'RD2', name: { en: 'Maple Cross', zh: '枫桥' }, line: 'red' },
  RD3: { id: 'RD3', name: { en: 'Central Plaza', zh: '中央广场' }, line: 'red' },
  RD4: { id: 'RD4', name: { en: 'Museum Row', zh: '博物馆大道' }, line: 'red' },
  RD5: { id: 'RD5', name: { en: 'Riverside', zh: '河畔' }, line: 'red' },
  RD6: { id: 'RD6', name: { en: 'Northgate', zh: '北门' }, line: 'red' },
  BL1: { id: 'BL1', name: { en: 'Old Town', zh: '旧城' }, line: 'blue' },
  BL2: { id: 'BL2', name: { en: 'Central Plaza', zh: '中央广场' }, line: 'blue' },
  BL3: { id: 'BL3', name: { en: 'University', zh: '大学站' }, line: 'blue' },
  BL4: { id: 'BL4', name: { en: 'Tech Park', zh: '科技园' }, line: 'blue' },
  BL5: { id: 'BL5', name: { en: 'Airport West', zh: '机场西' }, line: 'blue' },
  GR1: { id: 'GR1', name: { en: 'Sunset Bay', zh: '日落湾' }, line: 'green' },
  GR2: { id: 'GR2', name: { en: 'Market Street', zh: '市场街' }, line: 'green' },
  GR3: { id: 'GR3', name: { en: 'Museum Row', zh: '博物馆大道' }, line: 'green' },
  GR4: { id: 'GR4', name: { en: 'City Hall', zh: '市政厅' }, line: 'green' },
  GR5: { id: 'GR5', name: { en: 'East Terminal', zh: '东站' }, line: 'green' },
  GR6: { id: 'GR6', name: { en: 'Hillcrest', zh: '山景' }, line: 'green' },
  GR7: { id: 'GR7', name: { en: 'Grand Park', zh: '大公园' }, line: 'green' },
};

// Home station for the demo passenger, and their usual destination.
export const HOME_STATION = 'RD1';
export const DEFAULT_DESTINATION = 'GR4';
export const DEFAULT_EXIT = 'Exit A';

export const EXITS_BY_STATION = {
  GR4: ['Exit A', 'Exit B', 'Exit C'],
  RD3: ['Exit A', 'Exit B'],
  BL4: ['Exit A', 'Exit B', 'Exit C', 'Exit D'],
};

// Carriage layout for a 6-car train. `exitDistanceM` is a static map of how
// far each carriage's doors are from each named exit, used by the cost function.
export const CARRIAGE_COUNT = 6;

export const CARRIAGE_EXIT_DISTANCE = {
  GR4: {
    'Exit A': [90, 70, 50, 20, 35, 60],
    'Exit B': [60, 40, 20, 45, 65, 85],
    'Exit C': [20, 35, 55, 75, 90, 100],
  },
  RD3: {
    'Exit A': [80, 55, 30, 15, 40, 65],
    'Exit B': [15, 35, 60, 80, 95, 110],
  },
  BL4: {
    'Exit A': [100, 75, 50, 25, 10, 30],
    'Exit B': [70, 50, 30, 15, 35, 55],
    'Exit C': [40, 25, 15, 35, 55, 75],
    'Exit D': [10, 30, 50, 70, 90, 105],
  },
};

// Which side the doors open on, per destination + exit combination.
export const DOOR_SIDE = {
  GR4: { 'Exit A': 'right', 'Exit B': 'left', 'Exit C': 'right' },
  RD3: { 'Exit A': 'left', 'Exit B': 'right' },
  BL4: { 'Exit A': 'right', 'Exit B': 'left', 'Exit C': 'left', 'Exit D': 'right' },
};

// Simple deterministic pseudo-random so the demo is reproducible per run.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Crowding oscillates with a slow sine wave (rush hour build-up/fade) plus
// gentle noise, so values drift visibly over the simulation clock.
export function crowdingLevel(seedOffset, tickSeconds) {
  const wave = Math.sin(tickSeconds / 45 + seedOffset) * 28;
  const noise = (rand() - 0.5) * 10;
  const base = 55 + wave + noise;
  return clamp(Math.round(base), 5, 98);
}

export function levelToStatus(pct) {
  if (pct >= 70) return 'crowded';
  if (pct >= 40) return 'moderate';
  return 'clear';
}

export const STATUS_COLOR = {
  crowded: '#e5484d',
  moderate: '#f5a524',
  clear: '#22c55e',
};

// Generates a full network snapshot at a given simulated tick (seconds elapsed).
export function generateNetworkSnapshot(tickSeconds) {
  return LINES.map((line, li) => ({
    ...line,
    segments: line.stations.slice(0, -1).map((from, i) => {
      const to = line.stations[i + 1];
      const pct = crowdingLevel(li * 3 + i * 0.7, tickSeconds);
      return {
        from,
        to,
        pct,
        status: levelToStatus(pct),
      };
    }),
  }));
}

// Generates the approaching 6-car train snapshot for the platform screen.
export function generateTrainSnapshot(tickSeconds, destinationId) {
  const carriages = Array.from({ length: CARRIAGE_COUNT }, (_, i) => {
    const pct = crowdingLevel(10 + i * 1.3, tickSeconds);
    return {
      index: i + 1,
      pct,
      status: levelToStatus(pct),
    };
  });
  return {
    id: `T-${Math.floor(tickSeconds / 90) % 100}`,
    etaSeconds: Math.max(5, 90 - (tickSeconds % 90)),
    carriages,
  };
}

// Cost function: combines crowding, expected queue and walking distance to
// pick the best carriage. Never recommends a carriage at or above 90% full.
const FULL_THRESHOLD = 90;

export function recommendCarriage(carriages, destinationId, exit) {
  const distances = CARRIAGE_EXIT_DISTANCE[destinationId]?.[exit];
  const scored = carriages.map((c) => {
    const walk = distances ? distances[c.index - 1] : 50;
    // expected queue rises non-linearly as crowding approaches capacity
    const queue = c.pct > 60 ? (c.pct - 60) * 1.8 : 0;
    const cost = c.pct * 0.6 + queue * 0.9 + walk * 0.25;
    return { ...c, walk, queue, cost };
  });
  const eligible = scored.filter((c) => c.pct < FULL_THRESHOLD);
  const pool = eligible.length ? eligible : scored;
  return pool.reduce((best, c) => (c.cost < best.cost ? c : best), pool[0]);
}

// Builds a station-by-station route between two stations, switching lines
// at a shared-name interchange when origin and destination are on different lines.
export function getRoute(originId, destId) {
  const originStation = STATIONS[originId];
  const destStation = STATIONS[destId];
  if (!originStation || !destStation) return [originId, destId];

  const segment = (lineId, fromId, toId) => {
    const line = LINES.find((l) => l.id === lineId);
    const fromIdx = line.stations.indexOf(fromId);
    const toIdx = line.stations.indexOf(toId);
    const [a, b] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    const slice = line.stations.slice(a, b + 1);
    return fromIdx < toIdx ? slice : slice.reverse();
  };

  if (originStation.line === destStation.line) {
    return segment(originStation.line, originId, destId);
  }

  const destLine = LINES.find((l) => l.id === destStation.line);
  let interchangeOnOrigin = null;
  let interchangeOnDest = null;
  for (const sid of LINES.find((l) => l.id === originStation.line).stations) {
    const match = destLine.stations.find(
      (dsid) => STATIONS[dsid].name.en === STATIONS[sid].name.en
    );
    if (match) {
      interchangeOnOrigin = sid;
      interchangeOnDest = match;
      break;
    }
  }
  if (!interchangeOnOrigin) return [originId, destId];

  const firstLeg = segment(originStation.line, originId, interchangeOnOrigin);
  const secondLeg = segment(destStation.line, interchangeOnDest, destId);
  return [...firstLeg, ...secondLeg.slice(1)];
}

export function nearestExitCarriage(carriages, destinationId, exit) {
  const distances = CARRIAGE_EXIT_DISTANCE[destinationId]?.[exit];
  if (!distances) return carriages[0];
  let bestIdx = 0;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] < distances[bestIdx]) bestIdx = i;
  }
  return carriages[bestIdx];
}
