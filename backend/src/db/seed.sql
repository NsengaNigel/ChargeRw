INSERT INTO stations (name, address, latitude, longitude, connector, speed_kw, price_per_kwh, status) VALUES
  ('Kigali Heights Charging Hub', 'KG 7 Ave, Kigali Heights', -1.9441, 30.0619, 'Type 2', 22.0, 500, 'available'),
  ('Inzora Rooftop EV Point',     'KG 5 Ave, Inzora Tower',   -1.9521, 30.0589, 'Type 2', 11.0, 450, 'available'),
  ('Norrsken House Kigali',       'KN 3 Rd, Norrsken Hub',    -1.9381, 30.0649, 'CCS',    50.0, 480, 'busy'),
  ('KCC Fast Charger',            'KN 2 Ave, Convention Ctr', -1.9536, 30.0605, 'CHAdeMO',43.0, 460, 'available'),
  ('Kimironko Charge Hub',        'KG 9 Ave, Kimironko',      -1.9397, 30.1119, 'Type 2', 22.0, 500, 'available'),
  ('Nyamirambo EV Station',       'KN 4 Ave, Nyamirambo',     -1.9781, 30.0419, 'Type 2', 11.0, 440, 'available'),
  ('Remera Charge Point',         'KG 11 Ave, Remera',        -1.9478, 30.1011, 'CCS',    50.0, 490, 'busy'),
  ('Gisozi Tech Park Charger',    'KG 16 Ave, Gisozi',        -1.9178, 30.0801, 'Type 2', 22.0, 470, 'available')
ON CONFLICT DO NOTHING;
