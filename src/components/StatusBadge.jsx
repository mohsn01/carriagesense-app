import { useLanguage } from '../i18n/LanguageContext';

export default function StatusBadge({ live, confidence }) {
  const { t } = useLanguage();
  return (
    <span className={`badge ${live ? 'live' : 'forecast'}`}>
      <span className="badge-dot" />
      {live ? t('live') : t('forecast')}
      {!live && confidence != null && (
        <span style={{ opacity: 0.75, fontWeight: 500 }}>
          &nbsp;· {confidence}% {t('confidence')}
        </span>
      )}
    </span>
  );
}
