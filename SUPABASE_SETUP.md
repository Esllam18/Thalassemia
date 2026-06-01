# SUPABASE SETUP
## Database, Authentication, and Storage Documentation

---

## Project Details

| Setting | Value |
|---------|-------|
| Project Name | thalassemia-detection |
| Project ID | gxxdmovgkjiugfahzcgc |
| Region | eu-central-1 |
| Supabase URL | https://gxxdmovgkjiugfahzcgc.supabase.co |

---

## Database Tables

### Table: `profiles`
Stores one row per registered user. Created automatically when a user signs up.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Links to `auth.users.id` |
| `email` | TEXT | User's email (unique) |
| `full_name` | TEXT | Display name |
| `role` | TEXT | `'patient'`, `'doctor'`, or `'admin'` (default: `'patient'`) |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Auto-updated on every change |

**How it's populated:** A database trigger (`on_auth_user_created`) automatically inserts a row when Supabase Auth creates a new user. You never insert into this table directly from the app.

---

### Table: `predictions`
Every AI prediction result is saved here.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | Links to `profiles.id` |
| `hgb` | NUMERIC | Hemoglobin value entered |
| `mcv` | NUMERIC | MCV value |
| `mch` | NUMERIC | MCH value |
| `rbc` | NUMERIC | RBC value |
| `mentzer_index` | NUMERIC | Computed: `mcv / rbc` |
| `shine_lal` | NUMERIC | Computed: `(mcv² × mch) / 100` |
| `diagnosis` | TEXT | AI prediction result (e.g., "Beta-Thalassemia Minor") |
| `confidence` | NUMERIC | Model confidence (0.0–1.0) |
| `thalassemia_score` | SMALLINT | Risk score 1–10 |
| `recommendation` | TEXT | Clinical recommendation text |
| `explanation` | TEXT | Explanation of the result |
| `input_method` | TEXT | `'manual'`, `'file'`, or `'image'` |
| `report_file_path` | TEXT | Optional file path in Supabase Storage |
| `created_at` | TIMESTAMPTZ | When prediction was made |

---

### Table: `notifications`
For future use. Stores alerts for users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | Links to `profiles.id` |
| `title` | TEXT | Notification title |
| `body` | TEXT | Notification body |
| `is_read` | BOOLEAN | Read status (default: false) |
| `created_at` | TIMESTAMPTZ | When created |

---

### View: `user_statistics`
A pre-computed view used for the dashboard stats. Returns one row per user.

| Column | Description |
|--------|-------------|
| `user_id` | User ID |
| `total_predictions` | Total count |
| `last_prediction_at` | Most recent prediction time |
| `avg_confidence` | Average AI confidence |
| `avg_score` | Average thalassemia score |
| `normal_count` | Predictions with score ≤ 2 |
| `borderline_count` | Predictions with score 3–4 |
| `possible_count` | Predictions with score 5–6 |
| `high_risk_count` | Predictions with score ≥ 7 |

**Access:** Read using `db.predictions.getStats(userId)` in the app.

---

## Row Level Security (RLS)

RLS ensures users can only see their own data. These policies are already set up.

### profiles policies
| Policy | What it does |
|--------|-------------|
| `profiles: users read own` | User can SELECT their own row |
| `profiles: users update own` | User can UPDATE their own row |
| `profiles: admins read all` | Admin can SELECT all rows |

### predictions policies
| Policy | What it does |
|--------|-------------|
| `predictions: users read own` | User can SELECT their own predictions |
| `predictions: users insert own` | User can INSERT predictions for themselves |
| `predictions: doctors read all` | Doctors/admins can SELECT all predictions |

### notifications policies
| Policy | What it does |
|--------|-------------|
| `notifications: users read own` | User can SELECT their own notifications |
| `notifications: users update own` | User can mark notifications as read |

---

## Authentication

### Configuration
- **Provider:** Email + Password (no OAuth currently)
- **Email confirmation:** OFF (users are signed in immediately after registration)
- **Site URL:** `http://localhost:8088` (update this for production)
- **Redirect URLs:** `http://localhost:8088/**`

### Auth Flow
```
1. User submits register form
   → supabase.auth.signUp({ email, password, options: { data: { full_name } } })
   → Supabase creates auth.users row
   → Database trigger creates profiles row automatically
   → User is signed in immediately (no email confirmation)
   → App redirects to /dashboard/index.html

2. User submits login form
   → supabase.auth.signInWithPassword({ email, password })
   → Supabase returns session token
   → App stores session (Supabase handles this in localStorage)
   → App redirects to /dashboard/index.html

3. User visits any dashboard page
   → requireAuth() calls supabase.auth.getSession()
   → If no session → redirect to /auth/login.html
   → If session valid → page loads normally
```

### Updating Auth Settings for Production
When you deploy to a real domain:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Change **Site URL** to your production URL: `https://yourdomain.com`
3. Add to **Redirect URLs**: `https://yourdomain.com/**`
4. Save changes

---

## Storage Buckets

Two buckets exist for file uploads:

| Bucket | Purpose | Max Size |
|--------|---------|----------|
| `lab-reports` | Single lab report images | 50 MB |
| `batch-uploads` | CSV/Excel files for batch processing | 50 MB |

### File Path Convention
All files must be stored as: `{user_id}/{filename}`

This allows the storage policies to ensure each user can only access their own files.

### Storage Policies
Both buckets have these policies:
- Users can **upload** files to their own folder only
- Users can **read** files from their own folder only
- Users can **delete** their own files
- Doctors and admins can **read** all files

---

## Running the SQL Schema

If you need to set up a fresh Supabase project from scratch:

1. Go to Supabase Dashboard → SQL Editor
2. Run the files in this order:
   1. `schema_1_tables.sql` — Creates tables, triggers, RLS policies
   2. `schema_2_storage.sql` — Adds storage bucket policies and views
   3. `schema_3_fixes.sql` — Applies security fixes (run if you get permission errors)

---

## Useful Queries

Run these in the Supabase SQL Editor to inspect your data:

```sql
-- See all users and their prediction counts
SELECT p.email, p.full_name, p.role, COUNT(pr.id) as total
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id ORDER BY total DESC;

-- See all predictions for a specific user
SELECT diagnosis, thalassemia_score, confidence, created_at
FROM predictions
WHERE user_id = 'PASTE_USER_ID_HERE'
ORDER BY created_at DESC;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```
