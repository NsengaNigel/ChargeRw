import axios from 'axios';
import type { Station, Session, PaymentEstimate } from '../types';
import { MOCK_STATIONS } from '../data/mockStations';

const BASE = '/api';

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const api = {
  stations: {
    list: () =>
      safeFetch<Station[]>(
        () => axios.get(`${BASE}/stations`).then((r) => r.data),
        MOCK_STATIONS
      ),
    get: (id: string) =>
      safeFetch<Station | null>(
        () => axios.get(`${BASE}/stations/${id}`).then((r) => r.data),
        MOCK_STATIONS.find((s) => s.id === id) ?? null
      ),
  },

  sessions: {
    create: (body: { station_id: string; phone: string; payment_method: string }) =>
      axios.post(`${BASE}/sessions`, body).then((r) => r.data as Session),
    get: (id: string) =>
      axios.get(`${BASE}/sessions/${id}`).then((r) => r.data as Session),
    stop: (id: string) =>
      axios.post(`${BASE}/sessions/${id}/stop`).then((r) => r.data as Session),
  },

  payments: {
    estimate: (price_per_kwh: number, kwh = 25) =>
      safeFetch<PaymentEstimate>(
        () =>
          axios
            .get(`${BASE}/payments/estimate`, { params: { price_per_kwh, kwh } })
            .then((r) => r.data),
        {
          subtotal_rwf: price_per_kwh * kwh,
          fee_rwf: Math.round(price_per_kwh * kwh * 0.08),
          total_rwf: Math.round(price_per_kwh * kwh * 1.08),
          kwh,
        }
      ),
    initiate: (body: { session_id: string; provider: string; phone: string; amount_rwf: number }) =>
      axios.post(`${BASE}/payments/initiate`, body).then((r) => r.data),
  },
};
