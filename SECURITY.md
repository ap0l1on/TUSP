# SECURITY.md

## Reporting
Please open a private security advisory on GitHub or contact the school admin. Do not file public issues for vulnerabilities.

## Scope
- Static site only: no backend, no accounts, no cookies.
- All content in `public/data/` is public. Never put student names, grades, phone numbers, or personal data there.
- Teacher names in the timetable only with school approval; otherwise leave `teacher` empty.
- Feedback submissions go to a school-owned Google Form/Sheet; only admins can see responses.
- Markdown is sanitized (DOMPurify allowlist: bold, italic, lists, links only). No raw HTML, no `innerHTML` with unsanitized data, no `eval`.
