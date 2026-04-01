# ShopIQ Project Structure

This document defines the strict directory structure for the ShopIQ repository. 

**AI INSTRUCTIONS (CURSOR):**
- **Strict Separation:** Never place Python files inside the `/src` directory. Never place React/Next.js components inside the `/api` directory.
- **Vercel Serverless:** The `/api` folder at the root is required by Vercel to correctly build and deploy the Python FastAPI backend as serverless functions.
- **Next.js App Router:** All frontend routing and UI components belong in the `/src` directory using the modern Next.js App Router paradigm.

---

## Directory Tree

```text
ShopIQ/
│
├── .cursorrules              # Global AI instructions for tech stack and behavior
├── DB_SCHEMA.md              # Supabase PostgreSQL schema definition
├── API_CONTRACT.md           # FastAPI endpoint definitions and JSON structures
├── PROJECT_STRUCTURE.md      # This file
│
├── vercel.json               # Vercel configuration routing /api/* to FastAPI
├── requirements.txt          # Python dependencies (FastAPI, scikit-learn, supabase)
├── package.json              # Node.js dependencies (Next.js, React, Tailwind)
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
│
├── /api                      # 🐍 BACKEND: FastAPI & Machine Learning
│   ├── main.py               # FastAPI application initialization and root router
│   ├── dependencies.py       # Shared dependencies (e.g., Supabase client setup)
│   ├── routers/              # API Route Handlers
│   │   ├── customers.py      # Customer profile and order history routes
│   │   ├── orders.py         # Order placement and retrieval routes
│   │   └── warehouse.py      # Priority queue and ML scoring trigger routes
│   │
│   └── ml_model/             # Machine Learning Assets
│       ├── late_delivery_model.pkl  # The exported scikit-learn model
│       └── predict.py        # Helper functions to format data and run inference
│
├── /src                      # ⚛️ FRONTEND: Next.js App Router & UI
│   ├── app/                  # Next.js Pages and Layouts
│   │   ├── layout.tsx        # Global HTML layout and navigation wrapper
│   │   ├── page.tsx          # Landing page / Select Customer screen
│   │   ├── /customer/        # Customer-facing views
│   │   │   └── page.tsx      # Customer dashboard and order history
│   │   └── /warehouse/       # Internal warehouse views
│   │       └── page.tsx      # Late Delivery Priority Queue dashboard
│   │
│   ├── components/           # Reusable React UI Components
│   │   ├── ui/               # Generic buttons, inputs, modals
│   │   ├── CustomerCard.tsx  # Displays customer profile info
│   │   ├── OrderTable.tsx    # Displays order history for customers
│   │   └── PriorityQueue.tsx # The interactive ML-driven warehouse table
│   │
│   └── lib/                  # Frontend Utilities
│       └── utils.ts          # Formatting helpers (dates, currency)
│
└── /scripts                  # 🛠️ UTILITIES: Data Migration & Setup
    └── migrate_sqlite.py     # Script to push shop.db data to Supabase
Module Responsibilities
/api (Backend)
Language: Python 3.9+

Responsibility: Direct database communication with Supabase via the supabase-py client, data validation using Pydantic, and executing the ML inference script.

Execution: Runs as serverless functions on Vercel.

/src (Frontend)
Language: TypeScript / TSX

Responsibility: Client-side state, UI rendering, routing, and making HTTP requests to the /api endpoints.

Execution: Next.js deployed on Vercel.

/scripts (Utilities)
Language: Python or Bash

Responsibility: One-off scripts used for development or deployment prep, such as the initial migration from SQLite to PostgreSQL. These are not executed in production.