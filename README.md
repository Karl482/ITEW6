# AcademicWeb v2 — Supabase + Admin Portal Setup

## Quick Start

### 1. Set up Supabase
1. Go to https://supabase.com → New Project
2. Open **SQL Editor** → paste entire contents of `supabase_schema.sql` → Run
3. Go to **Settings → API** → copy your **Project URL** and **anon/public key**

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 3. Install & run
```bash
npm install
npm run dev
```

---

## Login Credentials

| Role    | ID / Email                    | Password    |
|---------|-------------------------------|-------------|
| Admin   | admin@academicweb.edu.ph      | admin1234   |
| Student | 2021-00142 (Maria Santos)     | 1234        |
| Student | 2022-00315 (Juan Cruz)        | 1234        |
| Student | 2023-00478 (Angela Dela Cruz) | 1234        |
| Faculty | FAC-2015-004 (Dr. Jose Reyes) | 1234        |
| Faculty | FAC-2018-011 (Prof. Ana Lim)  | 1234        |
| Faculty | FAC-2010-002 (Engr. Marco Santos) | 1234    |

---

## Admin Features

| Page          | What you can do                              |
|---------------|----------------------------------------------|
| Dashboard     | Overview stats + recent activity log         |
| Students      | Add / Edit / Delete students                 |
| Faculty       | Add / Edit / Delete faculty                  |
| Subjects      | Add / Edit / Delete faculty subjects         |
| Events        | Add / Edit / Delete events (assign audience) |
| Activity Log  | Full log of all admin actions with filters   |

All admin actions are automatically logged to `activity_logs` table.

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.js        ← Supabase client
│   └── activityLog.js     ← Log helper
├── store/
│   └── auth.js            ← Auth (admin/student/faculty)
├── router/
│   └── index.js           ← Routes with role guards
├── layouts/
│   ├── DashboardLayout.vue ← Student/Faculty sidebar
│   └── AdminLayout.vue     ← Admin sidebar
├── views/
│   ├── Login.vue           ← 3-tab login (Student/Faculty/Admin)
│   ├── Dashboard.vue       ← Student/Faculty dashboard (Supabase)
│   ├── Profile.vue
│   ├── Syllabus.vue
│   ├── Curriculum.vue
│   ├── Lessons.vue
│   ├── Events.vue
│   ├── Scheduling.vue
│   └── admin/
│       ├── AdminDashboard.vue
│       ├── AdminStudents.vue    ← Full CRUD
│       ├── AdminFaculty.vue     ← Full CRUD
│       ├── AdminSubjects.vue    ← Full CRUD
│       ├── AdminEvents.vue      ← Full CRUD + audience control
│       └── AdminActivityLog.vue ← Filterable log
└── data/
    └── sampleData.js       ← Kept for fallback reference
```

---

## Deployment (Netlify)

1. Push to GitHub
2. Netlify → New Site → connect repo
3. Build: `npm run build` | Publish: `dist`
4. Add environment variables in Netlify → Site Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
