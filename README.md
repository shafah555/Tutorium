# Tutorium — Student Management System

A production-ready, full-stack **Student Management System** built for a single private tutor to manage students, monthly tuition fees, model test fees, payments, receipts, dues, and reports from anywhere.

> Single-tutor system: only one teacher account can exist. There is no multi-user/admin hierarchy.

Tested end-to-end locally with a real PostgreSQL database during development: registration, login, student creation with automatic roll-number and payable-month generation, payment collection, PDF/Excel/CSV report exports, and PDF receipt generation all verified working.

---

## Features

- **Auth**: Register (one-time), login with email/phone + password, JWT auth, forgot/reset password via OTP.
- **Dashboard**: total/active/completed students, this month's collection & due, model test collection, 6-month collection chart, due/today notifications.
- **Students**: full CRUD, auto roll number per HSC year (`HSC-25001`, `HSC-25002`, ...), automatic payable-month generation from joining date, "Complete Student" workflow that stops future dues, photo upload, search & filters, pagination.
- **Payments**: pending-months view per student, pay one or many months at once, single receipt per transaction, manual payment editing.
- **Model Tests**: unlimited tests per student, fees tracked completely separately from tuition.
- **Receipts**: JSON detail view, printable in-browser receipt, downloadable PDF receipt (with QR code) generated server-side with PDFKit.
- **Reports**: monthly collection, due, student (active/completed), model test, and income (by month/year) reports — each exportable as Excel, CSV, or PDF.
- **Settings**: institute name, tutor name, logo/signature upload, Google Form link (for external student intake — see below), receipt footer, default monthly fee, currency.
- **Security**: bcrypt password hashing, JWT, Helmet, rate limiting, CORS, Sequelize parameterized queries (SQL-injection safe), input validation.

---

## Tech Stack

**Frontend:** React 18, React Router, Axios, Tailwind CSS, React Hook Form, React Icons, React Toastify, Chart.js
**Backend:** Node.js, Express, PostgreSQL, Sequelize ORM, JWT, PDFKit, Multer, Nodemailer, Swagger
**Deployment:** Vercel (frontend), Render (backend + PostgreSQL)

---

## Project Structure

```
tutorium/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, Layout, StatCard, Modal, etc.
│   │   ├── pages/            # Login, Dashboard, Students, Payments, Reports, Settings...
│   │   ├── context/          # AuthContext
│   │   ├── services/         # Axios API client
│   ├── vercel.json
│   └── .env.example
├── server/                  # Express backend
│   ├── controllers/
│   ├── routes/
│   ├── models/               # Sequelize models (User, Student, MonthlyPayment, ...)
│   ├── middleware/           # auth, error handler, upload, rate limiter
│   ├── config/               # database.js, config.js, swagger.js
│   ├── helpers/               # mailer
│   ├── utils/                 # rollNumber, monthGenerator, receiptNumber, receiptPdf, otp
│   ├── database/
│   │   ├── schema.sql         # raw SQL backup/reference schema
│   │   └── seeders/seed.js    # demo data generator (50 students)
│   ├── uploads/               # student photos, logos, signatures (gitignored)
│   └── .env.example
├── render.yaml               # Render deployment blueprint
└── .gitignore
```

---

## Database Design

Tables: `users`, `students`, `monthly_payments`, `model_tests`, `model_test_payments`, `payment_receipts`, `settings`, `dashboard_logs`.

Full schema (mirrors the Sequelize models): [`server/database/schema.sql`](server/database/schema.sql)

### Roll Number Rule
Format: `HSC-{YY}{NNN}`, e.g. `HSC-25001`, `HSC-25002`. Each HSC year has its own independent sequence that never repeats.

### Joining Month Rule
If a student joins on 15 July 2026, payable months are auto-generated starting **July 2026** onward (no charge before the joining month) up to the current month. When a student is marked **Completed**, any future auto-generated (unpaid) months beyond the completion month are removed.

---

## API Documentation

Once the backend is running, Swagger UI is available at:
```
http://localhost:5000/api-docs
```
(or `https://<your-render-service>.onrender.com/api-docs` in production)

### Key Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create the one-time teacher account |
| POST | `/api/auth/login` | Login (email/phone + password) |
| POST | `/api/auth/forgot-password` | Request OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET/POST | `/api/students` | List / create students |
| PUT/DELETE | `/api/students/:id` | Update / delete student |
| POST | `/api/students/:id/complete` | Mark student completed |
| GET/POST | `/api/payments` | List payments / receive payment |
| GET | `/api/payments/pending/:studentId` | Pending due/partial months |
| GET/POST/PUT/DELETE | `/api/model-tests` | Manage model tests |
| POST | `/api/model-tests/:id/pay` | Pay model test fee |
| GET | `/api/receipt/:id` | Receipt JSON |
| GET | `/api/receipt/pdf/:id` | Printable receipt PDF |
| GET | `/api/dashboard` | Dashboard analytics |
| GET | `/api/reports/{monthly,due,students,model-tests,income}` | Reports (add `?format=excel\|csv\|pdf`) |
| GET/PUT | `/api/settings` | Institute settings |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local install or a hosted instance)
- npm

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/tutorium.git
cd tutorium

# Backend
cd server
npm install

# Frontend (in a new terminal)
cd ../client
npm install
```

### 2. Database Setup

Create a local database:
```bash
createdb tutorium
# or from psql:
# CREATE DATABASE tutorium;
```

Import the schema (optional — the app can also auto-create tables on first boot):
```bash
psql -U postgres -d tutorium -f server/database/schema.sql
```

### 3. Environment Variables

**Backend** — copy `server/.env.example` to `server/.env` and fill in:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/tutorium
DB_SSL=false
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Tutorium <no-reply@tutorium.app>"
```

**Frontend** — copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed Demo Data (optional but recommended)

Generates 1 teacher account + 50 students with random payments, dues, and model test payments:
```bash
cd server
npm run seed
```
Demo login: `demo@tutorium.app` / `Demo@1234`

### 5. Run Locally

```bash
# Terminal 1 - backend
cd server
npm run dev      # nodemon, http://localhost:5000

# Terminal 2 - frontend
cd client
npm run dev       # http://localhost:5173
```

Visit `http://localhost:5173`, register (if you didn't seed demo data) or log in, and start managing students.

---

## Google Form Student Intake (Optional)

Under **Settings**, you can paste a Google Form link for reference so prospective students can self-submit their basic information externally. Recommended fields to add to that Google Form:

- Full Name
- Phone Number
- Guardian Phone Number
- School / College
- Class
- Group (Science / Commerce / Arts)
- HSC Year
- Address

> Note: out of the box, this link is stored for your own reference/sharing only. Automatically pulling form submissions into the `students` table requires connecting the Google Forms/Sheets API and a small polling or webhook job in the backend — the `settings.googleFormLink` field and UI are already in place to build that on top of.

---

## Deployment

### A. Push to GitHub

```bash
cd tutorium
git init
git add .
git commit -m "Initial commit: Tutorium Student Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/tutorium.git
git push -u origin main
```

### B. Backend on Render

**Option 1 — Blueprint (recommended, uses the included `render.yaml`):**
1. Go to https://dashboard.render.com → **New** → **Blueprint**.
2. Connect your GitHub repo. Render detects `render.yaml` at the repo root and provisions:
   - A **PostgreSQL** database (`tutorium-db`)
   - A **Web Service** (`tutorium-api`) with root directory `server`
3. Render auto-generates `JWT_SECRET` and wires `DATABASE_URL` from the database. Fill in `CLIENT_URL` (your Vercel URL) and SMTP variables in the Render dashboard under the service's **Environment** tab.
4. Click **Apply** — Render builds (`npm install`) and starts (`npm start`) the service automatically.

**Option 2 — Manual setup:**
1. **New** → **PostgreSQL** → create a database (note the **Internal Database URL**).
2. **New** → **Web Service** → connect the repo → set **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables (`DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, SMTP_* vars, `PORT=5000`, `NODE_ENV=production`).
6. Deploy. Once live, run the seed script if desired via Render's **Shell** tab: `npm run seed`.

Your API will be live at `https://tutorium-api.onrender.com` (health check: `/health`, docs: `/api-docs`).

### C. Frontend on Vercel

1. Go to https://vercel.com/new and import the same GitHub repo.
2. **Root Directory**: set to `client`.
3. **Framework Preset**: Vite (auto-detected).
4. **Environment Variables**: add `VITE_API_URL=https://tutorium-api.onrender.com/api` (your Render backend URL + `/api`).
5. Click **Deploy**. Vercel builds and hosts the static frontend, including the SPA rewrite rule in `client/vercel.json` so client-side routing works on refresh/deep links.
6. Once deployed, go back to Render and set the backend's `CLIENT_URL` environment variable to your Vercel URL (e.g. `https://tutorium.vercel.app`) so CORS allows it, then redeploy the backend service.

### D. Post-deploy checklist
- [ ] Visit the Vercel URL → register the teacher account (or seed demo data via Render shell).
- [ ] Confirm login works and dashboard loads (this validates DB connectivity + CORS).
- [ ] Create a test student, receive a payment, and download a receipt PDF.
- [ ] Set up SMTP credentials so forgot-password OTP emails actually send (without SMTP configured, OTPs are only logged server-side, not delivered).

---

## Environment Variables Reference

**Backend (`server/.env`):**
| Variable | Description |
|---|---|
| `PORT` | Port the API listens on |
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_SSL` | `true` for hosted Postgres (Render), `false` for local |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `SMTP_*` | Email credentials for OTP/password reset |

**Frontend (`client/.env`):**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (include `/api`) |

---

## Security Notes
- Passwords are hashed with bcrypt (10 salt rounds).
- JWT-protected routes via `middleware/auth.js`.
- `helmet` sets secure HTTP headers; `express-rate-limit` throttles auth and general API traffic.
- All database access goes through Sequelize (parameterized queries), preventing SQL injection.
- Uploaded files are restricted to image types and size-limited via Multer.

---

## License
MIT — see [LICENSE](LICENSE).
