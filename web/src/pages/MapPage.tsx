import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import type { Station } from '../types';

// Fix Leaflet default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(status: Station['status']) {
  const color = status === 'available' ? '#1B5E20' : status === 'busy' ? '#B71C1C' : '#757575';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11.3 16 24 16 24s16-12.7 16-24C32 7.2 24.8 0 16 0z" fill="${color}"/>
      <text x="16" y="21" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif">⚡</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

function fmtRwf(n: number) {
  return n.toLocaleString() + ' RWF';
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.stations.list().then(setStations);
  }, []);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, {
      center: [-1.9441, 30.0619],
      zoom: 13,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMap.current);
  }, []);

  // Add/update markers when stations load
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !stations.length) return;
    stations.forEach((s) => {
      const marker = L.marker([s.latitude, s.longitude], { icon: makeIcon(s.status) })
        .addTo(map)
        .bindPopup(
          `<div class="text-sm font-semibold">${s.name}</div>
           <div class="text-xs text-gray-500">${s.address}</div>
           <div class="text-xs mt-1">${fmtRwf(s.price_per_kwh)}/kWh · ${s.speed_kw}kW</div>
           <a href="/stations/${s.id}" class="text-xs text-green-800 font-bold mt-1 inline-block">View details →</a>`
        );
      marker.on('click', () => setSelected(s));
    });
  }, [stations]);

  const filtered = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const flyTo = (s: Station) => {
    leafletMap.current?.flyTo([s.latitude, s.longitude], 15, { duration: 1 });
    setSelected(s);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white z-10 shadow-sm">
        <span className="text-xl font-bold text-green-900">⚡ ChargeRW</span>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            className="w-full pl-8 pr-4 py-2 rounded-full bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-green-800"
            placeholder="Search stations in Kigali..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-white flex flex-col">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {filtered.length} stations nearby
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => flyTo(s)}
                className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors ${
                  selected?.id === s.id ? 'bg-green-50 border-l-4 border-green-800' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{s.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-bold text-green-900">
                        {fmtRwf(s.price_per_kwh)}/kWh
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{s.speed_kw}kW</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{s.connector}</span>
                    </div>
                  </div>
                  <span
                    className={`mt-0.5 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      s.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : s.status === 'busy'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Station detail panel (bottom-right) */}
          {selected && (
            <div className="absolute bottom-6 right-6 w-72 bg-white rounded-2xl shadow-xl p-4 z-[1000] border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-2">
                  <p className="font-bold text-gray-900 text-sm leading-snug">{selected.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.address}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-3 my-3 text-center">
                {[
                  { label: 'Price', value: `${fmtRwf(selected.price_per_kwh)}/kWh` },
                  { label: 'Speed', value: `${selected.speed_kw}kW` },
                  { label: 'Type', value: selected.connector },
                ].map(({ label, value }) => (
                  <div key={label} className="flex-1 bg-gray-50 rounded-xl py-2 px-1">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <Link
                to={`/stations/${selected.id}`}
                className="block w-full text-center bg-green-900 hover:bg-green-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                View & Start Charging
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
