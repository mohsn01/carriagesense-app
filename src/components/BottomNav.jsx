import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';

const ITEMS = [
  { id: 'home', key: 'navHome', icon: '⌂' },
  { id: 'plan', key: 'navPlan', icon: '🗺' },
  { id: 'platform', key: 'navPlatform', icon: '🚉' },
  { id: 'onboard', key: 'navOnboard', icon: '🚆' },
];

export default function BottomNav() {
  const { screen, setScreen } = useSimulation();
  const { t } = useLanguage();
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${screen === item.id ? 'active' : ''}`}
          onClick={() => setScreen(item.id)}
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span>{t(item.key)}</span>
        </button>
      ))}
    </nav>
  );
}
