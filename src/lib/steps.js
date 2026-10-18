import { STATIONS, LINE_BY_ID } from '../data/gzMetro';
import { fmtClock, fmtDistance, walkMetres } from './geo';
import { upcomingTrains } from './network';

const MIN = 60000;

/**
 * Turns a timed schedule into the list of instructions shown to the passenger.
 * Each step remembers which schedule segments it covers (segs) so the live
 * tracker can highlight the current one.
 */
export function buildSteps(sched, route, exit, lang, t) {
  const name = (id) => STATIONS[id].name[lang];
  const steps = [];
  const segs = sched.segs;

  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];

    if (s.kind === 'walk' && s.phase === 'in') {
      const meters = walkMetres(route.from, STATIONS[route.board.station.id]);
      steps.push({
        key: 'walk-in',
        icon: 'walk',
        title: t('stepWalkTo', { place: name(route.board.station.id) }),
        sub: `${fmtDistance(meters)} · ${Math.max(1, Math.round(s.minutes))} ${t('min')}`,
        startMs: s.startMs,
        segs: [i],
      });
    } else if (s.kind === 'wait') {
      const ride = segs[i + 1];
      const lineName = LINE_BY_ID[s.lineId].name[lang];
      const stops = ride.stations.length - 1;
      const next = upcomingTrains(s.serviceId, s.at, s.dir, s.endMs + 1000, 2).map((ms) =>
        Math.round((ms - s.endMs) / MIN)
      );
      steps.push({
        key: `ride-${s.leg}`,
        lineId: s.lineId,
        title: t('stepRide', { line: lineName, toward: name(s.toward) }),
        sub: t(stops === 1 ? 'stepRideSub1' : 'stepRideSub', {
          dep: fmtClock(s.endMs),
          wait: Math.max(0, Math.round(s.minutes)),
          stops,
          to: name(ride.to),
        }),
        extra: t('stepNextTrains', { a: next[0], b: next[1] }),
        startMs: s.startMs,
        segs: [i, i + 1],
      });
      i += 1;
    } else if (s.kind === 'transfer') {
      const nextWait = segs[i + 1];
      steps.push({
        key: `transfer-${s.leg}`,
        icon: 'swap',
        title: t('stepChange', { line: LINE_BY_ID[nextWait.lineId].name[lang], station: name(s.at) }),
        sub: t('stepChangeSub', { n: Math.round(s.minutes) }),
        startMs: s.startMs,
        segs: [i],
      });
    } else if (s.kind === 'exit') {
      const label = exit?.ref
        ? t('stepExitRef', { ref: exit.ref })
        : t('stepExitDir', { dir: t(`dir${exit?.direction || 'N'}`) });
      steps.push({
        key: 'exit',
        icon: 'exit',
        title: label,
        sub: name(s.at),
        startMs: s.startMs,
        segs: [i],
      });
    } else if (s.kind === 'walk' && s.phase === 'out') {
      steps.push({
        key: 'walk-out',
        icon: 'pin',
        title: t('stepWalkTo', { place: t('yourDestination') }),
        sub: `${exit ? fmtDistance(exit.walkMeters) : ''} · ${Math.max(1, Math.round(s.minutes))} ${t('min')}`,
        startMs: s.startMs,
        segs: [i],
      });
    }
  }
  return steps;
}
