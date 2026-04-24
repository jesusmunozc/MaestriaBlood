-- ============================================================
--  !Blood — Supabase Schema
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  username          TEXT UNIQUE NOT NULL,
  email             TEXT,
  blood_type        TEXT,
  user_type         TEXT NOT NULL DEFAULT 'donor',  -- 'donor' | 'professional'
  id_type           TEXT,
  city              TEXT,
  address           TEXT,
  profile_image_url TEXT,
  front_doc_url     TEXT,
  back_doc_url      TEXT,
  avg_rating        NUMERIC(3,2) DEFAULT 0,
  total_donations   INT DEFAULT 0,
  penalty_until     TIMESTAMPTZ,
  survey_done       BOOLEAN DEFAULT FALSE,
  aptitude_eligible BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read any profile"     ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own profile"   ON profiles FOR ALL   USING (auth.uid() = id);

-- Blood requests
CREATE TABLE IF NOT EXISTS blood_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_type      TEXT NOT NULL,
  units_needed    INT NOT NULL DEFAULT 1,
  donors_needed   INT NOT NULL DEFAULT 1,
  donors_accepted INT NOT NULL DEFAULT 0,
  urgency         TEXT NOT NULL DEFAULT 'medium',  -- 'low' | 'medium' | 'urgent'
  health_center   TEXT NOT NULL,
  address         TEXT,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'open',    -- 'open' | 'completed' | 'cancelled'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read open requests"   ON blood_requests FOR SELECT USING (true);
CREATE POLICY "Owner can manage own requests"   ON blood_requests FOR ALL   USING (auth.uid() = requester_id);
CREATE POLICY "Authenticated can read"          ON blood_requests FOR SELECT USING (auth.role() = 'authenticated');

-- Donations
CREATE TABLE IF NOT EXISTS donations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id    UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'confirmed',  -- 'confirmed' | 'cancelled' | 'completed'
  confirmed_at  TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (donor_id, request_id)
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donation visibility"      ON donations FOR SELECT USING (auth.uid() = donor_id OR EXISTS (SELECT 1 FROM blood_requests WHERE id = request_id AND requester_id = auth.uid()));
CREATE POLICY "Donor can manage own"     ON donations FOR ALL   USING (auth.uid() = donor_id);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  description        TEXT,
  location           TEXT NOT NULL,
  date               DATE NOT NULL,
  start_time         TIME,
  end_time           TIME,
  total_slots        INT NOT NULL DEFAULT 20,
  registered_slots   INT NOT NULL DEFAULT 0,
  blood_types_needed TEXT[],
  requirements       TEXT,
  status             TEXT NOT NULL DEFAULT 'upcoming',  -- 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read campaigns"      ON campaigns FOR SELECT USING (true);
CREATE POLICY "Organizer can manage campaigns" ON campaigns FOR ALL   USING (auth.uid() = organizer_id);

-- Campaign registrations
CREATE TABLE IF NOT EXISTS campaign_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'registered',  -- 'registered' | 'cancelled' | 'attended'
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, campaign_id)
);

ALTER TABLE campaign_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can see own registrations" ON campaign_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can manage own reg"        ON campaign_registrations FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "Organizer can view"             ON campaign_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND organizer_id = auth.uid())
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  related_id UUID,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  donation_id UUID REFERENCES donations(id),
  stars       INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rater_id, donation_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rater can submit"           ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Rated user can read"        ON ratings FOR SELECT USING (auth.uid() = rated_id OR auth.uid() = rater_id);

-- ============================================================
--  RPCs
-- ============================================================

-- Increment donors_accepted on blood_requests
CREATE OR REPLACE FUNCTION increment_donors_accepted(request_id UUID)
RETURNS VOID AS $$
  UPDATE blood_requests
  SET donors_accepted = donors_accepted + 1
  WHERE id = request_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Increment registered_slots on campaigns
CREATE OR REPLACE FUNCTION increment_registered_slots(camp_id UUID)
RETURNS VOID AS $$
  UPDATE campaigns
  SET registered_slots = registered_slots + 1
  WHERE id = camp_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Update avg_rating for a user
CREATE OR REPLACE FUNCTION update_user_avg_rating(p_user_id UUID)
RETURNS VOID AS $$
  UPDATE profiles
  SET avg_rating = (SELECT COALESCE(AVG(stars), 0) FROM ratings WHERE rated_id = p_user_id)
  WHERE id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get email by user_id (for username login)
CREATE OR REPLACE FUNCTION get_email_by_user_id(p_username TEXT)
RETURNS TEXT AS $$
  SELECT email FROM profiles WHERE username = p_username LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
--  Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blood_requests_status     ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_type ON blood_requests(blood_type);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at ON blood_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_donor           ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_request         ON donations(request_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_date            ON campaigns(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_username         ON profiles(username);
