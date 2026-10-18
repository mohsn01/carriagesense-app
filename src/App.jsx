import { useEffect, useRef, useState } from 'react';
import './App.css';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { PrefsProvider } from './context/PrefsContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import BottomNav from './components/BottomNav';
import Icon from './components/Icon';
import Logo from './components/Logo';
import PlacePicker from './components/PlacePicker';
import PlanScreen from './screens/PlanScreen';
import MapScreen from './screens/MapScreen';
import TripScreen from './screens/TripScreen';
import MeScreen from './screens/MeScreen';

const SCREEN_COMPONENTS = {
  plan: PlanScreen,
  map: MapScreen,
  trip: TripScreen,
  me: MeScreen,
};

// Sizes (CSS px) of the preview devices shown on desktop browsers.
const DEVICES = {
  phone: { w: 390, h: 844, label: 'Phone' },
  tablet: { w: 1112, h: 834, label: 'Tablet' },
};

const DESKTOP_QUERY = '(min-width: 900px) and (hover: hover) and (pointer: fine)';

function useDesktopPreview() {
  const [on, setOn] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = () => setOn(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return on;
}

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

function StatusBar() {
  const d = new Date();
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return (
    <div className="statusbar" aria-hidden="true">
      <span>{time}</span>
      <span className="statusbar-icons">
        <i className="sb-signal" />
        <i className="sb-battery" />
      </span>
    </div>
  );
}

function AppShell({ framed }) {
  const { screen, demo, startDemo, stopDemo, picker } = useSimulation();
  const { lang, toggle, t } = useLanguage();
  const ScreenComponent = SCREEN_COMPONENTS[screen];
  const mainRef = useRef(null);

  // Every tab starts at the top.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <div className="app">
      <header className="app-header">
        {framed && <StatusBar />}
        <div className="app-header-row">
          <div className="brand">
            <Logo size={34} />
            <div className="brand-text">
              <strong>{t('appName')}</strong>
              <span>{t('tagline')}</span>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`pill-btn ${demo ? 'danger' : ''}`}
              onClick={demo ? stopDemo : startDemo}
              aria-pressed={demo}
            >
              <Icon name={demo ? 'stop' : 'play'} size={14} strokeWidth={2.2} />
              {demo ? t('stopDemo') : t('demoMode')}
            </button>
            <button className="pill-btn" onClick={toggle} aria-label="Language">
              {lang === 'en' ? '中文' : 'EN'}
            </button>
          </div>
        </div>
      </header>
      <main className={`screen ${screen === 'map' ? 'is-map' : ''}`} ref={mainRef}>
        <ScreenComponent key={screen} />
      </main>
      <BottomNav />
      {picker && <PlacePicker key={picker} />}
    </div>
  );
}

function Frame() {
  const [device, setDevice] = useState('phone');
  const { w, h } = useViewport();
  const d = DEVICES[device];
  const scale = Math.min(1, (h - 110) / d.h, (w - 48) / d.w);

  return (
    <div className="stage framed">
      <div className="picker" role="radiogroup" aria-label="Preview device">
        {Object.entries(DEVICES).map(([id, dev]) => (
          <button
            key={id}
            role="radio"
            aria-checked={device === id}
            className={device === id ? 'on' : ''}
            onClick={() => setDevice(id)}
          >
            {dev.label}
          </button>
        ))}
      </div>
      <div className="device-slot" style={{ width: d.w * scale, height: d.h * scale }}>
        <div
          className={`device ${device}`}
          style={{ width: d.w, height: d.h, transform: `scale(${scale})` }}
        >
          <AppShell framed />
        </div>
      </div>
    </div>
  );
}

function Root() {
  const desktop = useDesktopPreview();
  if (desktop) return <Frame />;
  return (
    <div className="stage">
      <div className="device full">
        <AppShell framed={false} />
      </div>
    </div>
  );
}

function App() {
  return (
    <PrefsProvider>
      <LanguageProvider>
        <SimulationProvider>
          <Root />
        </SimulationProvider>
      </LanguageProvider>
    </PrefsProvider>
  );
}

export default App;
