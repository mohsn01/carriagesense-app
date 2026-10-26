import { useLanguage } from '../i18n/LanguageContext';
import { fmtClock } from '../lib/geo';
import Icon from './Icon';
import CrowdPill from './CrowdPill';

const RANK = { quiet: 0, moderate: 1, busy: 2, packed: 3 };

// "Should you go?" Shows how crowded the station and the train should be when you
// would be there, so the decision is made BEFORE scanning in at the gate.
export default function GoDecision({ station, reachMs, stationCrowd, trainMs, trainCrowd, switchTo, onSwitch }) {
  const { t } = useLanguage();
  const worst = Math.max(RANK[stationCrowd.level], RANK[trainCrowd.level]);
  const verdict = worst >= 3 ? 'packed' : worst === 2 ? 'busy' : 'ok';
  const icon = verdict === 'ok' ? 'check' : 'alert';

  return (
    <div className={`decision ${verdict}`} role="status">
      <div className="decision-head">
        <Icon name={icon} size={20} />
        <strong>{t(`dec_${verdict}`)}</strong>
      </div>
      <ul className="decision-rows">
        <li>
          <span>{t('decStation', { station, time: fmtClock(reachMs) })}</span>
          <CrowdPill crowd={stationCrowd} showPct={false} />
        </li>
        <li>
          <span>{t('decTrain', { time: fmtClock(trainMs) })}</span>
          <CrowdPill crowd={trainCrowd} showPct={false} />
        </li>
      </ul>
      <p className="decision-note">
        <Icon name="info" size={14} />
        {t('decScanNote')}
      </p>
      {verdict !== 'ok' && (
        <div className="decision-actions">
          {switchTo != null && (
            <button className="chip-btn on" onClick={onSwitch}>
              {switchTo === 0 ? t('leaveNow') : t('recUse', { n: switchTo })}
            </button>
          )}
          <button
            className="chip-btn"
            onClick={() => document.getElementById('alt-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            {t('decOther')}
          </button>
        </div>
      )}
    </div>
  );
}
