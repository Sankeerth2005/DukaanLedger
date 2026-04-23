# Product Requirements Document (PRD) – DukaanLedger

## 1. Product Summary
**DukaanLedger** is a sleek, modern, multi-tenant SaaS platform designed for small-to-medium retail shops and business owners. Positioned as a digital ledger and Point of Sale (POS) application, it empowers shopkeepers to effortlessly track inventory, process billing transactions, and extract actionable business insights from a central, motion-first interface.

### 1.1 Vision
To bring enterprise-grade business intelligence and seamless retail management into the hands of local shop owners through a visually engaging, high-performance, mobile-responsive "Gen Z" aesthetic. 

---

## 2. Target Audience
1. **Retail Shop Owners:** Need a digital tool to manage stock, oversee staff activity, and understand revenue margins without requiring complex technical knowledge.
2. **Shop Staff/Cashiers:** Need a lightning-fast, error-free billing interface to check out customers and view product availability.
3. **Multi-Store Franchises (*Future Scope*):** Users managing multiple branches needing aggregate analytics.

---

## 3. Technology Stack
The platform is built around a modern, high-performance Javascript/TypeScript ecosystem:
- **Framework:** Next.js (App Router) with React 19
- **Database:** PostgreSQL (Hosted on Neon DB)
- **ORM:** Prisma Client
- **Authentication:** NextAuth.js (configured with Google OAuth & seamless Multi-Tenancy session healing)
- **Styling & UI:** Tailwind CSS (v4), `shadcn/ui`, Glassmorphism utilities, and Framer Motion for micro-animations
- **Data Visualization:** Recharts for responsive, animated area/bar charts

---

## 4. User Roles & Permissions
**DukaanLedger** enforces strict, route-level security and data isolation for all operations.

| Role | Capabilities |
| :--- | :--- |
| **OWNER** | Super-admin for their respective shop. Can view Analytics, manage Shop Settings, and hire/manage `STAFF`. Has full CRUD access to Products, Billing, and Sales. |
| **STAFF** | Action-oriented role. Can access the POS/Billing page, view Products, and process sales, but is restricted from seeing overall profit analytics, modifying shop settings, or managing personnel. |

> [!CAUTION]
> **Data Integrity:** All database queries are scoped to the authenticated user's `shopId`. A transaction cannot be created, nor a product deleted, unless the strict `shopId` validation passes.

---

## 5. Core Features & Architecture

### 5.1 Authentication & Multi-Tenancy Engine
- **Just-In-Time Shop Creation:** New users signing up via Google OAuth are automatically provisioned an isolated `Shop` entity and default `ShopSettings` via atomic Prisma transactions. 
- **Auto-Healing Sessions:** Stale JWT tokens dynamically re-fetch internal user mappings to prevent dashboard crashes.

### 5.2 Smart Billing & POS System
- **Real-Time Cart Calculation:** Instantly calculates subtotals, final selling prices, and itemized discounts.
- **Smart Co-Purchasing (Upsell AI):** Automatically analyzes historical transaction data to display *"Frequently bought together"* product chips right below the cart, mapped to the last added item.
- **Stock Lock & Consistency:** Validates stock-levels strictly at the time of checkout. Decrements stock and logs the sale under an atomic `$transaction` to prevent race conditions.

### 5.3 Inventory Management
- **Centralized Catalog:** Track Product Name, Buying Price, Selling Price, Base Discount, and Stock numbers.
- **Real-Time Sync:** Stock amounts dynamically update as backend sales are recorded.

### 5.4 Native Analytics & AI Insights
- **Aggregated Dashboard:** Visual representation of Revenue, Profit Margins, Total Orders, and Average Order Value (AOV).
- **Time-Series Analysis:** Area charts displaying Revenue and Profit trends across varying date filters (Today, 7D, 30D, 90D).
- **Profit Margin Leaderboard:** Visual bars ranking the most profitable items vs. volume-heavy items.
- **Native AI Insights Engine:** Generates rule-based algorithmic insights (No 3rd-party LLM costs). It continuously evaluates real shop data to generate alerts for:
  - *"Slow Movers"* (High stock, low sales)
  - *"Margin Warnings"* (Products selling below profitable thresholds)
  - *"Growth Signals"* (Week-over-week revenue changes)
  - *"Low/Out-of-Stock Alerts"*

### 5.5 Staff Management & Business Settings
- **Shop Profiles:** Owners can define their GST/Tax numbers, global currency symbol (e.g., `₹`, `$`), address, and store branding—which propagate down to invoice/receipt generation.
- **Personnel Directory:** Logging staff profile data, tracking salary, and logging performance improvements over time.

---

## 6. Implementation Specifications

### 6.1 Database Schema (High-Level)
- `User`, `Account`, `Session` (Auth infrastructure)
- `Shop` (The core Tenant. Everything nests under this).
- `ShopSettings` (1-to-1 with a Shop).
- `Product` (Catalog items).
- `Sale` (The master receipt/transaction).
- `SaleItem` (Snapshot of price/profit at the exact time of the transaction).
- `StaffProfile`, `SalaryIncrement` (HR management).

### 6.2 UX / UI Principles
> [!TIP]
> The app employs a **Gen Z Motion-First** design language. 
- Surfaces leverage heavy glassmorphism (`backdrop-blur`) interacting with dark-mode gradients.
- Typography relies on modern Grotesque/Display fonts (`Syne` for headers, `Inter` for data).
- Buttons and state changes use physics-based spring animations via Framer Motion.

---

## 7. Security & Edge Case Handling
- **Defensive API Hardening**: Every `route.ts` API enforces `shopId` null guards returning `400 Bad Request` safely if session context is lost.
- **Stale Context Warnings:** Users are met with an actionable banner ("Session needs a refresh") and an automatic heal pathway if cookie policies interrupt mapping.

---

## 8. Future Roadmap 
- **Invoice PDF Engine:** Move from basic receipt printing to deep, downloadable PDF tax invoices mapped to local compliance standards.
- **Supplier & Purchase Order Management:** Allow tracking not just outbound sales, but inbound inventory purchases and vendor balances.
- **Voice-Enabled Actions:** Integrate Speech-to-text allowing cashiers to say *"Add 2 bottles of Water to Cart"* for accessibility and speed.
