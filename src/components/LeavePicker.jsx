import { DEPART_OFFSETS, MAX_LEAVE_MIN, useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { fmtClock } from '../lib/geo';

const MIN = 60000;

// "When do you leave?" Quick presets plus a stepper for any number of minutes.
// Everything on the Plan screen (next trains, crowding, arrival) follows this.
export default function LeavePicker() {
  const { leaveOffset, setLeaveOffset, now } = useSimulation();
  const { t } = useLanguage();
  const label = (o) => (o === 0 ? t('leaveNow') : t('leaveIn', { n: o }));

  return (
    <div className="field leave-picker">
      <span className="field-label">{t('leaveWhen')}</span>
      <div className="chips-scroll" role="radiogroup" aria-label={t('leaveWhen')}>
        {DEPART_OFFSETS.map((o) => (
          <button
            key={o}
            role="radio"
            aria-checked={leaveOffset === o}
            className={`chip ${leaveOffset === o ? 'on' : ''}`}
            onClick={() => setLeaveOffset(o)}
          >
            {label(o)}
          </button>
        ))}
      </div>
      <div className="stepper">
        <button onClick={() => setLeaveOffset(leaveOffset - 5)} disabled={leaveOffset <= 0} aria-label={t('minus5')}>
          −
        </button>
        <label className="stepper-mid">
          <span className="stepper-input">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={MAX_LEAVE_MIN}
              value={leaveOffset}
              onChange={(e) => setLeaveOffset(Number(e.target.value) || 0)}
              aria-label={t('leaveMinutes')}
            />
            <span>{t('min')}</span>
          </span>
          <small>{t('leaveAtClock', { time: fmtClock(now + leaveOffset * MIN) })}</small>
        </label>
        <button onClick={() => setLeaveOffset(leaveOffset + 5)} aria-label={t('plus5')}>
          +
        </button>
      </div>
    </div>
  );
}
