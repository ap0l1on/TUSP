# TUSP — TED Üsküdar Öğrenci Portalı

Student portal for TED Üsküdar: today's lessons, lunch menu, announcements and feedback.

Live: `https://ap0l1on.github.io/TUSP/`

## Features
- **Bugün (Today):** today's lessons for your class, live current lesson, last-minute changes, today's events. Istanbul time always.
- **Yemek (Lunch):** menu for today/tomorrow/week, with registration notice.
- **Duyurular + Takvim:** notices (dress code, holidays, guest speakers) + month calendar, ICS download, share.
- **Geri bildirim:** school-owned Google Form embedded (anonymous by default). Static site can't keep submissions private, so responses go to a private Sheet only admins see.
- TR/EN toggle, class picker saved on device, PWA installable + offline with last-update note.

## Content = JSON in `public/data/`
Validated by schemas in `schemas/`. A bad edit fails the build; live site keeps last good version. Fetched with `cache: no-cache`, edits appear ~1 min after deploy.

See **EDITING.md** (Turkish guide) for how to edit in the GitHub web editor, plus `data-src/templates/` for CSV examples.

> `publish` times in announcements are **not secret** — the repo is public.

## v2 plan
Replace Google Form with a proper backend + admin inbox, logins for admins.

## Dev
```sh
npm ci
npm run dev
npm test
npm run validate:data
npm run build
npx playwright test  # headless
```

## License
MIT — The TUSP contributors. See LICENSE.
