-- Add payment support to Cal-Lite
-- Migration: 00002_add_payments

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');

-- Add payment fields to event_types table
ALTER TABLE event_types
  ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN price_cents INTEGER,
  ADD COLUMN refund_window_hours INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN promo_code TEXT;

-- Add constraint: price_cents required when is_paid is true
ALTER TABLE event_types
  ADD CONSTRAINT check_paid_has_price CHECK (
    (is_paid = FALSE) OR (is_paid = TRUE AND price_cents IS NOT NULL AND price_cents > 0)
  );

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  refund_id TEXT,
  refund_amount_cents INTEGER,
  event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_timezone TEXT NOT NULL,
  booking_start_time TIMESTAMPTZ NOT NULL,
  booking_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payments table
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_event_type_id ON payments(event_type_id);

-- Apply updated_at trigger to payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
-- Users can view payments for their own event types
CREATE POLICY "Users can view payments for own events"
  ON payments FOR SELECT
  USING (
    event_type_id IN (
      SELECT id FROM event_types WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all payments (for webhook handling)
CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Add payment_id reference to bookings for easier lookup
ALTER TABLE bookings
  ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_payment_id ON bookings(payment_id);
