# BookPresent — Digital Book Catalog System

A production-ready web app for publisher agents to present books as interactive flipbooks to school teachers — eliminating the need to carry physical books.

---

## 🚀 Live URLs

| Service | URL |
|---|---|
| Frontend | https://webbookapp-two.vercel.app |
| Backend | https://webbookapp-xjd7.onrender.com |
| GitHub | https://github.com/abhyutthanwelfarefoundation-cyber/Webbookapp |

---

## 👥 User Roles

### Admin
- Upload books (PDF + optional cover image)
- Create/manage nested categories with cover images
- Manage agent accounts (create, edit, password reset, activate/deactivate)
- Respond to support tickets from agents
- View all books, categories, agents from dashboard

### Agent
- Login and browse books by category
- Open any book as a smooth flipbook with page-flip sound
- Present books to teachers on tablet/mobile
- Raise support tickets (password reset, account issues, etc.)
- Works offline after first visit

---

## ✅ Features Built

### Core
- JWT authentication with role-based access (Admin / Agent)
- Secure login with show/hide password + error messages
- Admin dashboard with stats (books, categories, agents, tickets)
- Nested categories (unlimited depth) with cover image upload
- Book upload with PDF processing + auto cover generation
- Book catalog with search + breadcrumb navigation + back button
- Interactive flipbook viewer (page-flip animation + paper sound)
- Tablet + mobile responsive UI
- Offline PWA support (books cached after first open)

### Admin Panel
- Manage Books — upload PDF, optional cover, auto page count
- Manage Categories — nested tree, cover image per category
- Manage Agents — create, edit name/email/password, activate/deactivate
- Support Tickets — view all agent tickets, respond, change status

### Agent Panel
- Catalog — browse categories with logo/cover cards
- Flipbook — smooth page flip with sound, fullscreen, slider
- Help — raise support tickets, see admin responses

### UI/UX
- Dark navy navbar with active link indicator
- Premium login page (two-panel, mobile responsive)
- Real book cards with spine effect + hover animation
- Navbodh/Gyanbodh special logo covers
- Gradient fallback covers for books without images
- Framer Motion animations throughout

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (CRA) |
| Styling | Tailwind CSS + inline styles |
| Animations | Framer Motion |
| State | Zustand + TanStack Query |
| Routing | React Router v6 |
| Flipbook | react-pageflip + pdfjs-dist |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (M0 free) |
| File Storage | Supabase Storage (free 1GB) |
| Auth | JWT + bcrypt (12 rounds) |
| Frontend Deploy | Vercel (free) |
| Backend Deploy | Render (free tier) |

---

## 🔒 Security Features

- JWT authentication with expiry + password change detection
- bcrypt password hashing (12 rounds)
- Rate limiting — 100 req/10min globally, 10 req/15min on login
- NoSQL injection sanitization (express-mongo-sanitize)
- HTTP param pollution prevention (hpp)
- Security headers (Helmet)
- CORS configured to frontend URL only
- Input validation via Mongoose + validator
- Role-based route protection (admin/agent)
- Soft delete for agents (deactivate not delete)

---

## 💰 Cost (current setup)

| Service | Plan | Cost |
|---|---|---|
| MongoDB Atlas | M0 Free | ₹0 |
| Supabase Storage | Free 1GB | ₹0 |
| Vercel (frontend) | Hobby Free | ₹0 |
| Render (backend) | Free tier | ₹0 |
| **Total** | | **₹0/month** |

> ⚠️ Supabase free = 1GB. ~200 books × 4MB = 800MB. Monitor usage.
> Render free tier sleeps after 15min inactivity — first request takes 30-50 sec to wake up.
> Fix: set up UptimeRobot to ping https://webbookapp-xjd7.onrender.com/api/health every 5 minutes.

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+
- Git

### 1. Clone the repo
```bash

reset password of admin 

Step 1 — Open server/scripts/resetPassword.js
Step 2 — Change these 2 lines:
const EMAIL        = 'admin@company.com';   // ← email of user
const NEW_PASSWORD = 'YourNewPassword123';  // ← new password
Step 3 — Run:
cd server
node scripts/resetPassword.js

Output:
✅ Connected to MongoDB
✅ Password updated for: Admin (admin@company.com)
📧 Email:    admin@company.com
🔑 Password: YourNewPassword123