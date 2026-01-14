Guestara – Menu & Services Platform
Overview
A dynamic menu and booking platform for hospitality businesses (cafés, hotels, co-working spaces) with flexible pricing models and real-time availability.

Tech Stack
Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
Backend: Lovable Cloud (Supabase) – PostgreSQL database, Edge Functions
State Management: TanStack React Query
Database Schema
Table	Purpose
categories	Top-level groupings (Beverages, Food & Kitchen, Spaces & Rooms, Complimentary)
subcategories	Nested under categories (Espresso Drinks, Filter Coffee, All-Day Breakfast, etc.)
menu_items	Individual items with name, description, image, pricing type, bookable flag
tiered_pricing	Hour-based pricing tiers for bookable items
dynamic_pricing	Time-of-day pricing rules
discount_pricing	Base price with flat/percentage discounts
addons	Optional/required add-ons per item
availability_slots	Day-of-week availability windows
bookings	Customer reservations with status tracking
Pricing Models
Static – Fixed price
Tiered – Price varies by duration (e.g., ₹500/hr up to 2 hrs, ₹400/hr for 3+ hrs)
Dynamic – Price changes by time of day
Discounted – Base price with flat/percentage off
Complimentary – Free items
Edge Functions (API)
Endpoint	Method	Purpose
/item-price	GET	Calculate item price with add-ons & tax
/item-availability	GET	Get available booking slots for a date
/create-booking	POST	Create booking with conflict prevention
Key Features
Category/subcategory filtering
Tax inheritance (item → subcategory → category)
Bookable items with availability management
Double-booking prevention
Bestseller/New item badges
Here's a comprehensive overview of your project:

Guestara – Menu & Services Platform
Overview
A dynamic menu and booking platform for hospitality businesses (cafés, hotels, co-working spaces) with flexible pricing models and real-time availability.

Tech Stack
Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
Backend: Lovable Cloud (Supabase) – PostgreSQL database, Edge Functions
State Management: TanStack React Query
Database Schema
Table	Purpose
categories	Top-level groupings (Beverages, Food & Kitchen, Spaces & Rooms, Complimentary)
subcategories	Nested under categories (Espresso Drinks, Filter Coffee, All-Day Breakfast, etc.)
menu_items	Individual items with name, description, image, pricing type, bookable flag
tiered_pricing	Hour-based pricing tiers for bookable items
dynamic_pricing	Time-of-day pricing rules
discount_pricing	Base price with flat/percentage discounts
addons	Optional/required add-ons per item
availability_slots	Day-of-week availability windows
bookings	Customer reservations with status tracking
Pricing Models
Static – Fixed price
Tiered – Price varies by duration (e.g., ₹500/hr up to 2 hrs, ₹400/hr for 3+ hrs)
Dynamic – Price changes by time of day
Discounted – Base price with flat/percentage off
Complimentary – Free items
Edge Functions (API)
Endpoint	Method	Purpose
/item-price	GET	Calculate item price with add-ons & tax
/item-availability	GET	Get available booking slots for a date
/create-booking	POST	Create booking with conflict prevention
Key Features
Category/subcategory filtering
Tax inheritance (item → subcategory → category)
Bookable items with availability management
Double-booking prevention
Bestseller/New item badges




