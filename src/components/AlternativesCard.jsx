import { alternatives } from '../lib/alternatives';
import { fmtClock } from '../lib/geo';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';
import CrowdPill from './CrowdPill';

const ICONS = { metro: 'train', taxi: 'car', bus: 'bus', bike: 'bike', walk: 'walk' };

// The metro next to the other ways to get there, so a crowded metro is not the only choice.
export default function AlternativesCard({ from, to, leaveMs, metro }) {
  const { t } = useLanguage();
  const rows = [
    {
      id: 'metro',
      minutes: metro.minutes,
      arriveMs: metro.arriveMs,
      crowd: metro.crowd,
      current: true,
    },
    ...alternatives(from, to, leaveMs),
  ];
  const fastest = Math.min(...rows.map((r) => r.minutes));
  const metroBusy = metro.crowd.status === 'crowded';

  return (
    <div className="alts" id="alt-card">
      <p className={`alts-lead ${metroBusy ? 'warn' : ''}`}>
        {metroBusy ? t('altSubBusy', { level: t(`crowd_${metro.crowd.level}`) }) : t('altSub')}
      </p>
      <ul className="alt-list">
        {rows.map((r) => (
          <li key={r.id} className={`alt-row ${r.current ? 'current' : ''}`}>
            <span className="alt-icon">
              <Icon name={ICONS[r.id]} size={20} />
            </span>
            <span className="alt-main">
              <strong>{t(`alt_${r.id}`)}</strong>
              <span className="muted small">
                {t('altArrive', { time: fmtClock(r.arriveMs) })}
                {r.traffic && ` · ${t(`altTraffic_${r.traffic}`)}`}
                {r.costMax > 0 && ` · ≈ ¥${r.costMin}${r.costMax > r.costMin ? `–${r.costMax}` : ''}`}
              </span>
            </span>
            <span className="alt-side">
              <b>
                {Math.round(r.minutes)} <small>{t('min')}</small>
              </b>
              {r.crowd ? (
                <CrowdPill crowd={r.crowd} showPct={false} />
              ) : r.minutes === fastest ? (
                <span className="tag tag-blue">{t('tagFastest')}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="estimate-note">
        <Icon name="info" size={13} />
        {t('altNote')}
      </p>
    </div>
  );
}
