import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import type { Station, PaymentEstimate } from '../types';

type Method = 'mtn' | 'airtel';

const METHODS: { id: Method; name: string; detail: string; color: string; textColor: string }[] = [
  { id: 'mtn', name: 'MTN Mobile Money', detail: 'Pay via MTN MoMo', color: '#FFC107', textColor: '#000' },
  { id: 'airtel', name: 'Airtel Money', detail: 'Pay via Airtel wallet', color: '#E30613', textColor: '#fff' },
];

function fmtRwf(n: number) {
  return n.toLocaleString() + ' RWF';
}

function validatePhone(phone: string, method: Method) {
  const clean = phone.replace(/\D/g, '');
  if (method === 'mtn') return /^(078|079|072|073)\d{7}$/.test(clean) || /^250(78|79|72|73)\d{7}$/.test(clean);
  if (method === 'airtel') return /^(073|072)\d{7}$/.test(clean) || /^250(73|72)\d{7}$/.test(clean);
  return false;
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [station, setStation] = useState<Station | null>(null);
  const [estimate, setEstimate] = useState<PaymentEstimate | null>(null);
  const [method, setMethod] = useState<Method>('mtn');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.stations.get(id).then((s) => {
      setStation(s);
      if (s) api.payments.estimate(s.price_per_kwh, 25).then(setEstimate);
    });
  }, [id]);

  const handlePay = async () => {
    if (!station || !estimate) return;
    if (!validatePhone(phone, method)) {
      setPhoneError(`Enter a valid ${method === 'mtn' ? 'MTN (078/079)' : 'Airtel (073/072)'} number`);
      return;
    }
    setPhoneError('');
    setLoading(true);
    setError('');
    try {
      const session = await api.sessions.create({
        station_id: station.id,
        phone,
        payment_method: method,
      });
      await api.payments.initiate({
        session_id: session.id,
        provider: method,
        phone,
        amount_rwf: estimate.total_rwf,
      });
      navigate(`/sessions/${session.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!station || !estimate)
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link to={`/stations/${id}`} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
          ← Back
        </Link>
        <span className="text-sm font-bold text-green-900 flex-1 text-center">ChargeRW</span>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Selected station */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selected Station</p>
          <p className="font-bold text-green-900 text-base leading-tight">{station.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span>📍</span> {station.address}
          </p>
        </div>

        {/* Session summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Session Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated session (25 kWh)</span>
            <span className="font-semibold text-gray-900">{fmtRwf(estimate.subtotal_rwf)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ChargeRW fee (8%)</span>
            <span className="font-semibold text-gray-900">{fmtRwf(estimate.fee_rwf)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between items-end">
            <span className="font-bold text-gray-900">Total</span>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">{fmtRwf(estimate.total_rwf)}</p>
              <p className="text-xs text-gray-400">Rwandan Francs</p>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Payment Method</p>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setPhoneError(''); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                method === m.id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                style={{ backgroundColor: m.color, color: m.textColor }}
              >
                {m.id === 'mtn' ? 'MTN' : 'A'}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                <p className="text-xs text-gray-500">{m.detail}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  method === m.id ? 'bg-amber-400 border-amber-400' : 'border-gray-300'
                }`}
              >
                {method === m.id && <span className="text-white text-xs leading-none">✓</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Phone input */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Mobile Money Number
          </label>
          <input
            type="tel"
            placeholder={method === 'mtn' ? '078 xxx xxxx' : '073 xxx xxxx'}
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
              phoneError
                ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 focus:ring-2 focus:ring-green-800 focus:border-green-800'
            }`}
          />
          {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
          <p className="text-xs text-gray-400">
            You will receive a payment prompt on this number.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Pay button */}
        <div className="pb-8 space-y-3">
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : (
              <>⚡ Pay &amp; Start Charging</>
            )}
          </button>
          <p className="text-center text-xs text-gray-400">
            🔒 Secure payment via Mobile Money sandbox
          </p>
        </div>
      </div>
    </div>
  );
}
