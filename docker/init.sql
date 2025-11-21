CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_lat double precision,
  origin_lng double precision,
  dest_lat double precision,
  dest_lng double precision,
  status text NOT NULL DEFAULT 'created',
  distance_km double precision,
  price numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Columnas legacy: asegura que existan si ya estaba creada la tabla
ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_geojson text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_geojson text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_lat double precision;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_lng double precision;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dest_lat double precision;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dest_lng double precision;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_km double precision;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'created';
ALTER TABLE trips ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE trips ALTER COLUMN updated_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
