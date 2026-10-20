# Verification results — 20 October 2026

## Result

The required Online Course Service is implemented, pushed to the exam repository, and deployed as separate frontend and backend projects. Tests below were executed against the actual MongoDB-backed application.

| Check | Result |
| --- | --- |
| Backend ESLint | PASS |
| Frontend ESLint | PASS |
| Next.js production build (16.4.2) | PASS locally and on Vercel |
| Vite production build | PASS locally and on Vercel |
| Local integration suite | 102 checks passed |
| Deployed integration suite | 102 checks passed |
| Public backend `/api/health` | HTTP 200, database connected |
| Public frontend | HTTP 200 |
| All 3 Teacher + 3 Student logins | PASS locally and deployed |
| Role/ownership and private profile restrictions | PASS |
| Last-seat enrollment across 3 concurrent Students | Exactly 1 success, 2 conflicts |
| Duplicate enrollment with 4 simultaneous requests | Exactly 1 success, 3 conflicts |
| Open/Close/Cancel rules | PASS |
| Existing Student enrollments prevent deletion | PASS |
| Capacity cannot be reduced below enrollment count | PASS |
| Course-name and Teacher-name filters | PASS |
| Browser: Teacher login/create/edit | PASS on deployed frontend |
| Browser: Student login/details/enroll/My learning | PASS on deployed frontend |
| Browser: refresh preserves login and enrollment | PASS on deployed frontend |
| Browser: Teacher roster and disabled deletion after enrollment | PASS on deployed frontend |
| Existing-course Open/Close/Cancel transitions preserve enrollments | PASS |
| Hostile role/owner payloads and invalid field inputs | PASS |
| Literal search characters match correctly | PASS |
| Git file/secret review | PASS; only exam source/config/docs committed |

See `next-backend/scripts/smoke-test.mjs` for exact executable assertions. The suite verifies cookie and Bearer authentication, unauthenticated rejection, forged identity rejection, validation, role/ownership isolation, rosters, status rules, enrollment relationships, concurrent capacity/duplicate checks, deletion, CORS preflight and logout.

## Grading alignment

All eight categories are mapped to concrete checks in `GRADING_AUDIT.md`. The frontend audit also corrected the demo-email placeholder, Student empty-search guidance, and closed/full-course messaging. These changes passed frontend lint/build and were deployed.

## Test isolation

- Uses the dedicated Atlas database `wad_final_6711266` with separate `users` and `courses` collections.
- Does not reuse or change booking-project collections.
- Automated tests create unique `QA-...` courses and remove only those created ids after the run. Seed accounts/courses and existing enrollments are preserved.
- The additional live-browser test creates a separate temporary course and removes only that course after verification.
- Private environment values are configured locally/in Vercel and excluded from Git.

## Submission still requiring student action

The student's full-screen + camera recording and its shareable upload link must be supplied separately. No claim is made that recording was started or captured by the application or this verification.
