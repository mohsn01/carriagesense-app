import { STATIONS } from '../data/gzMetro';
import { stationRush } from '../lib/crowd';
import { fmtClock } from '../lib/geo';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';
import CrowdPill from './CrowdPill';

function outlookText(rush, t) {
  const { outlook } = rush;
  if (outlook.kind === 'busyUntil') {
    return outlook.ms ? t('outlookBusyUntil', { time: fmtClock(outlook.ms) }) : t('outlookBusyLong');
  }
  if (outlook.kind === 'busySoon') return t('outlookBusySoon', { time: fmtClock(outlook.ms) });
  return t('outlookQuiet');
}

// Is this station in rush hour, and when does it ease (or start)? Includes a
// 3 hour bar chart in 30 minute steps. `compact` keeps just the headline.
// `now` is the first moment shown; `refNow` is the real current time, so a later first slot is labelled with its clock time.
export default function RushCard({ stationId, now, refNow = now, compact = false }) {
  const { t, lang } = useLanguage();
  const rush = stationRush(stationId, now, 3);
  const name = STATIONS[stationId].name[lang];
  const showQuietest = rush.quietest.index > 0 && rush.now.pct - rush.quietest.pct >= 10;

  const headline = (
    <div className="rush-head">
      <div>
        <h3 className="rush-title">{t('rushAt', { station: name })}</h3>
        <p className="rush-outlook">
          <Icon name="clock" size={14} />
          {outlookText(rush, t)}
        </p>
      </div>
      <CrowdPill crowd={rush.now} />
    </div>
  );

  if (compact) return <div className="rush compact">{headline}</div>;

  return (
    <div className="rush">
      {headline}
      <div className="bars" role="img" aria-label={t('rushAt', { station: name })}>
        {rush.slots.map((s) => (
          <div
            key={s.index}
            className={`bar-col ${s.index === 0 ? 'now' : ''} ${showQuietest && s.index === rush.quietest.index ? 'best' : ''}`}
            data-status={s.status}
          >
            <span className="bar-pct">{s.pct}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ height: `${s.pct}%` }} />
            </span>
            <span className="bar-time">{s.index === 0 && Math.abs(now - refNow) < 120000 ? t('now') : fmtClock(s.ms)}</span>
          </div>
        ))}
      </div>
      {showQuietest && (
        <p className="insight">
          <Icon name="sparkle" size={16} />
          {t('quietestAround', { time: fmtClock(rush.quietest.ms) })}
        </p>
      )}
      <p className="estimate-note">
        <Icon name="info" size={13} />
        {t('crowdEstimateNote')}
      </p>
    </div>
  );
}
