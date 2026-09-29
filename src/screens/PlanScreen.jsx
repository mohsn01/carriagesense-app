import { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { STATIONS, EXITS_BY_STATION } from '../data/simulationData';

export default function PlanScreen() {
  const { origin, setOrigin, destination, setDestination, exit, setExit, setScreen, tick } =
    useSimulation();
  const { t, lang } = useLanguage();

  const stationList = Object.values(STATIONS);
  const exits = EXITS_BY_STATION[destination] || ['Exit A'];

  const breakdown = useMemo(() => {
    const walk = 6;
    const wait = 2 + (tick % 5);
    const ride = 14;
    return { walk, wait, ride, total: walk + wait + ride };
  }, [origin, destination, tick]);

  const total = breakdown.total;
  const pct = (v) => `${((v / total) * 100).toFixed(0)}%`;

  return (
    <>
      <div className="card">
        <div className="card-title">{t('planTitle')}</div>

        <div className="select-group" style={{ marginBottom: 12 }}>
          <label className="select-label">{t('origin')}</label>
          <select
            className="select-input"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            {stationList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name[lang]}
              </option>
            ))}
          </select>
        </div>

        <div className="select-group" style={{ marginBottom: 12 }}>
          <label className="select-label">{t('destination')}</label>
          <select
            className="select-input"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setExit((EXITS_BY_STATION[e.target.value] || ['Exit A'])[0]);
            }}
          >
            {stationList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name[lang]}
              </option>
            ))}
          </select>
        </div>

        <div className="select-group">
          <label className="select-label">{t('preferredExit')}</label>
          <select className="select-input" value={exit} onChange={(e) => setExit(e.target.value)}>
            {exits.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('journeyBreakdown')}</div>
        <div className="breakdown-bar">
          <div style={{ width: pct(breakdown.walk), background: '#4da3ff' }} />
          <div style={{ width: pct(breakdown.wait), background: '#f5a524' }} />
          <div style={{ width: pct(breakdown.ride), background: '#22c55e' }} />
        </div>
        <div className="breakdown-legend">
          <span>{t('walking')} {breakdown.walk}{t('min')}</span>
          <span>{t('waiting')} {breakdown.wait}{t('min')}</span>
          <span>{t('riding')} {breakdown.ride}{t('min')}</span>
        </div>
        <div className="info-row" style={{ marginTop: 8 }}>
          <span className="info-label">{t('totalTime')}</span>
          <span className="info-value">{total} {t('min')}</span>
        </div>
      </div>

      <button className="primary-btn" onClick={() => setScreen('platform')}>
        {t('goToPlatform')}
      </button>
    </>
  );
}
