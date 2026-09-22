I am building a platform called ChatBiz. Attached is the comprehensive, multi-page layout blueprint detailing the exact database schemas, workflows, token subscription matrices, and AI parsing logic we have designed. Please read this file fully. Once you understand the architecture, 

code url,  https://github.com/mncedicy/chatbiz-app.git

Rule: dont ever make changes to code or style or functionality without my command,  always give a complete code for modified files, always include commented file location on top of every file eg. // app/api/webhook/whatsapp/route.js.   


let  me paste some files dont do any changes until i say done.


ChatBiz is a Next.js, PostgreSQL, and PostGIS powered WhatsApp platform built for South African local businesses and township entrepreneurs. It allows merchants to register up to five businesses via a simple 8-step WhatsApp chat, supporting three business models: Shop and Quick Orders, Service and Bookings, and Event Rentals. The platform collects full business addresses and stores spatial location points in PostGIS to enable distance matching. Customers can search for nearby services in plain English, while an AI parser extracts intent and matches them with local merchants. Session states, merchant profiles, and registration steps are handled through a clean, modular file structure in the Next.js App Router webhook directory. In our next session, we will build the next phase features such as product and service management, merchant dashboard controls, or customer search and PostGIS distance matching.


ChatBiz is designed for the South African market—specifically tailored for township (kasi) and local business ecosystems (fast food kitchens, handymen, plumbers, bakkie hire, dress resellers, tent rentals, etc.).

Many small business owners run their entire operations on WhatsApp because data is cheap and their customers are already there. ChatBiz gives these local entrepreneurs a complete automated store and booking management system directly inside WhatsApp, without forcing them or their customers to download a new app or visit a complex website.

2. What It Does
For Business Owners (Merchants):
Instant Onboarding: Merchants register their business via an 8-step conversational WhatsApp chat in under 2 minutes.

Multi-Business Management: Merchants can manage up to 5 different businesses from one WhatsApp phone number using the Business Portal.

3 Core Business Models:

Shop & Quick Orders: E-commerce catalog, food menus, and instant checkout (e.g., Kota shops, hair resellers, LPG gas delivery).

Service & Bookings: Call-out requests, job quotes, and scheduling (e.g., plumbers, electricians, roadside tyre repair, bakkie hire).

Event Rentals: Daily or multi-day equipment allocation (e.g., stretch tents, DJ sound systems, mobile VIP toilets).

Location-Based Visibility: Automatically pins the physical address (province, city, township/suburb, street) so nearby customers can find them.

For Customers:
Conversational AI Search: Customers message ChatBiz in everyday language (e.g., "I need a plumber in Soweto" or "Who sells kotas near me?").

Location Matching: The platform automatically finds businesses in their exact area/township and orders them by proximity.

Direct Ordering & Booking: Customers view menus, request quotes, or place orders directly inside the WhatsApp chat interface.

read all attache md file and datbase structure