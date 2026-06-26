-- M0neyPundit - Supabase Schema
-- Run this in Supabase SQL Editor
-- IMPORTANT: This will DROP and recreate all tables with fresh data

-- ============================================
-- STEP 1: Drop existing tables (if they have wrong schema)
-- ============================================
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS marketplace CASCADE;
DROP TABLE IF EXISTS side_hustles CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- ============================================
-- STEP 2: Create Deals table (synced from Telegram)
-- ============================================
CREATE TABLE deals (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL DEFAULT 'goodlobang',
  title TEXT NOT NULL,
  description TEXT,
  discount TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  merchant TEXT,
  location TEXT,
  expiry_date TEXT,
  url TEXT,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  raw_text TEXT,
  matched_keywords TEXT[],
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_deals_category ON deals(category);
CREATE INDEX IF NOT EXISTS idx_deals_merchant ON deals(merchant) WHERE merchant IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_location ON deals(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_is_popular ON deals(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_channel_created ON deals(channel_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Public read access for deals (anyone can view deals)
CREATE POLICY "Allow public read access on deals"
  ON deals
  FOR SELECT
  USING (true);

-- Service role can insert/update (for Telegram sync)
CREATE POLICY "Service role full access on deals"
  ON deals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STEP 3: Create Side Hustles table
-- ============================================
CREATE TABLE side_hustles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10, 2),
  category TEXT,
  location TEXT,
  url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert sample side hustles
INSERT INTO side_hustles (title, description, hourly_rate, category, location, url, is_featured) VALUES
('Campus Tutor - Math & Science', 'Help fellow students with math, physics, chemistry tutoring. Flexible scheduling.', 50.00, 'Tutoring', 'NUS/NTU', NULL, TRUE),
('Food Delivery Rider', 'Deliver food orders using bike/scooter. Earn based on deliveries completed.', 15.00, 'Delivery', 'Various', NULL, FALSE),
('Freelance Graphic Designer', 'Create posters, flyers, social media graphics for student organizations.', 35.00, 'Design', 'Remote', NULL, TRUE),
('ESL Tutor for Kids', 'Teach English to primary school kids online. TEFL cert preferred but not required.', 40.00, 'Tutoring', 'Remote/Online', NULL, FALSE),
('Event Staff / Promoter', 'Work at concerts, festivals, and campus events. Good for networking.', 18.00, 'Events', 'Singapore', NULL, FALSE),
('Virtual Assistant', 'Help busy professionals with email management, scheduling, and research.', 25.00, 'Admin', 'Remote', NULL, TRUE),
('Photography Assistant', 'Assist at photo shoots, events, and exhibitions. Camera experience helpful.', 20.00, 'Creative', 'Singapore', NULL, FALSE),
('Content Writer / Blogger', 'Write articles, reviews, and blog posts for companies and startups.', 30.00, 'Writing', 'Remote', NULL, FALSE);

-- ============================================
-- STEP 4: Create Marketplace table
-- ============================================
CREATE TABLE marketplace (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'used')),
  listing_type TEXT CHECK (listing_type IN ('sell', 'rent', 'borrow', 'giveaway')),
  seller_name TEXT,
  seller_contact TEXT,
  location TEXT,
  image_url TEXT,
  url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_type ON marketplace(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_price ON marketplace(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_featured ON marketplace(is_featured) WHERE is_featured = TRUE;

-- Enable RLS
ALTER TABLE marketplace ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on marketplace"
  ON marketplace
  FOR SELECT
  USING (true);

-- Service role can insert/update/delete
CREATE POLICY "Service role full access on marketplace"
  ON marketplace
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert sample marketplace items
INSERT INTO marketplace (title, description, price, original_price, category, condition, listing_type, seller_name, location) VALUES
('CASIO fx-991EX Calculator', 'Scientific calculator, perfect for engineering math. Barely used.', 35.00, 55.00, 'Electronics', 'like_new', 'sell', 'John', 'NUS'),
('Organic Chemistry Textbook', '11th edition by McMurry. Good condition with some highlights.', 25.00, 80.00, 'Textbooks', 'good', 'sell', 'Sarah', 'NTU'),
('Lab Coat - Size M', 'White lab coat, NUS chemistry department standard size.', 10.00, 35.00, 'Equipment', 'good', 'rent', 'Mike', 'NUS'),
('Calculus Early Transcendentals', '8th edition. Essential for MA1101/MA1505.', 20.00, 65.00, 'Textbooks', 'fair', 'sell', 'Amy', 'SMU'),
('USB-C Hub / Dock', '7-in-1 USB-C hub. HDMI, ethernet, SD card reader.', 15.00, 45.00, 'Electronics', 'like_new', 'sell', 'David', 'Polytechnic'),
('Physics Textbook Vol 1', 'Halliday Resnick Fundamentals. Good for freshers.', 18.00, 70.00, 'Textbooks', 'good', 'sell', 'Lisa', 'NUS'),
('Scientific Calculator (Non-CAS)', 'Casio fx-570ES PLUS. Approved for exams.', 12.00, 30.00, 'Electronics', 'good', 'sell', 'Ryan', 'NTU'),
('Engineering Drawing Set', 'Complete set with compass, protractor, French curve.', 8.00, 25.00, 'Supplies', 'like_new', 'giveaway', 'Emma', 'NUS'),
('Python Crash Course Book', '3rd edition. Great for beginners.', 15.00, 40.00, 'Textbooks', 'good', 'sell', 'James', 'SMU'),
('Power Strip / Extension Cord', '6-outlet power strip with USB ports. Dorm essential.', 5.00, 20.00, 'Supplies', 'fair', 'sell', 'Olivia', 'Polytechnic');

-- ============================================
-- STEP 5: Create Hustles table (synced from Telegram)
-- ============================================
CREATE TABLE hustles (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL DEFAULT 'sgfreelancing',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  pay_rate TEXT,
  deadline TEXT,
  contact TEXT,
  url TEXT,
  location TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  raw_text TEXT,
  matched_keywords TEXT[],
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_hustles_category ON hustles(category);
CREATE INDEX IF NOT EXISTS idx_hustles_is_popular ON hustles(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_hustles_created_at ON hustles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hustles_channel_created ON hustles(channel_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE hustles ENABLE ROW LEVEL SECURITY;

-- Public read access for hustles
CREATE POLICY "Allow public read access on hustles"
  ON hustles
  FOR SELECT
  USING (true);

-- Service role can insert/update (for Telegram sync)
CREATE POLICY "Service role full access on hustles"
  ON hustles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STEP 6: Create User Preferences table (optional)
-- ============================================
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  preferred_categories TEXT[] DEFAULT ARRAY['food', 'tech'],
  campus TEXT DEFAULT 'nus',
  weekly_budget DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() IS NOT NULL OR user_id = 'anonymous');

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (true);