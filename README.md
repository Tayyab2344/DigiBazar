# 🛍️ DigiBazar — Multi-Vendor E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_DB-4169E1?style=flat-square&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**DigiBazar** is a high-performance, full-stack multi-tenant marketplace platform. It allows multiple vendors (companies) to create and customize their online storefronts, manage product catalogs, handle order fulfillments, run promotional campaigns, and process unified multi-vendor customer checkouts.

---

## 🌟 Key Architecture & Features

### 👑 1. Super Admin Dashboard
- **Company Governance**: Approve, suspend, or manage platform merchant applications and onboard vendors.
- **Platform Analytics**: Global revenue, payout management, active customer metrics, and system audit logs.
- **Global Coupons**: Create platform-wide promotional discounts and tracking campaigns.

### 🏢 2. Company (Vendor) Storefront & Management
- **Dynamic Storefronts**: Custom merchant branded URL stores (`/store/[companySlug]`).
- **Product & Inventory Management**: Multi-category catalog, variant pricing, media uploads, and inventory movement logs.
- **Order Fulfillment**: Track order status transitions (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
- **Staff & Team Management**: Invite staff members with role-based access control.

### 🛒 3. Customer Shopping & Unified Cart
- **Cross-Vendor Shopping**: Add products from multiple companies into a single unified cart.
- **Discount & Campaign Engine**: Server-verified coupon codes and single-use discount links.
- **Real-Time Order Tracking**: Order status progression, delivery address management, and purchase history.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS**, **Lucide Icons**, **API Client SDK** |
| **Backend** | **FastAPI** (Python 3.10+), **Pydantic v2**, **SQLAlchemy 2.0** (Async), **Alembic**, **Pytest** |
| **Database** | **Neon PostgreSQL** (Production), **SQLite** (Local fallback) |
| **Auth & Security** | **JWT Tokens** (Access & Refresh), Role & Tenant-Scoped Dependencies, **Bcrypt** Password Hashing |
| **Integrations** | **Stripe** Payment Gateway, **Cloudinary** Image & Asset Storage |

---

## 📁 Repository Structure

```
/apps
├── /api                          # FastAPI Backend Service
│   ├── /alembic                  # Database migration scripts
│   ├── /app
│   │   ├── /core                 # Security, JWT, DB engine & configuration
│   │   ├── /deps                 # Tenant scoping & auth dependency guards
│   │   ├── /models               # SQLAlchemy ORM models
│   │   ├── /routers              # REST API endpoint routers
│   │   ├── /schemas              # Pydantic v2 request/response schemas
│   │   ├── /services             # Business logic (checkout, auth, company)
│   │   └── main.py               # FastAPI application entry point
│   ├── /tests                    # Pytest automated test suite
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Backend environment template
│
└── /web                          # Next.js 15 Frontend Web App
    ├── /app                      # App Router page views & layouts
    ├── /components               # UI Components (Admin, Company, Marketplace)
    ├── /lib/api                  # Typed API Client for FastAPI backend
    ├── /types                    # TypeScript DTO interface definitions
    └── package.json              # Node.js dependencies
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 2. Backend Setup (`/apps/api`)

```bash
# Navigate to API directory
cd apps/api

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Run FastAPI development server
uvicorn app.main:app --reload --port 8000
```
*Backend API docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

### 3. Frontend Setup (`/apps/web`)

```bash
# Navigate to Web directory
cd apps/web

# Install NPM dependencies
npm install

# Start Next.js dev server
npm run dev
```
*Frontend web application will be live at: [http://localhost:3000](http://localhost:3000)*

---

## 🧪 Running Automated Tests

To execute the Pytest suite for API endpoints, role guards, and money math verification:

```bash
cd apps/api
pytest tests
```

---

## 🌐 Deployment

### Frontend (Vercel)
1. Import repository to **Vercel**.
2. Set build command: `npm --prefix web run build` or select `apps/web` root directory.
3. Configure environment variable:
   `NEXT_PUBLIC_API_URL=https://your-backend-api-url.com`

### Backend (Railway / Render / Cloud Containers)
1. Deploy `apps/api` to container host.
2. Set production environment variable:
   `DATABASE_URL=postgresql+asyncpg://neondb_owner:...@ep-polished-bonus...neon.tech/neondb?ssl=require`
   `CORS_ORIGINS=["https://your-vercel-app.vercel.app"]`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
