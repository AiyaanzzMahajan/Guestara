# 🍽️ Guestara – Menu & Services Platform

A modern, flexible **menu and booking platform** designed for hospitality businesses such as **cafés, hotels, and co-working spaces**. Guestara enables dynamic pricing, real-time availability, and seamless booking experiences — all built with scalability and performance in mind.

---

## ✨ Overview

Guestara helps hospitality businesses manage **menus, services, and reservations** from a single platform. It supports multiple pricing strategies, intelligent availability handling, and a clean, intuitive user experience for both customers and administrators.

---

## 🧰 Tech Stack

### Frontend

* **React 18**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **shadcn/ui**

### Backend

* **Lovable Cloud (Supabase)**
* **PostgreSQL** database
* **Edge Functions** for serverless APIs

### State Management

* **TanStack React Query** for efficient data fetching and caching

---

## 🗄️ Database Schema

| Table                  | Purpose                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **categories**         | Top-level groupings (Beverages, Food & Kitchen, Spaces & Rooms, Complimentary)           |
| **subcategories**      | Nested groups under categories (Espresso Drinks, Filter Coffee, All-Day Breakfast, etc.) |
| **menu_items**         | Individual items with name, description, image, pricing type, and bookable flag          |
| **tiered_pricing**     | Hour-based pricing tiers for bookable items                                              |
| **dynamic_pricing**    | Time-of-day pricing rules                                                                |
| **discount_pricing**   | Base price with flat or percentage discounts                                             |
| **addons**             | Optional or required add-ons per item                                                    |
| **availability_slots** | Day-of-week availability windows                                                         |
| **bookings**           | Customer reservations with full status tracking                                          |

---

## 💰 Pricing Models

Guestara supports multiple flexible pricing strategies:

* **Static Pricing** – Fixed price per item
* **Tiered Pricing** – Price varies by duration
  *Example: ₹500/hr up to 2 hours, ₹400/hr for 3+ hours*
* **Dynamic Pricing** – Price changes based on time of day
* **Discounted Pricing** – Base price with flat or percentage discounts
* **Complimentary** – Free items or services

---

## ⚙️ Edge Functions (API)

| Endpoint             | Method | Purpose                                               |
| -------------------- | ------ | ----------------------------------------------------- |
| `/item-price`        | GET    | Calculate final item price including add-ons and tax  |
| `/item-availability` | GET    | Fetch available booking slots for a given date        |
| `/create-booking`    | POST   | Create a booking with conflict and overlap prevention |

---

## 🚀 Key Features

* Category and subcategory-based filtering
* Hierarchical tax inheritance
  *(Item → Subcategory → Category)*
* Bookable items with real-time availability management
* Robust **double-booking prevention**
* Dynamic pricing logic handled server-side
* Bestseller and New-item badges for better visibility
* Scalable architecture using serverless edge functions

---

## 📌 Use Cases

* Cafés offering dine-in, takeaway, and timed seating
* Hotels managing rooms, meeting halls, and paid services
* Co-working spaces with hourly/daily bookings and add-ons

---

**Guestara** is built to be flexible, extensible, and production-ready — enabling hospitality businesses to deliver smarter pricing and smoother booking experiences.


