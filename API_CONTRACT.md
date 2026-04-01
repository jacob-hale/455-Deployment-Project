# API Contract & Routing (Next.js ↔ FastAPI)

This document defines the API endpoints exposed by the FastAPI backend and consumed by the Next.js frontend. 

**AI INSTRUCTIONS (CURSOR):**
- **Base URL:** When fetching data in the Next.js frontend, always use the relative path `/api/...` (e.g., `fetch('/api/warehouse/queue')`). Vercel will automatically route this to the Python serverless functions.
- **Strict Adherence:** Do not invent endpoints. If a feature requires data, use the endpoints defined below.
- **Data Types:** Match the JSON response structures exactly to the Pydantic models in FastAPI and the TypeScript interfaces in Next.js.

---

## 🧑‍🤝‍🧑 Customer Endpoints

### 1. Get Customer Profile
Retrieves a customer's basic information for the "Select Customer" dashboard view.

* **Method:** `GET`
* **Path:** `/api/customers/{customer_id}`
* **Request Body:** None
* **Response:**
```json
{
  "customer_id": 1042,
  "full_name": "Jacob Hale",
  "email": "jacob.hale@example.com",
  "customer_segment": "standard",
  "loyalty_tier": "gold"
}
2. Get Customer Order History
Retrieves all past orders for a specific customer, including items and shipping status.

Method: GET

Path: /api/customers/{customer_id}/orders

Request Body: None

Response:

JSON
{
  "orders": [
    {
      "order_id": 50991,
      "order_datetime": "2026-03-15T14:30:00Z",
      "order_total": 145.99,
      "status": "Shipped",
      "items": [
        { "product_name": "Wireless Mouse", "quantity": 1, "price": 45.99 }
      ]
    }
  ]
}
3. Place New Order
Submits a new order from the customer storefront into the operational database.

Method: POST

Path: /api/orders

Request Body:

JSON
{
  "customer_id": 1042,
  "payment_method": "card",
  "device_type": "desktop",
  "ip_country": "US",
  "shipping_fee": 5.99,
  "tax_amount": 10.50,
  "order_total": 162.48,
  "items": [
    { "product_id": 302, "quantity": 1, "unit_price": 145.99 }
  ]
}
Response:

JSON
{
  "status": "success",
  "order_id": 50992,
  "message": "Order placed successfully and routed to warehouse."
}
🏭 Warehouse & ML Endpoints
4. Get Late Delivery Priority Queue
Fetches the top 50 active shipments that have the highest probability of missing their delivery window. This drives the main warehouse dashboard.

Method: GET

Path: /api/warehouse/queue

Request Body: None

Response:

JSON
{
  "last_updated": "2026-03-31T14:00:00Z",
  "queue": [
    {
      "shipment_id": 8832,
      "order_id": 50980,
      "customer_name": "Emma Jeppsen",
      "carrier": "FedEx",
      "shipping_method": "standard",
      "promised_days": 3,
      "late_delivery_probability": 0.92,
      "risk_level": "High"
    },
    {
      "shipment_id": 8845,
      "order_id": 50981,
      "customer_name": "Nathan Hale",
      "carrier": "USPS",
      "shipping_method": "expedited",
      "promised_days": 2,
      "late_delivery_probability": 0.85,
      "risk_level": "High"
    }
  ]
}
5. Trigger ML Scoring (The Inference Job)
Executes the scikit-learn model on all active shipments, calculates new late-delivery probabilities, updates the Supabase database, and returns a success metric.

Method: POST

Path: /api/warehouse/score

Description: This endpoint is triggered manually by the "Run Scoring" button on the warehouse dashboard. It should load late_delivery_model.pkl, fetch active shipments from Supabase, run .predict_proba(), and execute an UPDATE on the shipments table.

Request Body: None

Response:

JSON
{
  "status": "success",
  "message": "ML Inference complete. Database updated.",
  "records_scored": 142,
  "high_risk_detected": 18,
  "execution_time_ms": 450
}