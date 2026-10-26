// Small stroke-icon set (24px grid). Inline SVG so it works offline in the APK
// and inherits the surrounding text colour.
const ICONS = {
  home: <path d="M3.5 10.8 12 3.5l8.5 7.3V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V14h-7v6.5H5A1.5 1.5 0 0 1 3.5 19z" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
    </>
  ),
  train: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3.5" />
      <path d="M5 11h14M9 21l2-4M15 21l-2-4" />
      <path d="M9 14.2h.01M15 14.2h.01" strokeWidth="2.4" />
    </>
  ),
  pass: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10.5h18M7 15h3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  swap: <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />,
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 21h4" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="M12 8.5l-2.5 4 2.5 2.2v5.3M12 8.5l3 3.5h2.5M9.5 12.5L7 14.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M16 14.2a4.8 4.8 0 0 1 4.5 4.8" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z" />,
  door: (
    <>
      <path d="M5 3.5h14v17H5z" />
      <path d="M12 3.5v17M9 12h.01M15 12h.01" />
    </>
  ),
  exit: (
    <>
      <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  bolt: <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.7h.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  play: <path d="M8 5v14l11-7z" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17" />
    </>
  ),
  cap: (
    <>
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5" />
    </>
  ),
  plane: <path d="M21 15.5v-2l-8-5V4a1.5 1.5 0 0 0-3 0v4.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" />,
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  textSize: <path d="M3.5 19l5-14 5 14M5.5 14h6M14.5 19l2.8-7.5L20.5 19M15.7 16.5h3.2" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  map: (
    <>
      <path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  navigation: <path d="M12 3l7 17-7-4-7 4z" />,
  car: (
    <>
      <path d="M4.5 16.5v-5l2-5h11l2 5v5z" />
      <path d="M4.5 11.5h15M7 16.5v2.5M17 16.5v2.5" />
      <path d="M8 14h.01M16 14h.01" strokeWidth="2.4" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="3.5" width="16" height="14" rx="3" />
      <path d="M4 11h16M7.5 20.5v-3M16.5 20.5v-3" />
      <path d="M8 14.3h.01M16 14.3h.01" strokeWidth="2.4" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l4-7h5l3 7M10 9l3 7M9 6h3" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <path d="M3.5 4v4.5H8M12 8v4.5l3 1.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.5" />
      <path d="M16 13.8h.01" strokeWidth="2.4" />
    </>
  ),
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
