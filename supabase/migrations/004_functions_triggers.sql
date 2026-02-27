-- ============================================
-- Functions & Triggers
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

-- ============================================
-- Full-text search trigger for listings
-- ============================================
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

-- ============================================
-- Auto-create profile on user signup
-- ============================================
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

-- ============================================
-- Auto-create notifications on offer events
-- ============================================
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
