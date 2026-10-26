// Routing + timetable engine over the Guangzhou network.
//
// There is no free real-time arrivals feed, so train times are *timetable
// estimates*: every service runs on a fixed headway that depends on the time of
// day, and trains are assumed to leave each terminus on that grid. That is the
// same assumption a printed timetable makes, and it is labelled as such in the UI.
import { STATIONS, LINE_BY_ID, SERVICES, SERVICE_BY_ID } from '../data/gzMetro';
import { haversine, walkMinutes, walkMetres } from './geo';

const MIN = 60000;

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

// Minutes between two adjacent stations: dwell + running time. Over short city
// gaps a train averages about 33 km/h; over long gaps (the airport branch) it
// reaches much higher speeds, so average speed grows with the gap, capped at 80 km/h.
function edgeMinutes(aId, bId) {
  const km = haversine(STATIONS[aId], STATIONS[bId]) / 1000;
  const kmh = Math.min(80, 25 + 8 * km);
  return Math.max(1.4, 0.5 + ((km * 1.15) / kmh) * 60);
}

// offsets[serviceId][i] = minutes from the first station of the service to station i
const OFFSETS = {};
SERVICES.forEach((svc) => {
  const arr = [0];
  for (let i = 1; i < svc.stations.length; i++) {
    arr.push(arr[i - 1] + edgeMinutes(svc.stations[i - 1], svc.stations[i]));
  }
  OFFSETS[svc.id] = arr;
});

const nodeKey = (stationId, serviceId) => `${stationId}|${serviceId}`;

const ADJ = new Map(); // nodeKey -> [{ to, minutes, kind }]
const SERVICES_AT = {}; // stationId -> [serviceId]
function addEdge(a, b, minutes, kind) {
  if (!ADJ.has(a)) ADJ.set(a, []);
  ADJ.get(a).push({ to: b, minutes, kind });
}

SERVICES.forEach((svc) => {
  svc.stations.forEach((sid, i) => {
    (SERVICES_AT[sid] ||= []).push(svc.id);
    if (i > 0) {
      const prev = svc.stations[i - 1];
      const m = OFFSETS[svc.id][i] - OFFSETS[svc.id][i - 1];
      addEdge(nodeKey(prev, svc.id), nodeKey(sid, svc.id), m, 'ride');
      addEdge(nodeKey(sid, svc.id), nodeKey(prev, svc.id), m, 'ride');
    }
  });
});

// Interchange edges between services that share a station.
Object.entries(SERVICES_AT).forEach(([sid, ids]) => {
  ids.forEach((a) => {
    ids.forEach((b) => {
      if (a === b) return;
      const same = SERVICE_BY_ID[a].lineId === SERVICE_BY_ID[b].lineId;
      addEdge(nodeKey(sid, a), nodeKey(sid, b), same ? 2 : transferMinutes(sid), 'transfer');
    });
  });
});

// Bigger interchanges take longer to walk through.
function transferMinutes(stationId) {
  const n = (SERVICES_AT[stationId] || []).length;
  return n >= 3 ? 5 : 4;
}

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------

function hourOf(ms) {
  const d = new Date(ms);
  return d.getHours() + d.getMinutes() / 60;
}

export function headwayAt(serviceId, ms) {
  const svc = SERVICE_BY_ID[serviceId];
  const h = hourOf(ms);
  const peak = (h >= 7 && h < 9.5) || (h >= 17 && h < 19.5);
  const late = h < 6.5 || h >= 22;
  const base = peak ? svc.headway.peak : late ? svc.headway.late : svc.headway.day;
  return base * svc.headwayScale;
}

export function isServiceHours(ms) {
  const h = hourOf(ms);
  return h >= 6 && h < 23.5;
}

// 06:00 on the next day the metro opens (today if it is before 06:00).
function nextOpening(ms) {
  const d = new Date(ms);
  if (hourOf(ms) >= 6) d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d.getTime();
}

function serviceHash(id) {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(6, 0, 0, 0);
  return d.getTime();
}

// Next train at `stationId` on `serviceId` heading in `dir` (+1 = along the
// station list, -1 = against it) at or after `atMs`. Returns epoch ms.
export function nextDeparture(serviceId, stationId, dir, requestedMs) {
  // Outside service hours the next train is the first one of the morning.
  const atMs = isServiceHours(requestedMs) ? requestedMs : nextOpening(requestedMs);
  const svc = SERVICE_BY_ID[serviceId];
  const idx = svc.stations.indexOf(stationId);
  const last = svc.stations.length - 1;
  const total = OFFSETS[serviceId][last];
  // Offset of this station from the terminus the train started at.
  const offsetMin = dir === 1 ? OFFSETS[serviceId][idx] : total - OFFSETS[serviceId][idx];
  const headMs = headwayAt(serviceId, atMs) * MIN;
  // Spread services apart so lines do not all depart on the same second.
  const phase = (serviceHash(serviceId) % 120) * 1000 + (dir === 1 ? 0 : 53000);
  const start = dayStart(atMs) + phase;
  const k = Math.max(0, Math.ceil((atMs - offsetMin * MIN - start) / headMs));
  return start + k * headMs + offsetMin * MIN;
}

// ---------------------------------------------------------------------------
// Nearest stations
// ---------------------------------------------------------------------------

export function linesAt(stationId) {
  const set = new Set();
  (SERVICES_AT[stationId] || []).forEach((sv) => set.add(SERVICE_BY_ID[sv].lineId));
  return [...set].map((id) => LINE_BY_ID[id]);
}

export function nearestStations(point, count = 3) {
  return Object.values(STATIONS)
    .map((s) => {
      const meters = haversine(point, s);
      return { station: s, meters, walkMin: walkMinutes(meters), lines: linesAt(s.id) };
    })
    .sort((a, b) => a.meters - b.meters)
    .slice(0, count);
}

// ---------------------------------------------------------------------------
// Route search (Dijkstra over station x service nodes)
// ---------------------------------------------------------------------------

function dijkstra(starts) {
  // starts: [{ key, cost }]
  const dist = new Map();
  const prev = new Map();
  const queue = [];
  starts.forEach((s) => {
    if (!dist.has(s.key) || s.cost < dist.get(s.key)) {
      dist.set(s.key, s.cost);
      queue.push([s.cost, s.key]);
    }
  });
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0]);
    const [cost, key] = queue.shift();
    if (cost > dist.get(key)) continue;
    for (const edge of ADJ.get(key) || []) {
      const next = cost + edge.minutes;
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, { from: key, kind: edge.kind });
        queue.push([next, edge.to]);
      }
    }
  }
  return { dist, prev };
}

// Turns a node path into ride legs: [{ serviceId, lineId, stations, dir }]
function legsFromPath(keys) {
  const legs = [];
  keys.forEach((key) => {
    const [sid, svcId] = key.split('|');
    const last = legs[legs.length - 1];
    if (last && last.serviceId === svcId) {
      if (last.stations[last.stations.length - 1] !== sid) last.stations.push(sid);
    } else {
      legs.push({ serviceId: svcId, lineId: SERVICE_BY_ID[svcId].lineId, stations: [sid] });
    }
  });
  return legs
    .filter((l) => l.stations.length > 1)
    .map((l) => {
      const svc = SERVICE_BY_ID[l.serviceId];
      const dir = svc.stations.indexOf(l.stations[1]) > svc.stations.indexOf(l.stations[0]) ? 1 : -1;
      const toward = dir === 1 ? svc.stations[svc.stations.length - 1] : svc.stations[0];
      return { ...l, dir, toward };
    });
}

const EXPECTED_WAIT = 3; // average wait used only to *rank* candidate routes

/**
 * Finds the best route between two points through the metro, trying the few
 * nearest stations at each end. Returns null if the points are not worth a metro trip.
 */
export function planRoute(from, to) {
  const originCands = nearestStations(from, 4);
  const destCands = nearestStations(to, 4);

  let best = null;
  originCands.forEach((oc) => {
    const starts = (SERVICES_AT[oc.station.id] || []).map((sv) => ({
      key: nodeKey(oc.station.id, sv),
      cost: oc.walkMin + EXPECTED_WAIT,
    }));
    const { dist, prev } = dijkstra(starts);
    destCands.forEach((dc) => {
      (SERVICES_AT[dc.station.id] || []).forEach((sv) => {
        const key = nodeKey(dc.station.id, sv);
        if (!dist.has(key)) return;
        const total = dist.get(key) + dc.walkMin + 1.5;
        if (!best || total < best.score) {
          best = { score: total, oc, dc, key, prev };
        }
      });
    });
  });
  if (!best) return null;

  // Rebuild the node path.
  const keys = [];
  let cursor = best.key;
  while (cursor) {
    keys.unshift(cursor);
    cursor = best.prev.get(cursor)?.from;
  }
  const legs = legsFromPath(keys);

  // Same boarding and alighting station: nothing to ride.
  if (!legs.length) return { sameStation: true, board: best.oc, alight: best.dc, legs: [] };

  return {
    from,
    to,
    board: best.oc,
    alight: best.dc,
    legs,
    // Direct walking is shorter than metro for very short trips.
    directWalkMeters: walkMetres(from, to),
  };
}

// ---------------------------------------------------------------------------
// Scheduling a route for a given moment
// ---------------------------------------------------------------------------

const TRANSFER_MIN = (sid) => transferMinutes(sid);

/**
 * Builds a timed itinerary: walk -> wait -> ride -> transfer -> wait -> ride ... -> exit -> walk.
 *  startMs    when the walk to the first station begins
 *  walkInMin  minutes to reach the boarding station (live GPS can shorten this)
 *  opts.notBefore  earliest time the first train may leave (to skip a train)
 */
export function buildSchedule(route, startMs, walkInMin, walkOutMin = route.alight.walkMin, opts = {}) {
  const segs = [];
  let t = startMs;

  const push = (seg) => {
    segs.push({ ...seg, startMs: t, endMs: t + seg.minutes * MIN });
    t += seg.minutes * MIN;
  };

  push({ kind: 'walk', minutes: Math.max(0, walkInMin), to: route.board.station.id, phase: 'in' });

  route.legs.forEach((leg, i) => {
    const boardId = leg.stations[0];
    const alightId = leg.stations[leg.stations.length - 1];
    // `notBefore` lets the passenger skip a crowded train and take a later one.
    const dep = nextDeparture(leg.serviceId, boardId, leg.dir, i === 0 ? Math.max(t, opts.notBefore || 0) : t);
    push({
      kind: 'wait',
      minutes: (dep - t) / MIN,
      at: boardId,
      leg: i,
      serviceId: leg.serviceId,
      lineId: leg.lineId,
      toward: leg.toward,
      dir: leg.dir,
    });
    const svc = SERVICE_BY_ID[leg.serviceId];
    const a = svc.stations.indexOf(boardId);
    const b = svc.stations.indexOf(alightId);
    const rideMin = Math.abs(OFFSETS[svc.id][b] - OFFSETS[svc.id][a]);
    // Time the train reaches each stop of this leg, for the live "stops left" display.
    const stopOffsets = leg.stations.map((st) =>
      Math.abs(OFFSETS[svc.id][svc.stations.indexOf(st)] - OFFSETS[svc.id][a])
    );
    push({
      kind: 'ride',
      minutes: rideMin,
      stopOffsetsMin: stopOffsets,
      leg: i,
      from: boardId,
      to: alightId,
      stations: leg.stations,
      serviceId: leg.serviceId,
      lineId: leg.lineId,
      toward: leg.toward,
      dir: leg.dir,
    });
    if (i < route.legs.length - 1) {
      push({ kind: 'transfer', minutes: TRANSFER_MIN(alightId), at: alightId, leg: i });
    }
  });

  push({ kind: 'exit', minutes: 1.5, at: route.alight.station.id });
  push({ kind: 'walk', minutes: Math.max(0, walkOutMin), from: route.alight.station.id, phase: 'out' });

  const firstWait = segs.find((s) => s.kind === 'wait');
  return {
    // First train is more than an hour away: the metro is closed right now.
    closed: !!firstWait && firstWait.minutes > 60,
    segs,
    startMs,
    endMs: t,
    totalMin: (t - startMs) / MIN,
    firstTrainInMin: firstWait ? firstWait.minutes : 0,
    boardMs: firstWait ? firstWait.endMs : startMs,
    arriveStationMs: segs.find((s) => s.kind === 'exit')?.startMs ?? t,
  };
}

// Upcoming departures at a station for the "next trains" list.
export function upcomingTrains(serviceId, stationId, dir, fromMs, count = 3) {
  const out = [];
  let t = fromMs;
  for (let i = 0; i < count; i++) {
    const d = nextDeparture(serviceId, stationId, dir, t);
    out.push(d);
    t = d + 1000;
  }
  return out;
}

// Stations a train passes between two stops, for the live "stops left" count.
export function stationIndex(serviceId, stationId) {
  return SERVICE_BY_ID[serviceId].stations.indexOf(stationId);
}

// Every service stop at a station: [{ serviceId, index, length }]
export function serviceStationsAt(stationId) {
  return (SERVICES_AT[stationId] || []).map((serviceId) => {
    const svc = SERVICE_BY_ID[serviceId];
    return { serviceId, index: svc.stations.indexOf(stationId), length: svc.stations.length };
  });
}

/**
 * Departure board for one station: every line and direction with its next
 * trains. Rows: [{ serviceId, lineId, dir, toward, times: [epoch ms] }]
 */
export function departuresAt(stationId, fromMs, count = 3) {
  const rows = [];
  serviceStationsAt(stationId).forEach(({ serviceId, index, length }) => {
    const svc = SERVICE_BY_ID[serviceId];
    [1, -1].forEach((dir) => {
      if ((dir === 1 && index === length - 1) || (dir === -1 && index === 0)) return;
      const toward = dir === 1 ? svc.stations[length - 1] : svc.stations[0];
      rows.push({
        serviceId,
        lineId: svc.lineId,
        dir,
        toward,
        times: upcomingTrains(serviceId, stationId, dir, fromMs, count),
      });
    });
  });
  return rows.sort((a, b) => a.times[0] - b.times[0]);
}
