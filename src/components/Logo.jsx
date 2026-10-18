// Brand mark: a train of three carriages, the middle one highlighted.
export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#0b3b57" />
      <rect x="6" y="17" width="10" height="14" rx="3" fill="#ffffff" opacity="0.55" />
      <rect x="19" y="17" width="10" height="14" rx="3" fill="#2fd1b0" />
      <rect x="32" y="17" width="10" height="14" rx="3" fill="#ffffff" opacity="0.55" />
      <path d="M8 36h32" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
