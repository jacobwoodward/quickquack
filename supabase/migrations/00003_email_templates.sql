-- Email templates and reminder tracking
-- Migration: 00003_email_templates

-- Create email template type enum
CREATE TYPE email_template_type AS ENUM ('confirmation', 'reminder', 'cancellation', 'rescheduled');

-- Create email_templates table for customizable email content
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

-- Add reminder tracking to bookings
ALTER TABLE bookings
  ADD COLUMN reminder_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (reminder_status IN ('pending', 'sent', 'skipped'));

-- Index for efficient reminder queries
CREATE INDEX idx_bookings_reminder_status ON bookings(reminder_status, start_time, status);

-- Index for email templates lookup
CREATE INDEX idx_email_templates_user_type ON email_templates(user_id, template_type);

-- Apply updated_at trigger to email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own templates
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

-- Service role can manage all (for cron jobs)
CREATE POLICY "Service role can manage all email templates"
  ON email_templates FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);
