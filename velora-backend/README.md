# VELORA — Backend Setup & Deployment Guide

Complete step-by-step guide to go from zero to a fully deployed contact-form backend in under 20 minutes.

---

## Project Structure

```
velora-backend/
├── public/
│   └── index.html          ← Your frontend (served as static)
├── models/
│   └── Contact.js          ← MongoDB schema
├── routes/
│   └── contact.js          ← API route + email logic
├── server.js               ← Express server entry point
├── package.json
├── render.yaml             ← One-click Render.com deploy config
├── .env.example            ← Copy to .env and fill in values
└── .env                    ← YOUR secrets (never commit this)
```

---

## Step 1 — Install dependencies

```bash
npm install
```

---

## Step 2 — Get a free MongoDB Atlas database

1. Go to **https://cloud.mongodb.com** and sign up free
2. Click **"Build a Database"** → choose **M0 Free Tier** → pick any region
3. Set a username and password (save these!)
4. Under "Where would you like to connect from?" choose **"My Local Environment"** and add IP `0.0.0.0/0` (allows all — fine for free tier)
5. Click **"Connect"** → **"Connect your application"**
6. Copy the connection string. It looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority
   ```
7. Add your database name before the `?`:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.abc12.mongodb.net/velora?retryWrites=true&w=majority
   ```
   This is your `MONGODB_URI`.

---

## Step 3 — Get a Gmail App Password

> You need this because Google blocks plain password logins for apps.
> This takes 2 minutes.

1. Go to **https://myaccount.google.com**
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification** and turn it ON (if not already)
4. Go back to **Security** → scroll down → click **"App passwords"**
   (If you don't see this, 2FA isn't enabled yet)
5. Under "Select app" choose **Mail**, under "Select device" choose **Other** → type `VELORA`
6. Click **Generate**
7. Copy the 16-character code (shown once — save it!)
   Example: `abcd efgh ijkl mnop`

This is your `EMAIL_PASS`.

---

## Step 4 — Create your .env file

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.abc12.mongodb.net/velora?retryWrites=true&w=majority
EMAIL_USER=veloradigital07@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
ADMIN_EMAIL=veloradigital07@gmail.com
PORT=3000
```

---

## Step 5 — Run locally

```bash
npm start
```

Open **http://localhost:3000** — your full site is live.

To test: fill in the contact form and hit Send. You should receive:
- An admin notification email at `ADMIN_EMAIL`
- An auto-reply at whatever email you typed in the form

---

## Deploy to Render.com (free, 5 clicks)

1. Push your project to a **GitHub repo**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   # create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/velora-backend.git
   git push -u origin main
   ```
   > Make sure `.env` is in your `.gitignore`! Add it if needed:
   > ```bash
   > echo ".env" >> .gitignore
   > ```

2. Go to **https://render.com** → sign up free with GitHub

3. Click **"New +"** → **"Web Service"**

4. Select your GitHub repo → Render auto-detects `render.yaml`

5. On the next screen, scroll to **"Environment Variables"** and add:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your Atlas connection string |
   | `EMAIL_USER` | veloradigital07@gmail.com |
   | `EMAIL_PASS` | your 16-char app password |
   | `ADMIN_EMAIL` | veloradigital07@gmail.com |

6. Click **"Create Web Service"** — Render builds and deploys automatically.

Your site will be live at `https://velora-backend.onrender.com` (or similar) in ~2 minutes.

---

## Deploy to Railway.app (alternative)

1. Go to **https://railway.app** → sign up free with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"** → select your repo
3. Click **"Variables"** tab and add the same 4 environment variables above
4. Railway auto-detects `npm start` and deploys. Done.

---

## API Reference

### `POST /api/contact`

**Body (JSON):**
```json
{
  "name":    "Riya Sharma",
  "email":   "riya@example.com",
  "brand":   "Bloom Co.",
  "message": "We want to grow our Instagram presence..."
}
```

**Success response (200):**
```json
{
  "success": true,
  "message": "Your message has been sent! We'll be in touch within 24–48 hours."
}
```

**Error response (400/429/500):**
```json
{
  "success": false,
  "message": "A valid email address is required."
}
```

**Rate limit:** 5 submissions per IP per hour (returns 429 if exceeded).

### `GET /health`
Returns server status and DB connection state.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoServerError: bad auth` | Wrong username/password in `MONGODB_URI` |
| `Error: Invalid login` (email) | App Password not set up correctly; re-generate it |
| Form submits but no email arrives | Check spam folder; verify `EMAIL_USER` matches the Google account you used for App Password |
| `ECONNREFUSED` on local | MongoDB URI is wrong or Atlas IP whitelist is blocking you |
| Render site shows old version | Trigger a manual deploy from Render dashboard |

---

## Security Notes

- `.env` is never committed to git (add to `.gitignore`)
- Inputs are sanitised server-side (HTML stripped)
- Rate limiting prevents spam/abuse
- MongoDB stores a hash of the submitter's IP for audit purposes
