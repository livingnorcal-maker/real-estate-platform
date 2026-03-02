-- ============================================
-- 005: Transactions, Escrow & Service Providers
-- ============================================

-- 1. Service Providers (escrow, title, inspectors, lenders)
CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('escrow', 'title', 'inspector', 'lender')),
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  city TEXT,
  state TEXT,
  rating NUMERIC(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Transactions (created when offer accepted)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  escrow_provider_id UUID REFERENCES service_providers(id),
  title_provider_id UUID REFERENCES service_providers(id),
  status TEXT NOT NULL DEFAULT 'opened' CHECK (status IN ('opened', 'in_progress', 'closing', 'closed', 'cancelled')),
  closing_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Transaction Milestones
CREATE TABLE transaction_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'waived')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Escrow Payments (Stripe)
CREATE TABLE escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  payer_id UUID NOT NULL REFERENCES profiles(id),
  amount BIGINT NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_service_providers_type ON service_providers(type) WHERE active = true;
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_milestones_transaction ON transaction_milestones(transaction_id);
CREATE INDEX idx_escrow_payments_transaction ON escrow_payments(transaction_id);
CREATE INDEX idx_escrow_payments_stripe ON escrow_payments(stripe_payment_intent_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;

-- Service Providers: anyone can read active providers
CREATE POLICY "Anyone can view active providers"
  ON service_providers FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can create providers"
  ON service_providers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Transactions: buyer and seller can view/update their own
CREATE POLICY "Buyer and seller can view their transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyer and seller can update their transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Milestones: accessible if user is buyer/seller on parent transaction
CREATE POLICY "Transaction parties can view milestones"
  ON transaction_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_milestones.transaction_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Transaction parties can update milestones"
  ON transaction_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_milestones.transaction_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "System can insert milestones"
  ON transaction_milestones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Escrow Payments: buyer and seller can view
CREATE POLICY "Transaction parties can view payments"
  ON escrow_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = escrow_payments.transaction_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert payments"
  ON escrow_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payments"
  ON escrow_payments FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on transactions
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_escrow_payments_updated_at
  BEFORE UPDATE ON escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Auto-create transaction + milestones when offer is accepted
CREATE OR REPLACE FUNCTION create_transaction_on_offer_accepted()
RETURNS TRIGGER AS $$
DECLARE
  new_transaction_id UUID;
  v_listing_id UUID;
  v_seller_id UUID;
  v_closing_date DATE;
  v_inspection BOOLEAN;
  v_financing BOOLEAN;
  v_appraisal BOOLEAN;
  v_earnest_money BIGINT;
  milestone_order INT := 1;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get offer details
    v_listing_id := NEW.listing_id;
    v_closing_date := NEW.closing_date::DATE;
    v_inspection := NEW.inspection_contingency;
    v_financing := NEW.financing_contingency;
    v_appraisal := NEW.appraisal_contingency;
    v_earnest_money := NEW.earnest_money;

    -- Get seller_id from listing
    SELECT seller_id INTO v_seller_id FROM listings WHERE id = v_listing_id;

    -- Create transaction
    INSERT INTO transactions (listing_id, offer_id, buyer_id, seller_id, closing_date, status)
    VALUES (v_listing_id, NEW.id, NEW.buyer_id, v_seller_id, v_closing_date, 'opened')
    RETURNING id INTO new_transaction_id;

    -- Create milestones based on offer contingencies
    -- 1. Earnest Money (always)
    IF v_earnest_money > 0 THEN
      INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
      VALUES (new_transaction_id, 'Earnest Money Deposit', 'Buyer deposits earnest money via platform', milestone_order);
      milestone_order := milestone_order + 1;
    END IF;

    -- 2. Title Search (always)
    INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
    VALUES (new_transaction_id, 'Title Search', 'Title company verifies clear title', milestone_order);
    milestone_order := milestone_order + 1;

    -- 3. Home Inspection (if contingency)
    IF v_inspection THEN
      INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
      VALUES (new_transaction_id, 'Home Inspection', 'Professional home inspection completed', milestone_order);
      milestone_order := milestone_order + 1;
    END IF;

    -- 4. Appraisal (if contingency)
    IF v_appraisal THEN
      INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
      VALUES (new_transaction_id, 'Appraisal', 'Property appraisal completed by lender', milestone_order);
      milestone_order := milestone_order + 1;
    END IF;

    -- 5. Financing (if contingency)
    IF v_financing THEN
      INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
      VALUES (new_transaction_id, 'Financing Approval', 'Buyer mortgage/loan approved', milestone_order);
      milestone_order := milestone_order + 1;
    END IF;

    -- 6. Final Walkthrough (always)
    INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
    VALUES (new_transaction_id, 'Final Walkthrough', 'Buyer conducts final property walkthrough', milestone_order);
    milestone_order := milestone_order + 1;

    -- 7. Closing (always)
    INSERT INTO transaction_milestones (transaction_id, title, description, sort_order)
    VALUES (new_transaction_id, 'Closing', 'Sign documents and transfer ownership', milestone_order);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_transaction
  AFTER UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_on_offer_accepted();
