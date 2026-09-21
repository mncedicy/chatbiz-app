# 🐘 Neon (Pure Serverless PostgreSQL)


🗺️ The Three Core Geometric DatatypesPostGIS introduces three fundamental building blocks to your data tables:Points: A single specific set of coordinates tracking exactly where something is. (In ChatBiz, we use this to track a customer's location pin or a car wash bay's physical address).Lines / LineStrings: A continuous series of connected points forming a pathway. (Used for tracking roads or a bakkie driver's trip route).Polygons: A closed ring of lines forming a boundary area. (Used for setting strict neighborhood operational perimeters, like mapping a delivery zone for a kitchen).⚙️ Why ChatBiz Needs PostGIS (The Real-World Tasks)Your application cannot function efficiently without PostGIS. It runs three critical spatial operations inside your backend:1. The Proximity Radius Match (ST_DWithin)When an on-demand plumber job is requested, your code doesn't scan the entire country. It uses a PostGIS spatial index to immediately filter and find only the plumbers whose registered coordinates fall within a strict 5-kilometer circle of the customer. This math is processed at database level in milliseconds.2. Exact Distance Calculation (ST_Distance)For your bakkie hire services, you don't guess travel distances. PostGIS measures the exact straight-line or road distance between the client's pickup coordinate point and drop-off coordinate point, converting that figure into kilometers automatically so the backend can apply the driver's per-kilometer price matrix.3. Spatial Boundary Indexing (GIST)In standard databases, searching through millions of coordinate points forces the server to look at every single row, which crashes response speeds. PostGIS introduces GIST (Generalized Search Tree) Indexes. It groups data by map grids, meaning the database can skip scanning 99% of rows outside the target city region instantly.💡 How It Looks in Plain EnglishInstead of writing complex mathematical formulas on your backend server to calculate the Earth's curvature, PostGIS lets you write a simple database query that reads like this: "Select all businesses from the profile table where the location column is within 5000 meters of the customer's coordinate point."


🔑 1. Why we don't need Neon AuthNeon Auth is designed to handle standard username/password logins for typical frontend mobile apps or websites.The ChatBiz Way: Our Phase 1 design completely skips passwords to remove friction for local merchants. Instead, we are utilizing a Passwordless WhatsApp OTP Handshake.When a user logs in, they receive a 4-digit code straight to their WhatsApp chat. Because this logic is driven completely by your Vercel server communicating with the Meta WhatsApp API, standard authentication plugins like Neon Auth cannot track or verify these custom messaging handshakes. Your database tables (core_users and whatsapp_sessions) will handle this login state memory dynamically.📦 2. Why we don't need Neon Object Storage for FICAWhile you absolutely need an object storage bucket to save photos of South African IDs and utility statements safely, hosting them inside Neon's database storage is a security risk.The POPIA/Data Security Issue: FICA documents contain highly sensitive, private personal identifiable information (PII). Under South African POPIA regulations, this data must be cryptographically isolated [10, 10.1.1].Databases are meant for fast text queries, not heavy image files. Storing raw identity images directly inside or right next to your core transactional database leaves you vulnerable to leaks.The Fix: As designed in our architectural blueprint, your Vercel server will stream FICA images out of WhatsApp and push them straight into an encrypted, completely private cloud data bucket (like AWS S3 or Supabase Storage on a completely separate, isolated security track). Your Neon database will only store a safe, un-biased text link pointing to that secure file destination.



🏛️ Segment 1: Activating Geography & Setting Up Core Account TablesWe are starting completely fresh. This first small segment does three things: it turns on the PostGIS map engine, sets up our text options (Enums), and builds the core_users account layer with the rich descriptive fields we planned. SEGMENT 1: INITIALIZATION & CORE ACCOUNT LAYER

-- 1. Activate the PostGIS Spatial map engine extension
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- 2. Establish custom text options (Enums) for user account states
CREATE TYPE active_mode_enum AS ENUM ('CUSTOMER_MODE', 'MERCHANT_MODE');

-- 3. Create the master human account identity table
CREATE TABLE core_users (
    id BIGSERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    title TEXT CHECK (title IN ('Mr', 'Mrs', 'Ms', 'Dr')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email_address TEXT UNIQUE,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create an optimized index on the phone number column for fast lookups
CREATE INDEX idx_users_phone ON core_users(phone_number);




This script builds the whatsapp_sessions table. As designed, it uses a high-speed JSONB data field to remember complex customer states (like a half-built food basket or a typed counter-offer time) and includes our strict 30-minute expiration metric field so users never get locked into broken text loops. SEGMENT 2: CONVERSATIONAL CONTEXT SESSION LAYER

CREATE TABLE whatsapp_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES core_users(id) ON DELETE CASCADE,
    active_mode active_mode_enum NOT NULL DEFAULT 'CUSTOMER_MODE',
    active_business_id INTEGER, -- Will be explicitly bound to the merchant profile table in a later segment
    current_step TEXT NOT NULL DEFAULT 'MAIN_GREETING',
    cached_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Note on the Session Expiration Mechanism (Vercel Backend Layer Logic):
-- When an incoming text strikes your Vercel server, your backend code will evaluate:
-- If (Current System Time - updated_at) > 30 Minutes, the serverless script overrides 
-- current_step back to 'MAIN_GREETING' before processing. This forces a fresh mode greeting 
-- layout button options set onto the user's thread automatically.




Segment 3: The Merchant Profile & FICA Security Layer.This script sets up our business categorizations (VOLUME_RETAIL, HIGH_TICKET_LEAD, EVENT_INFRASTRUCTURE), creates the merchant_profiles container table (using a PostGIS Geometry Point field to capture precise physical business locations), and builds the merchant_fica_records table with the full address and identity verification tracking trackers you requested.SEGMENT 3: MERCHANT PROFILE & FICA REGISTRATION TRUST LAYER

-- 1. Create text configuration options (Enums) for merchant validation states
CREATE TYPE business_class_enum AS ENUM ('VOLUME_RETAIL', 'HIGH_TICKET_LEAD', 'EVENT_INFRASTRUCTURE');
CREATE TYPE fica_status_enum AS ENUM ('UNSUBMITTED', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED');

-- 2. Create the master business profile table tracking physical coordinates
CREATE TABLE merchant_profiles (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES core_users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_class business_class_enum NOT NULL,
    contact_phone_secondary TEXT,
    full_physical_address TEXT NOT NULL,
    geographic_coordinates GEOMETRY(Point, 4326) NOT NULL, -- Core PostGIS coordinate field
    country_code TEXT NOT NULL DEFAULT 'ZA',
    city_region TEXT NOT NULL, -- e.g., 'Gauteng - Tembisa'
    is_fica_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Apply a specialized PostGIS GIST spatial index for high-speed location radius searches
CREATE INDEX idx_merchant_geo ON merchant_profiles USING GIST(geographic_coordinates);

-- 4. Alter the previous session table to safely bind the active_business_id foreign key constraint
ALTER TABLE whatsapp_sessions ADD CONSTRAINT fk_session_business FOREIGN KEY (active_business_id) REFERENCES merchant_profiles(id) ON DELETE SET NULL;

-- 5. Create the FICA document tracking data container with full address records
CREATE TABLE merchant_fica_records (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL UNIQUE REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    id_number TEXT NOT NULL, -- South African 13-digit ID or global passport string
    full_residential_address TEXT NOT NULL, -- Exact address on their utility bill or tribal letter
    id_document_url TEXT NOT NULL, -- Links to secure private storage
    proof_of_address_url TEXT NOT NULL, -- Links to secure private storage
    fica_status fica_status_enum NOT NULL DEFAULT 'UNSUBMITTED',
    rejection_reason TEXT, -- Populated if documents are blurry or expired
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);




Segment 4: The Dynamic Subscription Matrix & Automated Wallet Trigger.This is one of the most intelligent components of ChatBiz. It does three things:Creates the subscription_tier_rules matrix control table.Seeds it with the exact token allocations we designed (10 for kitchens, 20 for bakkies/hair resellers, 5 for event rentals, etc.).Creates a PL/pgSQL database function and trigger (tr_auto_initialize_free_tier).This trigger acts as your automation engine: the exact millisecond a user registers a new business, the database reads its class, grabs the matching Free Plan rule, and automatically builds their wallet inside token_ledgers with their free tokens pre-loaded. SEGMENT 4: DYNAMIC SUBSCRIPTION MATRIX & AUTOMATED WALLET TRIGGER

-- 1. Create text configuration options (Enums) for subscription plans
CREATE TYPE tier_name_enum AS ENUM ('FREE', 'PREMIUM_1', 'PREMIUM_2', 'PREMIUM_3');

-- 2. Create the administrative reference table driving business pricing logic
CREATE TABLE subscription_tier_rules (
    id SERIAL PRIMARY KEY,
    tier_name tier_name_enum NOT NULL,
    monthly_cost NUMERIC(10, 2) NOT NULL,
    business_class business_class_enum NOT NULL,
    token_allowance INTEGER NOT NULL -- Standard count balance (-1 represents Unlimited)
);

-- 3. Create the active credit ledger tracking wallet for businesses
CREATE TABLE token_ledgers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL UNIQUE REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    active_rule_id INTEGER NOT NULL REFERENCES subscription_tier_rules(id),
    tokens_remaining INTEGER NOT NULL,
    billing_cycle_reset DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date,
    is_subscription_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed the static baseline configuration rules matrix parameters
INSERT INTO subscription_tier_rules (tier_name, monthly_cost, business_class, token_allowance) VALUES
('FREE', 0.00, 'VOLUME_RETAIL', 10),
('FREE', 0.00, 'HIGH_TICKET_LEAD', 2),
('FREE', 0.00, 'EVENT_INFRASTRUCTURE', 1),
('PREMIUM_1', 50.00, 'VOLUME_RETAIL', 300),
('PREMIUM_1', 50.00, 'HIGH_TICKET_LEAD', 20),
('PREMIUM_1', 50.00, 'EVENT_INFRASTRUCTURE', 5),
('PREMIUM_2', 100.00, 'VOLUME_RETAIL', 1000),
('PREMIUM_2', 100.00, 'HIGH_TICKET_LEAD', 50),
('PREMIUM_2', 100.00, 'EVENT_INFRASTRUCTURE', 15),
('PREMIUM_3', 150.00, 'VOLUME_RETAIL', -1),
('PREMIUM_3', 150.00, 'HIGH_TICKET_LEAD', -1),
('PREMIUM_3', 150.00, 'EVENT_INFRASTRUCTURE', -1);

-- 5. Define the PL/pgSQL automation function for onboarding wallets
CREATE OR REPLACE FUNCTION fn_initialize_free_tier_wallet()
RETURNS TRIGGER AS $$
DECLARE
    v_rule_id INTEGER;
    v_allowance INTEGER;
BEGIN
    -- Look up the explicit Free Plan row matching the incoming business class configuration
    SELECT id, token_allowance INTO v_rule_id, v_allowance
    FROM subscription_tier_rules
    WHERE tier_name = 'FREE' AND business_class = NEW.business_class;

    -- Automatically initialize the business owner's token ledger balance card
    INSERT INTO token_ledgers (merchant_id, active_rule_id, tokens_remaining, billing_cycle_reset)
    VALUES (NEW.id, v_rule_id, v_allowance, (CURRENT_DATE + INTERVAL '30 days')::date);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach the trigger to fire completely automatically post merchant insertion
CREATE TRIGGER tr_auto_initialize_free_tier
AFTER INSERT ON merchant_profiles
FOR EACH ROW
EXECUTE FUNCTION fn_initialize_free_tier_wallet();





 Segment 5: Vertical Inventory Profiles & Catalogs.This script builds out the customized profile parameters for each distinct industry we are tracking: the core products table for menus and reseller items, home_service_profiles for domestic cleaner/gardener equipment parameters, logistics_pricing_matrices for bakkie distance-tier pricing setups, and event_rental_items for checking weekend asset capacities. SEGMENT 5: INVENTORY CATALOGS & VERTICAL BUSINESS CONFIGURATIONS

-- 1. Create the unified product and service database catalog table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0, -- Set to 9999 for non-inventory human labor actions
    is_daily_special BOOLEAN NOT NULL DEFAULT FALSE, -- Toggled via portal for instant kitchen boards
    image_url TEXT, -- Low-data asset path strings
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the specialized profile configuration table for cleaners and gardeners
CREATE TABLE home_service_profiles (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL UNIQUE REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    owns_heavy_equipment BOOLEAN NOT NULL DEFAULT FALSE, -- e.g., Petrol lawnmower or commercial vacuum cleaner
    provides_materials BOOLEAN NOT NULL DEFAULT FALSE, -- e.g., Detergents and cleaning cloths
    allows_recurring_bookings BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the pricing matrix configuration table used explicitly by bakkie operators
CREATE TABLE logistics_pricing_matrices (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL UNIQUE REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    base_fee_light_load NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Base price for 0-5km
    per_km_fee_light_load NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Rate after 5km
    base_fee_heavy_load NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    per_km_fee_heavy_load NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 4. Create the hard asset capability table used by tent and fridge rental merchants
CREATE TABLE event_rental_items (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- e.g., 'STRETCH_TENT', 'VIP_TOILET', 'MOBILE_FRIDGE'
    total_units_owned INTEGER NOT NULL, -- Total capacity cap to calculate weekend limits
    requires_trailer_towing BOOLEAN NOT NULL DEFAULT FALSE
);




 Segment 5 is safely locked in! Your database now cleanly understands your custom business catalogs, bakkie pricing math, and domestic service variables.Let’s execute our final structural layer, Segment 6: Master Bookings, Operational Workflows, & Paystack Logs.This script unifies the transaction pipelines across your entire Service Category Matrix:Creates the central bookings table (utilizing a PostGIS Point data type to calculate exact customer coordinate perimeters and map radius searches) [1.1.4, source: 2].Builds event_bookings and event_allocations to manage multi-day weekend calendar asset thresholds automatically.Builds order_shipping to hold national tracking parameters for PAXI and PUDO.Builds paystack_billing_history to audit token payment logs securely. SEGMENT 6: MASTER TRANSACTION ENGINE & SYSTEM FLOW LOGS

-- 1. Establish custom text options (Enums) for orders and transit configurations
CREATE TYPE service_category_enum AS ENUM ('FOOD_RETAIL', 'ON_DEMAND', 'APPOINTMENT');
CREATE TYPE payment_status_enum AS ENUM ('AWAITING_DIRECT_PAYMENT', 'DEPOSIT_PAID_CONFIRMED', 'PAID_IN_FULL', 'DISPUTED');
CREATE TYPE job_status_enum AS ENUM ('SEARCHING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE carrier_type_enum AS ENUM ('LOCAL_COLLECTION', 'LOCAL_BAKKIE', 'PEP_PAXI', 'PUDO_LOCKER');

-- 2. Create the unified transactional record tracking map coordinates
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    customer_phone TEXT NOT NULL,
    merchant_id INTEGER REFERENCES merchant_profiles(id) ON DELETE SET NULL, -- Null during initial broadcast search phase
    service_category service_category_enum NOT NULL,
    customer_coordinates GEOMETRY(Point, 4326) NOT NULL, -- PostGIS coordinate pin for matching perimeters
    delivery_coordinates GEOMETRY(Point, 4326), -- Nullable for standard call-outs/collections
    total_quoted_amount NUMERIC(10, 2) NOT NULL,
    proposed_date_time TIMESTAMPTZ, -- Used for scheduling salon slots, car washes, rentals
    payment_status payment_status_enum NOT NULL DEFAULT 'AWAITING_DIRECT_PAYMENT',
    job_status job_status_enum NOT NULL DEFAULT 'SEARCHING',
    excluded_merchant_ids INTEGER[] NOT NULL DEFAULT '{}', -- Tracks skipped/flakey drivers on re-request
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bookings_customer ON bookings(customer_phone);
CREATE INDEX idx_bookings_status ON bookings(job_status);

-- 3. Create the multi-day reservation extension table for event hardware rentals
CREATE TABLE event_bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    breakage_deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    breakage_status TEXT NOT NULL DEFAULT 'HELD' -- e.g., 'HELD', 'REFUNDED', 'CLAIMED_FOR_DAMAGE'
);

-- 4. Create the itemized basket contents ledger unifying meals and hire gear
CREATE TABLE order_booking_items (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL, -- Points to food/wigs if retail
    event_rental_item_id INTEGER REFERENCES event_rental_items(id) ON DELETE SET NULL, -- Points to tents if hire
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- 5. Create the live calendar allocation lookup table to prevent infrastructure double-booking
CREATE TABLE event_allocations (
    id BIGSERIAL PRIMARY KEY,
    event_booking_id BIGINT NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
    rental_item_id INTEGER NOT NULL REFERENCES event_rental_items(id) ON DELETE CASCADE,
    quantity_allocated INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 6. Create the shipping logistics tracker mapping nationwide couriers
CREATE TABLE order_shipping (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    carrier_type carrier_type_enum NOT NULL,
    destination_name TEXT NOT NULL, -- e.g., 'PEP Store Clayville Ext 4'
    tracking_number TEXT,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    label_pdf_url TEXT -- Link to printable shipping barcodes generated via web portal
);

-- 7. Create the subscription billing audit log linked straight to Paystack references
CREATE TABLE paystack_billing_history (
    id BIGSERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    paystack_reference TEXT NOT NULL UNIQUE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    target_rule_id INTEGER NOT NULL REFERENCES subscription_tier_rules(id),
    payment_status TEXT NOT NULL, -- e.g., 'SUCCESSFUL', 'FAILED'
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);















