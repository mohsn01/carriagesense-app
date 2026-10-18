import { createContext, useContext, useEffect, useState } from 'react';

const PrefsContext = createContext(null);

const DEFAULTS = { theme: 'light', largeText: false, quietAlerts: true, demoTools: false };

function readPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('cs-prefs') || '{}') };
  } catch {
    return DEFAULTS;
  }
}

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.large = prefs.largeText ? 'true' : 'false';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', prefs.theme === 'dark' ? '#07151f' : '#0b3b57');
    try {
      localStorage.setItem('cs-prefs', JSON.stringify(prefs));
    } catch {
      /* storage can be blocked (private mode); the app still works */
    }
  }, [prefs]);

  const setPref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));
  return <PrefsContext.Provider value={{ ...prefs, setPref }}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}
