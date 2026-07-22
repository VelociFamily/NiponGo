-- 1. Add new columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS adults INTEGER NOT NULL DEFAULT 1;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0;

-- 2. Migrate existing data for trips
UPDATE trips
SET
  adults = COALESCE(
    ((substring(name from '\n\n__TRIP_METADATA__:(.*)$')::jsonb)->>'adults')::integer,
    1
  ),
  children = COALESCE(
    ((substring(name from '\n\n__TRIP_METADATA__:(.*)$')::jsonb)->>'children')::integer,
    0
  ),
  name = regexp_replace(name, '\n\n__TRIP_METADATA__:.*$', '')
WHERE name LIKE '%\n\n__TRIP_METADATA__:%';

-- 3. Add new columns to blocks table
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS has_kids_price BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS kids_cost_in_base_currency NUMERIC;

-- 4. Migrate existing data for blocks
UPDATE blocks
SET
  has_kids_price = COALESCE(
    ((substring(details from '\n\n__KIDS_PRICE_METADATA__:(.*)$')::jsonb)->>'hasKidsPrice')::boolean,
    FALSE
  ),
  kids_cost_in_base_currency = ((substring(details from '\n\n__KIDS_PRICE_METADATA__:(.*)$')::jsonb)->>'kidsCostInBaseCurrency')::numeric,
  details = regexp_replace(details, '\n\n__KIDS_PRICE_METADATA__:.*$', '')
WHERE details LIKE '%\n\n__KIDS_PRICE_METADATA__:%';
