-- ============================================
-- FULL MIGRATION — Paste this entire file into Supabase SQL Editor and click Run
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

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

CREATE TABLE public.saved_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

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
-- 2. INDEXES
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

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Active listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (status != 'withdrawn' OR seller_id = auth.uid());

CREATE POLICY "Sellers can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = seller_id);

CREATE POLICY "Offers visible to listing seller and offer buyer"
  ON public.offers FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can submit offers"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Offer parties can update offers"
  ON public.offers FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Users see their own saved listings"
  ON public.saved_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings"
  ON public.saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave listings"
  ON public.saved_listings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-photos', 'property-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can upload property photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own property photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own property photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Full-text search trigger for listings
CREATE OR REPLACE FUNCTION listings_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.address_line1, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.city, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.zip_code, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_search_trigger
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION listings_search_update();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create notifications on offer events
CREATE OR REPLACE FUNCTION notify_on_offer_change() RETURNS trigger AS $$
DECLARE
  v_seller_id UUID;
  v_listing_title TEXT;
BEGIN
  SELECT l.seller_id, l.title INTO v_seller_id, v_listing_title
  FROM public.listings l WHERE l.id = NEW.listing_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_seller_id,
      'offer_received',
      'New offer received',
      'You received a new offer on "' || v_listing_title || '"',
      jsonb_build_object('listing_id', NEW.listing_id, 'offer_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (NEW.buyer_id, 'offer_accepted', 'Your offer was accepted!',
        'Your offer on "' || v_listing_title || '" was accepted.',
        jsonb_build_object('listing_id', NEW.listing_id, 'offer_id', NEW.id));
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (NEW.buyer_id, 'offer_rejected', 'Offer not accepted',
        'Your offer on "' || v_listing_title || '" was declined.',
        jsonb_build_object('listing_id', NEW.listing_id, 'offer_id', NEW.id));
    ELSIF NEW.status = 'countered' THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (NEW.buyer_id, 'offer_countered', 'Counter-offer received',
        'You received a counter-offer on "' || v_listing_title || '".',
        jsonb_build_object('listing_id', NEW.listing_id, 'offer_id', NEW.id));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER offers_notification_trigger
  AFTER INSERT OR UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION notify_on_offer_change();
