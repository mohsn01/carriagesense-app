import { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { STATUS_COLOR, STATIONS, HOME_STATION } from '../data/simulationData';
import StatusBadge from '../components/StatusBadge';

// Deterministic confidence that drifts slowly with the clock, standing in
// for a real forecast model's confidence score.
function confidenceFor(tick) {
  return Math.round(78 + Math.sin(tick / 60) * 12);
}

export default function HomeScreen() {
  const { network, tick, setScreen } = useSimulation();
  const { t, lang } = useLanguage();

  const confidence = confidenceFor(tick);

  const overallStatus = useMemo(() => {
    const allSegs = network.flatMap((l) => l.segments);
    const avg = allSegs.reduce((s, seg) => s + seg.pct, 0) / allSegs.length;
    return avg;
  }, [network]);

  const walkMinutes = 6;
  const nextTrains = useMemo(() => {
    const base = tick % 60;
    return [Math.max(1, 3 - Math.floor(base / 30)), 9, 16];
  }, [tick]);

  const suggestWait = overallStatus >= 65;
  const waitFor = 6;

  return (
    <>
      <div className="card">
        <div className="card-title">
          <span>{t('networkNow')}</span>
          <StatusBadge live={false} confidence={confidence} />
        </div>

        {network.map((line) => (
          <div className="line-row" key={line.id}>
            <span className="line-name">{line.name[lang]}</span>
            <div className="line-track">
              {line.segments.map((seg, i) => (
                <div
                  key={i}
                  className="line-seg"
                  style={{ background: STATUS_COLOR[seg.status] }}
                  title={`${seg.from} → ${seg.to}: ${seg.pct}%`}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLOR.clear }} />
            {t('clear')}
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLOR.moderate }} />
            {t('moderate')}
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLOR.crowded }} />
            {t('crowded')}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{STATIONS[HOME_STATION].name[lang]}</div>
        <div className="info-row">
          <span className="info-label">{t('walkToStation')}</span>
          <span className="info-value">{walkMinutes} {t('min')}</span>
        </div>
        <div className="info-row">
          <span className="info-label">{t('nextTrains')}</span>
          <span className="info-value">
            {nextTrains.map((m) => `${m}${lang === 'en' ? 'm' : '分'}`).join('  ·  ')}
          </span>
        </div>
      </div>

      <div className="suggestion-box">
        <div className="suggestion-title">{t('suggestion')}</div>
        <div className="suggestion-text">
          {suggestWait ? t('waitMinutes', { n: waitFor }) : t('leaveNow')}
        </div>
      </div>

      <button className="primary-btn" onClick={() => setScreen('plan')}>
        {t('planTripCta')}
      </button>
    </>
  );
}
