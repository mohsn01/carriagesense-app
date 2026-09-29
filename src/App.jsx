import './App.css';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import PlanScreen from './screens/PlanScreen';
import PlatformScreen from './screens/PlatformScreen';
import OnboardScreen from './screens/OnboardScreen';

const SCREEN_COMPONENTS = {
  home: HomeScreen,
  plan: PlanScreen,
  platform: PlatformScreen,
  onboard: OnboardScreen,
};

function AppShell() {
  const { screen, demoMode, startDemo, stopDemo } = useSimulation();
  const { lang, toggle, t } = useLanguage();
  const ScreenComponent = SCREEN_COMPONENTS[screen];

  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="topbar">
        <div className="app-title">{t('appName')}</div>
        <div className="topbar-actions">
          <button
            className="lang-toggle"
            onClick={demoMode ? stopDemo : startDemo}
            style={demoMode ? { background: '#e5484d', color: '#fff', borderColor: '#e5484d' } : undefined}
          >
            {demoMode ? t('stopDemo') : t('demoMode')}
          </button>
          <button className="lang-toggle" onClick={toggle}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>
      </div>
      <div className="screen">
        <ScreenComponent />
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <SimulationProvider>
        <AppShell />
      </SimulationProvider>
    </LanguageProvider>
  );
}

export default App;
