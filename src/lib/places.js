import { STATIONS, LANDMARKS } from '../data/gzMetro';

// A "place" is { id, kind: 'gps'|'saved'|'station'|'landmark'|'address'|'map', name, lat, lng }
// where name is either a plain string or { en, zh }.
export function placeName(place, lang) {
  if (!place) return '';
  if (typeof place.name === 'string') return place.name;
  return place.name[lang] || place.name.en;
}

const KEY = 'cs-saved-places';

export function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function storeSaved(saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* storage can be blocked; saved places then last for this session only */
  }
}

// Instant, offline search over stations and landmarks.
export function searchLocal(query, lang) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = (name) => name.en.toLowerCase().includes(q) || name.zh.includes(q);
  const stations = Object.values(STATIONS)
    .filter((s) => hit(s.name))
    .slice(0, 6)
    .map((s) => ({ id: `st-${s.id}`, kind: 'station', name: s.name, lat: s.lat, lng: s.lng, stationId: s.id }));
  const landmarks = LANDMARKS.filter((l) => hit(l.name))
    .slice(0, 5)
    .map((l) => ({ ...l, kind: 'landmark' }));
  void lang;
  return [...landmarks, ...stations];
}

// Online address / place search (OpenStreetMap Nominatim). Needs internet.
export async function searchAddress(query, lang, signal) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=cn' +
    `&accept-language=${lang === 'zh' ? 'zh-CN' : 'en'}` +
    '&viewbox=112.9,23.6,113.8,22.8&bounded=1' +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const rows = await res.json();
  return rows.map((r) => {
    const parts = (r.display_name || '').split(',').map((p) => p.trim());
    return {
      id: `osm-${r.place_id}`,
      kind: 'address',
      name: r.name || parts[0] || query,
      sub: parts.slice(1, 3).join(', '),
      lat: Number(r.lat),
      lng: Number(r.lon),
    };
  });
}
