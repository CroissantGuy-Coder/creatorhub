# CreatorHub — Creator Hiring Marketplace

A full-stack web platform for Roblox developers, 3D artists, and programmers to post and find work.

## Stack

- **Frontend**: React 18, Vite, TailwindCSS, React Router v6, Axios
- **Backend**: Node.js, Express, sql.js (SQLite via WASM), JWT auth, Multer
- **Database**: SQLite (stored at `backend/data/creatorhub.db`)

## Demo Accounts (pre-seeded)

| Username | Email | Password |
|---|---|---|
| RobloxPro | robloxpro@demo.com | demo1234 |
| BlenderArtist | blender@demo.com | demo1234 |
| LuaCoder | lua@demo.com | demo1234 |
| WebDevPro | webdev@demo.com | demo1234 |
| CharacterArtist | character@demo.com | demo1234 |

The database comes pre-loaded with **8 demo advertisements** across all three categories so the homepage looks populated immediately.

---

## Quick Start

### 1. Start the Backend (port 5000)

Open a terminal in `C:\Users\dell\creatorhub` and run:

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub\backend'; node src/index.js"
```

### 2. Start the Frontend (port 5173)

Open a second terminal and run:

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Set-Location 'C:\Users\dell\creatorhub\frontend'; npm run dev"
```

### 3. Open the app

Visit: **http://localhost:5173**

---

## Creating an Admin Account

1. Register a normal account at `/register`
2. Run this in a new terminal (replace `YourUsername`):

```powershell
powershell -ExecutionPolicy Bypass -NoProfile -Command "Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/promote' -Method POST -ContentType 'application/json' -Body '{\"username\":\"YourUsername\",\"adminSecret\":\"creatorhub_admin_setup_key\"}'"
```

3. Log out and back in — you'll now see the Admin Panel in the navbar dropdown.

---

## Features

- ✅ User registration, login, JWT auth
- ✅ Password reset flow
- ✅ Post advertisements with 3-step wizard
- ✅ Image uploads (reference images + avatars)
- ✅ Three categories: Roblox, Blender/3D, Coding
- ✅ Dynamic job type selection per category
- ✅ Payment: Fixed/Negotiable/Per Hour/Per Project + Robux or USD
- ✅ Contact/social links on advertisements
- ✅ Browse, search, and filter advertisements
- ✅ Category pages with sidebar filters
- ✅ Advertisement detail page with image gallery
- ✅ Save/unsave advertisements
- ✅ Report advertisements
- ✅ User dashboard: manage, edit, delete, mark as filled
- ✅ Public profile pages
- ✅ Admin dashboard: users, ads, reports management
- ✅ Dark gaming/developer aesthetic
- ✅ Fully responsive

## Project Structure

```
creatorhub/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express app entry
│   │   ├── db.js             # sql.js database layer
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT middleware
│   │   │   └── upload.js     # Multer file upload
│   │   └── routes/
│   │       ├── auth.js       # Register, login, reset password
│   │       ├── users.js      # Profiles, dashboard, saved ads
│   │       ├── advertisements.js  # Full CRUD + search
│   │       └── admin.js      # Admin panel routes
│   ├── data/                 # SQLite database file
│   ├── uploads/              # Uploaded images
│   └── .env                  # Environment config
└── frontend/
    └── src/
        ├── App.jsx
        ├── context/AuthContext.jsx
        ├── components/       # Navbar, Footer, AdCard, etc.
        ├── pages/            # All page components
        └── utils/            # API client, constants, helpers
```
