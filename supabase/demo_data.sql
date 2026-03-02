-- ============================================
-- DEMO DATA for HomeDirectly Platform
-- Run this in Supabase SQL Editor
-- ============================================

-- Get the first user's ID (you — the one who just signed up)
-- All demo listings will be created under your account
DO $$
DECLARE
  seller_id UUID;
BEGIN
  SELECT id INTO seller_id FROM profiles LIMIT 1;

  IF seller_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Sign up first, then run this script.';
  END IF;

  -- Update your profile with seller role and details
  UPDATE profiles SET
    full_name = COALESCE(full_name, 'Alex Thompson'),
    role = 'both',
    phone = '(512) 555-0199',
    location = 'Austin, TX',
    bio = 'Real estate enthusiast and homeowner in Austin. Looking to sell my property and find new investment opportunities.'
  WHERE id = seller_id;

  -- Insert demo listings
  INSERT INTO listings (seller_id, title, description, address_line1, city, state, zip_code, price, bedrooms, bathrooms, sqft, lot_sqft, year_built, property_type, status, photos, cover_photo_index) VALUES

  (seller_id,
   'Charming 3BR Colonial in Mueller',
   'Beautiful colonial-style home in the heart of Mueller. This well-maintained property features hardwood floors throughout, a renovated kitchen with granite countertops and stainless steel appliances, and a spacious backyard perfect for entertaining. Walking distance to parks, shops, and restaurants.',
   '4521 Mueller Blvd',
   'Austin', 'TX', '78723',
   42500000, 3, 2.5, 2100, 5500, 2008,
   'house', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'Modern Downtown Condo with Skyline Views',
   'Stunning 2-bedroom condo on the 15th floor with panoramic views of downtown Austin. Floor-to-ceiling windows, open concept living, chef''s kitchen with waterfall island. Building amenities include rooftop pool, fitness center, and 24/7 concierge.',
   '200 Congress Ave, Unit 1502',
   'Austin', 'TX', '78701',
   55000000, 2, 2, 1450, NULL, 2019,
   'condo', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'Spacious Family Home in Circle C Ranch',
   'Move-in ready 4-bedroom home in the sought-after Circle C Ranch neighborhood. Features a large open floor plan, updated master suite with walk-in closet, game room upstairs, and a resort-style backyard with pool and covered patio. Top-rated AISD schools.',
   '9012 Escarpment Blvd',
   'Austin', 'TX', '78749',
   67500000, 4, 3, 3200, 8000, 2005,
   'house', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'Historic Bungalow in Travis Heights',
   'Beautifully restored 1930s bungalow in one of Austin''s most desirable neighborhoods. Original character with modern updates — refinished hardwood floors, updated electrical and plumbing, new HVAC. Large front porch and mature oak trees. Walk to South Congress.',
   '1104 Travis Heights Blvd',
   'Austin', 'TX', '78704',
   72000000, 2, 1, 1200, 6200, 1932,
   'house', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'New Construction Townhouse in East Austin',
   'Brand new 3-story townhouse in booming East Austin. Smart home features throughout, quartz countertops, custom cabinetry, private rooftop deck with skyline views. Attached 2-car garage. Minutes from downtown, Rainey Street, and Lady Bird Lake.',
   '2305 E 12th St, Unit B',
   'Austin', 'TX', '78702',
   48500000, 3, 2.5, 1800, 2000, 2024,
   'townhouse', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'Hill Country Estate on 2 Acres',
   'Breathtaking Hill Country estate on 2+ acres with sweeping views. Custom-built with premium finishes — imported tile, chef''s kitchen with double ovens, wine cellar, home theater. Infinity pool overlooking the hills. Gated entry with circular driveway.',
   '18500 Hamilton Pool Rd',
   'Austin', 'TX', '78738',
   125000000, 5, 4.5, 4800, 87120, 2018,
   'house', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'Investment Multi-Family Duplex',
   'Excellent investment opportunity in growing East Austin corridor. Fully occupied duplex — each unit has 2 bedrooms and 1 bathroom. Both units recently updated with new flooring, paint, and appliances. Strong rental history with below-market rents.',
   '3401 Webberville Rd',
   'Austin', 'TX', '78702',
   38000000, 4, 2, 2400, 7000, 1975,
   'multi_family', 'active', ARRAY[]::TEXT[], 0),

  (seller_id,
   'Lakefront Land - Build Your Dream Home',
   'Rare 1.5-acre lakefront lot on Lake Travis with 150 feet of water frontage. Gentle slope to the water, mature trees, and stunning sunset views. Utilities at the lot line. Approved building plans available. One of the last undeveloped lakefront parcels.',
   '14200 Lakeshore Dr',
   'Austin', 'TX', '78734',
   95000000, NULL, NULL, NULL, 65340, NULL,
   'land', 'active', ARRAY[]::TEXT[], 0);

  RAISE NOTICE 'Demo data inserted successfully! 8 listings created for user %', seller_id;
END $$;
