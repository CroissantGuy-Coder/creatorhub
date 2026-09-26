# Deploying CreatorHub — Free Hosting Guide

Stack: Railway (backend, free $5/mo credit) + Vercel (frontend, free forever)

---

## Step 1 — Create a GitHub account and upload your code

GitHub is where you store your code online so Railway and Vercel can pull it.

1. Go to https://github.com and click "Sign up" — it's free
2. Create an account with any username/email
3. After signing in, click the "+" icon top-right → "New repository"
4. Name it: creatorhub
5. Set it to Public
6. Do NOT check "Add README" — leave everything unchecked
7. Click "Create repository"

Now upload your code. Open a terminal in Kiro and run these one at a time:

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git init"
```

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git add ."
```

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git commit -m 'Initial commit'"
```

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git branch -M main"
```

Replace YOUR_GITHUB_USERNAME with your actual GitHub username:
```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git remote add origin https://github.com/YOUR_GITHUB_USERNAME/creatorhub.git"
```

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git push -u origin main"
```

It will ask for your GitHub username and password.
For password — use a Personal Access Token, not your GitHub password.
Get one at: https://github.com/settings/tokens → Generate new token (classic) → check "repo" → copy the token → paste it as your password.

---

## Step 2 — Deploy Backend on Railway

Railway hosts your Node.js API server for free ($5 credit/month, enough for 24/7).

1. Go to https://railway.app and click "Start a New Project"
2. Sign in with GitHub (click "Login with GitHub")
3. Click "Deploy from GitHub repo"
4. Select your "creatorhub" repository
5. Railway will detect it — click "Add service" → "GitHub Repo"
6. When it asks for the root directory, type: backend
7. Click Deploy

### Add environment variables on Railway:

Click your service → "Variables" tab → add each one:

| Variable | Value |
|---|---|
| NODE_ENV | production |
| PORT | 5000 |
| JWT_SECRET | pick_a_long_random_string_here |
| JWT_EXPIRES_IN | 7d |
| ADMIN_SECRET | creatorhub_admin_setup_key |
| FRONTEND_URL | https://your-vercel-app.vercel.app (fill in after Step 3) |
| PAYPAL_CLIENT_ID | (add later when you have PayPal) |
| PAYPAL_CLIENT_SECRET | (add later when you have PayPal) |
| PAYPAL_MODE | sandbox |

### Add a Volume (keeps your database alive):

1. On your Railway project page click "+ New" → "Volume"
2. Attach it to your backend service
3. Set the mount path to: /data
4. Railway will automatically set RAILWAY_VOLUME_MOUNT_PATH=/data

### Get your backend URL:

After deploy, click your service → "Settings" → "Domains" → "Generate Domain"
It gives you something like: https://creatorhub-backend.up.railway.app
Copy this — you need it for Step 3.

---

## Step 3 — Deploy Frontend on Vercel

Vercel hosts your React app completely free, forever.

1. Go to https://vercel.com and click "Sign Up"
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your "creatorhub" repository
5. When it asks for Root Directory → click "Edit" → type: frontend → click Continue
6. Framework Preset will auto-detect as "Vite" — leave it
7. Click "Environment Variables" and add:

| Variable | Value |
|---|---|
| VITE_API_URL | https://your-railway-url.up.railway.app |

(Replace with the Railway URL you copied in Step 2)

8. Click "Deploy"

After deploy, Vercel gives you a URL like: https://creatorhub.vercel.app
Copy this URL.

---

## Step 4 — Connect them together

1. Go back to Railway
2. Open your backend service → Variables tab
3. Update FRONTEND_URL to your Vercel URL (e.g. https://creatorhub.vercel.app)
4. Railway will automatically redeploy

---

## Step 5 — Make yourself admin on the live site

Open a terminal and run (replace YourUsername with your account username):

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Invoke-RestMethod -Uri 'https://your-railway-url.up.railway.app/api/admin/promote' -Method POST -ContentType 'application/json' -Body '{""username"":""YourUsername"",""adminSecret"":""creatorhub_admin_setup_key""}'"
```

---

## Step 6 — Done!

Your site is now live 24/7 at your Vercel URL.

Any time you make changes to your code:
1. Save your files
2. Run the git commands again (add, commit, push)
3. Vercel and Railway automatically redeploy within 1-2 minutes

---

## Updating your code after changes

Run these 3 commands any time you want to push updates:

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git add ."
```

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git commit -m 'Update site'"
```

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub'; git push"
```

---

## Cost Summary

| Service | Cost |
|---|---|
| Vercel (frontend) | Free forever |
| Railway (backend) | Free — $5 credit/month included |
| Railway Volume (database) | ~$0.25/month (tiny, covered by free credit) |
| Total | $0/month |

