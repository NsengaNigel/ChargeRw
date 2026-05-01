CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS stations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  latitude      NUMERIC(9,6) NOT NULL,
  longitude     NUMERIC(9,6) NOT NULL,
  connector     TEXT NOT NULL DEFAULT 'Type 2',
  speed_kw      NUMERIC(5,1) NOT NULL,
  price_per_kwh INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','busy','offline')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id    UUID REFERENCES stations(id),
  phone         TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mtn','airtel')),
  started_at    TIMESTAMPTZ DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  kwh_delivered NUMERIC(6,3) DEFAULT 0,
  cost_rwf      INTEGER DEFAULT 0,
  fee_rwf       INTEGER DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled'))
);

CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID REFERENCES sessions(id),
  provider      TEXT NOT NULL,
  provider_ref  TEXT,
  amount_rwf    INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  created_at    TIMESTAMPTZ DEFAULT now()
);
