"I am building a platform called ChatBiz. Attached is the comprehensive, multi-page layout blueprint detailing the exact database schemas, workflows, token subscription matrices, and AI parsing logic we have designed. Please read this file fully. Once you understand the architecture, let's start by writing the complete PostgreSQL database initialization script to create all the necessary tables, enums, and relationships."






# ChatBiz: Comprehensive Operational, Architectural & Financial Blueprint
*The Definitive Technical and Business Documentation for a Scalable, Zero-Friction Conversational Marketplace Engine across Emerging Markets*

---

## 1. Executive Summary & Brand Paradigm

### 1.1 Vision Statement
ChatBiz is an on-demand, conversational marketplace ecosystem engineered explicitly to bridge the structural divide between formal and informal economies in emerging markets, starting with South Africa [2.2.1]. By utilizing Meta's WhatsApp Business Cloud API [2.2.1] as the primary consumer and provider operating terminal, ChatBiz eliminates app downloads, data costs, and technical barriers. ChatBiz is a hyper-localized logistics, service discovery, and commerce enablement layer that maps supply and demand in real time, driven by proximity and backed by verified institutional trust [2.2.1].

### 1.2 The Problem Landscape
Emerging consumer ecosystems suffer from several critical pain points that traditional software frameworks fail to resolve:
1. **App Fatigue & Storage Constraints:** Entry-level and mid-tier smartphones dominate emerging markets. Users constantly run out of onboard storage, making the download of standalone, heavy native mobile applications highly unviable.
2. **Data Poverty:** Mobile data remains highly expensive relative to disposable income. High-data web applications or data-heavy marketplaces drain airtime rapidly, creating an economic barrier to digital discovery.
3. **The Micro-Merchant Credibility Gap:** Social media platforms are rife with scams, phantom service providers, and unverified digital identities. Consumers are terrified of paying deposits upfront due to a total absence of accountability.
4. **Logistical Overheads for Micro-Enterprises:** Informal kitchens, local bakkie operators, independent technicians, and product resellers operate with highly fluid inventory and unpredictable schedules. They lack administrative capacity.

### 1.3 The ChatBiz Solution Architectural Pillars
ChatBiz bypasses these operational bottlenecks by anchoring its entire ecosystem onto four distinct architectural constraints:
* **Zero-Download Consumer Terminal:** 100% of consumer discovery, cart builder operations, booking negotiations, and dispatch updates occur inside a native WhatsApp conversation window using interactive button menus.
* **FICA-Verified Trust Layer:** No merchant or subscriber can interact with consumers, accept jobs, or display catalog inventory without passing a rigorous, mandatory financial and identity verification check (Financial Intelligence Centre Act compliance).
* **Decoupled P2P Settlement (Phase 1):** Payments are handled directly peer-to-peer (Cash, Instant EFT, or Capitec Pay) between the buyer and provider. The platform acts as a programmatic state machine that records status transitions without holding client cash.
* **Granular Tokenized Monetization:** Platform monetization is divorced from consumer payment pipelines. Instead, businesses buy highly optimized monthly token packages tailored directly to their specific business category's transaction volume and margin profile.

---

## 2. Global Unified Account Architecture

### 2.1 The Omni-Profile Concept
A foundational flaw in traditional multi-vendor applications is the strict separation between a "User app" and a "Merchant app." In localized economic networks, micro-entrepreneurs shift roles continuously. A single phone number must seamlessly morph from a consumer buying dinner to a bakkie driver fulfilling logistics orders, to a salon owner managing weekend hair bookings. ChatBiz introduces the Omni-Profile Engine, treating the verified WhatsApp phone number as the single root identifier inside the database. This profile dynamically mounts and unmounts operational system contexts based on the user’s real-time input inside the chat.

### 2.2 Relational Entity Relationship Logic
To support an infinite expansion from individual neighborhoods to international territories while enabling a single subscriber to manage an arbitrary number of distinct businesses, the database engine strictly decouples user identity from business registration. The structure maps as a strict One-to-Many Relational Tree:
- Core User Profile (Primary user rows)
- Business Entity Profile (Linked via ForeignKey relationships)
- Token Subscription Ledger (Manages credit levels per listing separately)

### 2.3 Real-Time Session State Orchestration
To prevent messaging collisions inside a single WhatsApp thread, ChatBiz utilizes a high-speed Session State Management Layer (typically running on Redis or an in-memory database cache). The system tracks the current conversational coordinate of every phone number. When an incoming webhook strikes the server, the application evaluates the user's active mode state (`CUSTOMER_MODE` or `MERCHANT_MODE_ACTIVE_X`).

---

## 3. Comprehensive Business Category Taxonomy & System Logic

ChatBiz programmatically structures all local economic activities into three primary code patterns. This abstract optimization ensures that whether a user is registering an informal home kitchen, a nationwide wig boutique, an on-demand plumber, or a multi-day tent hire service, the backend handles the routing through three standardized architectural state engines.

### 3.1 Category 1: Volume Retail (`VOLUME_RETAIL`)
* **Core Mechanics:** Driven by standard e-commerce cart mechanics, itemized menus, stock-keeping counts, and variant properties (e.g., size, color, inches).
* **Payment State Engine:** Instantaneous checking out. The customer builds an order cart via interactive lists, inputs their preferred fulfillment route, and receives an immutable receipt confirmation text.
* **Fulfillment Mechanics:** Operates on a synchronous order pipeline. The merchant views the complete order summary and toggles acceptance based on immediate stock or food readiness. Covers kitchens, fast food, and LPG gas cylinder exchanges.

### 3.2 Category 2: High-Ticket Lead & On-Demand Dispatch (`HIGH_TICKET_LEAD`)
* **Core Mechanics:** Driven by real-time geospatial grouping, problem profile parsing, and dual-party slot negotiation.
* **Payment State Engine:** Split-phase or post-service direct billing. Includes manual milestone markers updated programmatically over WhatsApp chat inputs (e.g., `Deposit Paid`, `Job Completed`).
* **Fulfillment Mechanics:** Uses asynchronous broadcast routing. When an urgent query strikes (e.g., emergency plumbing or roadside tire assistance), the server blasts notifications concurrently to matching vendors within a strict PostGIS geometric boundary. The fast responder wins exclusive client visibility. Covers plumbers, electricians, bakkie transport, and hair resellers.

### 3.3 Category 3: Event Infrastructure & Rental Matrix (`EVENT_INFRASTRUCTURE`)
* **Core Mechanics:** Driven by finite inventory allocation blocks, date range matrix algorithms, freight weight variable calculations, and labor dependencies (e.g., Sound system hire packaged with a live DJ).
* **Payment State Engine:** Multi-step manual protection loops requiring clear deposit confirmations and security/breakage tracking statuses.
* **Fulfillment Mechanics:** Calendar block allocation. Instead of locking hourly timeframes, the engine reserves discrete multi-day blocks (typically Friday morning drop-off to Monday morning collection). The system dynamically subtracts active items out at events from the absolute inventory pool of the local warehouse before showing availability to new prospective clients. Covers stretch tents, mobile VIP toilets, mobile event fridges, and party equipment rentals.

---

## 4. End-to-End Operational Workflows (Step-by-Step Functional Specifications)

### 4.1 Step-by-Step User Flow: Consumer Discovery and Procurement
1. **Entry Ingress:** The customer scans a high-visibility QR code sticker placed on a table or clicks a tracking link in a community group. This maps an immediate deep-link payload opening WhatsApp directly with a pre-populated greeting.
2. **Spatial Handshake:** The customer sends the text. The ChatBiz engine automatically catches the webhook, verifies the phone number is active, and fires a programmatic response containing an official Meta Location Request Button. The customer taps the button and transmits their live coordinates (`latitude`, `longitude`).
3. **Conversational Category Selection:** Upon validating the coordinate accuracy, the server builds a customized welcome menu using a native WhatsApp Interactive Button or List Message template.
4. **Search String Parsing:** The user selects a vertical or simply types an un-structured text query. The text travels instantly through the internal AI parsing layer.
5. **Dynamic Radius Evaluation:** The PostGIS geospatial extension calculates distance boundaries radiating from the customer's coordinates.
6. **Interactive Quote Rendering:** The system iterates through matching driver profiles, pulls their specific pricing structures stored in the database matrix, calculates the exact kilometer distance between the customer’s coordinate points, and responds via a highly clean WhatsApp list showcasing customized quotes.
7. **Confirmation and P2P Handoff:** The customer selects an option. The system instantly changes the booking record status to `ASSIGNED`, sharing direct routing links with the merchant and details with the client.

### 4.2 Step-by-Step Merchant Onboarding and FICA Compliance Pipeline
1. **Initial Self-Registration:** A local merchant adds the ChatBiz WhatsApp number and texts the keyword *"Register Business"*. The bot evaluates the current state cache and initiates an interactive structured setup questionnaire.
2. **Class Designation Matrix:** The merchant answers programmatic multiple-choice button nodes to declare their operational configuration (`VOLUME_RETAIL`, `HIGH_TICKET_LEAD`, or `EVENT_INFRASTRUCTURE`).
3. **Data Isolation Link Delivery:** The server registers the base entity row under the merchant's core user phone profile and flags the business state as `UNSUBMITTED`. The bot automatically generates a single-use authentication link redirecting the merchant to the lightweight Subscribers Web Portal.
4. **FICA Document Capture Loop:** To prevent payment fraud, fake listings, and customer scams, the merchant must submit statutory FICA verification materials via the Web Portal Upload or the WhatsApp Media Stream.
5. **Secure Extraction and Storage Encryption:** The server streams the files out of Meta's domain, compresses them, and moves them to an encrypted, completely private cloud data bucket.
6. **Administrative Human-in-the-Loop Review:** The document locations are logged inside the database, setting the verification flag to `PENDING_VERIFICATION`. The record surfaces inside the password-secured ChatBiz Admin Web Dashboard for manual operator review.
7. **Dynamic Ledger Initialization:** The approval action shifts the database merchant flag to `APPROVED` and automatically spins up a related token subscription entry card inside the database ledger.

### 4.3 Step-by-Step Job Acceptance and Dynamic Dispatch Lifecycle
1. **Structural Job Allocation Trigger:** A customer successfully passes their service specification entry. The database registers the entity inside the ledger under state status `SEARCHING`.
2. **Concurrent Geospatial Blast:** The backend executes a PostGIS radius scan mapping a 5km vector circle outwards from the customer's coordinate point. It compiles a targeted index array of all active, FICA-approved merchants currently holding an active token balance greater than zero.
3. **Interactive Template Dispatch Execution:** The system maps through the identified vendor array and executes concurrent API calls to Meta's Cloud API endpoints, injecting a high-priority WhatsApp Template Interactive Message onto the thread of every matching merchant.
4. **Race Condition Interception and Resolution:** To prevent double-booking, the application routing engine utilizes explicit PostgreSQL Row-Level Locking Mechanics (`SELECT ... FOR UPDATE`). The server locks the exact ticket ID row the split-second the first request clears, moving it to `ASSIGNED` and rejecting subsequent actions.
5. **Token Asset Ledger Deduction:** Simultaneously with changing the job state to `ASSIGNED`, the server performs an internal atomic ledger deduction.
6. **Offline P2P Coordination Handshake:** The app transmits the customer’s precise mobile contact string and physical address coordinates via a direct hyper-link wrapper onto the provider's WhatsApp screen.

### 4.4 Step-by-Step Cancellation and Re-Request Loop Workflow
1. **Customer Safety Ingress:** If the matched provider fails to show up, breaks communication, or experiences a breakdown en route, the customer opens ChatBiz on WhatsApp and taps the persistent interactive menu button option: `[ ❌ Cancel Booking ]`.
2. **Transaction Reversion and State Logging:** The backend changes the job record status to `CANCELLED_BY_CLIENT` and appends the flaked provider's ID to an exclusion list array.
3. **Flake Penalty Logging:** The system increments the provider's structural strike counter. If a vendor accumulates three strikes inside a rolling 7-day calendar window, their profile visibility is locked out of the network for 48 hours.
4. **Conversational Pivot Handling:** The automated ChatBiz bot messages the customer instantly via WhatsApp, validating their cancellation and offering choices to re-request or quit.
5. **Automatic Secondary Search Re-Broadcast:** If selected, the backend reads the original metadata column attributes from the previous cancelled job ticket row and launches a fresh broadcast blast concurrently to all other matching available operators within that 5km perimeter.

### 4.5 Step-by-Step Subscription Billing and Token Reset Lifecycle
1. **Token Boundary Intercept:** A merchant finishes their transaction acceptance allocations for the month and their internal token balance reaches 0. The system blocks incoming customer requests from reaching their thread.
2. **Programmatic WhatsApp Upsell Delivery:** The server fires an instantaneous, context-aware notification onto the merchant’s WhatsApp terminal offering clear pricing tiers.
3. **Paystack Secure Payment Tunnel Injection:** The merchant taps a selection. The ChatBiz backend triggers an automated API call out to the Paystack API Engine, returning a unique secure checkout URL string printed into the chat.
4. **Out-of-App Payment Processing:** The merchant clicks the link, which opens a secure, ultra-lightweight overlay window inside their mobile browser to complete their payment authentication protocol (e.g., Capitec Pay or card confirmation).
5. **Webhook Capture and Balance Provisioning:** The moment the payment clears, Paystack's server fires an asynchronous transaction event notification web-hook to your API endpoint. Your server parses the data payload, updates the database, resets token levels, and moves the billing cycle forward by 30 days.
6. **Confirmation Broadcast:** The backend triggers an instantaneous automated confirmation alert directly onto the merchant's WhatsApp chat screen.

---

## 5. Tokenized Monetization Matrix

The token deduction parameters are mathematically mapped to ensure high operational volume matching while providing value alignment based directly on the economic margin profiles of each specific business class layer.

| Metric Attribute | 🍔 Volume Retail Category | 🛠️ High-Ticket Lead Category | 🎪 Event Rental Category |
| :--- | :--- | :--- | :--- |
| **Primary Industry Examples** | Kitchens, Fast Food, LPG Gas | Plumbers, Bakkies, Hair Wigs | Tents, VIP Toilets, Sound & DJ |
| **Token Triggers Vector** | Merchant clicks `[Accept Order]` | Merchant clicks `[Accept Job]` first | Merchant clicks `[Confirm Booking]` |
| **🆓 Free Tier Allotment** | **10 Orders** / month | **2 Job Leads** / month | **1 Event Lead** / month |
| **🚀 Premium 1 Allotment (R50)** | **300 Orders** / month | **20 Job Leads** / month | **5 Event Leads** / month |
| **🔥 Premium 2 Allotment (R100)** | **1000 Orders** / month | **50 Job Leads** / month | **15 Event Leads** / month |
| **👑 Premium 3 Allotment (R150)** | **Unlimited Orders** / month | **Unlimited Leads** / month | **Unlimited Leads** / month |

---

## 6. Disappointment Prevention Plan (Empty Search Optimization Engine)

To protect your retention curves from flatlining during early rollout phases when specific neighborhoods lack depth across certain business categories, ChatBiz implements a programmatic Empty Search Optimization Matrix. The application will never terminate a query session by returning a dead-end message string.

### 6.1 The Food & Retail Alternative Match Loop
If a user searches for a specific dish tag inside an active zone but all matching neighborhood kitchens are toggled off or out of inventory, the platform activates its alternative query module:
1. The server isolates the failure coordinates and passes them to the AI query interpreter.
2. The AI scans the historical log parameters inside the database to isolate the absolute top three highest-performing, active local alternative meals.
3. The WhatsApp bot responds immediately with context-aware copywriting showcasing options with images for the most popular local items active inside the local grid system.

### 6.2 The Service & Rental "Geo-Trap Notification" Loop
If a user inputs a search parameter for an on-demand service or an operational event asset, and the system returns 0 matching results within that specific PostGIS 5km grid radius layer:
1. The application registers a row record inside an internal administrative tracking table called `unmatched_geo_queries`, logging coordinates and search terms to surface inside your Admin Dashboard metrics as an immediate operational expansion indicator.
2. The WhatsApp chatbot sends an automated customer preservation response offering a sticky "Notify Me When Active" notification button loop to secure the relation.

---

## 7. App-Data-Aware AI Engine Architecture

ChatBiz utilizes an advanced, lightweight application-data-aware AI layer (OpenAI GPT-4o-mini API) configured explicitly to operate as an absolute structured gateway router. The AI is entirely insulated from conversational filler and never speaks directly or freely with users. Its single execution vector is translating chaotic multi-lingual human language strings into rigid, performant JSON code arrays to trigger backend SQL database transactions.

### 7.1 Multi-Lingual Dialect Parsing Logic
The AI gateway router evaluates South African vernacular dynamics, specifically the fluid intersection of English, isiZulu, Sesotho, and Tsotsitaal street slang. The engine uses internal algorithmic semantic maps to parse and isolate values regardless of dialect syntax layout, returning structured system intent tags, urgency configurations, and isolated keyword elements seamlessly.

### 7.2 The Token Safeguard: Architecture Context Separation
To prevent your platform from running up massive, unsustainable API token billing expenses, the AI architecture utilizes Context Separation Integration:
* **The Trapped State:** The user’s message string never passes through large language model vector memory histories. Every incoming message is executed as an isolated, stateless transaction block.
* **The Token Cap Constraint:** The system prompt restricts model output explicitly to a maximum token constraint threshold length of 150 tokens. By forcing the AI model to return raw, un-formatted minified JSON strings without block formatting tags, the computational overhead per user transaction search stays beneath fractions of a single South African cent (R0.003), enabling total platform margin scaling without computing-cost bottlenecks.

---

## 8. Subscribers Web Portal (Internet-Connected Control Panel)

For business subscribers possessing stable internet connections and smartphone devices, ChatBiz provides a lightweight, responsive, data-optimized control panel interface (**The Subscribers Web Portal**). Built using highly optimized rendering frameworks (Next.js / Tailwind CSS), the web portal completely avoids heavy image layouts, pre-loads static framework files, and acts as a compressed, data-saving control hub for detailed structural operations.

### 8.1 Passwordless WhatsApp OTP Secure Handshake
To completely eliminate account lockout friction and the administrative burden of handling forgotten password retrieval pipelines, the portal implements a passwordless WhatsApp OTP Authentication System:
1. The business owner opens the web portal login link, enters their registered WhatsApp mobile phone number string, and clicks `[ Generate Code ]`.
2. The web server creates an ephemeral, 4-digit numeric cryptographic authorization token inside its cache memory, mapping a temporary 5-minute lifespan threshold parameter.
3. The server triggers a secure background API call out to the ChatBiz WhatsApp Cloud engine, flashing the code directly onto the user's phone inside their native WhatsApp thread.
4. The merchant inputs the 4 digits into their active web browser container window. The server running the verification loop matches the entry to cache memory, drops an encrypted JSON Web Token (JWT) into the browser cookie directory, and securely mounts the business administration profile.

### 8.2 Real-Time Inventory and Variable Menu Management Control
The web portal serves as the primary system panel for merchants to build out complex asset menus and stock lists that would feel too clunky to compile via raw text chat:
* **Dynamic Menu Matrix Builders:** Kitchen owners type out item names, custom descriptions, baseline pricing parameters, and upload optimized, high-compression thumbnails.
* **The Variant Property Configurator:** Product resellers (e.g., Hair Extension vendors) detail specific catalog rows, declaring weight metrics, lengths, and available unit numbers (`stock_quantity`).
* **The Master Availability Kill Switch:** Every item or service has a clear on/off visual toggle switch. If a kitchen runs out of stock or a provider is unavailable, they flip the switch off on their web dashboard. The state change updates the central database ledger instantly.

### 8.3 Multi-Listing Account Switcher Interface Logic
If a single subscriber profile maps ownership across multiple separate local businesses inside the database architecture, the web portal interface dynamically injects a persistent Global Profile Switcher Dropdown into the master header layout.
* **One-Tap Context Shifting:** Tapping an alternate asset profile instantly alters the web application’s state parameters.
* **Zero Reload Performance Engine:** The switcher intercepts the browser event pipeline, prevents a hard webpage refresh, and launches a micro-fetch API request out to the server to draw down *only* the specific data rows tied to the newly targeted business ID. This saves data consumption costs for merchants operating on micro-bundles of mobile web data.

---

## 9. Admin Web Dashboard & Geographic Analytics Engine

The **ChatBiz Admin Web Dashboard** is the centralized administrative command engine used by the platform owners and regional area managers to monitor ecosystem structural health, process FICA validations, optimize monetization parameters, and map geographic supply and demand variables at scale.

### 9.1 Multi-Region Partition Isolation Architecture
To ensure seamless scaling from initial neighborhood deployments into city hubs, distinct provinces, and eventual cross-border international markets, the Admin dashboard data processing layout is built entirely upon a Hierarchical Geographic Partition Structure:
* **The Global View Layer:** Visible exclusively to the root platform owners, displaying aggregate platform volume, global financial revenue, and system uptime loops.
* **Regional Data Segregation Filters:** Regional area managers are assigned strict administrative profile parameters that limit their data access to explicit localized boundaries (e.g., a manager in Durban logs in and views *only* the data parameters, transactions, and merchant fields belonging to KwaZulu-Natal). This isolates operational risks and enables massive regional team scaling.

### 9.2 Real-Time Analytics and System Health Indicators
* **Verification Velocity Tracking:** Displays live real-time ratios tracking registered profiles against fully FICA-verified profiles to instantly expose operational choke points inside the onboarding funnel.
* **Atomic Match Success Rate Indicator:** Computes real-time percentages tracking consumer search entries that successfully execute an offline P2P connection handshake via an explicit vendor `[ Accept ]` button command trigger.
* **Unmatched Search Keyword Metrics:** Accumulates data strings captured from the *Empty Search Optimization Matrix*, sorting them by volume and plotting them into an aggregate geographic index list to guide onboarding strategy.
* **Token Depletion Velocity Gauge:** Calculates the chronological burn rate of subscription credits across different vendor segments, identifying if specific tiers require structural pricing updates or proactive tier-upgrade prompt delivery strategies.

---

## 10. Engineering Data Security, Privacy & POPIA/GDPR Compliance

Because ChatBiz collects personal identifiable information (PII) inside South Africa and expanding international territories, including official South African identity card photos, household physical address coordinates, and mobile phone verification fields, the entire infrastructure must adhere strictly to the statutory requirements of the **Protection of Personal Information Act (POPIA)** and international data privacy laws (GDPR).

### 10.1 Static Asset Cryptographic Isolation Engine
Images uploaded during the FICA validation pipeline (identity book photographs, proof of address utility bills) represent highly sensitive private user data assets. 
* **The Isolation Layer Rule:** These images are never stored inside standard public file folders or static asset server directories. They are streamed into structurally isolated, private cloud object storage nodes (e.g., AWS S3 Buckets configured with comprehensive Access Block Policies).
* **Temporary Authorized Signed URL Delivery:** The web files are entirely inaccessible to the public web. When an administrator logs into the Admin Dashboard to review a pending FICA profile, the server creates an ephemeral, single-use, cryptographically signed URL link string (`Presigned URL`) possessing a hard expiration threshold parameter of exactly 60 seconds. Once the administrator closes the page or 60 seconds transpires, the link expires, ensuring security against asset leaks.

### 10.2 System-Wide At-Rest and In-Transit Encryption Standards
* **Data In-Transit:** Every transactional webhook event coming from Meta's servers, all Paystack financial status update signals, and every browser interaction clearing through the Subscribers Web Portal travel exclusively through transport layers encrypted with high-grade **Transport Layer Security (TLS 1.3)** protocols.
* **Data At-Rest:** The core PostgreSQL production database instance running the system profiles applies comprehensive **Advanced Encryption Standard (AES-256)** encryption keys across all storage volumes. Sensitive configuration fields—such as verified identity numbers, precise geographic address text blocks, and webhook authorization tracking strings—are salted and hashed using cryptographic keys before writing to disk, ensuring robust data posture against physical or virtual storage breaches.


### 🗂️ UPDATED: Core Profile & Session Context Layer

#### Table: `core_users`
*   `id`: Big Key (Primary Key, Auto-Incrementing)
*   `phone_number`: Text (Unique, Non-Nullable, Index. e.g., `+27821112222`)
*   `title`: Text (Validations restricted to: `Mr`, `Mrs`, `Ms`, `Dr`)
*   `first_name`: Text (Non-Nullable)
*   `last_name`: Text (Non-Nullable)
*   `email_address`: Text (Unique, Nullable)
*   `preferred_language`: String (Default: `en`. Supports `zu`, `st`, `xh`)
*   `created_at`: Timestamp with Timezone

#### Table: `whatsapp_sessions`
*   `id`: Big Key (Primary Key)
*   `user_id`: Big Key (Unique Foreign Key ➡️ `core_users.id` on cascade delete)
*   `active_mode`: Enum (`CUSTOMER_MODE`, `MERCHANT_MODE`)
*   `active_business_id`: Int (Foreign Key ➡️ `merchant_profiles.id`, Nullable)
*   `current_step`: Text (e.g., `AWAITING_LOCATION`, `AWAITING_COUNTER_TIME`)
*   `cached_metadata`: JSONB (Stores runtime states like half-built food carts or typed counter-offer times)
*   `updated_at`: Timestamp with Timezone
*   *TIMEOUT FALLBACK RULE:* If (Current Timestamp - `updated_at`) > 30 minutes, the backend automatically forces `current_step` to `MAIN_GREETING`. The user's next message displays the high-level mode entry selection menu (`[🛒 Shop / Hire]` vs `[💼 My Businesses]`) rather than locking them into stale sub-flows.

---

### 💼 UPDATED: Merchant Profile & Verification Layer

#### Table: `merchant_profiles`
*   `id`: Int (Primary Key, Auto-Incrementing)
*   `user_id`: Big Key (Foreign Key ➡️ `core_users.id` on cascade delete)
*   `business_name`: Text (Non-Nullable)
*   `business_class`: Enum (`VOLUME_RETAIL`, `HIGH_TICKET_LEAD`, `EVENT_INFRASTRUCTURE`)
*   `contact_phone_secondary`: Text (Nullable)
*   `full_physical_address`: Text (Non-Nullable address descriptor card string)
*   `geographic_coordinates`: Geometry (PostGIS Point, SRID 4326. GIST Index. Precise trade pin longitude/latitude)
*   `country_code`: Text (Default: `ZA`)
*   `city_region`: Text (e.g., `Gauteng - Tembisa`)
*   `is_fica_verified`: Boolean (Default: `False`)
*   `created_at`: Timestamp with Timezone

#### Table: `merchant_fica_records`
*   `id`: Int (Primary Key)
*   `merchant_id`: Int (Unique Foreign Key ➡️ `merchant_profiles.id` on cascade delete)
*   `id_number`: Text (13-Digit South African ID number or international passport validation string)
*   `full_residential_address`: Text (The exact residential address printed on their utility bill or tribal letter)
*   `id_document_url`: Text (Secure cloud bucket pointer)
*   `proof_of_address_url`: Text (Secure cloud bucket pointer)
*   `fica_status`: Enum (`UNSUBMITTED`, `PENDING_VERIFICATION`, `APPROVED`, `REJECTED`)
*   `rejection_reason`: Text (Nullable)
*   `verified_at`: Timestamp with Timezone (Nullable)

---

### 💳 NEW: Dynamic Subscription Configuration Matrix Layer

#### Table: `subscription_tier_rules`
*The static administrative rules database controlling platform monetization tiers across industries dynamically.*
*   `id`: Int (Primary Key, Auto-Incrementing)
*   `tier_name`: Enum (`FREE`, `PREMIUM_1`, `PREMIUM_2`, `PREMIUM_3`)
*   `monthly_cost`: Numeric (Scale: 2, e.g., `0.00`, `50.00`, `100.00`, `150.00`)
*   `business_class`: Enum (`VOLUME_RETAIL`, `HIGH_TICKET_LEAD`, `EVENT_INFRASTRUCTURE`)
*   `token_allowance`: Int (Number of valid engagements. A value of `-1` explicitly registers as **Unlimited**).

#### Seed Matrix Parameter Rows:
FREE        | R0.00   | VOLUME_RETAIL        | Allowance: 10 OrdersFREE        | R0.00   | HIGH_TICKET_LEAD     | Allowance: 2 LeadsFREE        | R0.00   | EVENT_INFRASTRUCTURE | Allowance: 1 LeadPREMIUM_1   | R50.00  | VOLUME_RETAIL        | Allowance: 300 OrdersPREMIUM_1   | R50.00  | HIGH_TICKET_LEAD     | Allowance: 20 LeadsPREMIUM_1   | R50.00  | EVENT_INFRASTRUCTURE | Allowance: 5 LeadsPREMIUM_2   | R100.00 | VOLUME_RETAIL        | Allowance: 1000 OrdersPREMIUM_2   | R100.00 | HIGH_TICKET_LEAD     | Allowance: 50 LeadsPREMIUM_2   | R100.00 | EVENT_INFRASTRUCTURE | Allowance: 15 LeadsPREMIUM_3   | R150.00 | VOLUME_RETAIL        | Allowance: -1 (Unlimited)PREMIUM_3   | R150.00 | HIGH_TICKET_LEAD     | Allowance: -1 (Unlimited)PREMIUM_3   | R150.00 | EVENT_INFRASTRUCTURE | Allowance: -1 (Unlimited)




#### Table: `token_ledgers`
*Tracks active credit wallet accounting states for every single business listing separately.*
*   `id`: Int (Primary Key)
*   `merchant_id`: Int (Unique Foreign Key ➡️ `merchant_profiles.id` on cascade delete)
*   `active_rule_id`: Int (Foreign Key ➡️ `subscription_tier_rules.id`)
*   `tokens_remaining`: Int (Decrements upon successful transaction loop assignment)
*   `billing_cycle_reset`: Date (Calculated as configuration/upgrade date + 30 days)
*   `is_subscription_active`: Boolean (Default: `True`)
*   `updated_at`: Timestamp with Timezone
*   *Automated Database Onboarding Trigger:* When a row registers inside `merchant_profiles`, a database trigger function checks the `business_class`, looks up the static `subscription_tier_rules` for the matching `FREE` tier card combination, and creates this ledger wallet line instantly—handling automatic user tier assignments.



🗺️ Phase 1: Database & Core Infrastructure (Week 1)Goal: Build the solid foundation that stores all data, relationships, and locations.Step 1: PostgreSQL & PostGIS Schema SetupInstruct the AI to write the complete SQL initialization script based on the blueprint.Create tables for core_users, merchant_profiles, products, offline_orders, token_subscriptions, and merchant_fica_records.Set up data constraints, unique indexes (like unique phone numbers), and the spatial data types for pickup_location and dropoff_location.Step 2: Database Hosting DeploymentSpin up a free database instance on a platform like Supabase or Neon.Execute your SQL script in their SQL Editor to build your tables and active schemas.🛠️ Phase 2: Webhooks & Communication Routing (Week 2)Goal: Get your Vercel server listening and talking directly to the Meta WhatsApp API.Step 3: Serverless Backend Environment SetupCreate a clean code repository (Node.js/Express or Python/FastAPI) and host it on Vercel.Configure your project environment variables (META_ACCESS_TOKEN, VERIFY_TOKEN, DATABASE_URL).Step 4: Meta Webhook Integration HandshakeWrite the basic webhook verification route (GET /webhook) to authenticate your server with Meta.Write the receiving route (POST /webhook) to accept incoming JSON payload strings from WhatsApp.Step 5: Transactional Messaging ClientBuild helper code files that make outgoing API calls to Meta to send simple texts, list selection menus, and interactive reply buttons.🧠 Phase 3: The AI & Search Parsing Core (Week 3)Goal: Turn messy human chat text into structured system commands.Step 6: OpenAI GPT-4o-mini IntegrationInstall the official OpenAI library on your Vercel backend code.Write the hidden system prompt structure instructing the AI to read colloquial slang (isiZulu, Sesotho, Tsotsitaal, English) and extract clean target data categories.Step 7: Search Routing & Disappointment Prevention LogicWrite the backend query logic: Take the category/keywords from the AI, grab the user's location coordinates, and run a PostGIS distance calculation query.Write the fallback logic: If the search returns 0 results, query the database for the most popular trending local items in that neighborhood and push those via WhatsApp buttons instead.💼 Phase 4: Subscriber Workflows & Token Management (Week 4)Goal: Enable multi-business profiles, FICA uploads, and token mechanics.Step 8: Role & Profile Switching LogicBuild session tracking logic using Redis or your main database. When a user texts, determine if they are inside CUSTOMER_MODE or MERCHANT_MODE_BUSINESS_X.Step 9: Interactive Job Dispatch PipelinesWrite the "First to Accept" broadcast mechanism for plumbers and bakkie operators.Write the manual confirmation toggle flow for merchants to click [ Deposit Paid ] or [ Job Completed ], updating the database and triggering alerts back to the consumer.Step 10: Token Ledger Validation ChecksWrite code validations that check a merchant’s tokens_remaining count before allowing them to click [ Accept Job ] or [ Accept Order ]. Deduct credits dynamically based on industry classification.🖥️ Phase 5: Lightweight Subscriber & Admin Web Portals (Week 5)Goal: Build the data-saving web visual interfaces.Step 11: Passwordless OTP Authentication FlowCreate a clean Next.js/Tailwind login page. When a user enters their number, have your Vercel server generate a 4-digit code and text it to their WhatsApp. Once inputted into the browser, generate a login session.Step 12: Merchant Inventory & Business Selector DropdownBuild the mobile-responsive dropdown layout that updates the dashboard views instantly when toggling from a Bakkie profile to a Hair Salon.Create clean, lightweight form inputs to add products, adjust pricing tiers, or upload raw images of FICA files.Step 13: The Master Admin DashboardBuild a secure dashboard layout containing regional manager data partitions and the high-priority visual verification queue for FICA uploads.💳 Phase 6: Paystack Monetization & Live Alpha Launch (Week 6)Goal: Connect the financial loop and launch testing.Step 14: Paystack API IntegrationWrite code endpoints to generate customized Paystack checkout links whenever a business requests a plan upgrade (Premium 1, 2, or 3).Write a Paystack Webhook Listener (POST /paystack-webhook) to automatically top up their database token accounts the exact second a payment clears via card or Capitec Pay.Step 15: Single-Block Alpha TestingConnect a live South African phone number to your ChatBiz system, manually onboard 3 local micro-merchants in one neighborhood sector, and run pilot transactions to verify that every single system layer communicates seamlessly.     




🛡️ The FICA Verification Workflow on WhatsAppWhen a business owner registers on your app, they cannot receive customer payments or take jobs until your system verifies their FICA status.[Business Owner on WhatsApp] 
       │ 
       ▼
 💬 Chooses [Register Business] ──► Selects Category (e.g., Hair & Beauty Reseller)
       │
       ▼
 📄 🤖 Bot sends FICA Requirement Alert:
     "To protect customers and comply with SA law, please upload your FICA docs:
      1. Green ID Book or Smart ID Card (Photo)
      2. Proof of Address or Tribal Authority Letter (Photo/PDF)" [1, 2]
       │
       ▼
 📸 Owner takes a clear photo of their ID and drops it straight into the WhatsApp chat.
 📸 Owner takes a clear photo of their proof of residence and drops it into the chat.
       │
       ▼
 ⚙️ Your Backend processes the media files ──► Saves them securely to AWS S3/Cloud Storage.
 🔏 Status set to: 'PENDING_VERIFICATION' (Merchant is locked out of receiving customer money).
       │
       ▼
 🕵️‍♂️ (Admin Review or Automated Check verifies docs) ──► Switch status to 'APPROVED'
 📲 Bot alerts owner: "Verification successful! 🎉 Your business is live and can 




🔄 2. The WhatsApp Booking & Logistics WorkflowHere is how your WhatsApp app handles an infrastructure request, ensuring transport costs (which are massive for heavy items like mobile toilets or fridges) are accurately factored in:[Customer on WhatsApp] 
       │ 
       ▼
 💬 Chooses [Event Rentals] ──► Selects Date: [Fri 16 Oct - Mon 19 Oct]
       │
       ▼
 📋 Chooses Items to Bundle:
     ☑️ [1. 50-Seater Stretch Tent]
     ☑️ [2. Mobile VIP Toilet]
     ☑️ [3. Sound System + Live DJ]
       │
       ▼
 📍 Drops Location Pin ──► Backend finds closest FICA-verified Event Merchant with available stock
       │
       ▼
 🚛 Transport Calculation: System checks weight/bulk, calculates distance from merchant warehouse, 
    and automatically adds a Heavy Freight Delivery/Collection Fee.
       │
       ▼
 💳 Displays Total Quote ──► Customer pays deposit via Capitec Pay ──► Calendar 






 👥 1. The Dynamic "Role-Switching" Menu LayoutWhen a user messages your WhatsApp bot, the system checks their phone number against the database. If they are registered as both a customer and a business subscriber, the bot always gives them a quick way to switch context.🤖 [App Bot]: Hello Thabo! Welcome back. What would you like to do today?

🔘 Button 1: [ 🛒 Shop / Hire Service ] -> (Switches to Customer Mode)
🔘 Button 2: [ 💼 My Businesses ] -------> (Switches to Merchant Mode)
If they click [ 🛒 Shop / Hire Service ]:The bot shifts into standard customer mode. Thabo can look for Inhoko, hire a plumber, or book an event tent.If they click [ 💼 My Businesses ]:The bot lists their registered businesses in an interactive list message:🤖 Select which business you want to manage:
1. 🚛 Thabo's 1-Ton Bakkie Hire (Premium 1 - 14 tokens left)
2. ✂️ Thabo's Barber & Fade (Free Tier - 0 tokens left)
3. ➕ [ Register a New Business ]
Once he taps a specific business, the bot enters management mode for that specific entity so he can update menus, accept job requests, or check token status.🗄️ 2. The Multi-Business Database Relationship ModelTo make this possible behind the scenes, you must decouple the User Account Profile from the Business Profiles. Instead of making them one table, you split them into a "One-to-Many" relationship:                  ┌─────────────────────────────────────────┐
                  │          CORE USER PROFILE TABLE        │
                  │   - id (Primary Key)                    │
                  │   - phone_number (Unique Key) e.g. 082  │
                  └────────────────────┬────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼ (Can own multiple rows)              ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│        BUSINESS PROFILE ROW 1         │   │        BUSINESS PROFILE ROW 2         │
│ - id                                  │   │ - id                                  │
│ - user_id (Links to Core Profile)     │   │ - user_id (Links to Core Profile)     │
│ - business_name: "Thabo's Bakkie"     │   │ - business_name: "Thabo's Barber"     │
│ - business_class: HIGH_TICKET_LEAD    │   │ - business_class: HIGH_TICKET_LEAD    │
└──────────────────┬────────────────────┘   └──────────────────┬────────────────────┘
                   │                                           │
                   ▼ (Each business has its own billing row)    ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│        TOKEN SUBSCRIPTION ROW 1       │   │        TOKEN SUBSCRIPTION ROW 2       │
│ - business_id                         │   │ - business_id                         │
│ - tier: PREMIUM_1 (R50 Paystack link) │   │ - tier: FREE (R0)                     │
│ - tokens_remaining: 14                │   │ - tokens_remaining: 0                 │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
⚙️ 3. How the WhatsApp Webhook Remembers the User's StateSince a WhatsApp chat is just a continuous stream of text and buttons, the app needs to remember what "mode" the user is currently in. You handle this using a lightweight Session State Layer in your system memory.The Entry Check: Thabo sends a message. The app notes his phone number.The Active Context Check: The app checks his active state session.If his session status is marked as CUSTOMER_MODE, incoming keywords like "Plumber" search the global database for nearby plumbers.If his session status is marked as MERCHANT_MODE_BUSINESS_1, incoming messages or button clicks (like [ Accept Job ]) apply directly to his Bakkie business ledger.Timeout Protection: If Thabo doesn't type anything for 30 minutes while in Merchant Mode, the session automatically resets. The next time he texts the bot, it greets him with the main menu to choose between Shopping or Managing his businesses again, preventing accidental interactions.💳 4. Independent Paystack Billing ProfilesBecause each business operates on a different token limit and pricing tier, Paystack invoices must be tied directly to the Business Profile ID, not the core user phone number.If Thabo wants to upgrade his Bakkie business to Premium 2, the unique Paystack link generated by your web portal handles payment authorization specifically for that business profile. He can comfortably pay R100 for his Bakkie business while leaving his Barber shop on the Free Tier, receiving completely distinct automated renewal reminders for each via WhatsApp.This approach gives your platform immense scalability—a single community leader could theoretically onboard and manage 3 or 4 local micro-ventures from one WhatsApp number.





                       ┌──► 🍗 Food & Retail (Kitchens, Resellers, Gas)
                            ├──► 🛠️ Emergency / Trade Services (Plumbers, Roadside Tyre)
[ YOUR WHATSAPP ENGINE ] ───┼──► 📅 Bookings & Events (Salons, Daycares, Tents/DJs)
                            └──► 🚚 Logistics (Bakkie Hire, Courier Logistics, Laundry Collect)




