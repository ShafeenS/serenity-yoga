# Deployment Guide — Render.com (Free Tier)

This guide walks you through deploying Serenity Yoga to Render.com step by step.
The app will auto-seed with sample data and a default organiser account on first boot.

---

## Step 1 — Push your code to GitHub

If you haven't already:

```bash
# In your project folder
git init
git add .
git commit -m "Initial commit"
```

Then go to **github.com**, create a new repository (call it `yoga-booking` or similar),
and follow GitHub's instructions to push. It looks like:

```bash
git remote add origin https://github.com/YOUR-USERNAME/yoga-booking.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Render account

Go to **https://render.com** and sign up (free — you can use your GitHub account).

---

## Step 3 — Create a new Web Service

1. From the Render dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect account"** to link your GitHub, then select your `yoga-booking` repo
3. Fill in the settings:

| Setting | Value |
|---|---|
| **Name** | `serenity-yoga` (or anything you like) |
| **Region** | Europe (Frankfurt) — closest to Scotland |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

4. Scroll down to **"Environment Variables"** and add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | Click **"Generate"** to create a random secret |

5. Click **"Create Web Service"**

---

## Step 4 — Wait for the deploy

Render will install dependencies and start the app. This takes about 2-3 minutes.
You'll see a green **"Live"** badge when it's ready.

Your site will be at: `https://serenity-yoga.onrender.com` (or similar)

---

## Step 5 — Test the deployed app

Visit your URL and check:
- Home page loads with 3 sample courses ✅
- You can register a new account ✅
- Log in as organiser: `organiser@yoga.local` / `organiser123` ✅
- Organiser dashboard works ✅

---

## ⚠️ Important: Free Tier Limitations

**The free tier spins down after 15 minutes of inactivity.** The first request after
that takes ~30 seconds to wake up. This is normal — just warn your marker or
demo the site immediately after visiting it.

**The filesystem resets on every redeploy.** This means any data added after
deployment (new courses, registrations etc.) will be wiped on the next deploy.
The auto-seed recreates the default courses and organiser account automatically.

For a real production app you would use a proper hosted database (MongoDB Atlas,
PostgreSQL etc.) — but for coursework purposes this is fine.

---

## Redeploying after changes

Every time you push to GitHub, Render automatically redeploys:

```bash
git add .
git commit -m "Your change description"
git push
```

---

## Troubleshooting

**Build fails:** Check the Render logs tab. Most common cause is a missing
`npm install` or a syntax error.

**App crashes on start:** Check logs for the error. Usually an env variable
issue — make sure `SESSION_SECRET` and `NODE_ENV` are set.

**"Cannot find module":** You may have forgotten to commit a new file.
Run `git status` to check, then `git add . && git commit && git push`.
