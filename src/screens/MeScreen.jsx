import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePrefs } from '../context/PrefsContext';
import { placeName } from '../lib/places';
import Icon from '../components/Icon';

function Toggle({ checked, onChange, label, hint, icon }) {
  return (
    <div className="setting">
      <span className="setting-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="setting-text">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <i />
      </button>
    </div>
  );
}

function SavedRow({ kind, place, onSet, onClear, onUseGps, canUseGps, t, lang }) {
  return (
    <div className="setting">
      <span className="setting-icon">
        <Icon name={kind === 'home' ? 'home' : 'briefcase'} size={20} />
      </span>
      <span className="setting-text">
        <strong>{t(kind)}</strong>
        <small>{place ? placeName(place, lang) : t('notSet')}</small>
      </span>
      <span className="row-actions">
        {canUseGps && (
          <button className="chip-btn" onClick={onUseGps}>
            <Icon name="locate" size={14} /> {t('hereNow')}
          </button>
        )}
        <button className="chip-btn" onClick={onSet}>
          {place ? t('change') : t('set')}
        </button>
        {place && (
          <button className="chip-btn danger" onClick={onClear} aria-label={t('remove')}>
            <Icon name="x" size={14} />
          </button>
        )}
      </span>
    </div>
  );
}

export default function MeScreen() {
  const { saved, setPicker, clearSaved, choosePlace, geo, demo, startDemo, stopDemo } = useSimulation();
  const { t, lang, setLang } = useLanguage();
  const { theme, largeText, demoTools, setPref } = usePrefs();

  const gpsText = {
    live: t('gpsOn'),
    asking: t('gpsAsking'),
    denied: t('gpsDenied'),
    unavailable: t('gpsUnavailable'),
    error: t('gpsNoSignal'),
    idle: t('gpsOff'),
  }[geo.status];

  function saveHere(key) {
    if (geo.fix) {
      choosePlace(key, {
        id: key,
        kind: 'saved',
        name: t(key),
        sub: t('fromGps'),
        lat: geo.fix.lat,
        lng: geo.fix.lng,
      });
    } else {
      geo.start();
    }
  }

  return (
    <div className="page page-grid">
      <header className="page-head span-all">
        <h1>{t('navMe')}</h1>
      </header>

      <div className="col">
        <section className="card">
          <h2 className="card-title">{t('savedPlaces')}</h2>
          <p className="muted small saved-hint">{t('savedHint')}</p>
          {['home', 'work'].map((key) => (
            <SavedRow
              key={key}
              kind={key}
              place={saved[key]}
              onSet={() => setPicker(key)}
              onClear={() => clearSaved(key)}
              onUseGps={() => saveHere(key)}
              canUseGps={geo.status === 'live' || geo.status === 'idle'}
              t={t}
              lang={lang}
            />
          ))}
        </section>

        <section className="card">
          <h2 className="card-title">{t('location')}</h2>
          <div className="setting first">
            <span className="setting-icon">
              <Icon name="locate" size={20} />
            </span>
            <span className="setting-text">
              <strong>{t('gpsTitle')}</strong>
              <small>{gpsText}</small>
            </span>
            {geo.status !== 'live' && (
              <button className="chip-btn on" onClick={geo.start}>
                {t('turnOnGps')}
              </button>
            )}
          </div>
          <div className="setting">
            <span className="setting-icon">
              <Icon name="play" size={20} />
            </span>
            <span className="setting-text">
              <strong>{t('demoTitle')}</strong>
              <small>{t('demoHint')}</small>
            </span>
            <button className={`chip-btn ${demo ? 'danger' : 'on'}`} onClick={demo ? stopDemo : startDemo}>
              {demo ? t('stopDemo') : t('demoMode')}
            </button>
          </div>
        </section>
      </div>

      <div className="col">
        <section className="card settings">
          <h2 className="card-title">{t('settings')}</h2>

          <div className="setting first">
            <span className="setting-icon">
              <Icon name="globe" size={20} />
            </span>
            <span className="setting-text">
              <strong>{t('language')}</strong>
            </span>
            <div className="segmented sm" role="radiogroup" aria-label={t('language')}>
              <button role="radio" aria-checked={lang === 'en'} className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>
                EN
              </button>
              <button role="radio" aria-checked={lang === 'zh'} className={lang === 'zh' ? 'on' : ''} onClick={() => setLang('zh')}>
                中文
              </button>
            </div>
          </div>

          <div className="setting">
            <span className="setting-icon">
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={20} />
            </span>
            <span className="setting-text">
              <strong>{t('theme')}</strong>
            </span>
            <div className="segmented sm" role="radiogroup" aria-label={t('theme')}>
              <button role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => setPref('theme', 'light')}>
                {t('themeLight')}
              </button>
              <button role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => setPref('theme', 'dark')}>
                {t('themeDark')}
              </button>
            </div>
          </div>

          <Toggle
            icon="play"
            label={t('presenterTools')}
            hint={t('presenterToolsHint')}
            checked={demoTools}
            onChange={(v) => setPref('demoTools', v)}
          />
          <Toggle
            icon="textSize"
            label={t('largeText')}
            hint={t('largeTextHint')}
            checked={largeText}
            onChange={(v) => setPref('largeText', v)}
          />
        </section>

        <section className="card about">
          <h2 className="card-title">{t('aboutData')}</h2>
          <p>{t('aboutBody')}</p>
          <p className="muted small">{t('aboutCredits')}</p>
        </section>
      </div>
    </div>
  );
}
