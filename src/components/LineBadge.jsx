import { LINE_BY_ID } from '../data/gzMetro';

// A metro line as passengers know it: a coloured roundel with the line number.
export default function LineBadge({ lineId, size = 'md', label }) {
  const line = LINE_BY_ID[lineId];
  if (!line) return null;
  return (
    <span className={`lbadge ${size}`} style={{ background: line.color, color: line.text }} aria-label={label}>
      {line.id}
    </span>
  );
}
