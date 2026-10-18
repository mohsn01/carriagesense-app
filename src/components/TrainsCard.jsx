import { STATIONS } from '../data/gzMetro';
import { buildSchedule, upcomingTrains } from '../lib/network';
import { trainCrowd } from '../lib/crowd';
import { fmtClock } from '../lib/geo';
import { useLanguage } from '../i18n/LanguageContext';
import LineBadge from './LineBadge';
import CrowdPill from './CrowdPill';

const MIN = 60000;

// The next trains you can catch on the first leg of the trip: when each leaves,
// how long it takes to reach the destination, and how busy it is expected to be.
export default function TrainsCard({ route, now, leaveMs }) {
  const { t, lang } = useLanguage();
  const leg = route.legs[0];
  const boardId = leg.stations[0];
  const walkMs = route.board.walkMin * MIN;

  const rows = upcomingTrains(leg.serviceId, boardId, leg.dir, leaveMs + walkMs, 4).map((dep) => {
    // Plan for reaching the platform just before this train, so it is the one chosen.
    const sched = buildSchedule(route, dep - walkMs - 1000, route.board.walkMin);
    const ride = sched.segs.find((s) => s.kind === 'ride');
    return {
      dep,
      ride: ride.minutes,
      arrive: sched.endMs,
      total: (sched.endMs - leaveMs) / MIN,
      crowd: trainCrowd(leg.serviceId, boardId, leg.dir, dep),
    };
  });
  const earliest = Math.min(...rows.map((r) => r.arrive));
  const quietest = rows.reduce((b, r) => (r.crowd.pct < b.crowd.pct ? r : b), rows[0]);
  const maxPct = Math.max(...rows.map((r) => r.crowd.pct));
  const legEnd = STATIONS[leg.stations[leg.stations.length - 1]].name[lang];

  return (
    <>
      <div className="trains-head">
        <LineBadge lineId={leg.lineId} />
        <div>
          <strong>{t('towardX', { toward: STATIONS[leg.toward].name[lang] })}</strong>
          <span className="muted small">{t('boardAt', { station: STATIONS[boardId].name[lang] })}</span>
        </div>
      </div>
      <ul className="train-rows">
        {rows.map((r) => {
          const inMin = Math.max(0, Math.round((r.dep - now) / MIN));
          return (
            <li key={r.dep} className="train-row">
              <span className="tr-when">
                <strong>{inMin === 0 ? t('arriving') : inMin}</strong>
                {inMin > 0 && <small>{t('min')}</small>}
              </span>
              <span className="tr-body">
                <span className="tr-top">
                  <b>{fmtClock(r.dep)}</b>
                  {r.arrive === earliest && <span className="tag tag-blue">{t('tagFastest')}</span>}
                  {r === quietest && maxPct - r.crowd.pct >= 6 && (
                    <span className="tag tag-teal">{t('tagQuietest')}</span>
                  )}
                </span>
                <span className="tr-sub">{t('rideTo', { n: Math.round(r.ride), station: legEnd })}</span>
                <span className="tr-sub strong">
                  {t('arriveTotal', { time: fmtClock(r.arrive), n: Math.round(r.total) })}
                </span>
              </span>
              <CrowdPill crowd={r.crowd} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
