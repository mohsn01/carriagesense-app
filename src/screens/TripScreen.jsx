import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LINE_BY_ID, STATIONS } from '../data/gzMetro';
import { fmtClock, fmtDistance, haversine, walkMetres } from '../lib/geo';
import { buildSteps } from '../lib/steps';
import { trainCrowd } from '../lib/crowd';
import { nextDeparture } from '../lib/network';
import { usePrefs } from '../context/PrefsContext';
import DemoControls from '../components/DemoControls';
import CrowdSimulator from '../components/CrowdSimulator';
import CrowdPill from '../components/CrowdPill';
import Icon from '../components/Icon';
import LineBadge from '../components/LineBadge';
import MetroMap from '../components/MetroMap';
import StepList from '../components/StepList';

const MIN = 60000;

function fmtCountdown(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Segment colours for the journey bar: walking, waiting and the line colour for rides.
function segColor(seg) {
  if (seg.kind === 'ride') return LINE_BY_ID[seg.lineId].color;
  if (seg.kind === 'walk') return '#6db6ff';
  return 'rgba(255,255,255,0.35)';
}

function GpsChip({ state, accuracy, demo, onEnable, t }) {
  const map = {
    live: { cls: 'ok', icon: 'locate', text: demo ? t('gpsDemoLive') : t('gpsLiveAcc', { n: Math.round(accuracy || 0) }) },
    weak: { cls: 'warn', icon: 'alert', text: t('gpsWeak') },
    asking: { cls: 'warn', icon: 'locate', text: t('gpsAsking') },
    denied: { cls: 'bad', icon: 'alert', text: t('gpsDenied') },
    unavailable: { cls: 'bad', icon: 'alert', text: t('gpsUnavailable') },
    error: { cls: 'warn', icon: 'alert', text: t('gpsNoSignal') },
    idle: { cls: 'off', icon: 'locate', text: t('gpsOff') },
  };
  const m = map[state] || map.idle;
  return (
    <span className="gps-line">
      <span className={`gps-chip ${m.cls}`}>
        <Icon name={m.icon} size={14} strokeWidth={2.2} />
        {m.text}
      </span>
      {(state === 'idle' || state === 'error') && (
        <button className="gps-enable" onClick={onEnable}>
          {t('turnOnGps')}
        </button>
      )}
    </span>
  );
}

export default function TripScreen() {
  const { trip, tripInfo, now, exitChoice, exitInfo, geo, demo, endTrip, setScreen, waitForNextTrain } = useSimulation();
  const { demoTools } = usePrefs();
  const { t, lang } = useLanguage();
  const [follow, setFollow] = useState(true);

  const steps = useMemo(
    () => (trip ? buildSteps(trip.sched, trip.route, exitChoice, lang, t) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip, exitChoice, lang]
  );

  // Buzz when it is time to get off (or change) so the phone can stay in a pocket.
  const buzzKey = tripInfo?.seg?.kind === 'ride' && tripInfo.stopsLeft === 1 ? `${tripInfo.seg.leg}` : null;
  const lastBuzz = useRef(null);
  useEffect(() => {
    if (buzzKey != null && lastBuzz.current !== buzzKey) {
      lastBuzz.current = buzzKey;
      try {
        navigator.vibrate?.([220, 120, 220]);
      } catch {
        /* vibration is optional */
      }
    }
  }, [buzzKey]);

  // Keep the screen on during a trip so the GPS keeps reporting (released when the trip ends).
  const tripActive = !!trip;
  useEffect(() => {
    if (!tripActive || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    const acquire = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          lock = l;
        })
        .catch(() => {});
    const onVisible = () => document.visibilityState === 'visible' && acquire();
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release?.().catch(() => {});
    };
  }, [tripActive]);

  if (!trip || !tripInfo) {
    return (
      <div className="page">
        <section className="card empty-card tall">
          <Icon name="navigation" size={34} />
          <h2>{t('noTripTitle')}</h2>
          <p className="muted">{t('noTripSub')}</p>
          <button className="btn-primary" onClick={() => setScreen('plan')}>
            {t('planATrip')}
          </button>
        </section>
      </div>
    );
  }

  const { seg, arrived, pos, gpsState, etaMs, minutesLeft, stopsLeft, nextStopId, remainingWalkM, idx } = tripInfo;
  const { route, sched } = trip;
  const name = (id) => STATIONS[id].name[lang];
  const alightName = name(route.alight.station.id);

  // --- the one instruction that matters right now -----------------------------
  let kicker;
  let title;
  let sub;
  let big = null;
  let lineId = null;

  if (arrived) {
    kicker = t('phaseArrived');
    title = t('arrivedTitle');
    sub = t('arrivedSub');
  } else if (idx === 0 || (seg.kind === 'walk' && seg.phase === 'in')) {
    const meters = haversine(pos, STATIONS[route.board.station.id]) * 1.3;
    const first = sched.segs.find((s) => s.kind === 'wait');
    kicker = t('phaseWalkIn');
    title = name(route.board.station.id);
    sub = t('walkLeft', { dist: fmtDistance(meters), n: Math.max(1, Math.ceil((seg.endMs - now) / MIN)) });
    lineId = first.lineId;
  } else if (seg.kind === 'wait') {
    kicker = t('phaseWait');
    title = t('lineToward', { line: LINE_BY_ID[seg.lineId].name[lang], toward: name(seg.toward) });
    sub = t('departsAt', { time: fmtClock(seg.endMs) });
    big = fmtCountdown(seg.endMs - now);
    lineId = seg.lineId;
  } else if (seg.kind === 'ride') {
    const lastStop = seg.to;
    const isFinal = lastStop === route.alight.station.id;
    kicker = t('phaseRide');
    title = nextStopId ? name(nextStopId) : alightName;
    sub =
      stopsLeft === 1
        ? t(isFinal ? 'getOffNext' : 'changeNext')
        : t('stopsToGetOff', { n: stopsLeft, station: name(lastStop) });
    lineId = seg.lineId;
  } else if (seg.kind === 'transfer') {
    const nextWait = sched.segs[idx + 1];
    kicker = t('phaseTransfer');
    title = t('lineToward', { line: LINE_BY_ID[nextWait.lineId].name[lang], toward: name(nextWait.toward) });
    sub = t('followSigns', { station: name(seg.at) });
    lineId = nextWait.lineId;
  } else if (seg.kind === 'exit') {
    kicker = t('phaseExit');
    title = exitChoice?.ref ? t('stepExitRef', { ref: exitChoice.ref }) : t('stepExitDir', { dir: t(`dir${exitChoice?.direction || 'N'}`) });
    sub = t('exitStation', { station: alightName });
  } else {
    kicker = t('phaseWalkOut');
    title = t('yourDestination');
    sub = t('walkLeft', { dist: fmtDistance(remainingWalkM ?? walkMetres(STATIONS[route.alight.station.id], route.to)), n: Math.max(1, Math.ceil((seg.endMs - now) / MIN)) });
  }

  // How busy the train you are waiting for (or riding) is expected to be.
  let trainLoad = null;
  if (!arrived && seg.kind === 'wait') trainLoad = trainCrowd(seg.serviceId, seg.at, seg.dir, seg.endMs);
  else if (!arrived && seg.kind === 'ride') trainLoad = trainCrowd(seg.serviceId, seg.from, seg.dir, seg.startMs);

  // If the train about to arrive is crowded and the next one is clearly calmer, say so.
  let waitAdvice = null;
  if (trainLoad && seg.kind === 'wait' && seg.leg === 0 && trainLoad.pct >= 60) {
    const nextDep = nextDeparture(seg.serviceId, seg.at, seg.dir, seg.endMs + 1000);
    const nextLoad = trainCrowd(seg.serviceId, seg.at, seg.dir, nextDep);
    const rank = (l) => ['quiet', 'moderate', 'busy', 'packed'].indexOf(l.level);
    if (rank(nextLoad) < rank(trainLoad) || nextLoad.pct <= trainLoad.pct - 12) {
      waitAdvice = { mins: Math.round((nextDep - seg.endMs) / MIN), load: nextLoad };
    }
  }
  const simStation = seg.kind === 'wait' ? seg.at : route.board.station.id;
  const showDemoTools = demo || demoTools;

  // Position of the marker on the journey bar (0..1 over the whole itinerary).
  const spanStart = sched.segs[0].startMs;
  const spanTotal = Math.max(1, sched.endMs - spanStart);
  const progress = Math.min(1, Math.max(0, (now - spanStart) / spanTotal));
  const showExitCard = exitChoice && !arrived;
  const onExitSoon = seg.kind === 'ride' && seg.to === route.alight.station.id;

  return (
    <div className="page page-grid">
      <section className="hero trip-hero span-all" aria-live="polite">
        <div className="hero-top">
          <GpsChip state={gpsState} accuracy={geo.fix?.accuracy} demo={demo} onEnable={geo.start} t={t} />
        </div>

        <p className="trip-kicker">{kicker}</p>
        <div className="trip-main">
          {lineId && <LineBadge lineId={lineId} size="lg" />}
          <h1 className="trip-title">{title}</h1>
        </div>
        <p className="trip-sub">{sub}</p>
        {trainLoad && (
          <p className="trip-crowd">
            <span>{t('thisTrainIs')}</span>
            <CrowdPill crowd={trainLoad} />
            <small>{t(trainLoad.seat ? 'seatLikely' : 'standingLikely')}</small>
          </p>
        )}
        {sched.closed && seg.kind === 'wait' && (
          <p className="trip-closed">
            <Icon name="alert" size={15} /> {t('metroClosed', { time: fmtClock(seg.endMs) })}
          </p>
        )}
        {big && (
          <div className="trip-countdown" aria-label={t('departsAt', { time: fmtClock(seg.endMs) })}>
            {big}
          </div>
        )}

        <div className="eta">
          <div>
            <small>{t('arriveLabel')}</small>
            <strong>{fmtClock(etaMs)}</strong>
          </div>
          <div>
            <small>{t('timeLeft')}</small>
            <strong>
              {minutesLeft} <span>{t('min')}</span>
            </strong>
          </div>
          <div>
            <small>{t('to')}</small>
            <strong className="eta-dest">{alightName}</strong>
          </div>
        </div>

        <div className="journey-bar" aria-hidden="true">
          {sched.segs.map((s, i) => (
            <span
              key={i}
              style={{ flex: Math.max(0.5, s.minutes), background: segColor(s), opacity: i < idx ? 0.45 : 1 }}
            />
          ))}
          <i className="journey-marker" style={{ left: `${progress * 100}%` }} />
        </div>
      </section>

      {waitAdvice && (
        <section className="card advice-card span-all-sm" role="status">
          <Icon name="sparkle" size={20} />
          <div>
            <strong>{t('waitSuggestTitle', { level: t(`crowd_${trainLoad.level}`) })}</strong>
            <span className="muted small">
              {t('waitSuggest', { n: waitAdvice.mins, level: t(`crowd_${waitAdvice.load.level}`) })}
            </span>
            <button className="chip-btn on" onClick={waitForNextTrain}>
              {t('waitBtn')}
            </button>
          </div>
        </section>
      )}

      {showDemoTools && <DemoControls info={tripInfo} trip={trip} />}
      {showDemoTools && !arrived && (
        <section className="card span-all-sm">
          <CrowdSimulator stationId={simStation} />
        </section>
      )}

      {showExitCard && (
        <section className={`card exit-card span-all-sm ${onExitSoon ? 'hot' : ''}`}>
          <span className="exit-badge">{exitChoice.ref || <Icon name="exit" size={22} />}</span>
          <div>
            <strong>
              {exitChoice.ref
                ? t('useExitRef', { ref: exitChoice.ref, station: alightName })
                : t('useExitDir', { dir: t(`dir${exitChoice.direction}`), station: alightName })}
            </strong>
            <span className="muted small">
              {t('thenWalk', { dist: fmtDistance(exitChoice.walkMeters), n: Math.max(1, Math.round(exitChoice.walkMeters / 78)) })}
              {!exitChoice.ref && ` · ${exitInfo?.loading ? t('lookingUpExits') : t('exitLettersUnknown')}`}
            </span>
          </div>
        </section>
      )}

      <section className="card map-card">
        <MetroMap
          legs={route.legs}
          from={route.from}
          to={route.to}
          board={STATIONS[route.board.station.id]}
          alight={STATIONS[route.alight.station.id]}
          user={{ lat: pos.lat, lng: pos.lng, accuracy: gpsState === 'live' ? geo.fix?.accuracy || 12 : null }}
          follow={follow}
          fitKey={`${route.board.station.id}-${route.alight.station.id}`}
          onUserMove={() => setFollow(false)}
        />
        <button className="map-fab small" onClick={() => setFollow(true)} aria-label={t('recenter')}>
          <Icon name="locate" size={20} />
        </button>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">{t('yourRoute')}</h2>
        </div>
        <StepList steps={steps} currentSeg={arrived ? 99 : idx} />
      </section>

      <div className="span-all trip-actions">
        <button className="btn-danger" onClick={endTrip}>
          <Icon name="stop" size={18} strokeWidth={2.2} />
          {t('endTrip')}
        </button>
      </div>
    </div>
  );
}
