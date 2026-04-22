# Serenity Yoga Studio — Booking System

A full-stack web application for managing yoga courses, class bookings and studio administration. Built with Node.js, Express, NeDB and Mustache templates.

---

## How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` if you want to change the session secret or port.

### 3. Seed the database with sample data
```bash
npm run seed
```
This creates two sample courses (a weekend workshop and a 12-week block) plus a demo student account.

### 4. Create an organiser account
```bash
node seed/create-organiser.js
```
This creates a login-capable organiser:
- **Email:** `organiser@yoga.local`
- **Password:** `organiser123`

### 5. Start the development server
```bash
npm run dev
```
Visit: **http://localhost:3000**

### 6. Run tests
```bash
npm test
```

---

## Implemented Features

### Public (no login required)
- Home page with overview of the studio and upcoming courses
- Course listing page with filters (level, type, drop-in) and text search
- Course detail page showing name, description, dates, location, price and all sessions with capacity info

### Registered Users (student role)
- Register for an account with email and password
- Log in / log out securely (session-based authentication, passwords hashed with bcrypt)
- Enrol in a full course
- Book individual sessions (drop-in, where allowed by the course)
- Automatic waitlisting when a session is at capacity
- View all personal bookings with status (Confirmed / Waitlisted / Cancelled)
- Cancel a booking

### Organisers
- Secure organiser dashboard (role-based access control — students cannot access)
- Add new courses with title, description, level, type, dates, price and drop-in setting
- Edit any course details
- Delete a course (automatically removes all its sessions too)
- Add sessions to a course with start/end time and capacity
- Delete individual sessions
- View a class list for any session — shows participant names, emails, booking status and time
- Print class list directly from the browser
- View all registered users
- Add new organiser accounts
- Remove any user (and their bookings) — cannot delete own account

---

## Project Structure

```
├── controllers/        # Request handlers (views, bookings, organiser, auth)
├── middlewares/        # Auth middleware (attachUser, requireLogin, requireOrganiser)
├── models/             # NeDB database access (Course, Session, User, Booking)
├── routes/             # Express routers (views, auth, organiser, courses, sessions, bookings)
├── services/           # Business logic (booking rules, waitlisting)
├── views/              # Mustache templates
│   ├── partials/       # head, header, footer
│   ├── auth/           # login, register
│   └── organiser/      # dashboard, courses, sessions, class-list, users
├── public/             # Static CSS
├── seed/               # Database seeding scripts
├── tests/              # Jest + Supertest test suite
└── index.js            # App entry point
```

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | Web server and routing |
| NeDB-promises | Lightweight embedded database (file-based) |
| Mustache + mustache-express | Server-side HTML templating |
| express-session | Session management |
| bcryptjs | Password hashing |
| Jest + Supertest | Automated testing |

---

## Security Notes

- Passwords are hashed with bcrypt (cost factor 12) — never stored in plain text
- Sessions use `httpOnly` cookies to prevent XSS access
- Role-based middleware (`requireOrganiser`) protects all organiser routes
- Users cannot delete their own account to prevent lockout
- Input is trimmed and validated before database writes
