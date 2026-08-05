# AI College Timetable Management System

A complete, production-ready college timetable management system powered by **Genetic Algorithm AI** for conflict-free scheduling, now enhanced with 20 additional features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js (MVC) |
| Database | MySQL 8+ / MariaDB |
| Auth | JWT + bcryptjs |
| AI Engine | Genetic Algorithm |
| Charts | Chart.js + react-chartjs-2 |
| PDF Export | pdfkit |
| Excel Export | exceljs |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## Features

### Core Features
- AI-powered timetable generation (Genetic Algorithm)
- Department, Staff, Subject, Class, Room management (CRUD)
- JWT authentication with role-based access
- Dark / Light mode toggle
- Responsive UI (mobile + tablet + desktop)

### Enhanced Features (v2)

| # | Feature | Description |
|---|---|---|
| 1 | **Interval Settings** | Configure break durations (10/15/20/30 min) between periods |
| 2 | **Auto Time Calculation** | Enter start time + period duration → auto-generate all period timings |
| 3 | **Teacher Conflict Detection** | Block assigning same teacher to 2 classes at same period |
| 4 | **Classroom Conflict Detection** | Block same room for multiple classes at same time |
| 5 | **Subject Conflict Detection** | Warn on duplicate subject in same day/class |
| 6 | **Color-coded Timetable** | Each subject has a unique color; labs are amber; intervals are gray |
| 7 | **Enhanced Dashboard** | Today's classes, conflict alert, quick stats, activity log |
| 8 | **Search & Filter** | Filter by teacher, subject, class, day across all views |
| 9 | **Export PDF** | Formatted PDF for class/staff/room timetables |
| 10 | **Export Excel** | Color-formatted Excel with all schedule entries |
| 11 | **Print Timetable** | Print-friendly CSS layout with landscape orientation |
| 12 | **Notifications** | Toast notifications for all create/update/delete/error events |
| 13 | **Attendance Shortcut** | Mark today's classes as conducted/cancelled from dashboard |
| 14 | **Dark Mode** | Full dark mode with system preference detection |
| 15 | **Audit Log** | Every admin action logged with user, timestamp, IP |
| 16 | **Timetable History** | Save snapshots, view previous versions, restore old timetable |
| 17 | **Weekly View** | Monday–Saturday grid with color-coded subject cells |
| 18 | **Statistics** | Teacher workload chart, subject distribution, dept overview |
| 19 | **Validation** | Required fields, time validation, duplicate prevention |
| 20 | **Conflict Report** | Full system-wide conflict scan with teacher and room clash details |

---

## Project Structure

```
time table/
├── start.bat                    ← Double-click to start everything
├── stop.bat                     ← Double-click to stop
├── backend/
│   └── src/
│       ├── ai/                  ← Genetic Algorithm engine
│       ├── config/              ← DB connection pool
│       ├── controllers/         ← All business logic
│       │   ├── authController.js
│       │   ├── departmentController.js
│       │   ├── staffController.js
│       │   ├── subjectController.js
│       │   ├── classController.js
│       │   ├── roomController.js
│       │   ├── timeslotController.js
│       │   ├── timetableController.js
│       │   ├── exportController.js
│       │   ├── intervalController.js   ← NEW
│       │   ├── conflictController.js   ← NEW
│       │   ├── attendanceController.js ← NEW
│       │   ├── historyController.js    ← NEW
│       │   └── statisticsController.js ← NEW
│       ├── middleware/          ← Auth, error handler
│       ├── routes/              ← All REST routes
│       └── server.js
├── frontend/
│   └── src/
│       ├── api/                 ← All API functions
│       ├── components/          ← Reusable UI components
│       ├── context/             ← Auth + Theme
│       ├── hooks/               ← useCRUD
│       └── pages/
│           ├── auth/
│           ├── dashboard/       ← Enhanced with today's classes
│           ├── departments/
│           ├── staff/
│           ├── subjects/
│           ├── classes/
│           ├── rooms/
│           ├── timeslots/
│           ├── intervals/       ← NEW
│           ├── timetable/
│           ├── attendance/      ← NEW
│           ├── history/         ← NEW
│           ├── statistics/      ← NEW
│           └── audit/           ← NEW
└── database/
    └── schema.sql               ← Full schema + seed data
```

---

## Installation Guide

### Prerequisites
- **Node.js** v18+ → https://nodejs.org
- **XAMPP** (MySQL/MariaDB) → https://apachefriends.org
- **npm** v9+

### Step 1 — Start MySQL
Open **XAMPP Control Panel** → click **Start** next to **MySQL**

### Step 2 — Import Database

```bash
mysql -u root < "database/schema.sql"
```

Or in XAMPP MySQL console:
```sql
source C:/Users/24ad010/time table/database/schema.sql;
```

### Step 3 — Configure Backend

```bash
cd backend
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          ← leave blank for XAMPP default
DB_NAME=timetable_db
JWT_SECRET=your_secret_key_here
```

### Step 4 — Install & Run

**Option A — One-click (recommended):**
Double-click **`start.bat`** in the `time table` folder.

**Option B — Manual:**

Terminal 1 (Backend):
```bash
cd backend
npm install
node src/server.js
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install
node node_modules\vite\bin\vite.js
```

### Step 5 — Fix Admin Password (first time only)

```bash
cd backend
node src/utils/dbSetup.js
```

### Step 6 — Open Browser
Go to **http://localhost:5173**

| Credential | Value |
|---|---|
| Email | admin@college.edu |
| Password | Admin@123 |

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/dashboard` | Dashboard stats |
| CRUD | `/api/departments` | Departments |
| CRUD | `/api/staff` | Staff |
| CRUD | `/api/subjects` | Subjects |
| CRUD | `/api/classes` | Classes |
| CRUD | `/api/rooms` | Rooms |
| CRUD | `/api/timeslots` | Time Slots |
| GET/POST | `/api/intervals/settings` | Interval config |
| POST | `/api/intervals/calculate` | Auto-calculate timings |
| POST | `/api/intervals/apply` | Apply to system |
| POST | `/api/conflicts/check` | Check single conflict |
| GET | `/api/conflicts/report` | Full conflict report |
| GET/POST | `/api/attendance` | Attendance records |
| GET | `/api/attendance/today` | Today's schedule |
| POST | `/api/timetable/generate` | AI generation |
| GET | `/api/timetable/class/:id` | Class timetable |
| GET | `/api/timetable/staff/:id` | Staff timetable |
| GET | `/api/timetable/room/:id` | Room timetable |
| GET | `/api/timetable/export/pdf` | PDF export |
| GET | `/api/timetable/export/excel` | Excel export |
| POST | `/api/history/save` | Save timetable version |
| GET | `/api/history` | List versions |
| POST | `/api/history/:id/restore` | Restore version |
| GET | `/api/statistics/workload` | Teacher workload |
| GET | `/api/statistics/subjects` | Subject distribution |
| GET | `/api/statistics/audit` | Audit log |
| GET | `/api/statistics/colors` | Subject colors |

---

## AI Algorithm

Genetic Algorithm steps:
1. Initialize random timetable population (30 chromosomes)
2. Score each chromosome (fitness = 100 − conflict penalties)
3. Tournament selection of best candidates
4. Single-point crossover
5. 5% mutation rate
6. Elitism — top 4 preserved each generation
7. Repeats up to 200 generations or until score = 100

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page on first load | Hard-refresh browser (Ctrl+Shift+R) |
| Backend won't start | Check XAMPP MySQL is running |
| Login fails | Run `node src/utils/dbSetup.js` to reset password |
| No timetable in viewer | Select academic year marked with ★ |
| PDF export failed | Make sure a timetable is loaded first |
| Port in use error | Run `stop.bat` then `start.bat` |
#   t i m e - _ t a b l e _ m a n a g e m e n t  
 #   t i m e - _ t a b l e _ m a n a g e m e n t  
 