import { useLanguage } from '../i18n/LanguageContext';

// Estimated crowding as colour + word + percentage, so it never relies on colour alone.
export default function CrowdPill({ crowd, showPct = true }) {
  const { t } = useLanguage();
  return (
    <span className="crowd-pill" data-status={crowd.status}>
      <span className="crowd-pill-dot" />
      <strong>{t(`crowd_${crowd.level}`)}</strong>
      {showPct && <span className="crowd-pct">~{crowd.pct}%</span>}
    </span>
  );
}
