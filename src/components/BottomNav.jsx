import { useSimulation } from '../context/SimulationContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';

const ITEMS = [
  { id: 'plan', key: 'navPlan', icon: 'route' },
  { id: 'map', key: 'navMap', icon: 'map' },
  { id: 'trip', key: 'navTrip', icon: 'navigation' },
  { id: 'me', key: 'navMe', icon: 'user' },
];

// Bottom tab bar on phones; becomes a left rail on tablets (see App.css).
export default function BottomNav() {
  const { screen, setScreen, trip } = useSimulation();
  const { t } = useLanguage();
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => setScreen(item.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon">
              <Icon name={item.icon} size={22} strokeWidth={active ? 2.1 : 1.8} />
              {item.id === 'trip' && trip && <i className="nav-dot" aria-hidden="true" />}
            </span>
            <span className="nav-label">{t(item.key)}</span>
          </button>
        );
      })}
    </nav>
  );
}
