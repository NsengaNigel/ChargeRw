import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Station } from '../types';

function fmtRwf(n: number) {
  return n.toLocaleString() + ' RWF';
}

function StatusBadge({ status }: { status: Station['status'] }) {
  const cls =
    status === 'available'
      ? 'bg-green-100 text-green-800'
      : status === 'busy'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.stations.get(id).then((s) => {
      setStation(s);
      setLoading(false);
    });
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>
    );
  if (!station)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Station not found
      </div>
    );

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
  const co2 = ((station.speed_kw * 0.33) / station.speed_kw).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link to="/" className="text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center gap-1">
          ← Map
        </Link>
        <span className="text-sm font-bold text-green-900 flex-1 text-center">ChargeRW</span>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="bg-green-900 rounded-2xl h-44 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
          <span className="text-6xl">⚡</span>
          <div className="absolute top-4 left-4">
            <StatusBadge status={station.status} />
          </div>
        </div>

        {/* Name */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{station.name}</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <span>📍</span> {station.address}
          </p>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Connector', value: station.connector, icon: '🔌' },
            { label: 'Speed', value: `${station.speed_kw}kW`, icon: '⚡' },
            { label: 'Price', value: `${fmtRwf(station.price_per_kwh)}/kWh`, icon: '💰' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Sustainability */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <p className="text-sm font-semibold text-green-900">Sustainability impact</p>
            <p className="text-xs text-green-700 mt-0.5">
              Charging here saves approx. <strong>2.4kg of CO₂</strong> per full cycle compared to
              petrol vehicles.
            </p>
          </div>
        </div>

        {/* Estimated cost */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Estimated cost (25 kWh session)
          </p>
          <p className="text-3xl font-black text-gray-900">
            {fmtRwf(Math.round(station.price_per_kwh * 25 * 1.08))}
          </p>
          <p className="text-xs text-gray-400 mt-1">Includes 8% ChargeRW service fee</p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-6">
          {station.status === 'available' ? (
            <button
              onClick={() => navigate(`/stations/${station.id}/pay`)}
              className="w-full bg-green-900 hover:bg-green-800 text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
            >
              ⚡ Start Charging
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-base text-center cursor-not-allowed">
              Station Currently Busy
            </div>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full border-2 border-green-900 text-green-900 hover:bg-green-50 font-bold py-3.5 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
          >
            🗺 Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
