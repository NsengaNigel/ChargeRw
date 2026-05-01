export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  connector: string;
  speed_kw: number;
  price_per_kwh: number;
  status: 'available' | 'busy' | 'offline';
}

export interface Session {
  id: string;
  station_id: string;
  station_name: string;
  address: string;
  price_per_kwh: number;
  speed_kw: number;
  phone: string;
  payment_method: 'mtn' | 'airtel';
  started_at: string;
  ended_at: string | null;
  kwh_delivered: number;
  cost_rwf: number;
  fee_rwf: number;
  status: 'active' | 'completed' | 'cancelled';
  elapsed_sec: number;
  subtotal_rwf: number;
  total_rwf: number;
}

export interface PaymentEstimate {
  subtotal_rwf: number;
  fee_rwf: number;
  total_rwf: number;
  kwh: number;
}
