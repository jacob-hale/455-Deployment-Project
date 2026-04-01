# Database Schema (Supabase / PostgreSQL)

This document outlines the operational database schema migrated from the original `shop.db`. 

**AI INSTRUCTIONS:** - Always refer to these exact table and column names when writing FastAPI database logic or Supabase client queries.
- Ensure that Python models (Pydantic) and TypeScript interfaces match these data types.
- The `late_delivery` column in the `shipments` table is the primary target for the Late Delivery Priority Queue ML model. If your model writes a probability score instead of a binary integer, you will need to add a `late_delivery_probability` (FLOAT) column to the `shipments` table during the Supabase migration.

---

## Tables

### 1. `customers`
| Column Name | Data Type | Notes |
| :--- | :--- | :--- |
| `customer_id` | INT / UUID | Primary Key |
| `full_name` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL, UNIQUE |
| `gender` | TEXT | NOT NULL (e.g., "Male", "Female", "Non-binary") |
| `birthdate` | TEXT | NOT NULL (YYYY-MM-DD) |
| `created_at` | TEXT | NOT NULL |
| `city` | TEXT | |
| `state` | TEXT | |
| `zip_code` | TEXT | |
| `customer_segment` | TEXT | e.g., "budget", "standard", "premium" |
| `loyalty_tier` | TEXT | e.g., "none", "silver", "gold" |
| `is_active` | INT / BOOLEAN | NOT NULL, Default 1 |

### 2. `products`
| Column Name | Data Type | Notes |
| :--- | :--- | :--- |
| `product_id` | INT / UUID | Primary Key |
| `sku` | TEXT | NOT NULL, UNIQUE |
| `product_name` | TEXT | NOT NULL |
| `category` | TEXT | NOT NULL |
| `price` | REAL | NOT NULL |
| `cost` | REAL | NOT NULL |
| `is_active` | INT / BOOLEAN | NOT NULL, Default 1 |

### 3. `orders`
| Column Name | Data Type | Notes |
| :--- | :--- | :--- |
| `order_id` | INT / UUID | Primary Key |
| `customer_id` | INT / UUID | Foreign Key -> `customers.customer_id` |
| `order_datetime` | TEXT | NOT NULL |
| `billing_zip` | TEXT | |
| `shipping_zip` | TEXT | |
| `shipping_state` | TEXT | |
| `payment_method` | TEXT | NOT NULL (e.g., "card", "paypal") |
| `device_type` | TEXT | NOT NULL (e.g., "mobile", "desktop") |
| `ip_country` | TEXT | NOT NULL |
| `promo_used` | INT / BOOLEAN | NOT NULL, Default 0 |
| `promo_code` | TEXT | |
| `order_subtotal` | REAL | NOT NULL |
| `shipping_fee` | REAL | NOT NULL |
| `tax_amount` | REAL | NOT NULL |
| `order_total` | REAL | NOT NULL |
| `risk_score` | REAL | NOT NULL (0-100) - **ML Feature/Target** |
| `is_fraud` | INT / BOOLEAN | NOT NULL, Default 0 |

### 4. `order_items`
| Column Name | Data Type | Notes |
| :--- | :--- | :--- |
| `order_item_id` | INT / UUID | Primary Key |
| `order_id` | INT / UUID | Foreign Key -> `orders.order_id` |
| `product_id` | INT / UUID | Foreign Key -> `products.product_id` |
| `quantity` | INT | NOT NULL |
| `unit_price` | REAL | NOT NULL |
| `line_total` | REAL | NOT NULL |

### 5. `shipments` (Warehouse ML Target)
| Column Name | Data Type | Notes |
| :--- | :--- | :--- |
| `shipment_id` | INT / UUID | Primary Key |
| `order_id` | INT / UUID | Foreign Key -> `orders.order_id`, UNIQUE |
| `ship_datetime` | TEXT | NOT NULL |
| `carrier` | TEXT | NOT NULL (e.g., "UPS", "FedEx", "USPS") |
| `shipping_method` | TEXT | NOT NULL (e.g., "standard", "expedited") |
| `distance_band` | TEXT | NOT NULL (e.g., "local", "regional") |
| `promised_days` | INT | NOT NULL |
| `actual_days` | INT | NOT NULL |
| `late_delivery` | INT / BOOLEAN | NOT NULL, Default 0 - **ML Label / Prediction Target** |

### 6. `product_reviews`
| Column Name | Data Type | Notes |
| :--- | :--- | :--- |
| `review_id` | INT / UUID | Primary Key |
| `customer_id` | INT / UUID | Foreign Key -> `customers.customer_id` |
| `product_id` | INT / UUID | Foreign Key -> `products.product_id` |
| `rating` | INT | NOT NULL (1-5) |
| `review_datetime` | TEXT | NOT NULL |
| `review_text` | TEXT | |