You are a senior SaaS frontend engineer.

Your task is to migrate the current UI of this project to a **modern SaaS-style admin dashboard** using **TailwindCSS + Flowbite**.

The system is a **Property / Rental Management platform** (similar to a property management SaaS).

Do NOT change backend APIs or business logic. Only refactor and redesign the UI.

---

## Tech Stack

Use:

* TailwindCSS
* Flowbite
* Flowbite React (if React project)
* Existing framework (Next.js / React)

Install if missing:

npm install flowbite flowbite-react
npm install -D tailwindcss postcss autoprefixer

Configure Tailwind to include Flowbite plugin.

---

# Design Goal

Create a **professional SaaS admin dashboard** similar to products like:

* Stripe dashboard
* Vercel dashboard
* Supabase dashboard

The UI should feel:

* modern
* minimal
* data-focused
* responsive
* scalable for future features

Use good spacing, consistent typography, and card-based layouts.

---

# Main Layout

Create a reusable **AdminDashboardLayout** with:

### Left Sidebar (Flowbite Sidebar)

Sections:

Dashboard
Properties
Rooms / Units
Tenants
Services
Bills / Invoices
Contracts / Leases
Reports
Settings

Sidebar should support:

* icons
* active state
* collapsible mode

---

### Top Navbar

Include:

* page title
* search bar
* notifications
* user profile dropdown

---

### Main Content Area

Use:

* cards
* tables
* charts (optional)
* action buttons

---

# Dashboard Page

Create a SaaS-style dashboard overview with cards:

KPIs:

* Total Properties
* Total Rooms
* Active Tenants
* Monthly Revenue
* Pending Bills
* Occupancy Rate

Use **Flowbite cards** and responsive grid.

---

# Data Management Pages

Design the following admin pages.

## Properties

Table:

* Property name
* Address
* Number of rooms
* Occupancy
* Actions

Actions:

Edit
Delete
View rooms

---

## Rooms / Units

Table:

* Room number
* Property
* Tenant
* Status
* Rent price

Status badges:

Available
Occupied
Maintenance

---

## Tenants

Table:

* Name
* Phone
* Email
* Room
* Contract status

---

## Services

Utility services:

* Electricity
* Water
* Gas
* Internet

Fields:

Service name
Unit (kWh, m³, etc)
Price per unit

---

## Bills / Invoices

Billing table:

Tenant
Room
Total amount
Status
Due date

Status badges:

Paid
Pending
Overdue

---

# UI Components

Use Flowbite components for:

Tables
Forms
Modals
Dropdowns
Buttons
Tabs
Cards
Alerts
Badges

---

# Forms

Create Flowbite forms for:

Create property
Create room
Add tenant
Add service
Create bill
Edit contract

Forms should include:

* labels
* validation messages
* proper spacing

---

# Modals

Use Flowbite modals for:

Create new item
Edit item
Delete confirmation

---

# UX Improvements

Implement good SaaS UX patterns:

Pagination
Search filters
Status badges
Empty states
Loading states

---

# Responsiveness

The UI must work for:

Desktop
Tablet
Mobile

Sidebar should collapse on mobile.

---

# Code Organization

Create reusable components:

components/ui/
components/dashboard/
components/tables/
components/forms/

Avoid duplicated layouts.

---

# Cleanup

After migration:

Remove:

* old CSS frameworks
* legacy styles
* old UI components

Keep only:

TailwindCSS
Flowbite

Ensure the project builds successfully.

---

# Final Result

The final result must be a **clean SaaS admin dashboard UI** suitable for a **property / rental management platform** with modern UX and scalable structure.
