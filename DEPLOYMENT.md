# DEPLOYMENT GUIDE
## How to Deploy ThalassemiaAI to Production

---

## Before You Deploy

Checklist:
- [ ] `js/config.js` has your real Supabase anon key
- [ ] `js/config.js` has the correct `API_URL` (Railway production URL)
- [ ] Supabase Auth Site URL is updated to your production domain
- [ ] Supabase Auth Redirect URLs include your production domain

---

## Option 1 — Netlify (Recommended — Free)

Netlify is the easiest way to host a static website for free.

### Method A — Drag and Drop (Simplest)

1. Go to: https://app.netlify.com
2. Sign up for a free account
3. On your dashboard, find the "Deploy manually" section
4. Drag your entire `thalassemia-app` folder into the browser window
5. Netlify gives you a URL like `https://random-name-123.netlify.app`
6. That's it — your site is live!

### Method B — GitHub + Auto-deploy (Recommended for ongoing development)

1. Create a GitHub account: https://github.com
2. Create a new repository (click the "+" button)
3. Upload your project files to the repository
4. Go to Netlify → New site → Import an existing project
5. Connect your GitHub account and select the repository
6. Leave all build settings empty (no build command needed)
7. Set **Publish directory** to: `.` (just a dot, meaning the root folder)
8. Click Deploy

Every time you push new code to GitHub, Netlify will automatically redeploy.

### Custom Domain on Netlify
1. Go to Site settings → Domain management
2. Click Add custom domain
3. Follow the instructions to point your domain's DNS to Netlify

---

## Option 2 — Vercel (Also Free)

Very similar to Netlify.

1. Go to: https://vercel.com
2. Sign up and connect your GitHub
3. Import your repository
4. Framework: select **Other** (not Next.js, not React)
5. Build command: leave empty
6. Output directory: `.`
7. Click Deploy

---

## Option 3 — GitHub Pages (Free)

If your code is already on GitHub:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under Source, select **main branch** → **/ (root)**
4. Click Save
5. Your site will be at: `https://yourusername.github.io/thalassemia-app`

**Limitation:** The URL will include your GitHub username and repository name, not a custom domain (unless you configure DNS).

---

## After Deploying: Update Supabase

This is **required** — otherwise login will not work on your production site.

1. Copy your production URL (e.g., `https://my-app.netlify.app`)
2. Go to: Supabase Dashboard → Authentication → URL Configuration
3. Set **Site URL**: `https://my-app.netlify.app`
4. Under **Redirect URLs**, click **Add URL** and add: `https://my-app.netlify.app/**`
5. Click **Save changes**

---

## Environment Variables

This project uses `js/config.js` instead of a `.env` file, because there is no build step.

However, the values in `js/config.js` are **visible in the browser** (because they're in JavaScript). This is fine for the **Supabase anon key** — it is designed to be public and is protected by Row Level Security.

**Never put the Supabase service_role key in `js/config.js`** — that key has admin access and must stay secret.

---

## Deploying the Railway API

The Railway API (`thalassemia-api`) is already deployed. You don't need to redeploy it unless you change the Python code.

If you need to redeploy:
1. Make changes to `main.py` or other files
2. Push to the GitHub repo connected to Railway (`https://github.com/Esllam18/thalassemia-api`)
3. Railway automatically redeploys when you push to the main branch

### Railway Environment Variables
These are set in Railway → Variables:
| Variable | Value | Description |
|----------|-------|-------------|
| `ALLOWED_ORIGINS` | Your frontend URLs | Comma-separated list |
| `MODEL_PATH` | `thalassemia_expert_model.pkl` | ML model file |
| `ENCODER_PATH` | `label_encoder.pkl` | Label encoder file |
| `MCV_NORMAL_THRESHOLD` | `81.0` | Override threshold |
| `MAX_UPLOAD_BYTES` | `10485760` | 10 MB |
| `HOST` | `0.0.0.0` | Listen on all interfaces |
| `RELOAD` | `false` | Disable hot reload in production |

When you deploy your frontend, add your new domain to `ALLOWED_ORIGINS`:
```
http://localhost:8088,https://my-app.netlify.app
```

---

## Production Checklist

After deploying, test these:

- [ ] Visit the homepage → it loads correctly
- [ ] Click "Get Started" → goes to register page
- [ ] Register a new account → redirects to dashboard
- [ ] Sign out → redirects to homepage
- [ ] Sign back in → dashboard loads
- [ ] Go to New Prediction → enter CBC values → get a result
- [ ] Check History → prediction appears
- [ ] Check Profile → shows name and stats
- [ ] Change password in Settings → works without error
- [ ] Test on mobile screen → layout is responsive
