-- QuickQuack Database Schema
-- Single consolidated migration for easy setup
-- Run this in Supabase SQL Editor to set up your database

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE booking_status AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'REJECTED');
CREATE TYPE location_type AS ENUM ('google_meet', 'in_person', 'phone', 'link');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE email_template_type AS ENUM ('confirmation', 'reminder', 'cancellation', 'rescheduled');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schedules table (availability templates)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Availability table (time slots within schedules)
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  specific_date DATE, -- For date-specific overrides
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_time_range CHECK (start_time < end_time),
  CONSTRAINT check_day_or_date CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL AND specific_date IS NOT NULL)
  )
);

-- Event types table
CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  length INTEGER NOT NULL DEFAULT 30, -- Duration in minutes
  location_type location_type NOT NULL DEFAULT 'google_meet',
  location_value TEXT, -- Address, phone number, or custom link
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  buffer_time_before INTEGER NOT NULL DEFAULT 0, -- Minutes before meeting
  buffer_time_after INTEGER NOT NULL DEFAULT 0, -- Minutes after meeting
  minimum_notice INTEGER NOT NULL DEFAULT 60, -- Minutes of advance notice required
  booking_limits_per_day INTEGER,
  booking_limits_per_week INTEGER,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  -- Payment fields
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  price_cents INTEGER,
  refund_window_hours INTEGER NOT NULL DEFAULT 24,
  promo_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug),
  CONSTRAINT check_paid_has_price CHECK (
    (is_paid = FALSE) OR (is_paid = TRUE AND price_cents IS NOT NULL AND price_cents > 0)
  )
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID, -- Set after booking is created
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

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'ACCEPTED',
  location_type location_type NOT NULL,
  location_value TEXT, -- The actual meeting URL/address
  cancellation_reason TEXT,
  rescheduled_from_uid TEXT, -- Reference to original booking if rescheduled
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  reminder_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (reminder_status IN ('pending', 'sent', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_booking_time CHECK (start_time < end_time)
);

-- Add foreign key from payments to bookings (after bookings table exists)
ALTER TABLE payments
  ADD CONSTRAINT payments_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- Attendees table
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credentials table (OAuth tokens for calendar integrations)
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'google_calendar'
  key JSONB NOT NULL, -- Encrypted tokens: { access_token, refresh_token, expiry_date }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Selected calendars (calendars to check for conflicts)
CREATE TABLE selected_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Calendar ID from Google
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, credential_id, external_id)
);

-- Destination calendars (where to create booking events)
CREATE TABLE destination_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Calendar ID from Google
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- Only one destination calendar per user
);

-- Booking references (links to external calendar events)
CREATE TABLE booking_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'google_calendar'
  external_id TEXT NOT NULL, -- Event ID from Google Calendar
  meeting_url TEXT, -- Google Meet link
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_type email_template_type NOT NULL,
  subject TEXT NOT NULL,
  greeting TEXT,
  body_text TEXT,
  footer_text TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, template_type)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_event_types_user_id ON event_types(user_id);
CREATE INDEX idx_event_types_slug ON event_types(slug);
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_availability_schedule_id ON availability(schedule_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_type_id ON bookings(event_type_id);
CREATE INDEX idx_bookings_uid ON bookings(uid);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_id ON bookings(payment_id);
CREATE INDEX idx_bookings_reminder_status ON bookings(reminder_status, start_time, status);
CREATE INDEX idx_attendees_booking_id ON attendees(booking_id);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_selected_calendars_user_id ON selected_calendars(user_id);
CREATE INDEX idx_booking_references_booking_id ON booking_references(booking_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_event_type_id ON payments(event_type_id);
CREATE INDEX idx_email_templates_user_type ON email_templates(user_id, template_type);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON event_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Schedules policies
CREATE POLICY "Users can manage own schedules"
  ON schedules FOR ALL
  USING (auth.uid() = user_id);

-- Availability policies
CREATE POLICY "Users can manage own availability"
  ON availability FOR ALL
  USING (
    schedule_id IN (
      SELECT id FROM schedules WHERE user_id = auth.uid()
    )
  );

-- Event types policies
CREATE POLICY "Users can manage own event types"
  ON event_types FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view non-hidden event types"
  ON event_types FOR SELECT
  USING (hidden = FALSE);

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (TRUE);

-- Attendees policies
CREATE POLICY "Users can view attendees of own bookings"
  ON attendees FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create attendees"
  ON attendees FOR INSERT
  WITH CHECK (TRUE);

-- Credentials policies
CREATE POLICY "Users can manage own credentials"
  ON credentials FOR ALL
  USING (auth.uid() = user_id);

-- Selected calendars policies
CREATE POLICY "Users can manage own selected calendars"
  ON selected_calendars FOR ALL
  USING (auth.uid() = user_id);

-- Destination calendars policies
CREATE POLICY "Users can manage own destination calendars"
  ON destination_calendars FOR ALL
  USING (auth.uid() = user_id);

-- Booking references policies
CREATE POLICY "Users can view own booking references"
  ON booking_references FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage booking references"
  ON booking_references FOR ALL
  USING (TRUE);

-- Payments policies
CREATE POLICY "Users can view payments for own events"
  ON payments FOR SELECT
  USING (
    event_type_id IN (
      SELECT id FROM event_types WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Email templates policies
CREATE POLICY "Users can view own email templates"
  ON email_templates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email templates"
  ON email_templates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own email templates"
  ON email_templates FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all email templates"
  ON email_templates FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- AUTH HOOKS (Auto-create user profile and default schedule)
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to create default schedule for new users
CREATE OR REPLACE FUNCTION create_default_schedule()
RETURNS TRIGGER AS $$
DECLARE
  schedule_id UUID;
BEGIN
  -- Create default schedule
  INSERT INTO schedules (user_id, name, timezone, is_default)
  VALUES (NEW.id, 'Working Hours', NEW.timezone, TRUE)
  RETURNING id INTO schedule_id;

  -- Create default availability (Mon-Fri 9am-5pm)
  INSERT INTO availability (schedule_id, day_of_week, start_time, end_time)
  VALUES
    (schedule_id, 1, '09:00', '17:00'),
    (schedule_id, 2, '09:00', '17:00'),
    (schedule_id, 3, '09:00', '17:00'),
    (schedule_id, 4, '09:00', '17:00'),
    (schedule_id, 5, '09:00', '17:00');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default schedule when user is created
CREATE TRIGGER on_user_created_create_schedule
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_schedule();
