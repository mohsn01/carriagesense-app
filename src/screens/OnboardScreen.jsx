import { useEffect, useMemo, useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { STATIONS, getRoute, DOOR_SIDE } from '../data/simulationData';

const REMINDER_KEYS = ['reminderCrowded', 'reminderDoors', 'reminderBelongings'];

export default function OnboardScreen() {
  const { origin, destination, exit, tick } = useSimulation();
  const { t, lang } = useLanguage();

  const route = useMemo(() => getRoute(origin, destination), [origin, destination]);
  const doorSide = DOOR_SIDE[destination]?.[exit] || 'right';

  // Advance through the route as the simulated clock ticks, looping so the
  // demo always has something to show regardless of when the user arrives.
  const currentIdx = Math.min(route.length - 1, Math.floor((tick % (route.length * 8)) / 8));
  const remaining = route.length - 1 - currentIdx;

  const [reminderIdx, setReminderIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setReminderIdx((i) => (i + 1) % REMINDER_KEYS.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="card">
        <div className="card-title">{t('onboardTitle')}</div>
        <div className="info-row">
          <span className="info-label">{t('currentStation')}</span>
          <span className="info-value">{STATIONS[route[currentIdx]]?.name[lang]}</span>
        </div>
        <div className="info-row">
          <span className="info-label">{t('stationsRemaining')}</span>
          <span className="info-value">{remaining}</span>
        </div>
        <div className="info-row">
          <span className="info-label">{t('exitLabel')}</span>
          <span className="info-value">{exit}</span>
        </div>
        <div className="info-row">
          <span className="info-label">{t('doorSide')}</span>
          <span className="info-value">{doorSide === 'left' ? t('left') : t('right')}</span>
        </div>
      </div>

      <div className="card">
        <div className="exit-door-visual">
          {doorSide === 'left' && <span className="door-arrow left">⬅</span>}
          <div className="train-car-icon">{t('doorSide')}</div>
          {doorSide === 'right' && <span className="door-arrow right">➡</span>}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('arrivingAt')}</div>
        <div className="timeline">
          {route.map((sid, i) => {
            const isCurrent = i === currentIdx;
            const isLast = i === route.length - 1;
            return (
              <div className="timeline-item" key={sid}>
                <div className="timeline-rail">
                  <div className={`timeline-dot ${isCurrent ? 'current' : ''}`} />
                  {!isLast && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-station-name">{STATIONS[sid]?.name[lang]}</div>
                  {isLast && <div className="timeline-sub">{exit}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reminder-banner">
        <span>ℹ️</span>
        <span>{t(REMINDER_KEYS[reminderIdx], { side: doorSide === 'left' ? t('left') : t('right') })}</span>
      </div>
    </>
  );
}
