import { useMemo, useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { nearestStations, linesAt } from '../lib/network';
import { STATIONS } from '../data/gzMetro';
import Icon from '../components/Icon';
import LineBadge from '../components/LineBadge';
import MetroMap from '../components/MetroMap';
import DepartureBoard from '../components/DepartureBoard';
import RushCard from '../components/RushCard';
import CrowdSimulator from '../components/CrowdSimulator';
import { usePrefs } from '../context/PrefsContext';

export default function MapScreen() {
  const { now, demo, route, fromPoint, toPoint, geo, gpsFixFresh, pickOnMap, setPickOnMap, choosePlace, setScreen } =
    useSimulation();
  const { t, lang } = useLanguage();
  const { demoTools } = usePrefs();
  const showSim = demoTools || demo;
  const [station, setStation] = useState(null);
  const [follow, setFollow] = useState(false);

  const fixKey = route && !route.sameStation ? `${route.board.station.id}-${route.alight.station.id}-${fromPoint?.lat}-${toPoint?.lat}` : null;
  const nearest = useMemo(() => (geo.fix ? nearestStations(geo.fix, 1)[0] : null), [geo.fix]);

  function onMapClick(point) {
    if (pickOnMap) {
      choosePlace(pickOnMap, { id: `pin-${point.lat.toFixed(5)}`, kind: 'map', name: t('droppedPin'), sub: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`, ...point });
    } else {
      setStation(null);
    }
  }

  function setFromStation(s, target) {
    choosePlace(target, { id: `st-${s.id}`, kind: 'station', name: s.name, lat: s.lat, lng: s.lng, stationId: s.id });
    setScreen('plan');
  }

  return (
    <div className="page map-page">
      <div className="map-wrap">
        <MetroMap
          legs={route && !route.sameStation ? route.legs : null}
          from={route && !route.sameStation ? fromPoint : null}
          to={route && !route.sameStation ? toPoint : null}
          board={route && !route.sameStation ? STATIONS[route.board.station.id] : null}
          alight={route && !route.sameStation ? STATIONS[route.alight.station.id] : null}
          user={geo.fix ? { lat: geo.fix.lat, lng: geo.fix.lng, accuracy: geo.fix.accuracy } : null}
          follow={follow}
          fitKey={fixKey}
          onMapClick={onMapClick}
          onStationClick={(s) => (pickOnMap ? setFromStation(s, pickOnMap) : setStation(s))}
          onUserMove={() => setFollow(false)}
        />

        {pickOnMap && (
          <div className="map-banner" role="status">
            <Icon name="pin" size={18} />
            <span>{t('tapToChoose')}</span>
            <button className="icon-btn sm" onClick={() => setPickOnMap(null)} aria-label={t('close')}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <button
          className="map-fab"
          onClick={() => {
            geo.start();
            setFollow(true);
          }}
          aria-label={t('locateMe')}
        >
          <Icon name="locate" size={22} />
        </button>

        {geo.status === 'denied' && (
          <p className="map-note notice" role="alert">
            <Icon name="alert" size={16} /> {t('gpsDeniedHelp')}
          </p>
        )}

        {station && !pickOnMap && (
          <div className="map-sheet">
            <button className="icon-btn sm map-sheet-x" onClick={() => setStation(null)} aria-label={t('close')}>
              <Icon name="x" size={16} />
            </button>
            <div className="map-sheet-head">
              <strong>{station.name[lang]}</strong>
              <span className="muted small">{station.name[lang === 'en' ? 'zh' : 'en']}</span>
            </div>
            <div className="station-lines">
              {linesAt(station.id).map((l) => (
                <span key={l.id} className="line-chip">
                  <LineBadge lineId={l.id} size="sm" />
                  {l.name[lang]}
                </span>
              ))}
            </div>
            <div className="map-sheet-scroll">
              <RushCard stationId={station.id} now={now} compact />
              {showSim && <CrowdSimulator stationId={station.id} />}
              <DepartureBoard stationId={station.id} fromMs={now} now={now} />
            </div>
            <div className="map-sheet-actions">
              <button className="quick" onClick={() => setFromStation(station, 'from')}>
                <Icon name="navigation" size={16} /> {t('fromHere')}
              </button>
              <button className="quick on" onClick={() => setFromStation(station, 'to')}>
                <Icon name="pin" size={16} /> {t('toHere')}
              </button>
            </div>
          </div>
        )}

        {!station && !pickOnMap && nearest && gpsFixFresh && (
          <div className="map-chip">
            <Icon name="train" size={16} />
            {t('nearestIs', { name: nearest.station.name[lang], n: Math.max(1, Math.round(nearest.walkMin)) })}
          </div>
        )}
      </div>
    </div>
  );
}
