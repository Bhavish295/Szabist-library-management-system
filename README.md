# Szabist Smart Digital Library Management System

A full-stack library management system for **Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (Szabist)** with Student and Admin (Librarian) roles.

## Tech Stack

- **Frontend:** React.js, Vite, HTML/CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL

## Features

### Student
- Register, Login, Forgot Password
- Dashboard with issued books, reservations, fines, due date alerts
- Search books (title, author, category, ISBN)
- Book details with rack/shelf location and availability
- Online reservations (24-hour hold, duplicate prevention)
- Issued books history with due dates
- Auto-calculated fines
- E-book PDF downloads
- In-app and email notifications

### Admin (Librarian)
- Dashboard analytics (books, students, fines, categories)
- Add/Edit/Delete books with cover image and PDF upload
- Student management (block/unblock)
- Approve/Reject reservations, cancel expired
- Issue & Return books with auto availability update
- Fine management and reports

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
```

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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | Login (student/admin) |
| GET | `/api/books/search` | Search books |
| POST | `/api/reservations` | Create reservation |
| POST | `/api/issues/issue` | Issue book (admin) |
| POST | `/api/issues/return` | Return book (admin) |
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
