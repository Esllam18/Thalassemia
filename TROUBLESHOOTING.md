# TROUBLESHOOTING GUIDE
## Common Errors and How to Fix Them

---

## Authentication Errors

### "Incorrect email or password"
- Double-check you're using the email and password you registered with
- Passwords are case-sensitive
- If you forgot your password, you need to reset it via Supabase (there is no "forgot password" UI yet — use the Supabase Dashboard)

### "Please confirm your email before signing in"
- If email confirmation is ON in your Supabase project, you need to confirm via email
- To turn it OFF: Supabase Dashboard → Authentication → Providers → Email → Disable "Confirm email"

### After login, nothing happens (no redirect)
- Open browser DevTools (F12) → Console tab
- Look for red error messages
- Common cause: wrong Supabase URL or key in `js/config.js`

### "Invalid API key" or 401 errors in the console
- Open `js/config.js`
- Make sure `SUPABASE_ANON_KEY` is the **anon/public** key, not the **service_role** key
- The anon key starts with `eyJ` and is safe to use in the browser
- The service key is secret and must never go in frontend code

---

## Supabase Connection Errors

### "TypeError: Cannot read property 'createClient' of undefined"
- The Supabase SDK CDN script failed to load
- Check your internet connection
- Make sure this script tag appears before `js/supabase.js` in your HTML:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  ```

### "permission denied for table predictions"
- RLS policies are missing or wrong
- Run the SQL from `schema_3_fixes.sql` in Supabase SQL Editor
- Make sure the user is logged in before reading data

### Dashboard shows skeletons forever (data never loads)
- Open browser DevTools → Network tab
- Look for failed requests to `supabase.co`
- If you see 401/403 errors: check your anon key
- If you see CORS errors: your Supabase URL may be wrong

### "Failed to load user_statistics"
- The `user_statistics` view may not have the correct security settings
- Run this in Supabase SQL Editor:
  ```sql
  GRANT SELECT ON public.user_statistics TO authenticated;
  ```

---

## API / Prediction Errors

### "Cannot reach the AI service"
- The Railway API is down or your internet is off
- Check if the API is running: visit `https://thalassemia-api-production-1e64.up.railway.app/health` in your browser
- You should see `{"status":"ok",...}`
- If you see a timeout or error, the Railway service may need to be restarted

### "AI service is temporarily unavailable (503)"
- The ML model files (`*.pkl`) failed to load at startup
- Go to Railway Dashboard → your project → View logs
- Look for "Model file not found" error
- The `.pkl` files must be in the project root when deployed

### "Invalid values. Please check your CBC data (422)"
- One of your input values is outside the valid range
- Check ranges:
  - HGB: 3–25
  - MCV: 40–130
  - MCH: 10–50
  - RBC: 1–8 (and must be > 0)

### "File type not supported (415)"
- For file upload: only `.csv`, `.xlsx`, `.xls` are accepted
- For image upload: only `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`

### "File too large (413)"
- Maximum file size is 10 MB
- Compress or split your file

### "Too many requests (429)"
- You've hit the rate limit
- Wait 1 minute and try again
- Limits: Manual = 10/min, File = 5/min, Image = 3/min

### Image OCR returns "partial" status
- The image quality may be poor
- Try: better lighting, higher resolution, no blur
- Or switch to Manual tab and type the values yourself

---

## Browser / Local Development Errors

### Login works but then redirects to the same page
- This happens when `window.location.href` paths don't match your file structure
- Make sure the redirect paths in `auth.js` match your folder structure
- If you're using a subfolder, update the paths accordingly

### Opening `index.html` directly (file:// protocol) and Supabase calls fail
- Browsers block some requests when using `file://` protocol
- Use a local server instead: run `npx serve .` in the terminal
- Access via `http://localhost:3000` (not by double-clicking the file)

### "CORS error" in the console
- This means a server is blocking requests from your browser
- For the Supabase API: make sure your Site URL and Redirect URLs are set correctly in Authentication settings
- For the Railway API: the API already allows all origins (`*`)

### Page shows unstyled (no CSS)
- CSS files are not loading
- Check that the `css/` folder exists and has all files
- Check file paths in the `<link>` tags — they should match the folder structure

---

## Deployment Errors

### Netlify / Vercel: "Page not found" on direct URL visits
- This is a SPA routing issue
- Since this is not a SPA (each page is a separate HTML file), links should work directly
- Make sure all HTML files were uploaded/deployed

### After deploying, login doesn't work
- You must update Supabase Auth settings for your production URL:
  1. Supabase → Authentication → URL Configuration
  2. Set Site URL to `https://your-domain.com`
  3. Add Redirect URL: `https://your-domain.com/**`

### API calls fail in production ("mixed content" warning)
- If your site is HTTPS and the API is HTTP, browsers block the request
- The Railway API already uses HTTPS (`https://...railway.app`) — this should not happen
- Make sure you're using the full HTTPS URL in `js/config.js`

---

## Development Commands

### `npx serve .` gives "command not found"
- Node.js is not installed
- Install from: https://nodejs.org (choose LTS version)
- Verify: run `node --version` in terminal

### Terminal says "permission denied"
- On Mac/Linux, add `sudo` before the command: `sudo npx serve .`
- Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors

---

## Getting More Debug Information

When something goes wrong:

1. **Open DevTools:** Press F12 (or Cmd+Option+I on Mac)
2. **Console tab:** Shows JavaScript errors in red
3. **Network tab:** Shows all HTTP requests — look for failed ones (red)
4. **Application tab → Local Storage:** Shows the Supabase session token

If you see an error and need help, share:
- The error message from the Console tab
- The failing request URL from the Network tab
- Which page and action caused the error
