import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GUANGZHOU_CENTER, LINE_BY_ID, SERVICES, STATIONS } from '../data/gzMetro';
import { linesAt } from '../lib/network';
import { useLanguage } from '../i18n/LanguageContext';

const ll = (p) => [p.lat, p.lng];

// Metro map: the Guangzhou lines over OpenStreetMap tiles (the lines and stations
// are drawn locally, so they stay visible even if tiles cannot load offline).
export default function MetroMap({
  legs = null, // route legs [{ lineId, stations }]
  from = null,
  to = null,
  board = null,
  alight = null,
  user = null, // { lat, lng, accuracy }
  follow = false,
  fitKey = null,
  interactive = true,
  className = '',
  onMapClick,
  onStationClick,
  onUserMove,
}) {
  const { lang } = useLanguage();
  const el = useRef(null);
  const map = useRef(null);
  const layers = useRef({});
  const handlers = useRef({});
  handlers.current = { onMapClick, onStationClick, onUserMove };

  // --- create the map once --------------------------------------------------
  useEffect(() => {
    const m = L.map(el.current, {
      center: GUANGZHOU_CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: false,
      keyboard: interactive,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    if (interactive) L.control.zoom({ position: 'bottomright' }).addTo(m);
    m.attributionControl.setPrefix(false);

    // Network lines and stations
    const network = L.layerGroup().addTo(m);
    SERVICES.forEach((svc) => {
      const line = LINE_BY_ID[svc.lineId];
      L.polyline(
        svc.stations.map((id) => ll(STATIONS[id])),
        { color: line.color, weight: 3.5, opacity: 0.85, interactive: false }
      ).addTo(network);
    });
    Object.values(STATIONS).forEach((s) => {
      const hub = linesAt(s.id).length > 1;
      const dot = L.circleMarker(ll(s), {
        radius: hub ? 5 : 3.2,
        weight: hub ? 2.4 : 1.6,
        color: hub ? '#0b2c42' : '#4f6a7a',
        fillColor: '#fff',
        fillOpacity: 1,
      }).addTo(network);
      dot.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        handlers.current.onStationClick?.(s);
      });
      dot.station = s;
    });

    layers.current = {
      network,
      route: L.layerGroup().addTo(m),
      user: L.layerGroup().addTo(m),
    };

    m.on('dragstart', () => handlers.current.onUserMove?.());
    m.on('click', (e) => handlers.current.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }));

    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    map.current = m;
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
    // The map is created once; props are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Station labels follow the app language.
  useEffect(() => {
    layers.current.network?.eachLayer((layer) => {
      if (layer.station) layer.bindTooltip(layer.station.name[lang], { direction: 'top', offset: [0, -4] });
    });
  }, [lang]);

  // --- route highlight ------------------------------------------------------
  useEffect(() => {
    const group = layers.current.route;
    if (!group) return;
    group.clearLayers();
    const bounds = [];

    if (legs?.length) {
      legs.forEach((leg) => {
        const pts = leg.stations.map((id) => ll(STATIONS[id]));
        bounds.push(...pts);
        L.polyline(pts, { color: '#ffffff', weight: 10, opacity: 0.95, interactive: false }).addTo(group);
        L.polyline(pts, { color: LINE_BY_ID[leg.lineId].color, weight: 6, opacity: 1, interactive: false }).addTo(group);
      });
    }
    const dashed = { color: '#0b3b57', weight: 3, dashArray: '2 7', opacity: 0.9, interactive: false };
    if (from && board) L.polyline([ll(from), ll(board)], dashed).addTo(group);
    if (alight && to) L.polyline([ll(alight), ll(to)], dashed).addTo(group);

    const pin = (p, cls) =>
      L.marker(ll(p), {
        interactive: false,
        icon: L.divIcon({ className: `pin ${cls}`, html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] }),
      }).addTo(group);
    if (from) {
      pin(from, 'pin-from');
      bounds.push(ll(from));
    }
    if (to) {
      pin(to, 'pin-to');
      bounds.push(ll(to));
    }
    if (board) {
      const m = L.circleMarker(ll(board), { radius: 7, weight: 3, color: '#0b3b57', fillColor: '#fff', fillOpacity: 1, interactive: false });
      m.addTo(group);
    }
    if (alight) {
      L.circleMarker(ll(alight), { radius: 7, weight: 3, color: '#1fc3a4', fillColor: '#fff', fillOpacity: 1, interactive: false }).addTo(group);
    }
    layers.current.bounds = bounds;
  }, [legs, from, to, board, alight]);

  // Re-fit when asked (a new route was planned, or the tab was shown).
  useEffect(() => {
    const m = map.current;
    const b = layers.current.bounds;
    if (!m || !b?.length) return;
    m.invalidateSize();
    m.fitBounds(L.latLngBounds(b), { padding: [36, 36], maxZoom: 15 });
  }, [fitKey]);

  // --- user position --------------------------------------------------------
  useEffect(() => {
    const group = layers.current.user;
    const m = map.current;
    if (!group || !m) return;
    group.clearLayers();
    if (!user) return;
    if (user.accuracy) {
      L.circle(ll(user), {
        radius: user.accuracy,
        weight: 0,
        fillColor: '#2f8fff',
        fillOpacity: 0.14,
        interactive: false,
      }).addTo(group);
    }
    L.marker(ll(user), {
      interactive: false,
      zIndexOffset: 1000,
      icon: L.divIcon({ className: 'user-dot', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
    }).addTo(group);
    if (follow) m.setView(ll(user), Math.max(m.getZoom(), 15), { animate: true });
  }, [user?.lat, user?.lng, user?.accuracy, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={`metro-map ${className}`} />;
}
