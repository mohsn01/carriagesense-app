import { createContext, useContext, useState } from 'react';
import { t as translate } from './strings';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
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
