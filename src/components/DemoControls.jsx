import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';

const MIN = 60000;

// Presenter buttons that move the trip forward without waiting or travelling.
// They jump the clock to the next moment of the journey, so every number on
// screen (ETA, stops left, crowd, exit) updates as if time had passed.
export default function DemoControls({ info, trip }) {
  const { skipTo, now } = useSimulation();
  const { t } = useLanguage();
  const { seg, arrived, nextStopId } = info;
  if (arrived) return null;

  let primary;
  if (seg.kind === 'walk' && seg.phase === 'in') primary = { key: 'skipAtStation', to: seg.endMs };
  else if (seg.kind === 'wait') primary = { key: 'skipBoarded', to: seg.endMs };
  else if (seg.kind === 'ride') {
    const i = nextStopId ? seg.stations.indexOf(nextStopId) : seg.stations.length - 1;
    primary = { key: 'skipNextStop', to: seg.startMs + seg.stopOffsetsMin[i] * MIN };
  } else if (seg.kind === 'transfer') primary = { key: 'skipChanged', to: seg.endMs };
  else if (seg.kind === 'exit') primary = { key: 'skipOutside', to: seg.endMs };
  else primary = { key: 'skipDestination', to: seg.endMs };

  const jump = (to) => skipTo(Math.max(to, now) + 400);

  return (
    <section className="card demo-controls span-all-sm">
      <div className="card-head">
        <div>
          <h2 className="card-title">{t('demoControls')}</h2>
          <p className="muted small">{t('demoControlsHint')}</p>
        </div>
        <Icon name="play" size={20} className="muted" />
      </div>
      <div className="demo-buttons">
        <button className="btn-primary sm" onClick={() => jump(primary.to)}>
          <Icon name="navigation" size={18} strokeWidth={2.2} />
          {t(primary.key)}
        </button>
        {seg.kind === 'ride' && (
          <button className="quick" onClick={() => jump(seg.endMs - 1000)}>
            {t('skipRide')}
          </button>
        )}
        <button className="quick" onClick={() => jump(trip.sched.endMs - 1000)}>
          {t('skipFinish')}
        </button>
      </div>
    </section>
  );
}
