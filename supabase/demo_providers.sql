-- Demo Service Providers
-- Run in Supabase SQL Editor after running 005_transactions_escrow.sql

INSERT INTO service_providers (name, type, description, phone, email, website, city, state, rating) VALUES
  ('Lone Star Escrow', 'escrow', 'Full-service escrow with fast turnaround times. Serving Central Texas since 2010.', '(512) 555-0101', 'info@lonestarescrow.com', 'https://lonestarescrow.com', 'Austin', 'TX', 4.8),
  ('Capital City Escrow', 'escrow', 'Trusted escrow services for residential and commercial transactions.', '(512) 555-0102', 'hello@capitalcityescrow.com', 'https://capitalcityescrow.com', 'Austin', 'TX', 4.5),
  ('Texas Shield Title', 'title', 'Comprehensive title search and insurance. 20+ years experience in Texas real estate.', '(512) 555-0201', 'info@texasshieldtitle.com', 'https://texasshieldtitle.com', 'Austin', 'TX', 4.9),
  ('Clearview Title Co.', 'title', 'Fast, reliable title services with online document access and e-signing.', '(512) 555-0202', 'support@clearviewtitle.com', 'https://clearviewtitle.com', 'Round Rock', 'TX', 4.6),
  ('HomeCheck Inspections', 'inspector', 'Certified home inspectors with same-day reports. ASHI and InterNACHI certified.', '(512) 555-0301', 'book@homecheckinspections.com', 'https://homecheckinspections.com', 'Austin', 'TX', 4.7),
  ('Eagle Eye Home Inspectors', 'inspector', 'Thorough inspections including foundation, roof, HVAC, electrical, and plumbing.', '(512) 555-0302', 'info@eagleeyeinspectors.com', 'https://eagleeyeinspectors.com', 'Cedar Park', 'TX', 4.4),
  ('Hill Country Lending', 'lender', 'Competitive mortgage rates with personalized service. Pre-approvals in 24 hours.', '(512) 555-0401', 'loans@hillcountrylending.com', 'https://hillcountrylending.com', 'Austin', 'TX', 4.6),
  ('Austin First Mortgage', 'lender', 'Conventional, FHA, VA, and jumbo loans. Local expertise with national reach.', '(512) 555-0402', 'apply@austinfirstmortgage.com', 'https://austinfirstmortgage.com', 'Austin', 'TX', 4.3);
