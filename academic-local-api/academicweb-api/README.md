# AcademicWeb — Local MongoDB API

## Overview

This Express + Mongoose API mirrors all Supabase tables for **local development**.

| Environment | Database | Config |
|---|---|---|
| Local dev | MongoDB (this server) | `VITE_USE_LOCAL_API=true` |
| Production | Supabase | `VITE_USE_LOCAL_API=false` |

## Requirements

- Node.js 18+
- MongoDB installed and running locally

## Install MongoDB (if not installed)

### Windows
Download from https://www.mongodb.com/try/download/community
Install → MongoDB runs as a Windows service automatically.

### Using MongoDB Atlas (free cloud) instead
Replace `.env` MONGO_URI with your Atlas connection string:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/academicweb
```

## Setup & Run

```bash
# 1. Enter the API folder
cd academicweb-api

# 2. Install dependencies
npm install

# 3. Copy env file
cp .env.example .env
# Edit .env if needed (default: mongodb://localhost:27017/academicweb)

# 4. Seed the admin account
curl -X POST http://localhost:3001/api/admins/seed

# 5. Start the API
npm run dev
# → Runs on http://localhost:3001
```

## Vue project setup

In your Vue project `.env`:
```
VITE_USE_LOCAL_API=true
VITE_LOCAL_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then run:
```bash
npm run dev
```

The Vue app now talks to MongoDB locally.

## For deployment (Netlify)

In Netlify environment variables:
```
VITE_USE_LOCAL_API=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Supabase is used automatically — no changes needed in code.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Login (admin/student/faculty) |
| GET/POST/PUT/DELETE | /api/faculty | Faculty CRUD |
| GET/POST/PUT/DELETE | /api/students | Students CRUD |
| GET/POST/PUT/DELETE | /api/grades | Grades CRUD |
| GET/POST/PUT/DELETE | /api/faculty-subjects | Subjects CRUD |
| GET/POST/PUT/DELETE | /api/events | Events CRUD |
| GET/POST | /api/activity-logs | Activity log |
| GET/POST/PUT/DELETE | /api/student-affiliations | Student affiliations |
| GET/POST/PUT/DELETE | /api/student-skills | Student skills |
| GET/POST/PUT/DELETE | /api/student-academic-history | Academic history |
| GET/POST/PUT/DELETE | /api/student-nonacademic-history | Non-academic history |
| GET/POST/PUT/DELETE | /api/student-violations | Violations |
| GET | /api/stats | Dashboard counts |
| GET | /api/health | Health check |
