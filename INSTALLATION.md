# INSTALLATION GUIDE
## Complete Step-by-Step Setup (No Web Experience Required)

---

## What You Need

This project is a **static website** — it has no server, no build process, and requires no special tools to run locally.

You need:
- A text editor (VS Code recommended — free)
- A web browser (Chrome or Firefox)
- Your Supabase project credentials
- (Optional) Node.js only if you want a local development server

---

## STEP 1 — Get VS Code (Text Editor)

VS Code is free and the best editor for web projects.

1. Go to: https://code.visualstudio.com
2. Click **Download** for your operating system (Windows/Mac/Linux)
3. Install it like any normal app

**What it does:** Lets you open, read, and edit code files with syntax highlighting.

---

## STEP 2 — Open the Project

1. Unzip the project folder if it came as a `.zip`
2. Open VS Code
3. Click **File → Open Folder**
4. Select the `thalassemia-app` folder
5. You will see all files listed in the left panel

---

## STEP 3 — Configure Your Keys

This is the **most important step**. You must tell the app where your Supabase database is.

### 3a. Get your Supabase Anon Key

1. Go to: https://supabase.com/dashboard
2. Click on your project (`thalassemia-detection`)
3. Click **Project Settings** (gear icon, bottom left)
4. Click **API** in the left menu
5. Under **Project API keys**, copy the **anon / public** key (the long string starting with `eyJ...`)

### 3b. Edit config.js

1. In VS Code, open the file: `js/config.js`
2. Find this line:
   ```javascript
   SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
   ```
3. Replace `YOUR_SUPABASE_ANON_KEY` with the key you copied
4. The result should look like:
   ```javascript
   SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   ```
5. Save the file (Ctrl+S / Cmd+S)

**Your Supabase URL is already set** to `https://gxxdmovgkjiugfahzcgc.supabase.co` — only the key needs changing.

---

## STEP 4 — Update Supabase Auth Settings

Your Supabase project needs to allow your app's URL.

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to where your app will be hosted
   - For local testing: `http://localhost:8080`
   - For production: `https://your-domain.com`
3. Under **Redirect URLs**, add the same URL with `/**` at the end:
   - `http://localhost:8080/**`
4. Click **Save changes**

---

## STEP 5 — Run the App Locally

### Option A — No tools needed (simplest)

Just double-click `index.html` — it opens in your browser.

⚠️ **Note:** Some browsers block Supabase calls when opening files directly (`file://` protocol). If login doesn't work, use Option B.

### Option B — With a local server (recommended)

You need Node.js for this. Here's how:

#### Install Node.js

1. Go to: https://nodejs.org
2. Download the **LTS** version (Long Term Support)
3. Install it — click Next through all steps

#### Verify Node.js is installed

Open Terminal (Mac/Linux) or Command Prompt (Windows):
```bash
node --version
```
You should see something like `v20.11.0`. If you do, Node.js is installed.

#### Start the local server

In your terminal, navigate to the project folder:

```bash
# Windows example:
cd C:\Users\YourName\thalassemia-app

# Mac example:
cd /Users/YourName/thalassemia-app
```

Then run:
```bash
npx serve .
```

**What this command does:**
- `npx` — runs a package without installing it permanently
- `serve` — a tiny static file server
- `.` — serve the current folder

You will see output like:
```
   ┌──────────────────────────────┐
   │                              │
   │   Serving!                   │
   │                              │
   │   - Local:   http://localhost:3000  │
   │                              │
   └──────────────────────────────┘
```

Open `http://localhost:3000` in your browser.

**To stop the server:** Press `Ctrl+C` in the terminal.

---

## STEP 6 — Test the App

1. Open the app in your browser
2. Click **Get Started** or navigate to `/auth/register.html`
3. Create a test account
4. Go to **New Prediction** and enter test CBC values:
   - HGB: 8.5
   - MCV: 65
   - MCH: 20
   - RBC: 5.8
5. Click **Analyze**
6. You should see a result within a few seconds

If you see an error, check `TROUBLESHOOTING.md`.

---

## STEP 7 — Deploy for Production

See `DEPLOYMENT.md` for full instructions. The short version:

```bash
# Push to GitHub, then connect to Netlify or Vercel
# They will host the static files automatically — free
```

---

## Environment Variables Reference

See `.env.example` for all configurable values. All configuration lives in `js/config.js`.

---

## Common Commands

| Command | What it does | When to use |
|---------|-------------|-------------|
| `npx serve .` | Starts a local web server | During development |
| `Ctrl+C` | Stops the server | When done |
| `node --version` | Checks Node.js version | To verify installation |

---

## Need Help?

Check `TROUBLESHOOTING.md` for solutions to common problems.
