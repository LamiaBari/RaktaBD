-- ═══════════════════════════════════════════════════════════════════
-- RAKTABD — COMPLETE POSTGRESQL SCHEMA
-- Blood Donor Emergency Finder — Bangladesh
-- ═══════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy district search

-- ───────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ───────────────────────────────────────────────────────────────────
CREATE TYPE blood_group_enum   AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE urgency_enum       AS ENUM ('Critical','Normal');
CREATE TYPE req_status_enum    AS ENUM ('Open','Closed');
CREATE TYPE service_type_enum  AS ENUM ('Government','Private','NGO');
CREATE TYPE donor_badge_enum   AS ENUM ('First Time Donor','Regular Donor','Hero Donor','Lifesaver');

-- ───────────────────────────────────────────────────────────────────
-- TABLE: profiles  (synced from auth.users)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  gender      TEXT CHECK (gender IN ('Male','Female','Other')),
  district    TEXT,
  division    TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: donors
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  blood_group      blood_group_enum NOT NULL,
  district         TEXT NOT NULL,
  division         TEXT,
  phone_number     TEXT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  last_donated_at  TIMESTAMPTZ,
  donation_count   INTEGER NOT NULL DEFAULT 0,
  gender           TEXT CHECK (gender IN ('Male','Female','Other')),
  date_of_birth    DATE,
  nid              TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: emergency_requests
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_group     blood_group_enum NOT NULL,
  patient_name    TEXT NOT NULL,
  hospital_name   TEXT NOT NULL,
  district        TEXT NOT NULL,
  address         TEXT,
  contact_number  TEXT NOT NULL,
  units_required  INTEGER NOT NULL DEFAULT 1 CHECK (units_required > 0),
  urgency_level   urgency_enum NOT NULL DEFAULT 'Normal',
  status          req_status_enum NOT NULL DEFAULT 'Open',
  description     TEXT,
  needed_by       TIMESTAMPTZ,
  patient_age     INTEGER,
  contact_person  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: ambulance_services
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulance_services (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name    TEXT NOT NULL,
  phone_number    TEXT NOT NULL,
  district        TEXT NOT NULL,
  division        TEXT,
  address         TEXT,
  service_type    service_type_enum NOT NULL DEFAULT 'Private',
  available_24_7  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: donation_history
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donation_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id        UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_group     blood_group_enum NOT NULL,
  donation_date   DATE NOT NULL,
  hospital_name   TEXT NOT NULL,
  district        TEXT NOT NULL,
  units_donated   INTEGER NOT NULL DEFAULT 1 CHECK (units_donated > 0),
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: contact_views  (phone reveal audit log)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id    UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  viewer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id  UUID NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(donor_id, viewer_id, request_id)
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: user_preferences
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  show_phone_number               BOOLEAN NOT NULL DEFAULT TRUE,
  show_email                      BOOLEAN NOT NULL DEFAULT FALSE,
  available_for_donation          BOOLEAN NOT NULL DEFAULT TRUE,
  receive_emergency_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  receive_email_notifications     BOOLEAN NOT NULL DEFAULT TRUE,
  allow_contact_reveal            BOOLEAN NOT NULL DEFAULT TRUE,
  donation_eligibility_days       INTEGER NOT NULL DEFAULT 120,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: notifications
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info'
              CHECK (type IN ('info','emergency','contact_reveal','eligibility','system')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: bangladesh_districts  (static lookup)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bangladesh_districts (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  division  TEXT NOT NULL
);

INSERT INTO bangladesh_districts (name, division) VALUES
  ('Bagerhat','Khulna'),('Bandarban','Chittagong'),('Barguna','Barisal'),
  ('Barisal','Barisal'),('Bhola','Barisal'),('Bogra','Rajshahi'),
  ('Brahmanbaria','Chittagong'),('Chandpur','Chittagong'),('Chapai Nawabganj','Rajshahi'),
  ('Chattogram','Chittagong'),('Chuadanga','Khulna'),('Comilla','Chittagong'),
  ('Cox''s Bazar','Chittagong'),('Dhaka','Dhaka'),('Dinajpur','Rangpur'),
  ('Faridpur','Dhaka'),('Feni','Chittagong'),('Gaibandha','Rangpur'),
  ('Gazipur','Dhaka'),('Gopalganj','Dhaka'),('Habiganj','Sylhet'),
  ('Jamalpur','Mymensingh'),('Jessore','Khulna'),('Jhalokati','Barisal'),
  ('Jhenaidah','Khulna'),('Joypurhat','Rajshahi'),('Khagrachhari','Chittagong'),
  ('Khulna','Khulna'),('Kishoreganj','Dhaka'),('Kurigram','Rangpur'),
  ('Kushtia','Khulna'),('Lakshmipur','Chittagong'),('Lalmonirhat','Rangpur'),
  ('Madaripur','Dhaka'),('Magura','Khulna'),('Manikganj','Dhaka'),
  ('Meherpur','Khulna'),('Moulvibazar','Sylhet'),('Munshiganj','Dhaka'),
  ('Mymensingh','Mymensingh'),('Naogaon','Rajshahi'),('Narail','Khulna'),
  ('Narayanganj','Dhaka'),('Narsingdi','Dhaka'),('Natore','Rajshahi'),
  ('Netrokona','Mymensingh'),('Nilphamari','Rangpur'),('Noakhali','Chittagong'),
  ('Pabna','Rajshahi'),('Panchagarh','Rangpur'),('Patuakhali','Barisal'),
  ('Pirojpur','Barisal'),('Rajbari','Dhaka'),('Rajshahi','Rajshahi'),
  ('Rangamati','Chittagong'),('Rangpur','Rangpur'),('Satkhira','Khulna'),
  ('Shariatpur','Dhaka'),('Sherpur','Mymensingh'),('Sirajganj','Rajshahi'),
  ('Sunamganj','Sylhet'),('Sylhet','Sylhet'),('Tangail','Dhaka'),
  ('Thakurgaon','Rangpur')
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_donors_blood_group   ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_district      ON donors(district);
CREATE INDEX IF NOT EXISTS idx_donors_is_active     ON donors(is_active);
CREATE INDEX IF NOT EXISTS idx_donors_user_id       ON donors(user_id);

CREATE INDEX IF NOT EXISTS idx_er_status            ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_er_urgency           ON emergency_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_er_district          ON emergency_requests(district);
CREATE INDEX IF NOT EXISTS idx_er_user_id           ON emergency_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_er_created_at        ON emergency_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_er_blood_group       ON emergency_requests(blood_group);

CREATE INDEX IF NOT EXISTS idx_amb_district         ON ambulance_services(district);
CREATE INDEX IF NOT EXISTS idx_amb_type             ON ambulance_services(service_type);
CREATE INDEX IF NOT EXISTS idx_amb_247              ON ambulance_services(available_24_7);

CREATE INDEX IF NOT EXISTS idx_dh_donor_id          ON donation_history(donor_id);
CREATE INDEX IF NOT EXISTS idx_dh_user_id           ON donation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dh_date              ON donation_history(donation_date DESC);

CREATE INDEX IF NOT EXISTS idx_cv_donor_viewer      ON contact_views(donor_id, viewer_id);
CREATE INDEX IF NOT EXISTS idx_cv_viewer_id         ON contact_views(viewer_id);

CREATE INDEX IF NOT EXISTS idx_notif_user_id        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read        ON notifications(is_read);

-- Trigram indexes for district search
CREATE INDEX IF NOT EXISTS idx_districts_trgm       ON bangladesh_districts USING GIN (name gin_trgm_ops);

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS: auto-update updated_at
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ DECLARE t TEXT;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'profiles','donors','emergency_requests','ambulance_services',
  'donation_history','user_preferences'
]) LOOP
  EXECUTE format(
    'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()', t, t);
END LOOP; END $$;

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: auto-create profile + preferences on signup
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: sync donation_count on donation_history insert/delete
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_sync_donation_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_donor_id UUID;
BEGIN
  v_donor_id := COALESCE(NEW.donor_id, OLD.donor_id);
  UPDATE donors
  SET
    donation_count  = (SELECT COUNT(*) FROM donation_history WHERE donor_id = v_donor_id),
    last_donated_at = (SELECT MAX(donation_date)::TIMESTAMPTZ FROM donation_history WHERE donor_id = v_donor_id)
  WHERE id = v_donor_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_donation_count
  AFTER INSERT OR DELETE ON donation_history
  FOR EACH ROW EXECUTE FUNCTION fn_sync_donation_count();

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: send notification on contact reveal
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_notify_contact_reveal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_donor_user_id UUID; v_viewer_name TEXT;
BEGIN
  SELECT user_id INTO v_donor_user_id FROM donors WHERE id = NEW.donor_id;
  SELECT COALESCE(full_name,'Someone') INTO v_viewer_name FROM profiles WHERE id = NEW.viewer_id;

  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (
    v_donor_user_id,
    'Your contact was revealed',
    v_viewer_name || ' viewed your phone number.',
    'contact_reveal',
    jsonb_build_object('viewer_id', NEW.viewer_id, 'request_id', NEW.request_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_contact_reveal
  AFTER INSERT ON contact_views
  FOR EACH ROW EXECUTE FUNCTION fn_notify_contact_reveal();

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: notify matching donors on new emergency request
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_notify_matching_donors()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT
    d.user_id,
    'Emergency Blood Request — ' || NEW.blood_group,
    'Urgent ' || NEW.blood_group || ' blood needed at ' || NEW.hospital_name || ', ' || NEW.district,
    'emergency',
    jsonb_build_object('request_id', NEW.id, 'blood_group', NEW.blood_group, 'district', NEW.district)
  FROM donors d
  JOIN user_preferences up ON up.user_id = d.user_id
  WHERE
    d.blood_group = NEW.blood_group
    AND d.district = NEW.district
    AND d.is_active = TRUE
    AND up.receive_emergency_notifications = TRUE
    AND d.user_id <> NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_matching_donors
  AFTER INSERT ON emergency_requests
  FOR EACH ROW EXECUTE FUNCTION fn_notify_matching_donors();

-- ═══════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS (callable via Supabase RPC)
-- ═══════════════════════════════════════════════════════════════════

-- Check if user has an active emergency request
CREATE OR REPLACE FUNCTION user_has_active_request(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM emergency_requests
    WHERE user_id = p_user_id AND status = 'Open'
  );
$$;

-- Search districts (autocomplete)
CREATE OR REPLACE FUNCTION search_districts(p_query TEXT)
RETURNS TABLE(name TEXT, division TEXT) LANGUAGE sql STABLE AS $$
  SELECT name, division FROM bangladesh_districts
  WHERE name ILIKE p_query || '%'
  ORDER BY name
  LIMIT 10;
$$;

-- Get donor badge based on donation_count
CREATE OR REPLACE FUNCTION get_donor_badge(p_count INTEGER)
RETURNS donor_badge_enum LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_count = 0 THEN 'First Time Donor'::donor_badge_enum
    WHEN p_count BETWEEN 1 AND 4  THEN 'Regular Donor'::donor_badge_enum
    WHEN p_count BETWEEN 5 AND 9  THEN 'Hero Donor'::donor_badge_enum
    ELSE 'Lifesaver'::donor_badge_enum
  END;
$$;

-- Get next eligible donation date for a donor
CREATE OR REPLACE FUNCTION next_eligible_date(p_donor_id UUID)
RETURNS DATE LANGUAGE sql STABLE AS $$
  SELECT (d.last_donated_at + (up.donation_eligibility_days || ' days')::INTERVAL)::DATE
  FROM donors d
  JOIN user_preferences up ON up.user_id = d.user_id
  WHERE d.id = p_donor_id AND d.last_donated_at IS NOT NULL;
$$;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE notifications SET is_read = TRUE
  WHERE user_id = p_user_id AND is_read = FALSE;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- ── Helper: is admin ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── PROFILES ─────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT  USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── DONORS ───────────────────────────────────────────────────────
CREATE POLICY "donors_read_all"       ON donors FOR SELECT  USING (TRUE);
CREATE POLICY "donors_insert_own"     ON donors FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "donors_update_own"     ON donors FOR UPDATE  USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "donors_delete_own"     ON donors FOR DELETE  USING (auth.uid() = user_id OR is_admin());

-- ── EMERGENCY REQUESTS ────────────────────────────────────────────
CREATE POLICY "er_read_all"           ON emergency_requests FOR SELECT  USING (TRUE);
CREATE POLICY "er_insert_own"         ON emergency_requests FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "er_update_own"         ON emergency_requests FOR UPDATE  USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "er_delete_own"         ON emergency_requests FOR DELETE  USING (auth.uid() = user_id OR is_admin());

-- ── AMBULANCE SERVICES ────────────────────────────────────────────
CREATE POLICY "amb_read_all"          ON ambulance_services FOR SELECT  USING (TRUE);
CREATE POLICY "amb_insert_admin"      ON ambulance_services FOR INSERT  WITH CHECK (is_admin());
CREATE POLICY "amb_update_admin"      ON ambulance_services FOR UPDATE  USING (is_admin());
CREATE POLICY "amb_delete_admin"      ON ambulance_services FOR DELETE  USING (is_admin());

-- ── DONATION HISTORY ──────────────────────────────────────────────
CREATE POLICY "dh_select_own_or_admin" ON donation_history FOR SELECT  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "dh_insert_admin"        ON donation_history FOR INSERT  WITH CHECK (is_admin());
CREATE POLICY "dh_update_admin"        ON donation_history FOR UPDATE  USING (is_admin());
CREATE POLICY "dh_delete_admin"        ON donation_history FOR DELETE  USING (is_admin());

-- ── CONTACT VIEWS ─────────────────────────────────────────────────
CREATE POLICY "cv_select_own_or_donor" ON contact_views FOR SELECT
  USING (
    auth.uid() = viewer_id OR
    EXISTS (SELECT 1 FROM donors WHERE id = contact_views.donor_id AND user_id = auth.uid()) OR
    is_admin()
  );
CREATE POLICY "cv_insert_own"          ON contact_views FOR INSERT  WITH CHECK (auth.uid() = viewer_id);

-- ── USER PREFERENCES ──────────────────────────────────────────────
CREATE POLICY "pref_select_own"        ON user_preferences FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "pref_insert_own"        ON user_preferences FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pref_update_own"        ON user_preferences FOR UPDATE  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────
CREATE POLICY "notif_select_own"       ON notifications FOR SELECT  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "notif_update_own"       ON notifications FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "notif_delete_own"       ON notifications FOR DELETE  USING (auth.uid() = user_id OR is_admin());

-- ── BANGLADESH DISTRICTS (public read) ────────────────────────────
ALTER TABLE bangladesh_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "districts_read_all"     ON bangladesh_districts FOR SELECT USING (TRUE);

-- ═══════════════════════════════════════════════════════════════════
-- REALTIME: enable publications
-- ═══════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE ambulance_services;
ALTER PUBLICATION supabase_realtime ADD TABLE donation_history;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE contact_views;

-- ═══════════════════════════════════════════════════════════════════
-- VIEWS (for convenient queries)
-- ═══════════════════════════════════════════════════════════════════

-- Emergency requests with requester profile
CREATE OR REPLACE VIEW v_emergency_requests AS
SELECT
  er.*,
  p.full_name AS requester_name,
  p.district  AS requester_district
FROM emergency_requests er
LEFT JOIN profiles p ON p.id = er.user_id
ORDER BY er.created_at DESC;

-- Donors with preferences (privacy flags)
CREATE OR REPLACE VIEW v_donors AS
SELECT
  d.*,
  up.show_phone_number,
  up.allow_contact_reveal,
  up.available_for_donation,
  get_donor_badge(d.donation_count) AS badge,
  next_eligible_date(d.id)          AS next_eligible_date
FROM donors d
LEFT JOIN user_preferences up ON up.user_id = d.user_id;

-- Donation history with badge
CREATE OR REPLACE VIEW v_donation_history AS
SELECT
  dh.*,
  d.full_name AS donor_name,
  d.donation_count,
  get_donor_badge(d.donation_count) AS badge
FROM donation_history dh
JOIN donors d ON d.id = dh.donor_id
ORDER BY dh.donation_date DESC;



cat >> /home/claude/raktabd/schema.sql << 'SQL'

-- ═══════════════════════════════════════════════════════
-- ADDITIONAL TABLES (new features)
-- ═══════════════════════════════════════════════════════

-- ── ambulance_services ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulance_services (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  district     TEXT NOT NULL,
  address      TEXT,
  service_type TEXT NOT NULL DEFAULT 'Private' CHECK (service_type IN ('Government','Private','NGO')),
  available_24_7 BOOLEAN DEFAULT true,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_amb_district ON ambulance_services(district);
CREATE INDEX IF NOT EXISTS idx_amb_type     ON ambulance_services(service_type);

-- ── donation_history ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS donation_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id      UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_group   TEXT NOT NULL,
  donation_date DATE NOT NULL,
  hospital_name TEXT NOT NULL,
  district      TEXT,
  units_donated INTEGER DEFAULT 1,
  verified      BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dh_user_id ON donation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dh_date    ON donation_history(donation_date DESC);

-- ── user_preferences ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  show_phone_number             BOOLEAN DEFAULT true,
  show_email                    BOOLEAN DEFAULT false,
  available_for_donation        BOOLEAN DEFAULT true,
  receive_emergency_notifications BOOLEAN DEFAULT true,
  receive_email_notifications   BOOLEAN DEFAULT false,
  allow_contact_reveal          BOOLEAN DEFAULT true,
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

-- ── notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- ── bangladesh_districts (autocomplete source) ───────────
CREATE TABLE IF NOT EXISTS bangladesh_districts (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  division TEXT NOT NULL
);

INSERT INTO bangladesh_districts (name, division) VALUES
('Bagerhat','Khulna'),('Bandarban','Chittagong'),('Barguna','Barisal'),
('Barishal','Barisal'),('Bhola','Barisal'),('Bogura','Rajshahi'),
('Brahmanbaria','Chittagong'),('Chandpur','Chittagong'),('Chapainawabganj','Rajshahi'),
('Chattogram','Chittagong'),('Chuadanga','Khulna'),('Cox''s Bazar','Chittagong'),
('Cumilla','Chittagong'),('Dhaka','Dhaka'),('Dinajpur','Rangpur'),
('Faridpur','Dhaka'),('Feni','Chittagong'),('Gaibandha','Rangpur'),
('Gazipur','Dhaka'),('Gopalganj','Dhaka'),('Habiganj','Sylhet'),
('Jamalpur','Mymensingh'),('Jashore','Khulna'),('Jhalokathi','Barisal'),
('Jhenaidah','Khulna'),('Joypurhat','Rajshahi'),('Khagrachhari','Chittagong'),
('Khulna','Khulna'),('Kishoreganj','Dhaka'),('Kurigram','Rangpur'),
('Kushtia','Khulna'),('Lakshmipur','Chittagong'),('Lalmonirhat','Rangpur'),
('Madaripur','Dhaka'),('Magura','Khulna'),('Manikganj','Dhaka'),
('Meherpur','Khulna'),('Moulvibazar','Sylhet'),('Munshiganj','Dhaka'),
('Mymensingh','Mymensingh'),('Naogaon','Rajshahi'),('Narail','Khulna'),
('Narayanganj','Dhaka'),('Narsingdi','Dhaka'),('Natore','Rajshahi'),
('Netrokona','Mymensingh'),('Nilphamari','Rangpur'),('Noakhali','Chittagong'),
('Pabna','Rajshahi'),('Panchagarh','Rangpur'),('Patuakhali','Barisal'),
('Pirojpur','Barisal'),('Rajbari','Dhaka'),('Rajshahi','Rajshahi'),
('Rangamati','Chittagong'),('Rangpur','Rangpur'),('Satkhira','Khulna'),
('Shariatpur','Dhaka'),('Sherpur','Mymensingh'),('Sirajganj','Rajshahi'),
('Sunamganj','Sylhet'),('Sylhet','Sylhet'),('Tangail','Dhaka'),
('Thakurgaon','Rangpur')
ON CONFLICT (name) DO NOTHING;

-- ── search_districts RPC ─────────────────────────────────
CREATE OR REPLACE FUNCTION search_districts(p_query TEXT)
RETURNS TABLE(name TEXT, division TEXT) AS $$
  SELECT name, division FROM bangladesh_districts
  WHERE name ILIKE '%' || p_query || '%'
  ORDER BY
    CASE WHEN name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    name
  LIMIT 10;
$$ LANGUAGE sql STABLE;

-- ── mark_all_notifications_read RPC ──────────────────────
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void AS $$
  UPDATE notifications SET is_read = true
  WHERE user_id = p_user_id AND is_read = false;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── RLS for new tables ───────────────────────────────────
ALTER TABLE ambulance_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- ambulance_services: anyone reads, owner manages
CREATE POLICY "amb_read_all"   ON ambulance_services FOR SELECT USING (true);
CREATE POLICY "amb_insert_own" ON ambulance_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amb_update_own" ON ambulance_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amb_delete_own" ON ambulance_services FOR DELETE USING (auth.uid() = user_id);

-- donation_history: only the donor sees their own
CREATE POLICY "dh_select_own" ON donation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dh_insert_own" ON donation_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dh_update_own" ON donation_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dh_delete_own" ON donation_history FOR DELETE USING (auth.uid() = user_id);

-- user_preferences
CREATE POLICY "prefs_own" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "notif_own" ON notifications FOR ALL USING (auth.uid() = user_id);
SQL
echo "schema extended"