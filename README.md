# ShopIQ: Predictive E-Commerce & Warehouse Dashboard

ShopIQ is a full-stack e-commerce web application backed by an operational database and an active machine learning pipeline. It provides a frictionless customer storefront alongside an intelligent warehouse dashboard that predicts and prioritizes orders at risk of late delivery.

**Live Deployment:** [Insert your Vercel Live URL Here]

## 🚀 Features

### Customer Portal
* **Select Customer:** Frictionless entry screen requiring no signup or login.
* **Customer Dashboard:** Displays personalized order summaries for the selected user.
* **Order History:** A comprehensive view of all past transactions.
* **Live Order Placement:** Submit new orders that are instantly saved to the operational database.

### Warehouse Management & ML Integration
* **Late Delivery Priority Queue:** A dedicated warehouse view displaying the top 50 active orders, ranked dynamically by their predicted probability of missing the delivery window.
* **On-Demand ML Scoring:** A "Run Scoring" button that triggers a live machine learning inference job. This recalculates late-delivery probabilities based on the latest data and instantly refreshes the priority queue.

## 🛠️ Tech Stack

* **Frontend:** Next.js / React
* **Backend API:** FastAPI (Python)
* **Database:** Supabase (PostgreSQL)
* **Machine Learning:** Scikit-learn / Pandas (Trained in Jupyter Notebooks)
* **Deployment:** Vercel (Frontend and Serverless Python Functions)

## 🏗️ Architecture & Data Flow

1. **Database:** The operational data was migrated from a local SQLite file (`shop.db`) to a managed Supabase PostgreSQL instance.
2. **API Layer:** The FastAPI backend handles all CRUD operations, securely bridging the Next.js frontend with the Supabase database.
3. **ML Inference Pipeline:** * The predictive model was trained in Jupyter Notebooks and exported as a `.pkl` (or `.joblib`) file.
   * When the "Run Scoring" button is clicked, Next.js calls a FastAPI endpoint.
   * FastAPI loads the model, fetches recent unfulfilled orders from Supabase, and runs the `predict_proba()` function.
   * The new risk scores are written back to the database, and the frontend queue automatically updates.

## 💻 Local Setup & Development

### Prerequisites
* [Node.js](https://nodejs.org/)
* [Python 3.9+](https://www.python.org/)
* A [Supabase](https://supabase.com/) account and project

### 1. Database Setup
1. Create a new project in Supabase.
2. Run your data migration scripts to transfer the schema and data from `shop.db` to Supabase PostgreSQL.
3. Obtain your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the project settings.

### 2. Backend (FastAPI) Setup
1. Navigate to the backend directory (or root, depending on your structure).
2. Create a virtual environment: `python -m venv venv`
3. Activate the environment:
   * Windows: `venv\Scripts\activate`
   * Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file and add your Supabase credentials.
6. Run the local server: `uvicorn api.main:app --reload` (Adjust path to your main FastAPI file).

### 3. Frontend (Next.js) Setup
1. Navigate to the frontend directory.
2. Install dependencies: `npm install`
3. Create a `.env.local` file with:
   * `NEXT_PUBLIC_SUPABASE_URL=your_url`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`
   * `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` (for local API calls)
4. Start the development server: `npm run dev`

## 🌐 Deployment Details

This project is configured to deploy entirely on **Vercel**. 
* The Next.js frontend builds normally.
* The `vercel.json` file in the root directory routes requests from `/api/*` to the FastAPI Python serverless functions, allowing the frontend, backend, and ML inference script to exist in a single unified deployment.