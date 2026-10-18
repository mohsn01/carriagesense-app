import { useEffect, useRef, useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LANDMARKS } from '../data/gzMetro';
import { placeName, searchAddress, searchLocal } from '../lib/places';
import Icon from './Icon';

const ICON_BY_KIND = {
  gps: 'locate',
  saved: 'home',
  station: 'train',
  landmark: 'pin',
  address: 'search',
  map: 'pin',
};

function Row({ icon, title, sub, onClick, tone }) {
  return (
    <button className={`pick-row ${tone || ''}`} onClick={onClick}>
      <span className="pick-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="pick-text">
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
      </span>
      <Icon name="chevronRight" size={18} className="muted" />
    </button>
  );
}

// Full-screen sheet for choosing a place: my location, saved places, stations,
// landmarks, free-text address search, or a point on the map.
export default function PlacePicker() {
  const { picker, setPicker, choosePlace, saved, setPickOnMap, setScreen } = useSimulation();
  const { t, lang } = useLanguage();
  const [q, setQ] = useState('');
  const [online, setOnline] = useState({ loading: false, results: [], error: false });
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Address search is online-only: debounce it and cancel stale requests.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setOnline({ loading: false, results: [], error: false });
      return undefined;
    }
    const controller = new AbortController();
    setOnline((o) => ({ ...o, loading: true, error: false }));
    const id = setTimeout(() => {
      searchAddress(query, lang, controller.signal)
        .then((results) => setOnline({ loading: false, results, error: false }))
        .catch((err) => {
          if (err.name !== 'AbortError') setOnline({ loading: false, results: [], error: true });
        });
    }, 550);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q, lang]);

  const isSaveTarget = picker === 'home' || picker === 'work';
  const local = q.trim() ? searchLocal(q, lang) : [];
  const pick = (place) => choosePlace(picker, place);
  const titleKey = { from: 'pickFrom', to: 'pickTo', home: 'pickHome', work: 'pickWork' }[picker];

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t(titleKey)}>
      <div className="sheet-head">
        <button className="icon-btn" onClick={() => setPicker(null)} aria-label={t('close')}>
          <Icon name="arrowLeft" size={22} />
        </button>
        <h2>{t(titleKey)}</h2>
      </div>

      <div className="sheet-search">
        <Icon name="search" size={20} className="muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchHint')}
          aria-label={t('searchHint')}
          enterKeyHint="search"
        />
        {q && (
          <button className="icon-btn sm" onClick={() => setQ('')} aria-label={t('clear')}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      <div className="sheet-body">
        {!q.trim() && (
          <div className="pick-group">
            {picker === 'from' && (
              <Row
                icon="locate"
                tone="accent"
                title={t('myLocation')}
                sub={t('myLocationSub')}
                onClick={() => pick({ id: 'gps', kind: 'gps', name: t('myLocation') })}
              />
            )}
            <Row
              icon="map"
              title={t('chooseOnMap')}
              sub={t('chooseOnMapSub')}
              onClick={() => {
                setPickOnMap(picker);
                setPicker(null);
                setScreen('map');
              }}
            />
            {!isSaveTarget &&
              ['home', 'work'].map(
                (key) =>
                  saved[key] && (
                    <Row
                      key={key}
                      icon={key === 'home' ? 'home' : 'briefcase'}
                      title={t(key === 'home' ? 'home' : 'work')}
                      sub={placeName(saved[key], lang)}
                      onClick={() => pick(saved[key])}
                    />
                  )
              )}
          </div>
        )}

        {!q.trim() && (
          <>
            <h3 className="pick-title">{t('popularPlaces')}</h3>
            <div className="pick-group">
              {LANDMARKS.map((l) => (
                <Row
                  key={l.id}
                  icon="pin"
                  title={l.name[lang]}
                  sub={l.name[lang === 'en' ? 'zh' : 'en']}
                  onClick={() => pick({ ...l, kind: 'landmark' })}
                />
              ))}
            </div>
          </>
        )}

        {q.trim() && (
          <>
            {local.length > 0 && (
              <>
                <h3 className="pick-title">{t('stationsAndLandmarks')}</h3>
                <div className="pick-group">
                  {local.map((p) => (
                    <Row
                      key={p.id}
                      icon={ICON_BY_KIND[p.kind]}
                      title={placeName(p, lang)}
                      sub={placeName({ name: p.name }, lang === 'en' ? 'zh' : 'en')}
                      onClick={() => pick(p)}
                    />
                  ))}
                </div>
              </>
            )}
            <h3 className="pick-title">{t('addresses')}</h3>
            <div className="pick-group">
              {online.loading && <p className="pick-note">{t('searching')}</p>}
              {online.error && <p className="pick-note warn">{t('searchOffline')}</p>}
              {!online.loading && !online.error && online.results.length === 0 && (
                <p className="pick-note">{t('noResults')}</p>
              )}
              {online.results.map((p) => (
                <Row key={p.id} icon="search" title={p.name} sub={p.sub} onClick={() => pick(p)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
