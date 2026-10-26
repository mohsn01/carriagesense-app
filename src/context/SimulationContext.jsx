import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LANDMARKS, STATIONS } from '../data/gzMetro';
import { haversine, lerp, pointAlong, walkMinutes } from '../lib/geo';
import { buildSchedule, planRoute } from '../lib/network';
import { clearStationReadings, setStationReading, READING_LEVELS } from '../lib/crowd';
import { loadSaved, storeSaved } from '../lib/places';
import { fetchExits, chooseExit } from '../lib/exits';
import { useGeolocation } from '../lib/useGeolocation';
import { startCrowdFeed } from '../lib/crowdFeed';

const AppContext = createContext(null);

export const DEPART_OFFSETS = [0, 5, 10, 15, 20, 30];
export const MAX_LEAVE_MIN = 240;
const MIN = 60000;
const FIX_MAX_AGE_MS = 30000;
const FIX_MAX_ACCURACY_M = 150;
const DEMO_SPEED = 14; // demo clock runs 14x so a whole trip fits in about two minutes

// Demo scenario (the CarriageSense story): Naomi lives a few minutes' walk from Tiyu Xilu,
// where Line 1 meets Line 3, and commutes to Baiyun Airport on a weekday morning at 08:20.
const DEMO_FROM = { id: 'demo-home', kind: 'demo', name: { en: 'Home (Tianhe)', zh: '家（天河）' }, lat: 23.1318, lng: 113.3176 };
const DEMO_TO = { ...LANDMARKS.find((l) => l.id === 'lm-airport'), kind: 'landmark' };

// Where the passenger is according to the timetable, for when GPS is missing
// (underground) and for the demo.
function estimatePosition(trip, now) {
  const { sched, route } = trip;
  const seg = sched.segs.find((s) => now < s.endMs) || sched.segs[sched.segs.length - 1];
  const f =
    seg.endMs > seg.startMs ? Math.min(1, Math.max(0, (now - seg.startMs) / (seg.endMs - seg.startMs))) : 1;
  const board = STATIONS[route.board.station.id];
  const alight = STATIONS[route.alight.station.id];
  switch (seg.kind) {
    case 'walk':
      return seg.phase === 'in' ? lerp(route.from, board, f) : lerp(alight, route.to, f);
    case 'wait':
    case 'transfer':
      return STATIONS[seg.at];
    case 'exit':
      return alight;
    case 'ride':
      return pointAlong(
        seg.stations.map((id) => STATIONS[id]),
        f
      );
    default:
      return board;
  }
}

function segmentIndex(sched, now) {
  const i = sched.segs.findIndex((s) => now < s.endMs);
  return i === -1 ? sched.segs.length : i;
}

// Re-times the itinerary from the passenger's real progress. Before boarding,
// the walk is re-measured from the live GPS fix, so a slow walk can mean a later
// train; on the final walk the remaining distance is re-measured the same way.
function advanceTrip(trip, now, fix) {
  const { sched, route } = trip;
  const idx = segmentIndex(sched, now);
  if (idx >= sched.segs.length) return trip;
  const seg = sched.segs[idx];

  if (idx === 0) {
    // Without a real fix the timetable estimate stands; with one, re-measure.
    if (!fix) return trip;
    const meters = haversine(fix, STATIONS[route.board.station.id]);
    const remaining = meters < 45 ? 0 : walkMinutes(meters);
    return { ...trip, sched: buildSchedule(route, now, remaining, route.alight.walkMin, { notBefore: trip.notBefore }) };
  }

  if (seg.kind === 'walk' && seg.phase === 'out' && fix) {
    const remaining = walkMinutes(haversine(fix, route.to));
    const end = now + remaining * MIN;
    const segs = sched.segs.map((s, i) =>
      i === sched.segs.length - 1 ? { ...s, endMs: end, minutes: remaining } : s
    );
    return { ...trip, sched: { ...sched, segs, endMs: end } };
  }
  return trip;
}

export function SimulationProvider({ children }) {
  const [screen, setScreen] = useState('plan');
  const [saved, setSaved] = useState(loadSaved);
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);
  const [leaveOffset, setLeaveOffsetState] = useState(0); // minutes from now until you leave
  const [crowdVersion, setCrowdVersion] = useState(0); // bumps when a station reading changes
  const [picker, setPicker] = useState(null); // 'from' | 'to' | 'home' | 'work' | null
  const [pickOnMap, setPickOnMap] = useState(null); // same targets, while choosing on the map
  const [trip, setTrip] = useState(null);
  const [exitInfo, setExitInfo] = useState(null); // { loading, exits, error }
  const [demo, setDemo] = useState(false);

  const geo = useGeolocation();

  // Live station crowd readings, if a feed is configured (see src/lib/crowdFeed.js).
  useEffect(() => startCrowdFeed(() => setCrowdVersion((v) => v + 1)), []);

  // ---- clock (virtual while the demo runs) --------------------------------
  const demoClock = useRef(null); // { baseMs, realStart, paused }
  const skew = useRef(0); // demo controls jump the clock forward by moving this
  const clock = useCallback(() => {
    const d = demoClock.current;
    // While the passenger is still deciding, demo time stands still.
    const base = d ? (d.paused ? d.baseMs : d.baseMs + (Date.now() - d.realStart) * DEMO_SPEED) : Date.now();
    return base + skew.current;
  }, []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(clock()), 1000);
    return () => clearInterval(id);
  }, [clock]);

  // ---- starting point -----------------------------------------------------
  // "My location" follows the GPS but only re-plans once the user has moved a
  // real distance, so the plan does not jitter with every fix.
  const gpsFixFresh =
    geo.fix && Date.now() - geo.fix.ts < FIX_MAX_AGE_MS && geo.fix.accuracy <= FIX_MAX_ACCURACY_M
      ? geo.fix
      : null;
  const anchorRef = useRef(null);
  const wantsGps = fromPlace?.kind === 'gps';
  if (wantsGps && geo.fix) {
    if (!anchorRef.current || haversine(anchorRef.current, geo.fix) > 150) {
      anchorRef.current = { lat: geo.fix.lat, lng: geo.fix.lng };
    }
  }
  const fromPoint = wantsGps ? anchorRef.current : fromPlace ? { lat: fromPlace.lat, lng: fromPlace.lng } : null;
  const toPoint = toPlace ? { lat: toPlace.lat, lng: toPlace.lng } : null;

  const route = useMemo(
    () => (fromPoint && toPoint ? planRoute(fromPoint, toPoint) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fromPoint?.lat, fromPoint?.lng, toPoint?.lat, toPoint?.lng]
  );

  // The preset times plus whatever custom time is selected, in order.
  const options = useMemo(() => {
    if (!route || route.sameStation) return [];
    const offsets = [...new Set([...DEPART_OFFSETS, leaveOffset])].sort((a, b) => a - b);
    return offsets.map((offset) => ({
      offset,
      sched: buildSchedule(route, now + offset * MIN, route.board.walkMin),
    }));
  }, [route, now, leaveOffset]);
  const selected = options.find((o) => o.offset === leaveOffset) || options[0] || null;

  function setLeaveOffset(minutes) {
    setLeaveOffsetState(Math.max(0, Math.min(MAX_LEAVE_MIN, Math.round(minutes))));
  }

  // ---- exits at the destination station -----------------------------------
  const alightId = route?.alight?.station?.id;
  useEffect(() => {
    if (!alightId) return undefined;
    const controller = new AbortController();
    setExitInfo({ loading: true, exits: null });
    fetchExits(STATIONS[alightId], controller.signal)
      .then((exits) => setExitInfo({ loading: false, exits }))
      .catch((err) => {
        if (err.name !== 'AbortError') setExitInfo({ loading: false, exits: null, error: true });
      });
    return () => controller.abort();
  }, [alightId]);

  const exitChoice = useMemo(() => {
    if (!alightId || !toPoint) return null;
    return chooseExit(STATIONS[alightId], toPoint, exitInfo?.exits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alightId, toPoint?.lat, toPoint?.lng, exitInfo]);

  // ---- trip ---------------------------------------------------------------
  // In the demo the "GPS" is generated from the timetable, and drops out
  // underground just like a real phone would.
  const demoFix = useMemo(() => {
    if (!demo || !trip) return null;
    const seg = trip.sched.segs.find((s) => now < s.endMs);
    if (!seg || seg.kind !== 'walk') return null;
    return { ...estimatePosition(trip, now), accuracy: 12, ts: Date.now() };
  }, [demo, trip, now]);

  const liveFix = demo ? demoFix : gpsFixFresh;

  useEffect(() => {
    // The demo's fix is derived from the timetable itself, so it must not re-time it.
    setTrip((prev) => (prev ? advanceTrip(prev, now, demo || prev.manual ? null : liveFix) : prev));
    // The 1 s clock tick is the cadence; liveFix is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const tripInfo = useMemo(() => {
    if (!trip) return null;
    const { sched, route: r } = trip;
    const idx = segmentIndex(sched, now);
    const arrived = idx >= sched.segs.length;
    const seg = arrived ? sched.segs[sched.segs.length - 1] : sched.segs[idx];
    const pos = liveFix || estimatePosition(trip, now);

    let gpsState;
    if (demo) gpsState = liveFix ? 'live' : 'weak';
    else if (gpsFixFresh) gpsState = 'live';
    else if (geo.status === 'live') gpsState = 'weak';
    else gpsState = geo.status; // idle | asking | denied | unavailable | error

    let stopsLeft = null;
    let nextStopId = null;
    if (seg.kind === 'ride' && !arrived) {
      const times = seg.stopOffsetsMin.map((o) => seg.startMs + o * MIN);
      const found = times.findIndex((t, i) => i > 0 && t > now);
      const ni = found === -1 ? seg.stations.length - 1 : found;
      nextStopId = seg.stations[ni];
      stopsLeft = seg.stations.length - ni;
    }

    const last = sched.segs[sched.segs.length - 1];
    return {
      idx,
      seg,
      arrived,
      pos,
      gpsState,
      etaMs: sched.endMs,
      minutesLeft: Math.max(0, Math.ceil((sched.endMs - now) / MIN)),
      stopsLeft,
      nextStopId,
      remainingWalkM: seg === last && seg.kind === 'walk' ? haversine(pos, r.to) : null,
    };
  }, [trip, now, liveFix, gpsFixFresh, geo.status, demo]);

  function startTrip() {
    if (!route || route.sameStation || !selected) return;
    const startMs = now + selected.offset * MIN;
    const sched = buildSchedule(route, startMs, route.board.walkMin);
    // The demo clock starts running only now, from the moment the passenger leaves.
    if (demo && demoClock.current?.paused) {
      demoClock.current = { baseMs: startMs, realStart: Date.now(), paused: false };
      setNow(startMs);
    }
    setTrip({ route, sched, startedAt: startMs, notBefore: 0 });
    setScreen('trip');
    if (!demo && fromPlace?.kind === 'gps') geo.start();
  }

  function endTrip() {
    skew.current = 0;
    setTrip(null);
    // In the demo, ending the trip resets the scenario so it can be played again.
    if (demo) startDemo();
    else setScreen('plan');
  }

  // ---- places -------------------------------------------------------------
  function choosePlace(target, place) {
    if (target === 'from') setFromPlace(place);
    else if (target === 'to') setToPlace(place);
    else if (target === 'home' || target === 'work') {
      const next = { ...saved, [target]: { ...place, kind: 'saved' } };
      setSaved(next);
      storeSaved(next);
    }
    if (place?.kind === 'gps') geo.start();
    setPicker(null);
    setPickOnMap(null);
    setScreen(target === 'home' || target === 'work' ? 'me' : 'plan');
  }

  function clearSaved(key) {
    const next = { ...saved };
    delete next[key];
    setSaved(next);
    storeSaved(next);
  }

  function swapPlaces() {
    setFromPlace(toPlace);
    setToPlace(fromPlace);
  }

  // ---- demo ---------------------------------------------------------------
  const demoBase = useRef(0);
  function startDemo() {
    // The demo plays a weekday 08:20 (morning rush), using the most recent weekday if today is a weekend.
    const base = new Date();
    while (base.getDay() === 0 || base.getDay() === 6) base.setDate(base.getDate() - 1);
    base.setHours(8, 20, 0, 0);
    skew.current = 0;
    clearStationReadings();
    setCrowdVersion((v) => v + 1);
    demoBase.current = base.getTime();
    // Time is paused: the demo waits for the passenger to decide, it never starts a trip itself.
    demoClock.current = { baseMs: base.getTime(), realStart: Date.now(), paused: true };
    setNow(base.getTime());
    setDemo(true);
    setTrip(null);
    setFromPlace(DEMO_FROM);
    setToPlace(DEMO_TO);
    setLeaveOffsetState(0);
    setScreen('plan');
  }

  // Change the demo's time of day (only while it is waiting for a decision).
  function setDemoTime(hour, minute) {
    if (!demoClock.current?.paused) return;
    const d = new Date(demoBase.current);
    d.setHours(hour, minute, 0, 0);
    demoClock.current = { ...demoClock.current, baseMs: d.getTime() };
    clearStationReadings();
    setCrowdVersion((v) => v + 1);
    setNow(clock());
  }

  function stopDemo() {
    demoClock.current = null;
    skew.current = 0;
    clearStationReadings();
    setCrowdVersion((v) => v + 1);
    setNow(Date.now());
    setDemo(false);
    setTrip(null);
  }

  // ---- demo controls and station readings ----------------------------------
  // Jump the clock so the trip reaches `targetMs` (used by the presenter buttons).
  function skipTo(targetMs) {
    skew.current += targetMs - clock();
    setNow(clock());
    setTrip((prev) => (prev ? { ...prev, manual: true } : prev));
  }

  // Simulate a reading from a station sensor: 'quiet' | 'moderate' | 'busy' | 'packed' | null (auto).
  function setCrowdReading(stationId, level) {
    setStationReading(stationId, level ? READING_LEVELS[level] : null, { setAt: now, source: 'demo' });
    setCrowdVersion((v) => v + 1);
  }

  // At the platform: let this train go and take the next one.
  function waitForNextTrain() {
    setTrip((prev) => {
      if (!prev) return prev;
      const idx = segmentIndex(prev.sched, now);
      const seg = prev.sched.segs[idx];
      if (!seg || seg.kind !== 'wait' || seg.leg !== 0) return prev;
      const notBefore = seg.endMs + 1000;
      const sched = buildSchedule(prev.route, now, 0, prev.route.alight.walkMin, { notBefore });
      return { ...prev, sched, notBefore };
    });
  }

  // A link ending in ?demo=1 (for example from a QR code) opens the app straight into the demo.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') startDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    screen,
    setScreen,
    now,
    saved,
    fromPlace,
    toPlace,
    setFromPlace,
    setToPlace,
    choosePlace,
    clearSaved,
    swapPlaces,
    picker,
    setPicker,
    pickOnMap,
    setPickOnMap,
    leaveOffset,
    setLeaveOffset,
    crowdVersion,
    skipTo,
    setDemoTime,
    setCrowdReading,
    waitForNextTrain,
    fromPoint,
    toPoint,
    route,
    options,
    selected,
    exitChoice,
    exitInfo,
    geo,
    gpsFixFresh,
    liveFix,
    trip,
    tripInfo,
    startTrip,
    endTrip,
    demo,
    startDemo,
    stopDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
