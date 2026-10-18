import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { READING_LEVELS, getStationReading } from '../lib/crowd';
import { STATIONS } from '../data/gzMetro';
import Icon from './Icon';

const CHOICES = ['auto', 'quiet', 'moderate', 'busy', 'packed'];

// Demo tool: pretend the station's crowd sensor just reported a level. The plan
// reacts to it, and it fades back to the normal estimate within about 30 minutes.
// A real deployment would feed the same readings from the station's own system.
export default function CrowdSimulator({ stationId }) {
  const { setCrowdReading, crowdVersion } = useSimulation();
  const { t, lang } = useLanguage();
  const reading = getStationReading(stationId);
  const active = reading
    ? Object.entries(READING_LEVELS).find(([, pct]) => pct === reading.pct)?.[0] || 'auto'
    : 'auto';

  return (
    <div className="sim" data-v={crowdVersion}>
      <div className="sim-head">
        <Icon name="bolt" size={16} />
        <strong>{t('simTitle', { station: STATIONS[stationId].name[lang] })}</strong>
        <span className="tag tag-muted">{t('simBadge')}</span>
      </div>
      <div className="segmented sm sim-seg" role="radiogroup" aria-label={t('simTitle', { station: STATIONS[stationId].name[lang] })}>
        {CHOICES.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={active === c}
            className={active === c ? 'on' : ''}
            onClick={() => setCrowdReading(stationId, c === 'auto' ? null : c)}
          >
            {c === 'auto' ? t('simAuto') : c === 'packed' ? t('simPacked') : t(`crowd_${c}`)}
          </button>
        ))}
      </div>
      <p className="muted small">{reading ? t('simActive') : t('simHelp')}</p>
    </div>
  );
}
