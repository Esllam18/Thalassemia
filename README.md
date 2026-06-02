# ThalassemiaAI — Web Application

An AI-powered thalassemia detection system that analyzes CBC (Complete Blood Count) values and returns a clinical diagnosis with risk score and recommendations.

## What This App Does

1. User signs in / registers
2. User enters CBC values (HGB, MCV, MCH, RBC) — manually, via file, or via image
3. App sends values to the Railway AI API
4. AI model returns diagnosis, confidence score, and recommendation
5. Result is saved to Supabase database
6. User can view all past predictions in the History page

---

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | HTML5 + CSS3 + Vanilla JS     |
| Auth + DB  | Supabase                      |
| AI API     | FastAPI on Railway            |
| Hosting    | Any static host (Netlify, Vercel, GitHub Pages) |

**No build step required.** Open `index.html` in a browser and it works.

---

## Quick Start

```
1. Clone or unzip the project
2. Open js/config.js
3. Replace YOUR_SUPABASE_ANON_KEY with your real key
4. Open index.html in a browser — done!
```

See `INSTALLATION.md` for detailed step-by-step instructions.

---

## Project Structure

```
thalassemia-app/
├── index.html              ← Landing page
├── css/
│   ├── theme.css           ← Colors, buttons, forms, utilities
│   ├── layout.css          ← Nav, sidebar, dashboard shell
│   ├── home.css            ← Landing page styles
│   ├── auth.css            ← Login/register styles
│   └── dashboard.css       ← All dashboard page styles
├── js/
│   ├── config.js           ← ⭐ Edit this to configure URLs and keys
│   ├── supabase.js         ← Supabase client and database helpers
│   ├── auth.js             ← Auth guards and session helpers
│   ├── utils.js            ← Shared utility functions
│   ├── shell.js            ← Dashboard sidebar / theme logic
│   └── nav.js              ← Landing page nav
├── auth/
│   ├── login.html          ← Sign In page
│   └── register.html       ← Create Account page
└── dashboard/
    ├── index.html          ← Dashboard home (stats)
    ├── predict.html        ← New Prediction (manual/file/image)
    ├── history.html        ← All past predictions
    ├── profile.html        ← View/edit profile
    └── settings.html       ← Password, theme settings
```

---

## Documentation

- `INSTALLATION.md` — Step-by-step setup guide
- `PROJECT_STRUCTURE.md` — Every file explained
- `SUPABASE_SETUP.md` — Database, auth, storage setup
- `API_DOCUMENTATION.md` — Railway API endpoints
- `AI_SYSTEM.md` — How the AI works
- `TROUBLESHOOTING.md` — Common errors and fixes
- `DEPLOYMENT.md` — How to deploy
- `.env.example` — Environment variables reference

---

## Important Notes

- This app is for **clinical support purposes only**
- It is **not a replacement for professional medical advice**
- Always consult a qualified hematologist for diagnosis confirmation
