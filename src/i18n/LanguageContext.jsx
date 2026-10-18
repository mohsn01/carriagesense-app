import { createContext, useContext, useEffect, useState } from 'react';
import { t as translate } from './strings';

const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    return localStorage.getItem('cs-lang') === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    try {
      localStorage.setItem('cs-lang', lang);
    } catch {
      /* storage can be blocked (private mode); the app still works */
    }
  }, [lang]);

  const t = (key, vars) => translate(key, lang, vars);
  const toggle = () => setLang((l) => (l === 'en' ? 'zh' : 'en'));
  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
