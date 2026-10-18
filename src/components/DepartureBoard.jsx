import { STATIONS } from '../data/gzMetro';
import { departuresAt } from '../lib/network';
import { trainCrowd } from '../lib/crowd';
import { useLanguage } from '../i18n/LanguageContext';
import LineBadge from './LineBadge';
import CrowdPill from './CrowdPill';

const MIN = 60000;

// Every line and direction at a station with the next trains and how busy the
// first one is expected to be. Times come from the timetable model.
// `fromMs` is when you would be at the station; minutes are counted from `now`.
export default function DepartureBoard({ stationId, fromMs, now, count = 3 }) {
  const { t, lang } = useLanguage();
  const rows = departuresAt(stationId, fromMs, count);
  return (
    <ul className="board">
      {rows.map((r) => {
        const mins = r.times.map((ms) => Math.max(0, Math.round((ms - now) / MIN)));
        return (
          <li key={`${r.serviceId}-${r.dir}`} className="board-row">
            <LineBadge lineId={r.lineId} />
            <span className="board-main">
              <strong>{t('towardX', { toward: STATIONS[r.toward].name[lang] })}</strong>
              <span className="board-times">
                {mins.map((m, i) => (
                  <span key={i} className={i === 0 ? 'first' : ''}>
                    {m === 0 ? t('arriving') : m}
                  </span>
                ))}
                <small>{t('min')}</small>
              </span>
            </span>
            <CrowdPill crowd={trainCrowd(r.serviceId, stationId, r.dir, r.times[0])} showPct={false} />
          </li>
        );
      })}
    </ul>
  );
}
