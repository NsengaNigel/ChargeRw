import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Session } from '../types';

function fmtRwf(n: number) {
  return Math.round(n).toLocaleString() + ' RWF';
}

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="relative">
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>0%</span>
        <span className="font-bold text-green-900">{Math.round(percent)}% charged</span>
        <span>100%</span>
      </div>
      <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #1B5E20, #4CAF50)',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [stopping, setStopping] = useState(false);
  const [receipt, setReceipt] = useState<Session | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!id) return;
    try {
      const s = await api.sessions.get(id);
      setSession(s);
      if (s.status !== 'active') {
        clearInterval(intervalRef.current!);
      }
    } catch {
      // backend may not be running — keep showing mock session
    }
  }, [id]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 10_000);
    return () => clearInterval(intervalRef.current!);
  }, [poll]);

  const handleStop = async () => {
    if (!id || !window.confirm('Stop the charging session now?')) return;
    setStopping(true);
    try {
      const final = await api.sessions.stop(id);
      setReceipt(final);
      setSession(final);
      clearInterval(intervalRef.current!);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Could not stop session. Try again.');
    } finally {
      setStopping(false);
    }
  };

  if (!session)
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading session…</div>;

  const isActive = session.status === 'active';
  const elapsed = session.elapsed_sec ?? 0;
  const kwh = typeof session.kwh_delivered === 'number' ? session.kwh_delivered : 0;
  const maxKwh = 60;
  const percent = Math.min((kwh / maxKwh) * 100, 100);
  const co2 = (kwh * 0.33).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <span className="text-sm font-bold text-green-900 flex-1 text-center">ChargeRW</span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Status banner */}
        <div
          className={`rounded-2xl p-4 text-center ${
            isActive ? 'bg-green-900 text-white' : 'bg-gray-800 text-white'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
            {isActive ? 'Active Session' : 'Session Complete'}
          </p>
          <p className="text-2xl font-black">
            {isActive ? 'Charging your vehicle…' : 'Charging complete!'}
          </p>
          <p className="text-sm opacity-70 mt-1 flex items-center justify-center gap-1">
            <span>📍</span>
            {session.station_name ?? 'Kigali Heights'}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Battery Progress</p>
          <ProgressBar percent={percent} />
          <p className="text-xs text-gray-400 text-center">
            Session auto-stops when battery reaches 100%
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Time Elapsed', value: fmtTime(elapsed), icon: '⏱' },
            { label: 'Delivered', value: `${kwh.toFixed(2)} kWh`, icon: '⚡' },
            { label: 'CO₂ Saved', value: `${co2} kg`, icon: '🌿' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold leading-tight">{label}</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Running cost */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Cost</p>
          <p className="text-4xl font-black text-gray-900">{fmtRwf(session.subtotal_rwf ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">
            + {fmtRwf(session.fee_rwf ?? 0)} ChargeRW fee (8%)
          </p>
        </div>

        {/* Receipt (shown after session ends) */}
        {receipt && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wider">🧾 Final Receipt</p>
            {[
              { label: 'Energy Delivered', value: `${Number(receipt.kwh_delivered).toFixed(3)} kWh` },
              { label: 'Energy Cost', value: fmtRwf(receipt.cost_rwf ?? 0) },
              { label: 'Service Fee (8%)', value: fmtRwf(receipt.fee_rwf ?? 0) },
              { label: 'Total Charged', value: fmtRwf((receipt.cost_rwf ?? 0) + (receipt.fee_rwf ?? 0)) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-green-700">{label}</span>
                <span className="font-bold text-green-900">{value}</span>
              </div>
            ))}
            <button
              onClick={() => navigate('/')}
              className="w-full mt-2 bg-green-900 text-white font-bold py-3 rounded-xl text-sm"
            >
              Back to Map
            </button>
          </div>
        )}

        {/* Stop button */}
        {isActive && !receipt && (
          <div className="pb-8 space-y-3">
            <button
              onClick={handleStop}
              disabled={stopping}
              className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-60 font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
            >
              {stopping ? <span className="animate-spin">⏳</span> : <>⏹ Stop Charging</>}
            </button>
            <p className="text-center text-xs text-gray-400">
              Polling for live updates every 10 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
