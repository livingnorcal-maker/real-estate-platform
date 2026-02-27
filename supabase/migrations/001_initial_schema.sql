-- ============================================
-- P2P Real Estate Platform — Initial Schema
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  location      TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'buyer'
                CHECK (role IN ('buyer', 'seller', 'both')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings
CREATE TABLE public.listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  zip_code        TEXT NOT NULL,
  latitude        NUMERIC(10, 7),
  longitude       NUMERIC(10, 7),
  price           BIGINT NOT NULL,
  bedrooms        SMALLINT,
  bathrooms       NUMERIC(3, 1),
  sqft            INT,
  lot_sqft        INT,
  year_built      SMALLINT,
  property_type   TEXT NOT NULL DEFAULT 'house'
                  CHECK (property_type IN ('house','condo','townhouse','land','multi_family','other')),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','pending','sold','withdrawn')),
  photos          TEXT[] DEFAULT '{}',
  cover_photo_index SMALLINT DEFAULT 0,
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offers
CREATE TABLE public.offers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_price             BIGINT NOT NULL,
  earnest_money           BIGINT NOT NULL DEFAULT 0,
  closing_date            DATE NOT NULL,
  inspection_contingency  BOOLEAN NOT NULL DEFAULT TRUE,
  financing_contingency   BOOLEAN NOT NULL DEFAULT TRUE,
  appraisal_contingency   BOOLEAN NOT NULL DEFAULT TRUE,
  notes                   TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','countered','withdrawn')),
  counter_price           BIGINT,
  counter_notes           TEXT,
  seller_response_at      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id)
);

-- Saved listings
CREATE TABLE public.saved_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX listings_search_idx ON public.listings USING GIN (search_vector);
CREATE INDEX listings_city_state_idx ON public.listings (city, state);
CREATE INDEX listings_price_idx ON public.listings (price);
CREATE INDEX listings_status_idx ON public.listings (status);
CREATE INDEX listings_seller_idx ON public.listings (seller_id);
CREATE INDEX offers_listing_idx ON public.offers (listing_id);
CREATE INDEX offers_buyer_idx ON public.offers (buyer_id);
CREATE INDEX offers_status_idx ON public.offers (status);
CREATE INDEX saved_listings_user_idx ON public.saved_listings (user_id);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id, read);
