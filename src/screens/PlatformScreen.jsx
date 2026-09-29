import { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  STATUS_COLOR,
  recommendCarriage,
  nearestExitCarriage,
} from '../data/simulationData';
import StatusBadge from '../components/StatusBadge';

export default function PlatformScreen() {
  const { train, destination, exit, isLive, approachDistanceM, setScreen } = useSimulation();
  const { t } = useLanguage();

  const recommended = useMemo(
    () => recommendCarriage(train.carriages, destination, exit),
    [train, destination, exit]
  );
  const nearest = useMemo(
    () => nearestExitCarriage(train.carriages, destination, exit),
    [train, destination, exit]
  );

  const explanation =
    recommended.index === nearest.index
      ? t('tradeoffSame', { rec: recommended.index, exit })
      : t('tradeoffDiff', {
          rec: recommended.index,
          dist: recommended.walk,
          exit,
          near: nearest.index,
          pct: nearest.pct,
        });

  return (
    <>
      <div className="card">
        <div className="card-title">
          <span>{t('platformTitle')}</span>
          <StatusBadge live={isLive} />
        </div>
        <div className="info-row">
          <span className="info-label">{t('trainId')}</span>
          <span className="info-value">{train.id}</span>
        </div>
        <div className="info-row">
          <span className="info-label">{t('arrivesIn')}</span>
          <span className="info-value">{train.etaSeconds}{t('sec')}</span>
        </div>
        {!isLive && (
          <div className="info-row">
            <span className="info-label" style={{ fontSize: 11 }}>
              {Math.round(approachDistanceM)}m {t('toPlatform')}
            </span>
          </div>
        )}
        {isLive && (
          <div style={{ fontSize: 11, color: '#ff8a8a', marginTop: 4 }}>{t('liveSince')}</div>
        )}
      </div>

      <div className="card">
        <div className="card-title">{t('car')}s</div>
        <div className="train-visual">
          {train.carriages.map((c) => {
            const isRec = c.index === recommended.index;
            const isNear = c.index === nearest.index;
            return (
              <div
                key={c.index}
                className="carriage"
                style={{
                  background: `${STATUS_COLOR[c.status]}22`,
                  borderColor: isRec ? '#4da3ff' : isNear ? '#fff' : 'transparent',
                }}
              >
                {isRec && <span className="carriage-tag tag-recommended">{t('recommended')}</span>}
                {isNear && !isRec && (
                  <span className="carriage-tag tag-nearest">{t('nearestExit', { exit })}</span>
                )}
                <div className="carriage-num">{t('car')} {c.index}</div>
                <div className="carriage-pct" style={{ color: STATUS_COLOR[c.status] }}>
                  {c.pct >= 90 ? t('full') : `${c.pct}%`}
                </div>
              </div>
            );
          })}
        </div>
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

      <div className="recommend-box">
        <div className="recommend-head">
          <span>🚋</span>
          <span>{t('recommended')}: {t('car')} {recommended.index}</span>
        </div>
        <div className="recommend-explain">{explanation}</div>
      </div>

      <button className="primary-btn" onClick={() => setScreen('onboard')}>
        {t('boardTrain')}
      </button>
    </>
  );
}
