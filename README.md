# Szabist Smart Digital Library Management System

A full-stack library management system for **Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (Szabist)** with Student and Admin (Librarian) roles.

## Tech Stack

- **Frontend:** React.js, Vite, HTML/CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL

## Features

### Student
- Register, Login, Forgot Password
- Account page: edit profile, change password
- Dashboard with issued books, reservations, fines, due date alerts
- Search books (title, author, category, ISBN), paginated catalogue
- Book details with rack/shelf location and availability
- Online reservations (24-hour hold, duplicate prevention)
- Hold queue / waitlist when a book has no copies available — automatically
  promoted to an active hold (with email + in-app notification) the moment
  a copy frees up, FIFO by request time
- Self-service reservation cancellation
- Self-service book renewal (up to 2 renewals, blocked if overdue or if
  another student is waiting)
- Issued books history with due dates
- Auto-calculated fines
- E-book PDF downloads
- In-app and email notifications

### Admin (Librarian)
- Account page: change password
- Dashboard analytics (books, students, fines, categories) with charts
- Add/Edit/Delete books with cover image and PDF upload, paginated + CSV export
- Student management (block/unblock), paginated + searchable
- Approve/Reject reservations, cancel expired, paginated
- Issue & Return books with auto availability update, paginated
- Fine management and reports, paginated + CSV export

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
```

If you already have a database from before renewals/waitlist support was
added, also run the migrations in `database/migrations/` in order (fresh
installs via `schema.sql` above don't need them).

### 2. Backend Setup

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

Edit `.env` with your MySQL credentials and optional SMTP settings for email notifications.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Default Credentials

| Role    | Login              | Password    |
|---------|--------------------|-------------|
| Admin   | `admin`            | `admin123`  |
| Student | `ahmed@szabist.edu.pk` | `student123` |

## Testing

The backend has an integration test suite (Jest + Supertest) covering
auth, book search, and the full reservation/waitlist and issue/renewal
flows against a real MySQL database.

```bash
cd backend
npm install
npm test
```

Tests run against a separate `szabist_library_test` database (configured
in `backend/.env.test`, rebuilt from `database/schema.sql` automatically
on every run) — they never touch your development database.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | Login (student/admin) |
| PUT | `/api/auth/profile` | Update own profile (student) |
| PUT | `/api/auth/change-password` | Change own password (either role) |
| GET | `/api/books/search` | Search books (paginated) |
| POST | `/api/reservations` | Create reservation, or join the waitlist if unavailable |
| PUT | `/api/reservations/:id/cancel` | Cancel own pending/waitlisted reservation |
| POST | `/api/issues/issue` | Issue book (admin) |
| POST | `/api/issues/return` | Return book (admin) — auto-promotes the next waitlisted student |
| POST | `/api/issues/:id/renew` | Renew own issued book (student) |
| GET | `/api/dashboard` | Admin analytics |

## Color Theme

- Navy Blue (`#1a365d`) — Primary brand
- Gold (`#d4a853`) — Szabist accent
- Teal (`#319795`) — Secondary accent

## Project Structure

```
├── backend/          # Express API server
├── frontend/         # React Vite app
├── database/         # MySQL schema
└── README.md
```
