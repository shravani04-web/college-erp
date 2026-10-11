# College ERP

A beginner-friendly College ERP website built with **HTML, CSS and JavaScript**.
There is no backend and no database: all data is saved in the browser using **localStorage**, so the project runs by simply opening a file in Chrome.

## Features

**Student**
- Login with Student ID and password
- Dashboard with attendance %, upcoming exams, today's classes and latest announcements
- My Attendance: overall percentage, progress bar, low-attendance warning and day-by-day history
- Class timetable (Monday to Saturday, today is highlighted)
- Examination schedule with "days left" status
- Study material: view and download files
- College announcements with priority labels

**Admin**
- Admin dashboard with quick actions
- Student Records: add, edit, delete and search students
- Mark Attendance: pick a date, mark each student Present/Absent, save, and view an attendance report
- Add or delete timetable classes and exams
- Upload or delete study material (files up to 1 MB)
- Post or delete announcements
- "Restore sample data" button to start over

## How to run

1. Download or copy the `college-erp` folder to your computer.
2. Open the folder and **double-click `index.html`** (or right-click, then Open with, then Google Chrome).
3. Log in using one of the demo accounts below.

No installation, server or internet connection is needed.

### Demo accounts

| Role    | Username / ID | Password     |
|---------|---------------|--------------|
| Student | `STU001`      | `student123` |
| Student | `STU002` to `STU006` | `student123` |
| Admin   | `admin`       | `admin123`   |

## How to use

1. **Log in as admin** and open *Student Records* to add a new student (for example `STU007`).
2. Open *Mark Attendance*, choose a date, mark Present/Absent and click *Save attendance*.
3. Post an announcement, add an exam, or upload a study material file.
4. **Log out**, then log in as a student (the new `STU007` or any demo student) and check that the changes appear on the dashboard, attendance, exam, materials and announcements pages.

## Folder structure

```
college-erp/
|-- index.html   Page structure: login screen, sidebar layout, pop-up form
|-- style.css    All styling, including the mobile layout
|-- script.js    All logic: login, pages, admin tools, localStorage
`-- README.md    This file
```

### How `script.js` is organised

| Section | What it does |
|---------|--------------|
| 1. Settings | Admin account, menu items, constants |
| 2. Storage helpers | `store.get / set / remove` wrap localStorage |
| 3. Sample data | Creates demo students, attendance, timetable, exams and so on on first run |
| 4. Helper functions | Dates, escaping text, attendance calculation |
| 5. Login / logout | Checks credentials and keeps the session |
| 6. Navigation & dashboards | Sidebar menu, page switching, dashboards |
| 7 to 9. Pages | One function per page that returns HTML |
| 10. Pop-up form & messages | `showModal` and `showToast` |
| 11. Start the app | Seeds data and restores the session |

### Data saved in localStorage

| Key | Contents |
|-----|----------|
| `erp_students` | Student records (including login password) |
| `erp_attendance` | `{ "2026-10-09": { "STU001": "Present", ... } }` |
| `erp_timetable`, `erp_exams`, `erp_materials`, `erp_announcements` | Lists of records |
| `erp_session` | The currently logged-in user |

To inspect or clear it: press `F12` in Chrome, open *Application*, then *Local Storage*.

## Notes and limitations

- Data lives **only in your browser**. Clearing site data, using another browser, or using Incognito mode shows fresh sample data.
- Passwords are stored as plain text and the admin password is in `script.js`. This is fine for a classroom demo but **not secure** for a real system. A real ERP needs a backend with hashed passwords.
- localStorage holds about 5 MB, so uploads are limited to 1 MB per file.
- Sample study materials download as small text files because they have no real content.

## Ideas for your Agile and DevOps assignments

**Agile**
- Write each feature as a user story, for example: *"As a student, I want to see my attendance percentage so that I know if I am at risk."*
- Group them into sprints, for example Sprint 1 login and dashboard, Sprint 2 attendance and timetable, Sprint 3 exams, materials and announcements.
- Keep a product backlog and sprint board (Trello, Jira or GitHub Projects) and hold a short sprint review and retrospective after each sprint.

**DevOps**
- Put the folder in a Git repository and use branches, for example `main` and `feature/attendance`, with pull requests.
- Add a GitHub Actions workflow that checks the project on every push, for example HTML/CSS/JS linting.
- Deploy for free with **GitHub Pages**, since the site is only static files.
- Write a simple test checklist (login, add student, mark attendance, upload file) and run it before every release.

## Possible improvements

- Edit and delete for announcements
- Student profile page and password change
- Export attendance to CSV
- Replace localStorage with a real backend (Node.js and a database)
