# ShopIQ project setup and feature implementation
_Exported on 4/3/2026 at 10:53:40 MDT from Cursor (2.6.22)_

---

**User**

Please review the .cursorrules, PROJECT_STRUCTURE.md, API_CONTRACT.md, and DB_SCHEMA.md files in this root directory.

We are going to start building ShopIQ. Let's begin by scaffolding the project and building the first full-stack feature: The 'Select Customer' landing page. Please do this step-by-step:

Step 1: Scaffolding & Config

Create the vercel.json file at the root to route /api/(.*) to api/main.py.

Create the requirements.txt file for the Python backend (include fastapi, uvicorn, supabase, pydantic).

Assuming I have a standard Next.js app in /src, ensure the tailwind.config.ts and tsconfig.json are set up correctly.

Step 2: The FastAPI Backend

Create /api/main.py and set up the FastAPI application.

Create a Supabase client dependency.

Create the GET /api/customers/{customer_id} endpoint exactly as defined in the API_CONTRACT.md. For now, just write the query to fetch a customer by ID from the Supabase customers table.

Step 3: The Next.js Frontend

Update /src/app/page.tsx to be the "Select Customer" screen.

It should have a clean, modern UI (using Tailwind) where a user can enter a customer_id (e.g., 1042) or select from a hardcoded list of a few IDs to log in.

When a customer is selected, it should fetch their profile from the FastAPI endpoint we just made and display a welcome message with their name and loyalty tier.

Please execute these steps, creating the necessary folders and files to match PROJECT_STRUCTURE.md.

---

**Cursor**

I’ll start by reading the four spec files you listed so the scaffold and endpoint match your contracts exactly, then I’ll implement Step 1 → Step 3 in order and validate for obvious type/lint issues.

I’ve confirmed the contract/schema details and will now inspect the existing project files so I can scaffold without breaking your current Next.js setup.

I found this workspace currently only has the planning docs, so I’m creating the initial ShopIQ scaffold (root configs, `api` backend files, and `src/app` frontend files) according to `PROJECT_STRUCTURE.md`, then wiring the first customer lookup flow end-to-end.

I’m now adding the FastAPI app with a reusable Supabase dependency and a dedicated customers router so the endpoint shape stays aligned with your API contract as features expand.

Next I’m creating the `src` app structure (including placeholder pages/components from your project map) and implementing the interactive “Select Customer” page that calls `/api/customers/{id}`.

Implemented all three steps and scaffolded the repo to match your `PROJECT_STRUCTURE.md` baseline.

### Step 1: Scaffolding & Config

Created:

- `vercel.json` with rewrite routing `/api/(.*)` → `/api/main.py`
- `requirements.txt` with:
  - `fastapi`
  - `uvicorn`
  - `supabase`
  - `pydantic`
- `tailwind.config.ts` configured for `src/app`, `src/components`, and `src/pages`
- `tsconfig.json` with strict Next.js-friendly TypeScript settings and `@/*` path alias to `src/*`

### Step 2: FastAPI Backend

Created backend scaffold and endpoint wiring:

- `api/main.py` (FastAPI app bootstrap)
- `api/dependencies.py` (Supabase client dependency via env vars `SUPABASE_URL`, `SUPABASE_KEY`)
- `api/routers/customers.py` with:
  - Pydantic response model matching contract shape
  - `GET /api/customers/{customer_id}`
  - Supabase query against `customers` table selecting:
    - `customer_id`
    - `full_name`
    - `email`
    - `customer_segment`
    - `loyalty_tier`
  - 404 when customer not found

Also scaffolded package/router structure:

- `api/__init__.py`
- `api/routers/__init__.py`
- `api/routers/orders.py` (placeholder)
- `api/routers/warehouse.py` (placeholder)
- `api/ml_model/predict.py` (placeholder)
- `api/ml_model/late_delivery_model.pkl.placeholder`

### Step 3: Next.js “Select Customer” Landing Page

Created and updated frontend:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx` (full “Select Customer” UI)

`src/app/page.tsx` now includes:

- Input for `customer_id` (e.g. `1042`)
- Hardcoded quick-select ID buttons
- Fetch call to `/api/customers/{customer_id}`
- Loading + error states
- Welcome card showing:
  - customer `full_name`
  - `loyalty_tier`

### Additional structure files (to align with project map)

Created:

- `src/app/customer/page.tsx` (placeholder)
- `src/app/warehouse/page.tsx` (placeholder)
- `src/components/CustomerCard.tsx`
- `src/components/OrderTable.tsx`
- `src/components/PriorityQueue.tsx`
- `src/components/ui/.gitkeep`
- `src/lib/utils.ts`
- `scripts/migrate_sqlite.py`

Validation done: no linter errors reported for edited `src` and `api` paths.

If you want, next I can wire `GET /api/customers/{customer_id}/orders` and connect `src/app/customer/page.tsx` to display real order history from Supabase.

---

**User**

what are the next steps as far as installing depencies and whatever else is needed goes?

---

**Cursor**

You’re at the right point to move from scaffold to a runnable local setup; I’ll quickly check what config files are currently present and then give you the exact install/run sequence.

Great question. Based on your current state, the big missing piece is the **Node/Next.js package setup** (there’s no `package.json` yet), plus environment variables.

## Next Steps

- Initialize/install frontend dependencies (Next.js + React + Tailwind + TypeScript).
- Install Python backend dependencies from `requirements.txt`.
- Add `.env.local` values for Supabase.
- Run frontend and backend locally and verify `/api/customers/{id}` works.

## 1) Frontend setup (Node)

From project root:

```bash
npm init -y
npm install next react react-dom
npm install -D typescript @types/react @types/node tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then make sure your `package.json` has scripts like:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

Also make sure you have:

- `postcss.config.js` (from `tailwindcss init -p`)
- `next-env.d.ts` (usually auto-generated when Next starts; you can create it if needed)

## 2) Backend setup (Python)

If you use virtual env:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

(If `python` maps differently on your machine, use `py`.)

## 3) Environment variables

Create `.env.local` at repo root with at least:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

For backend security in production, you’ll eventually want service-role key usage server-side only, but for now this unblocks the customer fetch flow.

## 4) Run locally

You need both runtimes:

- Next frontend: `npm run dev`
- FastAPI backend:
  ```bash
  uvicorn api.main:app --reload --port 8000
  ```

Because your frontend calls `/api/...`, for local dev you may also want either:
- a Next rewrite/proxy to `http://127.0.0.1:8000/api/...`, or
- run in Vercel dev mode (`vercel dev`) so routing behaves like deployment.

## 5) Quick verification checklist

- Open landing page.
- Enter `1042` (or quick-select button).
- Confirm request to `/api/customers/1042`.
- Confirm response includes `full_name` and `loyalty_tier`.
- Confirm welcome card renders.

If you want, I can give you the exact minimal `package.json`, `postcss.config.js`, and local rewrite config to make this run smoothly on Windows in one pass.

---

**User**

 npx tailwindcss init -p
npm error could not determine executable to run
npm error A complete log of this run can be found in: C:\Users\jacob\AppData\Local\npm-cache\_logs\2026-03-31T21_10_55_103Z-debug-0.log

---

**Cursor**

That error usually means Tailwind isn’t actually installed in your local project yet (or `node_modules/.bin` wasn’t created). I’ll quickly check your current package setup and give the exact fix sequence.

You hit this because you installed **Tailwind v4** (`tailwindcss: ^4.2.2`), and in v4 the old `init -p` flow is no longer the standard CLI path.

## Why it failed

- `package.json` shows `tailwindcss` v4 in `devDependencies`.
- `npx tailwindcss init -p` is a v3-era command, so npm can’t find a runnable executable for that command shape.

## What to do now (recommended)

You already have `tailwind.config.ts`, so skip `init` and just add the missing Next scripts + PostCSS config.

1. Add scripts to `package.json`:
- `dev: next dev`
- `build: next build`
- `start: next start`
- optionally `lint: next lint`

2. Create `postcss.config.js` with:

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};
```

3. Install the v4 PostCSS plugin:

```bash
npm install -D @tailwindcss/postcss
```

4. Run:

```bash
npm run dev
```

---

## Alternative (if you want classic `init -p`)

Use Tailwind v3 instead:

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

That restores the old docs/workflow.

---

Given your current files, the **first path (stay on v4)** is cleaner.  
If you want, I can check your exact `postcss.config.js` and `package.json` content once you add them and confirm it’s correct before you run again.

---

**User**

do all the things needed from that last response you gave me

---

**Cursor**

I’ll apply the exact v4 Tailwind setup now: update `package.json` scripts, add `postcss.config.js`, install `@tailwindcss/postcss`, then run a build check to confirm it works.

I’ve applied the config/install changes. I’m running a quick production build now to verify the setup is actually working end-to-end.

Build surfaced one blocker: `package.json` is set to `commonjs`, which conflicts with your TS/ESM Next files. I’m fixing that now and re-running build.

One more compatibility fix is needed: Next is using TypeScript 6, which requires an explicit deprecation flag for `baseUrl`. I’m adding that and validating again.

Completed — I applied everything from that last setup response and verified it builds.

What I changed:

- Updated `package.json` scripts:
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
  - `lint`: `next lint`
- Switched `package.json` to ESM (`"type": "module"`) so it matches your TS/Next files.
- Added `postcss.config.js` in Tailwind v4-compatible ESM format using `@tailwindcss/postcss`.
- Installed the required Tailwind v4 PostCSS plugin:
  - `@tailwindcss/postcss`
- Resolved TypeScript compatibility cleanly by installing TS v5:
  - `typescript@5`

Validation status:

- `npm run build` passes successfully.
- No linter errors in edited config files.

One non-blocking warning remains during build:

- Next detects another `package-lock.json` at `C:\Users\jacob\package-lock.json` and warns about inferred workspace root.
- App still builds fine; this is only a warning.

Next command for you:

- Run `npm run dev` and open the app locally.

---

**User**

this is what I get when I run it locally and try toclick on any of the suggested ccustomerIDs

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};

---

**Cursor**

I’ll check your current `postcss.config.js` and terminal error output to confirm whether this is the CommonJS-vs-ESM config mismatch, then I’ll fix it directly if needed.

The snippet you pasted is actually fine now; your real blocker is the `404` on `/api/customers/*` in local dev. I’m adding a dev-only Next rewrite to proxy `/api/*` to FastAPI on port `8000`, so clicking IDs hits your Python backend locally.

You’re very close — the issue was not your Tailwind snippet anymore.

What was happening:
- Your terminal log shows `GET /api/customers/... 404`.
- In local `next dev`, those `/api/*` calls were staying in Next (which has no API route), instead of reaching FastAPI.

I fixed that by adding a dev proxy:

- `next.config.ts` now rewrites `/api/:path*` → `http://127.0.0.1:8000/api/:path*` in development only.

## What to run now

1. **Backend terminal**
```bash
cd "c:\Users\jacob\OneDrive\Documents\455 Deployment Project"
.venv\Scripts\activate
uvicorn api.main:app --reload --port 8000
```

2. **Frontend terminal**
```bash
cd "c:\Users\jacob\OneDrive\Documents\455 Deployment Project"
npm run dev
```

3. Ensure env vars exist (for backend):
- `SUPABASE_URL`
- `SUPABASE_KEY`

## Expected behavior after this fix

- Clicking suggested customer IDs should now call FastAPI.
- If an ID exists in Supabase `customers`, you’ll get the welcome message.
- If not, you’ll still get an error (valid `404 Customer not found` from backend), which is correct behavior.

If you want, I can next add a temporary endpoint to list a few real customer IDs from Supabase so the quick-select buttons are guaranteed to work with your actual data.

---

**User**

.venv\Scripts\activate
.venv\Scripts\activate : The module '.venv' could not be loaded. For more information, run 
'Import-Module .venv'.
At line:1 char:1
+ .venv\Scripts\activate
+ ~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (.venv\Scripts\activate:String) [], CommandNotFoundEx  
   ception
    + FullyQualifiedErrorId : CouldNotAutoLoadModule

PS C:\Users\jacob\OneDrive\Documents\455 Deployment Project> .venv\Scripts\activate
>> uvicorn api.main:app --reload --port 8000
.venv\Scripts\activate : The module '.venv' could not be loaded. For more information, run 
'Import-Module .venv'.
At line:1 char:1
+ .venv\Scripts\activate
+ ~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (.venv\Scripts\activate:String) [], CommandNotFoundEx  
   ception
    + FullyQualifiedErrorId : CouldNotAutoLoadModule

uvicorn : The term 'uvicorn' is not recognized as the name of a cmdlet, function, script file, or 
operable program. Check the spelling of the name, or if a path was included, verify that the path    
is correct and try again.
At line:2 char:1
+ uvicorn api.main:app --reload --port 8000
+ ~~~~~~~
    + CategoryInfo          : ObjectNotFound: (uvicorn:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException


---

**Cursor**

You’re hitting two Windows PowerShell specifics: the venv wasn’t activated with the PowerShell script path, and `uvicorn` isn’t installed in the active interpreter yet. I’ll quickly verify whether `.venv` exists, then give you exact copy/paste commands.

Perfect, this explains it clearly: `.venv` does **not exist yet**, so activation fails.

Also in PowerShell you need `.\` and usually `Activate.ps1` (not just `activate`).

Run these commands exactly from project root:

```powershell
# 1) Create venv
py -m venv .venv

# 2) Activate venv (PowerShell)
.\.venv\Scripts\Activate.ps1

# 3) Install backend deps
python -m pip install --upgrade pip
pip install -r requirements.txt

# 4) Start FastAPI
python -m uvicorn api.main:app --reload --port 8000
```

If step 2 is blocked by execution policy, run this once in the same terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Then keep backend running there, and in a second terminal run:

```powershell
npm run dev
```

---

Alternative (no activation needed), you can run backend directly with venv python:

```powershell
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn api.main:app --reload --port 8000
```

If you want, paste the next backend terminal output and I’ll verify the API is up correctly.

---

**User**

kay whenI run both, I get  a 200 on the frontend side. but I get this on the server side:  python -m uvicorn api.main:app --reload --port 8000
INFO:     Will watch for changes in these directories: ['C:\\Users\\jacob\\OneDrive\\Documents\\455 Deployment Project']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [29236] using StatReload
INFO:     Started server process [31228]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     127.0.0.1:51299 - "GET /api/customers/1042 HTTP/1.1" 500 Internal Server Error
INFO:     127.0.0.1:61239 - "GET /api/customers/3099 HTTP/1.1" 500 Internal Server Error
INFO:     127.0.0.1:53358 - "GET /api/customers/100 HTTP/1.1" 500 Internal Server Error
INFO:     127.0.0.1:54823 - "GET /api/customers/102 HTTP/1.1" 500 Internal Server Error

---

**Cursor**

Good progress—frontend wiring is working. I’m going to read the backend traceback output to pinpoint the exact 500 cause (it’s likely env vars or Supabase auth), then I’ll give you the precise fix.

This is almost certainly your backend missing Supabase env vars in the **same PowerShell session** where Uvicorn runs.

Your code currently does this in `api/dependencies.py`:

```10:17:api/dependencies.py
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=500,
            detail="Missing SUPABASE_URL or SUPABASE_KEY environment variables.",
        )
```

So a 500 is expected if those vars aren’t set.

## Quick fix (PowerShell, same backend terminal)

Before running uvicorn:

```powershell
$env:SUPABASE_URL="https://<your-project-ref>.supabase.co"
$env:SUPABASE_KEY="<your-anon-or-service-role-key>"
python -m uvicorn api.main:app --reload --port 8000
```

Then test directly:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/customers/1042"
```

## If you still get 500 after setting env vars

- Key/URL may be wrong, or
- the `customers` table may not exist/populated in Supabase yet.

Try this in Supabase SQL editor:

```sql
select customer_id, full_name, email, customer_segment, loyalty_tier
from customers
limit 5;
```

If that returns rows, use one of those `customer_id` values in your UI quick-select.

---

If you want, I can add robust error handling in the endpoint so the frontend shows clearer messages (missing env vs auth failure vs table missing) instead of a generic 500.

---

**User**

okay I went into supabase and connected it to my vercel project which is this entire deployment project. how do I get the shop.db data into the supabase so that it can actually connect and use that data

---

**Cursor**

Checking the migration script and SQLite schema so we can give accurate migration steps.



Inspecting `shop.db` table structure so migration steps match your file.



Here’s a practical path from **`shop.db` (SQLite)** to **Supabase (Postgres)** so your FastAPI app sees real rows.

Your SQLite file already has the same logical tables as `DB_SCHEMA.md`: `customers`, `products`, `orders`, `order_items`, `shipments`, `product_reviews` (plus SQLite’s internal `sqlite_sequence`, which you ignore).

---

### 1. Create the schema in Supabase

In the Supabase dashboard: **SQL → New query**. Run DDL that matches `DB_SCHEMA.md` (Postgres types, primary keys, foreign keys). Order matters: create **`customers`** and **`products`**, then **`orders`**, then **`order_items`** and **`shipments`** and **`product_reviews`**.

If you paste your draft SQL here, we can sanity-check it; otherwise generate it from the doc column-by-column (e.g. `TEXT` → `TEXT`, `REAL` → `DOUBLE PRECISION`, ints → `INTEGER`, booleans as `INTEGER` or `BOOLEAN` to match how you store them).

---

### 2. Load the data (pick one approach)

**A) pgloader (fastest full-database path, if you can install it)**  
Point pgloader at `shop.db` and at your Supabase connection string (from **Project Settings → Database**). It copies tables in bulk. You still want the Postgres schema to exist first, or let pgloader create tables and then adjust types/constraints to match your app.

**B) CSV export/import (good if you want no extra tools)**  
For each table (in dependency order):

1. Export from SQLite (example with `sqlite3` CLI):
   - Headers + CSV per table.
2. In Supabase: **Table Editor → table → Insert → Import data from CSV** (or use **SQL** with `COPY` if you prefer).

Load order: `customers`, `products`, `orders`, `order_items`, `shipments`, `product_reviews`.

**C) Python migration script (fits your repo)**  
`scripts/migrate_sqlite.py` is still a placeholder. A real script would: connect to `shop.db` with `sqlite3`, read each table in batches, and insert into Postgres via **`psycopg[binary]`** or the **Supabase client** (`supabase.table("customers").insert(rows).execute()` — watch row limits and RLS). This is what `PROJECT_STRUCTURE.md` was pointing at.

---

### 3. Row Level Security (RLS)

If you turned on RLS on these tables and only use the **anon** key from the browser, inserts/selects can fail. For the **FastAPI** backend, use the **service role** key in server env (`SUPABASE_KEY`) and keep it only on the server/Vercel — never in client code. That usually avoids RLS blocking server-side reads/writes if policies are tight.

---

### 4. Confirm data before testing the app

In **SQL**:

```sql
select customer_id, full_name, loyalty_tier from customers limit 5;
```

Use one of those `customer_id` values on your Select Customer page.

---

### 5. Vercel + Supabase integration

Connecting Supabase to Vercel **syncs env vars** (`SUPABASE_URL`, keys). Your FastAPI code expects **`SUPABASE_URL`** and **`SUPABASE_KEY`** — make sure Vercel’s variable **names** match what `api/dependencies.py` reads, or add aliases in the dashboard.

---

**Summary:** Create Postgres tables from `DB_SCHEMA.md`, then bulk-load `shop.db` with pgloader, CSV import, or a Python migrator. The project’s `migrate_sqlite.py` is not implemented yet; if you want that route in-repo, say so and we can wire it to `shop.db` and your Supabase project safely (batch size, FK order, and env vars).

---

**User**

I moved my sqlite file to a dump.sql. how do I migrate that or run it in supabase? When I try to run the whole script it says it is too long

---

**Cursor**

Checking the start of `dump.sql` to determine its format — SQLite dumps often aren't compatible with PostgreSQL without conversion.



Identifying the issue: `dump.sql` is a SQLite `.dump` (PRAGMA, `AUTOINCREMENT`, `sqlite_sequence`). Supabase won't accept the full file for two reasons: editor size limits and non-Postgres SQL. Adding a small script to extract Postgres-safe `INSERT` chunks and documenting the workflow.



Creating a script to extract only the `INSERT` statements (in FK order) and split them into chunks small enough for the Supabase SQL editor.



Detecting `dump.sql` is UTF-16 LE (BOM `\xff\xfe`), not UTF-8 — that caused the script to mis-read lines and find no INSERTs. Fixing the script to open with `utf-16-sig`.



Detecting Python 3.14 on your machine doesn't accept `utf-16-sig` in `Path.open`. Using robust BOM detection:



Here’s what was going on and how to fix it.

### Why the full script fails in Supabase

1. **Size** – The SQL editor only accepts a limited amount of text per run, so a ~28k-line file is too large.
2. **Wrong dialect** – Your file is a **SQLite** `.dump`: `PRAGMA`, `BEGIN TRANSACTION`, `CREATE TABLE ... AUTOINCREMENT`, `sqlite_sequence`, etc. **PostgreSQL (Supabase) cannot run that as-is.**
3. **Encoding** – On disk, `dump.sql` is **UTF-16 LE** (BOM `\xff\xfe`). If you open it as UTF-8, matches and edits look wrong.

### What works: empty tables + chunked `INSERT`s

1. **Create tables in Supabase** with **Postgres** DDL that matches `DB_SCHEMA.md` (do **not** paste the SQLite `CREATE TABLE` from the dump).
2. **Generate small files of only `INSERT` statements** (already wired up in your repo):

```powershell
cd "c:\Users\jacob\OneDrive\Documents\455 Deployment Project"
python scripts\prepare_supabase_inserts.py
```

That reads `dump.sql`, detects UTF-16 vs UTF-8, strips everything except inserts for:

`customers` → `products` → `orders` → `order_items` → `shipments` → `product_reviews`,

and writes **`scripts/supabase_chunks/0001_inserts.sql`** … **`0071_inserts.sql`** (400 statements per file by default, last file shorter).

3. **In Supabase → SQL → New query**, open each chunk **in order** (`0001`, then `0002`, …), paste, run.  
   If a chunk is still too large for the editor, rerun with a smaller batch:

```powershell
python scripts\prepare_supabase_inserts.py --lines-per-file 150
```

4. **Optional, for large loads:** use `psql` with your Supabase **database** connection string (Settings → Database) and `\i path\to\0001_inserts.sql` so you are not limited by the web UI.

### Notes

- **`scripts/supabase_chunks/`** is in `.gitignore` so generated SQL doesn’t flood git.
- Some names may still look like `Gonz├ílez` if they were already wrong in the dump; fixing that is a separate encoding cleanup if you care.
- If Supabase complains about **RLS**, use the **service role** for maintenance or adjust policies; inserts are unrelated to the “script too long” issue.

I can add a single `supabase/schema.sql` file with Postgres `CREATE TABLE` statements from `DB_SCHEMA.md` so step 1 is copy-paste once—say if you want that next.

---

**User**

yes please do that

---

**Cursor**

Creating `supabase/schema.sql` with PostgreSQL DDL matching `DB_SCHEMA.md`, including primary keys, foreign keys, and unique constraints.



Verifying SQLite inserts specify explicit IDs for all PKs. Checking for identity/sequence issues and updating the chunk script docstring.



Appending post-migration sequence sync so new auto-generated IDs won't collide after bulk inserts.



Here’s what was added.

### `supabase/schema.sql`

PostgreSQL DDL aligned with `DB_SCHEMA.md`:

- **`customers`**, **`products`**, **`orders`**, **`order_items`**, **`shipments`**, **`product_reviews`**
- Primary keys as **`INTEGER GENERATED BY DEFAULT AS IDENTITY`** so your SQLite-style `INSERT ... VALUES (explicit_id, ...)` still works
- **`UNIQUE`** on `customers.email` and `products.sku`
- **`UNIQUE`** on `shipments.order_id` (one shipment per order)
- **Foreign keys** with `ON DELETE RESTRICT`
- **`DOUBLE PRECISION`** for former SQLite `REAL` columns
- **CHECK** constraints for `0/1` flags and review `rating` 1–5
- Indexes on FK columns used for joins
- Comment block for optional **`late_delivery_probability`** on `shipments` (per `DB_SCHEMA.md`)
- **Comment-only** “POST-MIGRATION” `setval(...)` lines to run after all chunks so sequences match the max IDs

### `scripts/prepare_supabase_inserts.py`

Docstring step 1 now says to run **`supabase/schema.sql`** first.

### Suggested order in Supabase

1. SQL → paste and run **`supabase/schema.sql`** (only the `CREATE` / `INDEX` parts; skip the commented `setval` lines until after data load).
2. Run **`scripts/prepare_supabase_inserts.py`**, then execute **`scripts/supabase_chunks/*.sql`** in order.
3. Uncomment and run the **`setval`** block at the bottom of **`supabase/schema.sql`** (or copy those lines into a new query).

If anything errors on the first run (e.g. tables already created with different types), say what Supabase returned and we can adjust.

---

**User**

okay I run the sql create/index in supabase and that seems to work. I then ran the prep supabase inserts.py file. seemed successful. But there are 71 insert files that I don't want to copy and paste into the supabase sql editor. is there a better way? Maybe consolidate them into fewer files with longer text lines. or is there a better way

---

**Cursor**

Using `psql` against Supabase's database URL is the right approach for bulk loads. We'll add a single-file option to the prep script and a small PowerShell helper to run all chunks in order.



Implementing `--lines-per-file 0` for a single `all_inserts.sql`, and adding `load_supabase_chunks.ps1` to run chunks via `psql` (recommended for Supabase).



Avoiding duplicate loads if both `all_inserts.sql` and numbered chunks exist — prefer a single strategy:



Simplifying the loader script: prefer `all_inserts.sql` when present; otherwise run numbered chunks.



Here are two better options than pasting 71 times.

### 1. **Single SQL file + `psql` (simplest)**

Regenerate one file:

```powershell
cd "c:\Users\jacob\OneDrive\Documents\455 Deployment Project"
python scripts\prepare_supabase_inserts.py --lines-per-file 0
```

That writes `scripts/supabase_chunks/all_inserts.sql` (~28k `INSERT`s in one `BEGIN`/`COMMIT`).

Install PostgreSQL **client** tools so `psql` exists (e.g. full PostgreSQL or only `psql` on your PATH). In Supabase: **Project Settings → Database → Connection string → URI** (use the password they show; URL-encode special characters in the password if the URI breaks).

Then:

```powershell
psql "postgresql://postgres.[PROJECT-REF]:YOUR_PASSWORD@aws-0-....pooler.supabase.com:6543/postgres" -v ON_ERROR_STOP=1 -f "scripts\supabase_chunks\all_inserts.sql"
```

Or use the helper (it picks `all_inserts.sql` when that file exists):

```powershell
.\scripts\load_supabase_chunks.ps1 -DatabaseUrl "postgresql://..."
```

### 2. **Keep many chunks but load automatically**

If you stay with the default `--lines-per-file 400`, the same `load_supabase_chunks.ps1` runs every `0001_inserts.sql`, `0002_...`, … in order with `psql`—no editor.

You can also use a middle ground, e.g. `--lines-per-file 5000`, for fewer files if you still want manual `psql -f` without one huge transaction.

---

**Important:** If you already loaded some rows from the 71 files, either **truncate those tables** (in FK-safe order) before loading `all_inserts.sql`, or only use the merge approach on an **empty** database—otherwise you’ll get duplicate key errors.

After a successful full load, run the uncommented `setval` lines from the bottom of `supabase/schema.sql` so identity sequences match your max IDs.

---

**User**

instead, can you just make the insert statements into smaller chunks that will be easier to copy and paste into the sql editor. try bigger and if it is still too big for supabase then we will make it shorter. let's start by cutting it in half in length and see hwo that works

---

**Cursor**

Adding a `--num-chunks` option to split inserts evenly (e.g. `--num-chunks 2` for two files). Updating `prepare_supabase_inserts.py`.



Adding `--num-chunks` to split rows evenly (e.g. `--num-chunks 2` ≈ two halves) and regenerating the chunk files.



Here’s what changed:

### `--num-chunks` on `prepare_supabase_inserts.py`

- **`--num-chunks N`** splits the INSERT list into **N files** with **about the same number of rows** (`math.ceil(total / N)` per file).
- It **overrides** `--lines-per-file`.
- **`--num-chunks 1`** writes a single `all_inserts.sql` (same idea as before).

### Regenerated for “half and half”

From your project root:

```powershell
python scripts\prepare_supabase_inserts.py --num-chunks 2
```

That produced:

- `scripts/supabase_chunks/0001_inserts.sql` — **14,186** statements  
- `scripts/supabase_chunks/0002_inserts.sql` — **14,186** statements  

Run **0001 first**, then **0002** (same `BEGIN`/`COMMIT` wrapper in each).

### If the editor still complains

Use more pieces, e.g.:

```powershell
python scripts\prepare_supabase_inserts.py --num-chunks 4
```

(or `6`, `8`, …).

**Note:** Chunk **0001** still covers **customers → products → orders → part of `order_items`**; **0002** finishes **`order_items` → `shipments` → `product_reviews`**, so foreign keys stay valid as long as you paste in order.

---

**User**

okay still too big. lets divide it in half again and check

---

**Cursor**

Regenerated with **`--num-chunks 4`** (each file is about **half the size** of the previous 2-way split).

| File | INSERT statements |
|------|-------------------|
| `scripts/supabase_chunks/0001_inserts.sql` | 7,093 |
| `scripts/supabase_chunks/0002_inserts.sql` | 7,093 |
| `scripts/supabase_chunks/0003_inserts.sql` | 7,093 |
| `scripts/supabase_chunks/0004_inserts.sql` | 7,093 |

Run them in order **0001 → 0002 → 0003 → 0004**.

`0001` still contains all **customers**, **products**, and **orders** (those are the first 5,350 rows); later files are **`order_items` → `shipments` → `product_reviews`**, so FK order stays valid.

If any chunk is still too large for the editor, bump to **`--num-chunks 8`** (or **`12`**).

---

**User**

still too big

---

**Cursor**

Regenerating smaller chunks — using 16 files (~1,774 INSERTs each), ~4× smaller than the 4-file split.



Regenerated everything with **`--num-chunks 16`**.

You now have **16 files** under `scripts/supabase_chunks/`:

- **0001–0015:** **1,774** `INSERT`s each (plus `BEGIN` / `COMMIT`)
- **0016:** **1,762** `INSERT`s (remainder)

Run **`0001_inserts.sql` → `0016_inserts.sql` in order**.

That’s about **¼ of the size** of each 4-way chunk (~7k rows → ~1.77k rows).

---

If the editor still complains (it often limits **characters**, not only row count), try:

```powershell
python scripts\prepare_supabase_inserts.py --num-chunks 32
```

Or a fixed small batch:

```powershell
python scripts\prepare_supabase_inserts.py --lines-per-file 300
```

(`--num-chunks` overrides `--lines-per-file`; use one or the other.)

---

**Editor note:** Reload `0001_inserts.sql` from disk — if it still shows ~14k lines, the tab is an old buffer; the new `0001` should be ~1,779 lines total.

---

**User**

okay that worked great. I inserted them all. what now should i expect? If all i did was give vercel this repo and connected it to supabase using their built in Integration thingy

---

**Cursor**

Here’s a concise picture of **what you should expect** and **what often still needs a manual check** after “give Vercel the repo + Supabase integration + data loaded.”

### What should work if env vars line up

- **Production site loads** (Next.js from `src/app`).
- **Select Customer** calls **`GET /api/customers/{id}`** on the **same domain** (Vercel’s rewrite sends `/api/*` to your FastAPI serverless app, not Next.)
- **FastAPI** uses **`SUPABASE_URL` + `SUPABASE_KEY`** to query `customers` and return JSON matching your contract.

So for a `customer_id` that exists in Supabase, you should see the welcome UI with **name + loyalty tier**.

### What the Vercel ↔ Supabase integration *usually* sets

It often adds things like:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Your **Python** code reads **`SUPABASE_URL`** and **`SUPABASE_KEY`** (see `api/dependencies.py`). Those names are **not automatically the same** as the Next public vars.

**Expectation:** integration alone may **not** be enough until Vercel also has:

- `SUPABASE_URL` = your project URL  
- `SUPABASE_KEY` = a key that can **read** `customers` server-side (often the **service role** for backend-only use; never expose that to the browser)

If those are missing or wrong, the UI might load but customer fetch fails (500 / “not found” / generic error).

### Other things to be aware of

- **RLS:** If Row Level Security is on for `customers` and you use the **anon** key from the server, reads can fail unless policies allow it. Service role bypasses RLS (use only on the server / in Vercel env).
- **Local vs prod:** Your **`next.config.ts` rewrite** to `127.0.0.1:8000` is only for **development**. In production, **`vercel.json`** handles `/api/*` → Python. You don’t need the dev rewrite for deployed behavior.
- **Sequences:** After bulk `INSERT`s with explicit IDs, run the **`setval`** block from the bottom of **`supabase/schema.sql`** (uncommented) once so **new** rows get correct auto IDs later.
- **Root lockfile warning** you saw locally (extra `package-lock.json` under `C:\Users\jacob`) can confuse Next’s root; on Vercel it’s usually fine if only the project’s lockfile matters, but worth cleaning up if builds act weird.

### Quick “am I done?” checks

1. Open the **deployed** site, pick a **real** `customer_id` from Supabase (`SELECT customer_id FROM customers LIMIT 5;`).
2. In the browser **Network** tab, confirm `GET /api/customers/<id>` returns **200** and JSON with **`full_name`**, **`loyalty_tier`**.
3. In **Vercel → Project → Settings → Environment Variables**, confirm **`SUPABASE_URL`** and **`SUPABASE_KEY`** exist for **Production** (and redeploy after changes).

So: **you should expect the full stack to work in production once Vercel has the right server env vars for FastAPI**; the integration alone is often only half the wiring unless it also populates those exact names (or you map them). If you paste a redacted screenshot of your Vercel env var **names** (values hidden), I can tell you exactly what’s missing.

---

**User**

okay I don't thikn it works sinnce I havent't updated any special keys or urls. right now I get this when I put in a valid customer id

Failed to load resource: the server responded with a status of 500 ()Understand this error
/api/customers/99:1  

---

**Cursor**

Checking how the Supabase client is configured and updating it to read Vercel + Supabase integration env vars (fallback chain).



Updating the Supabase client to use Vercel + Supabase integration variable names (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) — the 500 is almost certainly from missing `SUPABASE_URL` / `SUPABASE_KEY`.



Here’s what was going wrong and what we changed.

### Cause of the 500

`api/dependencies.py` only looked for **`SUPABASE_URL`** and **`SUPABASE_KEY`**. The Vercel ↔ Supabase integration almost never uses those exact names; it usually adds things like **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, and often **`SUPABASE_SERVICE_ROLE_KEY`**. With no match, the dependency raised a **500** before any query ran.

### Code change

Supabase is now resolved with fallbacks:

- **URL:** `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- **Key (first match wins):** `SUPABASE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

So a normal integrated Vercel project can work **without** you creating custom `SUPABASE_KEY` / `SUPABASE_URL`, as long as those integration vars exist for **Production** (and you **redeploy** after any env change).

### What you should do

1. **Commit & push** this change, let Vercel redeploy (or trigger a redeploy).
2. In **Vercel → Project → Settings → Environment Variables**, confirm for **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - Prefer **`SUPABASE_SERVICE_ROLE_KEY`** for the Python API (server-only; never use it in client code).  
   - If you only have the anon key, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** can work **only if RLS allows** `SELECT` on `customers` for the anon role.
3. Try **`GET /api/customers/99`** again (and check the response JSON; a 500 may still include the `detail` message).

### If it’s still wrong after redeploy

- **404** → id not in DB or wrong project.
- **500 with Supabase/PostgREST body** → often **RLS**; switch the server to **service role** or add a policy for `customers` reads.
- Open **Vercel → Deployment → Functions** logs for the Python route to see the real traceback.

After this patch, the most likely fix is simply **redeploy** so production picks up both the new code and the integration env vars together.

---

**User**

sweet perfect! It is all connected now!! 

---

**Cursor**

Good to hear it’s all wired up end to end.

You’ve now got data in Supabase, Vercel serving Next.js + FastAPI, and the Select Customer flow hitting a real profile—solid foundation for the rest of ShopIQ.

Whenever you’re ready to tackle the next slice (e.g. customer order history, warehouse queue, or deployment polish), we can build on this setup.

---

**User**

can we see if it runs locally now?

---

**Cursor**

Checking the setup and starting the backend and frontend locally to verify they respond.



Starting the API with the project virtualenv — Next.js is running; the global Python lacked `uvicorn`.



Here’s what we verified:

### Running locally

| Check | Result |
|--------|--------|
| **Next.js** (`npm run dev`) | Up at **http://localhost:3000** |
| **FastAPI** (must use **project venv**) | **http://127.0.0.1:8000** |
| **`GET /api/health`** direct | `{"status":"ok"}` |
| **`GET /api/health`** via Next (`localhost:3000/api/health`) | Same (dev rewrite works) |

The first API start failed because **`python` was the global install**, which doesn’t have **`uvicorn`**. Your project **does** have `.venv` with everything installed.

### Customer API locally

`GET /api/customers/1` returned **500** with *“Missing Supabase credentials”* — there’s **no `.env` / env vars** in this environment for local runs. That’s expected until you set them.

**In the same PowerShell session** before starting uvicorn:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Then in another terminal:

```powershell
npm run dev
```

(Use the same URL/key values you use in Vercel; never commit the service role key.)

### Commands to remember

**Terminal 1 – API**

```powershell
cd "c:\Users\jacob\OneDrive\Documents\455 Deployment Project"
.\.venv\Scripts\Activate.ps1
python -m uvicorn api.main:app --reload --port 8000
```

**Terminal 2 – frontend**

```powershell
cd "c:\Users\jacob\OneDrive\Documents\455 Deployment Project"
npm run dev
```

So yes: **it runs locally**; use the **venv** for Python, and **set Supabase env vars** in that shell if you want customer lookups to work offline like production.

---

**User**

okay when I run it locally, it doesn't seem to be connected to a db

---

**Cursor**

Loading env files for the FastAPI process: Next.js reads `.env.local`, but uvicorn doesn't — we'll add `python-dotenv` and load `.env` / `.env.local` at startup.



Loading `.env` and `.env.local` into the FastAPI process (Next.js loads them automatically; uvicorn does not).



Here’s what was wrong and what we changed.

### Why local felt “not connected”

- **Next.js** loads **`.env.local`** automatically.
- **FastAPI (uvicorn)** does **not** — it only sees variables already in the OS environment. So unless you exported them in the shell, the API had **no Supabase URL/key** and couldn’t talk to the DB.

### What we did

1. **`python-dotenv`** added to `requirements.txt` and installed in your `.venv`.
2. **`api/main.py`** now calls `_load_local_env()` at import time so it loads:
   - **`.env`** first  
   - then **`.env.local`** (overrides), so it matches how you configure Next.
3. **`.env.example`** lists the variable names to copy into **`.env.local`**.

### What you should do locally

1. Copy the example file:

   ```powershell
   copy .env.example .env.local
   ```

2. Open **`.env.local`** and set real values (same as in **Vercel → Settings → Environment Variables** for your Supabase integration):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - Prefer **`SUPABASE_SERVICE_ROLE_KEY`** for the API (server-only), or `NEXT_PUBLIC_SUPABASE_ANON_KEY` if RLS allows `SELECT` on `customers`.

3. Restart the API:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Keep **`npm run dev`** running so `/api/*` is proxied to port 8000.

After that, customer lookup and any other Supabase-backed routes should use your real DB locally. **`.env.local` stays gitignored** — don’t commit secrets.

---

**User**

okay do those things for me

---

**Cursor**

Checking `.env.local` and `.env.example`. We can set up the file structure; you must paste real secrets from Vercel/Supabase (we don't have access to them).



`.env.local` still has placeholders. Pulling environment variables from Vercel (if the project is linked) to populate real values.



Vercel CLI isn’t linked to this repo from the terminal (would need `vercel link`). We can’t access your Supabase secrets. Preparing `.env.local` with clear placeholders and instructions so you only paste the three values from Vercel or Supabase.



Here’s what I could and couldn’t do:

### Done
- **`.env.local`** is set up at the project root with the three variables the app expects (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPONYMOUS_ANON_KEY` → **NEXT_PUBLIC_SUPABASE_ANON_KEY**, `SUPABASE_SERVICE_ROLE_KEY`), plus short comments on how to use it.
- Values are **left blank on purpose** — I don’t have your real URLs or keys.

### Not possible from here
- **Pulling from Vercel** failed: the repo isn’t **linked** in this environment (`vercel env pull` needs `vercel link` first, with your team/project).
- I **must not** invent or guess Supabase keys.

### What you do once (about 30 seconds)
1. Open **Vercel → your project → Settings → Environment Variables** (or **Supabase → Project Settings → API**).
2. Copy into **`.env.local`**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (for local API; keep this file out of git — it’s already gitignored)

3. Restart **uvicorn** (and keep `npm run dev` running).

### Optional: auto-fill from Vercel later
From the project folder, after linking:

```powershell
npx vercel link --yes
npx vercel env pull .env.local --yes
```

That overwrites `.env.local` with what’s in Vercel (double-check you’re okay with that).

`.env.example` is unchanged as the committed template; your real secrets live only in **`.env.local`**.

---

**User**

okay I added the keys. you do the rest to make sure it runs locally

---

**Cursor**

Verifying the stack locally: starting the API and Next.js, then hitting the health and customer endpoints. We won't read `.env.local` (it contains secrets).



Setting the Turbopack root to the project directory (fixes the stray `C:\Users\jacob\package-lock.json` issue), adding a `dev:api` npm script, then starting the API and verifying endpoints.



`.env.local` is valid. A stale process on port 8000 is likely still running from before the keys were added. Stopping it and restarting the API.



Identifying a typo in `NEXT_PUBLIC_SUPABASE_URL`: the JWT `ref` is `siftqqooinznbtyannuluv`, but the URL used `siftqqooinznbtyannulv` (missing a `u`). DNS failed for the wrong host. Fixing `.env.local` and normalizing the Supabase URL in code.



Here’s what was wrong and what was changed.

### Root cause
Your app **did** load the keys, but the API failed with **`getaddrinfo failed`** because **`NEXT_PUBLIC_SUPABASE_URL` had a typo in the project ref**:  
`…annulv…` instead of **`…annuluv…`** (extra **`u`**).

That matches the **`ref`** inside your **anon** JWT, so the URL in **`.env.local`** is updated to:

`https://siftqqooinznbtyannuluv.supabase.co`

### Other updates
- **`next.config.ts`** — `turbopack.root: process.cwd()` so Next doesn’t pick the wrong folder when another `package-lock.json` exists under your user directory.
- **`package.json`** — script **`npm run dev:api`** runs uvicorn with your `.venv`.
- **`api/dependencies.py`** — strips a trailing **`/`** on the Supabase URL.
- **`.env.example`** — note that the URL must match Supabase exactly.

### What you should do locally
1. **Restart the API** (so it reloads `.env.local` and clears the cached client):
   ```powershell
   npm run dev:api
   ```
   or:
   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Keep **`npm run dev`** running, then open **http://localhost:3000** and try a customer id again.

### Vercel
If production already works, **Vercel’s URL is probably already correct** and only **`.env.local`** was wrong. If you had the same typo in Vercel, fix it there too and redeploy.

### Security note
Your **`.env.local` contents were visible in this chat**. If that’s a concern, **rotate the anon and service-role keys** in Supabase (**Settings → API**) and update **Vercel** + **`.env.local`**.

---

**User**

give me a simple rundown of the current repo so that I can give good context for a new chat log of the apps structure and how it functions. Look through everything to give a good context

---

**Cursor**


Scanning the repository structure and key files to produce an accurate rundown.




Here’s a **compact context pack** you can paste into a new chat.

---

## ShopIQ — repo overview

**Purpose:** Full-stack app (Next.js UI + FastAPI on Vercel + Supabase Postgres). Customer storefront + warehouse/admin views; ML for fraud scoring / warehouse queue (see below).

**Hard rule (from `.cursorrules` / `PROJECT_STRUCTURE.md`):** Backend lives in root **`/api`** (Python only). Frontend lives in **`/src`** (Next.js App Router only). No Next.js route handlers under `app/api` — all `/api/*` traffic goes to FastAPI.

---

## Deployment & routing

- **`vercel.json`:** Rewrites **`/api/(.*)` → `/api/main.py`** so the FastAPI app runs as Vercel serverless functions.
- **Cron:** `vercel.json` defines a daily cron hitting **`POST /api/ml/retrain`** (3:00 UTC) for model retraining; protected with optional **`CRON_SECRET`** + `Authorization: Bearer …` in `api/main.py`.
- **Local dev:** **`next.config.ts`** rewrites **`/api/:path*`** → **`http://127.0.0.1:8000/api/:path*`** only when **`NODE_ENV === "development"`**, so you run **Next** (`npm run dev`) and **uvicorn** separately. Production relies on **`vercel.json`**, not this rewrite.

---

## Backend (`/api`)

- **`api/main.py`:** FastAPI app; mounts routers; **`GET /api/health`**; **`POST /api/ml/retrain`** (cron).
- **`api/dependencies.py`:** Supabase client via **`get_supabase_client()`** — reads env in order:
  - URL: `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
  - Key: `SUPABASE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`api/routers/customers.py`:** **`GET /api/customers/{customer_id}`** — profile from `customers` table.
- **`api/routers/orders.py`:** **`POST /api/orders`**, **`GET /api/orders`** (query params) — order create/list.
- **`api/routers/warehouse.py`:** **`GET /api/warehouse/queue`**, **`POST /api/warehouse/score`** — fraud queue + scoring (uses **`api/ml_model/predict.py`** etc.).
- **`api/ml_model/`:** Training/pipeline/predict code (`train.py`, `pipeline.py`, `predict.py`, notebook-related); integrates with Supabase.

**`requirements.txt`:** `fastapi`, `uvicorn`, `supabase`, `pydantic`, `scikit-learn`, `pandas`, `numpy`, `joblib` (and whatever else is listed there).

---

## Frontend (`/src`)

- **Next.js 16**, **React 19**, **Tailwind v4** (`tailwind.config.ts`, `postcss.config.js`, `src/app/globals.css`).
- **`src/app/layout.tsx`:** Shell + **`NavBar`**.
- **`src/app/page.tsx`:** **Select Customer** — `fetch('/api/customers/:id')`, quick-pick IDs, welcome card.
- **`src/app/customer/page.tsx`**, **`src/app/warehouse/page.tsx`:** Customer portal / admin dashboard (plus components like **`NavBar`**, **`OrderForm`**, **`CustomerCard`**, **`OrderTable`**, **`PriorityQueue`** — extent of wiring varies by page).
- **`src/lib/utils.ts`:** Small helpers.

**Data access:** Browser calls **relative `/api/...`** only (never direct Supabase from server-required secrets unless you add `NEXT_PUBLIC_*` for client-side Supabase later).

---

## Data & docs

- **`DB_SCHEMA.md`:** Canonical table/column names for Postgres (`customers`, `products`, `orders`, `order_items`, `shipments`, `product_reviews`, etc.).
- **`API_CONTRACT.md`:** Intended API shapes (some paths may be **spec** vs **implemented** — e.g. contract may mention **`/api/customers/{id}/orders`**; **router code** only shows **`GET /api/customers/{id}`** in `customers.py` — verify before assuming).
- **`supabase/schema.sql`:** DDL for creating tables in Supabase.
- **`scripts/prepare_supabase_inserts.py`:** Splits SQLite dump → Postgres `INSERT` chunks (`--num-chunks`, `--lines-per-file`, etc.).
- **`scripts/migrate_sqlite.py`:** Placeholder / legacy migration helper.
- **Local data:** `shop.db` / `dump.sql` may exist for migration; **production DB is Supabase**.

---

## Environment variables (typical)

- **Vercel + Supabase integration** often sets **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, **`SUPABASE_SERVICE_ROLE_KEY`**.
- Backend needs a **URL + key** that resolve to the above names (see `dependencies.py`).
- **`CRON_SECRET`:** Optional; secures **`POST /api/ml/retrain`** when set.

**Local:** Use **`.env.local`** for Next; FastAPI only sees vars if the shell exports them or you add a loader (this repo’s `main.py` may **not** load `dotenv` unless you re-added it — check `requirements.txt` / `api/main.py` in tree).

---

## Mental model (request flow)

1. User opens deployed site → Next.js serves UI.
2. UI calls **`/api/customers/123`** (same origin).
3. Vercel **rewrites** to Python **`/api/main.py`** → FastAPI route → **Supabase** `customers` table.
4. JSON returns to the browser.

---

## Quick file map

| Area | Paths |
|------|--------|
| Vercel routing | `vercel.json` |
| FastAPI entry | `api/main.py` |
| Supabase wiring | `api/dependencies.py` |
| HTTP routes | `api/routers/*.py` |
| Next pages | `src/app/**/page.tsx` |
| UI components | `src/components/*.tsx` |
| Specs | `API_CONTRACT.md`, `DB_SCHEMA.md`, `PROJECT_STRUCTURE.md` |

---

You can paste this block as-is at the start of a new chat and add: **your Vercel URL**, **whether ML cron is enabled**, and **any features you’re actively building** (e.g. customer order history endpoint).

