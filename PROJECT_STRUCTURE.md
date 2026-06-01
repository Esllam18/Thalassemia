# PROJECT STRUCTURE
## Every File and Folder Explained

---

```
thalassemia-app/
│
├── index.html                  ← Landing page (public)
│
├── css/                        ← All styles (CSS only)
│   ├── theme.css               ← Design system: colors, buttons, forms, utilities
│   ├── layout.css              ← App shell: nav, sidebar, topbar, content areas
│   ├── home.css                ← Landing page specific styles
│   ├── auth.css                ← Login and register page styles
│   └── dashboard.css          ← All dashboard page styles (predict, history, etc.)
│
├── js/                         ← All logic (JavaScript only)
│   ├── config.js               ← ⭐ EDIT THIS: Supabase URL, API URL, keys
│   ├── supabase.js             ← Supabase client setup and all database helpers
│   ├── auth.js                 ← Auth guards, getCurrentProfile, signOut
│   ├── utils.js                ← Shared helpers: dates, alerts, risk colors, etc.
│   ├── shell.js                ← Dashboard shell: sidebar toggle, theme, nav active state
│   └── nav.js                  ← Landing page burger menu
│
├── auth/                       ← Authentication pages
│   ├── login.html              ← Sign In page
│   └── register.html           ← Create Account page
│
├── dashboard/                  ← Protected pages (require login)
│   ├── index.html              ← Dashboard home: stats, risk breakdown, recent predictions
│   ├── predict.html            ← New Prediction: manual/file/image tabs
│   ├── history.html            ← All predictions with filters and expandable rows
│   ├── profile.html            ← View/edit profile name, view stats
│   └── settings.html          ← Change password, theme toggle
│
├── README.md                   ← Project overview
├── INSTALLATION.md             ← Beginner setup guide
├── PROJECT_STRUCTURE.md        ← This file
├── SUPABASE_SETUP.md           ← Database and auth documentation
├── API_DOCUMENTATION.md        ← Railway AI API endpoints
├── AI_SYSTEM.md                ← How the AI model works
├── TROUBLESHOOTING.md          ← Common errors and fixes
├── DEPLOYMENT.md               ← How to deploy to production
└── .env.example                ← All configurable environment variables
```

---

## File Details

### `js/config.js` ⭐
The **only file you need to edit** to connect the app to your services.

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://gxxdmovgkjiugfahzcgc.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_KEY_HERE',       // ← Change this
  API_URL: 'https://thalassemia-api-production-1e64.up.railway.app',
};
```

### `js/supabase.js`
Contains the `db` object — a clean API to all Supabase operations:
- `db.auth.signIn(email, password)`
- `db.auth.signUp(email, password, fullName)`
- `db.auth.signOut()`
- `db.auth.getUser()`
- `db.profiles.get(userId)`
- `db.profiles.update(userId, data)`
- `db.predictions.insert(row)`
- `db.predictions.list(userId, options)`
- `db.predictions.getStats(userId)`

**You rarely need to edit this file.** If you add a new database table, add a helper here.

### `js/auth.js`
Three key functions used on every page:
- `requireAuth()` — redirects to login if not signed in
- `requireGuest()` — redirects to dashboard if already signed in
- `getCurrentProfile()` — returns the current user's profile (cached)
- `populateSidebarUser()` — fills the sidebar user info

### `js/utils.js`
Shared helper functions used everywhere:
- `getRiskCategory(score)` — converts score to "Normal", "Borderline", etc.
- `getRiskColor(score)` — returns a CSS color variable for a risk score
- `scoreChip(score)` — returns HTML for a colored risk badge
- `formatDate(iso)` — formats a date string
- `showAlert(containerId, type, message)` — displays an alert box
- `setLoading(btnId, loading, text)` — shows spinner on a button
- `escapeHtml(str)` — prevents XSS attacks
- `getTheme() / setTheme() / toggleTheme()` — theme management
- `apiErrorMessage(err)` — converts API errors to user-friendly text

### `js/shell.js`
Runs on every dashboard page. Handles:
- Mobile sidebar open/close
- Theme toggle button
- Marking the active sidebar item
- Sign out button

### Each dashboard page (HTML files)
Each page is self-contained HTML with:
1. The full sidebar HTML (copied into each page for simplicity)
2. The page content
3. `<script>` tags at the bottom loading shared JS files
4. An inline `<script>` with page-specific logic

---

## What You Can Safely Modify

| File | What to change |
|------|---------------|
| `js/config.js` | API URLs, Supabase keys |
| `css/theme.css` | Colors (`--brand`), fonts, spacing |
| `index.html` | Landing page content |
| Any `dashboard/*.html` | Page content, labels |

## What NOT to Modify

| File | Why |
|------|-----|
| `js/supabase.js` | Unless adding new database tables |
| `js/auth.js` | Security-sensitive code |
| Supabase schema | Only change via SQL Editor, document everything |

---

## How Pages Are Loaded

There is no router. Each `.html` file is a separate page. Navigation is done with `<a href="">` links.

The flow is:
```
user visits /auth/login.html
  → enters credentials
  → JS calls db.auth.signIn()
  → Supabase returns a session
  → JS redirects to /dashboard/index.html
  → shell.js calls requireAuth() — verifies session still valid
  → page loads data from Supabase
  → renders HTML
```

---

## How to Add a New Page

1. Copy `dashboard/history.html`
2. Rename it, e.g., `dashboard/reports.html`
3. Update the `<title>` tag
4. Update the `data-path` on the sidebar item to match the new filename
5. Add a sidebar link: `<a href="reports.html" class="sidebar-item" data-path="reports">...`
6. Write your page logic in the inline `<script>` at the bottom
