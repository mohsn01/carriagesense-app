import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { fmtClock } from '../lib/geo';
import Icon from './Icon';

const TIMES = [
  { key: 'demoT_morning', h: 8, m: 20 },
  { key: 'demoT_lunch', h: 12, m: 30 },
  { key: 'demoT_before', h: 17, m: 40 },
  { key: 'demoT_evening', h: 18, m: 0 },
  { key: 'demoT_late', h: 21, m: 30 },
];

// Shown while the demo is waiting for the passenger's decision. Time is paused,
// nothing starts by itself, and the time of day can be changed to compare crowds.
export default function DemoBanner() {
  const { now, setDemoTime } = useSimulation();
  const { t } = useLanguage();
  const d = new Date(now);
  const current = d.getHours() * 60 + d.getMinutes();

  return (
    <section className="card demo-banner span-all">
      <div className="demo-banner-head">
        <Icon name="play" size={18} />
        <div>
          <strong>{t('demoBannerTitle', { time: fmtClock(now) })}</strong>
          <span className="muted small">{t('demoBannerHint')}</span>
        </div>
      </div>
      <div className="chips-scroll" role="radiogroup" aria-label={t('demoTimeLabel')}>
        {TIMES.map((x) => {
          const on = current === x.h * 60 + x.m;
          return (
            <button
              key={x.key}
              role="radio"
              aria-checked={on}
              className={`chip ${on ? 'on' : ''}`}
              onClick={() => setDemoTime(x.h, x.m)}
            >
              {t(x.key)} · {String(x.h).padStart(2, '0')}:{String(x.m).padStart(2, '0')}
            </button>
          );
        })}
      </div>
    </section>
  );
}
