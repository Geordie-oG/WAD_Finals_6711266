# Grading criteria audit — CSX4107 Final

Date: 20 October 2026. The audit maps observed application behavior to the paper's eight categories (30 marks total).

| Grading category | Weight | Evidence checked | Status |
| --- | ---: | --- | --- |
| Authentication | 3 | All six accounts; wrong-password rejection; cookie and Bearer authentication; protected-route rejection; page refresh restores session; logout | Passed application checks |
| Role and authorization | 4 | Student cannot create/update/delete; Teacher cannot enroll; teacher list/detail/update/delete restricted to owner; spoofed identity/role/owner payloads rejected or ignored by backend; private profiles protected | Passed application checks |
| Teacher course management | 5 | Create/view/edit course fields and multiple topics; own-course list; roster; delete empty course; reject deletion after enrollment, including Cancel courses | Passed application checks |
| Enrollment relationship and business rules | 7 | Enrollment persists; roster matches enrolled Student; duplicate and full-course rejection; 3 Students race for last seat; 4 duplicate requests produce one enrollment; capacity reduction rejected; Open/Close/Cancel transitions preserve existing relationships and enforce restrictions | Passed application checks |
| Student course functions | 4 | Non-Cancel catalog; partial/case-insensitive course and Teacher search; literal search characters; details; My learning contains only own enrollments | Passed application checks |
| Frontend integration and usability | 3 | Live Teacher create/edit; live Student enrollment/My learning; roster and disabled deletion; filtering; Close enrollment disabled; refresh persistence; clear role/status messages; no desktop horizontal overflow in checked detail view | Passed application checks |
| Deployment | 2 | Public frontend and backend; live MongoDB health; correct cross-origin communication; complete integration suite against deployed API | Passed application checks |
| Code quality and submission | 2 | Required starter architecture preserved; lint/build; field allowlist and shared validation/auth helpers; atomic database predicates; README six logins/setup/testing; source and deployment links; secrets/unrelated files excluded | Code/docs checked; student recording link pending |

## Executed verification

- Original functional suite: 72 checks passed locally and on the deployed backend.
- Expanded grading audit: **102/102 passed locally; 102/102 passed on the deployed backend**.
- Executable audit: `next-backend/scripts/smoke-test.mjs`.
- Teacher and Student browser flows were tested on the live frontend.
- Audit courses use unique QA names/ids and are cleaned up without changing existing course data.

## Usability improvements from this audit

1. Login placeholder now shows a valid demo email.
2. Student empty-search results suggest changing the search, without suggesting Teacher-only creation.
3. Closed/full-course details explain why enrollment is unavailable.

## Final student submission steps

1. Use the source/deployment links in `SUBMISSION.md`.
2. Include the full-screen + camera recording link with viewing access enabled.
3. Submit the links through the examination's required submission channel.

The recording upload and submission are student actions; their completion has not been verified here.
