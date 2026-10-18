import { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { usePrefs } from '../context/PrefsContext';
import { useLanguage } from '../i18n/LanguageContext';
import { fmtClock, fmtDistance, isNextDay } from '../lib/geo';
import { nearestStations } from '../lib/network';
import { placeName } from '../lib/places';
import { buildSteps } from '../lib/steps';
import { trainCrowd } from '../lib/crowd';
import Icon from '../components/Icon';
import LineBadge from '../components/LineBadge';
import StepList from '../components/StepList';
import CrowdPill from '../components/CrowdPill';
import DepartureBoard from '../components/DepartureBoard';
import RushCard from '../components/RushCard';
import TrainsCard from '../components/TrainsCard';
import LeavePicker from '../components/LeavePicker';
import CrowdSimulator from '../components/CrowdSimulator';

const MIN = 60000;

// Minutes of extra waiting a passenger would trade to avoid a train this crowded.
// Used only to rank the options, so "busy but fast" can lose to "calmer and a bit later".
const CROWD_PENALTY = { quiet: 0, moderate: 3, busy: 10, packed: 25 };
const CROWD_RANK = { quiet: 0, moderate: 1, busy: 2, packed: 3 };

function gpsSub(geo, t) {
  switch (geo.status) {
    case 'live':
      return t('gpsAccuracy', { n: Math.round(geo.fix?.accuracy || 0) });
    case 'asking':
      return t('gpsAsking');
    case 'denied':
      return t('gpsDenied');
    case 'unavailable':
      return t('gpsUnavailable');
    case 'error':
      return t('gpsNoSignal');
    default:
      return t('gpsTapToUse');
  }
}

function PlaceRow({ kind, label, place, sub, onClick, lang, t }) {
  return (
    <button className={`place-row ${kind}`} onClick={onClick}>
      <span className="place-dot" />
      <span className="place-text">
        <span className="place-label">{label}</span>
        <span className={`place-name ${place ? '' : 'empty'}`}>
          {place ? placeName(place, lang) : kind === 'from' ? t('whereFrom') : t('whereTo')}
        </span>
        {sub && <span className="place-sub">{sub}</span>}
      </span>
      <Icon name="chevronRight" size={18} className="muted" />
    </button>
  );
}

export default function PlanScreen() {
  const {
    now,
    demo,
    fromPlace,
    toPlace,
    setPicker,
    swapPlaces,
    fromPoint,
    route,
    options,
    selected,
    leaveOffset,
    setLeaveOffset,
    exitChoice,
    geo,
    startTrip,
    saved,
    choosePlace,
  } = useSimulation();
  const { t, lang } = useLanguage();
  const { demoTools } = usePrefs();
  const showSim = demoTools || demo;

  const nearest = useMemo(() => (fromPoint ? nearestStations(fromPoint, 3) : []), [fromPoint]);
  const sched = selected?.sched;
  const steps = useMemo(
    () => (sched && route && !route.sameStation ? buildSteps(sched, route, exitChoice, lang, t) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sched, route, exitChoice, lang]
  );

  const leaveMs = now + leaveOffset * MIN;
  const fromSub =
    fromPlace?.kind === 'gps'
      ? gpsSub(geo, t)
      : fromPlace?.kind === 'demo'
        ? t('demoPlace')
        : fromPlace?.sub;

  const bestId = route?.board?.station?.id;
  const waitingForGps = fromPlace?.kind === 'gps' && !fromPoint;

  // "08:42", or "tomorrow 06:02" when the next train is on another day.
  const whenLabel = (ms) => (isNextDay(ms, now) ? `${t('tomorrow')} ${fmtClock(ms)}` : fmtClock(ms));
  // 4 -> "4 min", 316 -> "5 h 16 min"
  const dur = (minutes) => {
    const m = Math.max(0, Math.round(minutes));
    return m >= 90 ? `${Math.floor(m / 60)} ${t('hoursShort')} ${m % 60} ${t('min')}` : `${m} ${t('min')}`;
  };

  // Estimated crowding of the first train of a schedule.
  const firstTrainCrowd = (s) => {
    const w = s.segs.find((x) => x.kind === 'wait');
    return trainCrowd(w.serviceId, w.at, w.dir, w.endMs);
  };

  const scored = options.map((o) => {
    const crowd = firstTrainCrowd(o.sched);
    return { ...o, crowd, score: (o.sched.endMs - now) / MIN + CROWD_PENALTY[crowd.level] };
  });
  const best = scored.reduce((b, o) => (o.score < b.score - 0.01 ? o : b), scored[0]);
  const current = scored.find((o) => o.offset === leaveOffset);

  // What the plan recommends, given how busy each option's train should be.
  let advice = null;
  if (current && best) {
    if (best.offset !== current.offset && CROWD_RANK[best.crowd.level] < CROWD_RANK[current.crowd.level]) {
      advice = {
        kind: 'switch',
        offset: best.offset,
        later: Math.round((best.sched.endMs - current.sched.endMs) / MIN),
      };
    } else if (CROWD_RANK[current.crowd.level] >= 2) {
      advice = { kind: 'busyAll' };
    } else {
      advice = { kind: 'good' };
    }
  }

  return (
    <div className="page page-grid">
      <header className="page-head span-all">
        <h1>{t('planTitle')}</h1>
        <p className="muted">{t('planSub')}</p>
      </header>

      <section className="card route-card">
        <div className="places">
          <PlaceRow kind="from" label={t('from')} place={fromPlace} sub={fromSub} onClick={() => setPicker('from')} lang={lang} t={t} />
          <div className="places-rail" aria-hidden="true" />
          <PlaceRow kind="to" label={t('to')} place={toPlace} sub={toPlace?.sub} onClick={() => setPicker('to')} lang={lang} t={t} />
          <button className="swap-btn" onClick={swapPlaces} aria-label={t('swap')} disabled={!fromPlace && !toPlace}>
            <Icon name="swap" size={20} />
          </button>
        </div>

        {!fromPlace && (
          <div className="quick-row">
            <button className="quick" onClick={() => choosePlace('from', { id: 'gps', kind: 'gps', name: t('myLocation') })}>
              <Icon name="locate" size={16} /> {t('useMyLocation')}
            </button>
            {saved.home && (
              <button className="quick" onClick={() => choosePlace('from', saved.home)}>
                <Icon name="home" size={16} /> {t('home')}
              </button>
            )}
          </div>
        )}
        {fromPlace?.kind === 'gps' && geo.status === 'idle' && (
          <button className="btn-soft" onClick={geo.start}>
            <Icon name="locate" size={18} /> {t('allowLocation')}
          </button>
        )}
        {geo.status === 'denied' && fromPlace?.kind === 'gps' && (
          <p className="notice" role="alert">
            <Icon name="alert" size={16} /> {t('gpsDeniedHelp')}
          </p>
        )}

        {fromPlace && <LeavePicker />}
      </section>

      {waitingForGps && (
        <section className="card empty-card">
          <Icon name="locate" size={28} />
          <p>{t('findingYou')}</p>
        </section>
      )}

      {fromPoint && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">{t('nearestStations')}</h2>
              <p className="muted small">{t('nearestSub', { place: placeName(fromPlace, lang) })}</p>
            </div>
          </div>
          <ul className="stations">
            {nearest.map((n, i) => (
              <li key={n.station.id} className={`station-row ${n.station.id === bestId ? 'best' : ''}`}>
                <span className="station-rank">{i + 1}</span>
                <div className="station-body">
                  <strong>{n.station.name[lang]}</strong>
                  <span className="muted small">
                    {n.station.name[lang === 'en' ? 'zh' : 'en']} · {fmtDistance(n.meters * 1.3)} ·{' '}
                    {Math.max(1, Math.round(n.walkMin))} {t('minWalk')}
                  </span>
                </div>
                <span className="station-lines" aria-label={t('lines')}>
                  {n.lines.map((l) => (
                    <LineBadge key={l.id} lineId={l.id} label={l.name[lang]} />
                  ))}
                </span>
                {n.station.id === bestId && <span className="tag tag-teal">{t('bestForTrip')}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {route?.sameStation && (
        <section className="card empty-card">
          <Icon name="walk" size={28} />
          <p>{t('justWalk')}</p>
        </section>
      )}

      {scored.length > 0 && (
        <section className="card span-all-sm">
          <div className="card-head">
            <div>
              <h2 className="card-title">{t('whenToLeave')}</h2>
              <p className="muted small">{t('optionsHelp')}</p>
            </div>
          </div>

          {advice && (
            <div className={`advice ${advice.kind}`} role="status">
              <Icon name={advice.kind === 'switch' ? 'sparkle' : advice.kind === 'good' ? 'check' : 'alert'} size={18} />
              <div>
                <strong>
                  {advice.kind === 'switch'
                    ? t(advice.offset === 0 ? 'recSwitchNow' : 'recSwitch', {
                        n: advice.offset,
                        level: t(`crowd_${best.crowd.level}`),
                        was: t(`crowd_${current.crowd.level}`),
                        d: Math.max(0, advice.later),
                      })
                    : advice.kind === 'good'
                      ? t('recGood', { level: t(`crowd_${current.crowd.level}`) })
                      : t('recBusyAll')}
                </strong>
                {advice.kind === 'switch' && (
                  <button className="chip-btn on" onClick={() => setLeaveOffset(advice.offset)}>
                    {advice.offset === 0 ? t('leaveNow') : t('recUse', { n: advice.offset })}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="opts" role="radiogroup" aria-label={t('whenToLeave')}>
            {scored.map((o) => {
              const s = o.sched;
              const on = o.offset === leaveOffset;
              const optLeave = now + o.offset * MIN;
              const reach = optLeave + route.board.walkMin * MIN;
              const wait = s.firstTrainInMin;
              return (
                <button
                  key={o.offset}
                  role="radio"
                  aria-checked={on}
                  className={`opt ${on ? 'selected' : ''}`}
                  onClick={() => setLeaveOffset(o.offset)}
                >
                  <span className="opt-top">
                    <strong>{o.offset === 0 ? t('leaveNow') : t('leaveIn', { n: o.offset })}</strong>
                    <small>{fmtClock(optLeave)}</small>
                    {o.offset === best.offset && scored.length > 1 && <span className="tag tag-teal">{t('tagRecommended')}</span>}
                    <CrowdPill crowd={o.crowd} showPct={false} />
                  </span>
                  <span className="opt-line">
                    <Icon name="train" size={15} />
                    <span>
                      {t('optNextTrain', { station: route.board.station.name[lang] })}{' '}
                      <b>{whenLabel(s.boardMs)}</b> · {t('optIn', { dur: dur((s.boardMs - now) / MIN) })}
                    </span>
                  </span>
                  <span className="opt-sub">
                    {t('optReach', { time: whenLabel(reach) })}
                    {wait >= 1 && ` · ${t('optWait', { dur: dur(wait) })}`}
                  </span>
                  <span className="opt-line">
                    <Icon name="pin" size={15} />
                    <span>
                      {t('optArrive')} <b>{whenLabel(s.endMs)}</b> · {t('optTrip', { dur: dur(s.totalMin) })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {sched?.closed && (
            <p className="notice" role="status">
              <Icon name="alert" size={16} />
              {t('metroClosed', { time: whenLabel(sched.boardMs) })}
            </p>
          )}
        </section>
      )}

      {route && !route.sameStation && selected && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">{t('nextTrainsTitle')}</h2>
              <p className="muted small">{t('nextTrainsSub')}</p>
            </div>
          </div>
          <TrainsCard route={route} now={now} leaveMs={leaveMs} />
        </section>
      )}

      {steps.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">{t('yourRoute')}</h2>
            <span className="total">
              {Math.round(sched.totalMin)} <small>{t('min')}</small>
            </span>
          </div>
          <StepList steps={steps} />
          {exitChoice && (
            <p className="exit-note">
              <Icon name="info" size={15} />
              {exitChoice.ref ? t('exitFromOsm') : t('exitDirectionOnly')}
            </p>
          )}
        </section>
      )}

      {route && !route.sameStation && (
        <section className="card">
          <RushCard
            stationId={route.legs[0].stations[0]}
            now={leaveMs + route.board.walkMin * MIN}
            refNow={now}
          />
          {showSim && <CrowdSimulator stationId={route.legs[0].stations[0]} />}
        </section>
      )}

      {!route && nearest[0] && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">{t('departuresAt', { station: nearest[0].station.name[lang] })}</h2>
              <p className="muted small">
                {t('boardFrom', { time: fmtClock(leaveMs + nearest[0].walkMin * MIN) })} · {t('timetableNote')}
              </p>
            </div>
          </div>
          <DepartureBoard
            stationId={nearest[0].station.id}
            fromMs={leaveMs + nearest[0].walkMin * MIN}
            now={now}
          />
          <RushCard
            stationId={nearest[0].station.id}
            now={leaveMs + nearest[0].walkMin * MIN}
            refNow={now}
          />
          {showSim && <CrowdSimulator stationId={nearest[0].station.id} />}
        </section>
      )}

      {route && !route.sameStation && (
        <div className="cta-bar span-all">
          <button className="btn-primary" onClick={startTrip}>
            <Icon name="navigation" size={20} strokeWidth={2.2} />
            {t('startTrip')}
          </button>
        </div>
      )}

      {!route && fromPoint && !toPlace && (
        <section className="card empty-card">
          <Icon name="search" size={28} />
          <p>{t('pickDestinationHint')}</p>
        </section>
      )}
    </div>
  );
}
