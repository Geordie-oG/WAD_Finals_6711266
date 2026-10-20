# CourseSpace — CSX4107 Final Examination

An Online Course Service using the required starter architecture: Next.js API, React/Vite frontend, MongoDB, and the provided HashRouter/UserContext structure.

## Student information

- Student: Ye Htet Aung
- Student ID: 6711266
- Course: CSX4107 Web Application Development, Semester 1/2026

## Test credentials

All six dedicated demonstration accounts use password **`Learn2026!`**. These are exam demo credentials, not database credentials. Sign in with the email or exact username below.

| Role    | Username    | Email                 |
| ------- | ----------- | --------------------- |
| Teacher | Alex Chen   | teacher1@courses.test |
| Teacher | Mia Wong    | teacher2@courses.test |
| Teacher | Daniel Lee  | teacher3@courses.test |
| Student | Emma Davis  | student1@courses.test |
| Student | Noah Wilson | student2@courses.test |
| Student | Olivia Kim  | student3@courses.test |

## Source and deployment

- Repository: https://github.com/Geordie-oG/WAD_Finals_6711266
- Backend source: https://github.com/Geordie-oG/WAD_Finals_6711266/tree/main/next-backend
- Frontend source: https://github.com/Geordie-oG/WAD_Finals_6711266/tree/main/react-frontend
- Backend URL: https://wad-finals-6711266-backend.vercel.app
- Frontend URL: https://wad-finals-6711266-frontend.vercel.app
- Screen recording: supplied separately by the student in the examination submission.

## Prerequisites

- Node.js 22.12+ or Node.js 24, and npm.
- MongoDB Atlas connection with permission to read/write the dedicated exam database, and network access from the backend host.
- Two terminal windows for local frontend/backend servers.

## 1. Backend setup

```bash
cd next-backend
npm ci
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
MONGODB_URI=your-private-mongodb-connection-string
DB_NAME=wad_final_6711266
JWT_SECRET=your-long-random-secret
FRONTEND_URL=http://localhost:5173
```

Then:

```bash
npm run seed
npm run dev
```

The API runs at `http://localhost:3000`. `GET /api/health` verifies the database connection. The seed is non-destructive: it inserts missing demo accounts and sample courses without replacing existing data. It is restricted to this exam's database names. Passwords are stored as bcrypt hashes.

## 2. Frontend setup

In another terminal:

```bash
cd react-frontend
npm ci
cp .env.example .env.local
npm run dev
```

The frontend environment contains:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Open `http://localhost:5173`. HashRouter handles frontend navigation, including direct link refreshes. The database URI and JWT secret are used only by the backend.

## 3. Teacher walkthrough

1. Sign in as `teacher1@courses.test` / `Learn2026!`.
2. My courses displays only Alex Chen's courses.
3. Choose **Create course** and enter name, positive duration in days, one or more comma/newline-separated topics, non-negative price, capacity and status.
4. Open the new course and choose **Edit course** to update it.
5. With no students enrolled, choose **Delete course**, then confirm. It is removed.
6. Create another Open course. Sign in as a Student and enroll, then return as the Teacher. Details show the student's name/email. Deletion is disabled and the API rejects deletion as well.
7. Sign in as `teacher2@courses.test`. The first teacher's courses do not appear and direct API access to those courses is rejected.
8. Teachers can set Open, Close or Cancel. Capacity cannot be reduced below the current enrolled count.

## 4. Student walkthrough

1. Sign in as `student1@courses.test` / `Learn2026!`.
2. Explore courses displays Open and Close courses, excluding Cancel.
3. Search part of a course name, such as `Web`, or part of a Teacher name, such as `Alex`.
4. Open a course to see duration, topics, fee, capacity and available seats.
5. Enroll in an Open course. The button becomes **Already enrolled**, the count updates, and the course appears under **My learning**.
6. Refresh the page: authentication is restored and the enrollment remains in MongoDB.
7. Repeated enrollment is rejected by the API. A full course, a Close course and a Cancel course cannot accept enrollments.
8. Log out. Protected screens require sign-in again.

Cancel courses are hidden from student-facing course lists/details. Existing enrollment relationships remain stored. Teacher details retain their student roster.

## 5. API design and backend rules

All course, user and enrollment operations require authentication. The proxy checks JWTs and handles preflight. Every handler independently loads the authenticated DB user and enforces role/ownership. Caller-supplied identity headers and owner/student ids never authorize operations.

| Method | Route                           | Purpose                                                                            |
| ------ | ------------------------------- | ---------------------------------------------------------------------------------- |
| POST   | `/api/auth/login`               | Email/username and password login                                                  |
| POST   | `/api/auth/logout`              | Clear session cookie                                                               |
| GET    | `/api/auth/me`                  | Restore current authenticated user                                                 |
| GET    | `/api/user`                     | Current user's safe profile only                                                   |
| GET    | `/api/user/:user_id`            | Own profile only                                                                   |
| GET    | `/api/course?q=...`             | Teacher's own courses or Student's non-Cancel catalog; partial name/Teacher search |
| POST   | `/api/course`                   | Teacher-only course creation                                                       |
| GET    | `/api/course/:course_id`        | Role-aware course details; Teacher gets enrolled Students                          |
| PUT    | `/api/course/:course_id`        | Owner Teacher-only validated course update                                         |
| DELETE | `/api/course/:course_id`        | Owner Teacher-only deletion with no enrolled Students                              |
| POST   | `/api/course/:course_id/enroll` | Student enrollment with all business rules                                         |
| GET    | `/api/enrollment`               | Student's own enrolled non-Cancel courses                                          |
| GET    | `/api/health`                   | Deployment/database health check                                                   |

Enrollment uses one atomic `findOneAndUpdate`: course must be Open, student absent, and `size(studentIds) < maxStudent`. `$addToSet` stores each student once. Concurrent requests cannot oversubscribe or duplicate enrollment. Capacity updates and deletion also include atomic predicates. Students cannot submit Teacher ownership or role changes.

JWTs expire after eight hours. Login also sets an HttpOnly cookie. The frontend sends the JWT using a Bearer header, stored in sessionStorage for refresh within the same browser tab, to work reliably when separate Vercel domains block third-party cookies. Logout clears the local token and cookie; a copied Bearer token remains valid until expiry. Public demo accounts are intentionally documented for grading.

## 6. Verification

In each application:

```bash
npm run lint
npm run build
```

With the backend running and its private environment file configured:

```bash
cd next-backend
node --env-file=.env.local scripts/smoke-test.mjs
```

For a deployed backend:

```bash
node --env-file=.env.local scripts/smoke-test.mjs https://YOUR-BACKEND.vercel.app/api
```

Verified results: **72/72 checks passed locally and 72/72 passed on the deployed backend**. Both apps passed lint and production builds. Live browser checks cover Teacher creation/editing, Student enrollment, My learning, and session persistence. See `TEST_RESULTS.md` for the verification record and `SUBMISSION.md` for hand-in steps.

The integration script covers unauthorized requests, all six logins, cookie/Bearer sessions, role/ownership restrictions, validation, course statuses, filtering, rosters, duplicate/full enrollment, concurrent last-seat and duplicate enrollment, deletion restrictions, CORS and logout. It creates uniquely named QA courses and cleans up only those course ids in the dedicated exam database. It does not alter seeded courses or existing student enrollments. The local environment must refer to the same database as the tested backend for cleanup.

## 7. Vercel deployment

Deploy the existing folders as two separate projects:

1. Backend project root: `next-backend`, framework Next.js, build `npm run build`.
2. Add backend environment variables: `MONGODB_URI`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`.
3. `FRONTEND_URL` must be the exact frontend origin (no trailing slash).
4. Frontend project root: `react-frontend`, framework Vite, build `npm run build`, output `dist`.
5. Set frontend `VITE_API_URL` to `https://YOUR-BACKEND.vercel.app/api`.
6. Redeploy after changing environment variables; Vite reads its variable at build time.
7. Verify `/api/health`, login and protected requests, then create/edit/enroll from the live frontend.

Do not upload `.env.local`, dependency directories, build output, the question paper or unrelated coursework. Database secrets are configured privately in Vercel, not in GitHub.

## Starter attribution

Continued from `https://github.com/pop2518hotmailcom/wad-final-2026-01.git` as required. Existing `next-backend/`, `react-frontend/`, provided API route paths, proxy/helpers, HashRouter, UserContext and main entry points are maintained. Dependencies may receive compatible fixes; implementation files fill the starter's placeholders.
