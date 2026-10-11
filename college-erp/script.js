/* ============================================================
   College ERP - script.js
   All data is saved in the browser's localStorage (no backend).

   Sections:
     1. Settings                 7. Student pages
     2. Storage helpers          8. Shared pages (timetable, exams,
     3. Sample data                 materials, announcements)
     4. Small helper functions   9. Admin pages (students, attendance)
     5. Login / logout          10. Pop-up form & messages
     6. Navigation & dashboards 11. Start the app
   ============================================================ */


/* ============================================================
   1. SETTINGS
   ============================================================ */
const ADMIN_ACCOUNT = { username: 'admin', password: 'admin123', name: 'Administrator' };
const MIN_ATTENDANCE = 75;            // below this % a warning is shown
const MAX_FILE_SIZE = 1024 * 1024;    // 1 MB limit for uploads (localStorage is small)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];

// Menu items for each role: [page key, icon, label]
const NAV = {
  student: [
    ['dashboard', '🏠', 'Dashboard'],
    ['attendance', '📅', 'My Attendance'],
    ['timetable', '🕒', 'Timetable'],
    ['exams', '📝', 'Exam Schedule'],
    ['materials', '📚', 'Study Material'],
    ['announcements', '📢', 'Announcements']
  ],
  admin: [
    ['dashboard', '🏠', 'Dashboard'],
    ['students', '👥', 'Student Records'],
    ['mark-attendance', '✅', 'Mark Attendance'],
    ['timetable', '🕒', 'Timetable'],
    ['exams', '📝', 'Exam Schedule'],
    ['materials', '📚', 'Study Material'],
    ['announcements', '📢', 'Announcements']
  ]
};

let currentUser = null;        // { role, id, name } of the logged-in person
let currentPage = 'dashboard'; // page that is currently open
let selectedAttDate = null;    // date chosen on the "Mark Attendance" page


/* ============================================================
   2. STORAGE HELPERS
   Every key is saved as "erp_<name>", for example "erp_students".
   ============================================================ */
const store = {
  get(name, fallback = []) {
    try {
      const raw = localStorage.getItem('erp_' + name);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },
  set(name, value) {
    try {
      localStorage.setItem('erp_' + name, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast('Storage is full. Try a smaller file.', 'error');
      return false;
    }
  },
  remove(name) {
    localStorage.removeItem('erp_' + name);
  }
};


/* ============================================================
   3. SAMPLE DATA (created the first time the app opens)
   ============================================================ */
function seedSampleData() {
  // --- Students ---
  const students = [
    { id: 'STU001', name: 'Aarav Sharma',   email: 'aarav@college.edu', department: 'Computer Science',       semester: 5, phone: '9876500001', password: 'student123' },
    { id: 'STU002', name: 'Diya Patil',     email: 'diya@college.edu',  department: 'Computer Science',       semester: 5, phone: '9876500002', password: 'student123' },
    { id: 'STU003', name: 'Rohan Mehta',    email: 'rohan@college.edu', department: 'Information Technology', semester: 5, phone: '9876500003', password: 'student123' },
    { id: 'STU004', name: 'Sneha Kulkarni', email: 'sneha@college.edu', department: 'Computer Science',       semester: 5, phone: '9876500004', password: 'student123' },
    { id: 'STU005', name: 'Karan Verma',    email: 'karan@college.edu', department: 'Electronics',            semester: 5, phone: '9876500005', password: 'student123' },
    { id: 'STU006', name: 'Priya Nair',     email: 'priya@college.edu', department: 'Information Technology', semester: 5, phone: '9876500006', password: 'student123' }
  ];
  store.set('students', students);

  // --- Attendance for the last 14 days (weekdays only) ---
  const attendance = {};
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip Sunday & Saturday

    const record = {};
    students.forEach((s, index) => {
      // STU004 gets lower attendance so the warning can be seen
      const absent = index === 3 ? (i + index) % 3 === 0 : (i + index * 3) % 7 === 0;
      record[s.id] = absent ? 'Absent' : 'Present';
    });
    attendance[toDateString(d)] = record;
  }
  store.set('attendance', attendance);

  // --- Timetable ---
  const cls = (day, time, subject, room, faculty) => ({ id: uid(), day, time, subject, room, faculty });
  store.set('timetable', [
    cls('Monday',    '09:00 - 10:00', 'Data Structures',     'A-101', 'Prof. Rao'),
    cls('Monday',    '10:00 - 11:00', 'DBMS',                'A-102', 'Prof. Iyer'),
    cls('Monday',    '11:15 - 12:15', 'Operating Systems',   'A-101', 'Prof. Khan'),
    cls('Monday',    '14:00 - 16:00', 'Data Structures Lab', 'Lab-1', 'Prof. Rao'),
    cls('Tuesday',   '09:00 - 10:00', 'Computer Networks',   'A-103', 'Prof. Joshi'),
    cls('Tuesday',   '10:00 - 11:00', 'Software Engineering','A-102', 'Prof. Desai'),
    cls('Tuesday',   '11:15 - 12:15', 'Web Technologies',    'A-104', 'Prof. Singh'),
    cls('Wednesday', '09:00 - 10:00', 'DBMS',                'A-102', 'Prof. Iyer'),
    cls('Wednesday', '10:00 - 11:00', 'Operating Systems',   'A-101', 'Prof. Khan'),
    cls('Wednesday', '11:15 - 12:15', 'Data Structures',     'A-101', 'Prof. Rao'),
    cls('Wednesday', '14:00 - 16:00', 'DBMS Lab',            'Lab-2', 'Prof. Iyer'),
    cls('Thursday',  '09:00 - 10:00', 'Software Engineering','A-102', 'Prof. Desai'),
    cls('Thursday',  '10:00 - 11:00', 'Web Technologies',    'A-104', 'Prof. Singh'),
    cls('Thursday',  '11:15 - 12:15', 'Computer Networks',   'A-103', 'Prof. Joshi'),
    cls('Thursday',  '14:00 - 16:00', 'OS Lab',              'Lab-1', 'Prof. Khan'),
    cls('Friday',    '09:00 - 10:00', 'Operating Systems',   'A-101', 'Prof. Khan'),
    cls('Friday',    '10:00 - 11:00', 'Data Structures',     'A-101', 'Prof. Rao'),
    cls('Friday',    '11:15 - 12:15', 'DBMS',                'A-102', 'Prof. Iyer'),
    cls('Friday',    '14:00 - 15:00', 'Technical Seminar',   'Hall-1','Prof. Desai'),
    cls('Saturday',  '09:00 - 12:00', 'Web Technologies Lab','Lab-2', 'Prof. Singh')
  ]);

  // --- Exams (dates are set relative to today so they always look "upcoming") ---
  const exam = (subject, type, daysFromNow, time, venue) =>
    ({ id: uid(), subject, type, date: addDays(daysFromNow), time, venue });
  store.set('exams', [
    exam('Data Structures',      'Unit Test', -20, '10:00', 'Room A-101'),
    exam('Data Structures',      'Mid-Term',    7, '10:00', 'Exam Hall 1'),
    exam('DBMS',                 'Mid-Term',    9, '10:00', 'Exam Hall 1'),
    exam('Operating Systems',    'Mid-Term',   11, '10:00', 'Exam Hall 2'),
    exam('Computer Networks',    'Mid-Term',   13, '10:00', 'Exam Hall 2'),
    exam('Software Engineering', 'Mid-Term',   15, '10:00', 'Exam Hall 1'),
    exam('Web Technologies',     'Practical',  18, '14:00', 'Lab-2')
  ]);

  // --- Study materials (sample files have no real content; see downloadMaterial) ---
  const material = (title, subject, fileName, size, daysAgo) =>
    ({ id: uid(), title, subject, fileName, size, uploadedOn: addDays(-daysAgo), data: '' });
  store.set('materials', [
    material('Unit 1 - Arrays and Linked Lists', 'Data Structures',     'DSA_Unit1_Notes.txt',     245760, 12),
    material('ER Diagram Cheat Sheet',           'DBMS',                'DBMS_ER_Diagrams.txt',    120400, 9),
    material('Process Scheduling Slides',        'Operating Systems',   'OS_Scheduling.txt',       512000, 6),
    material('Agile and Scrum Basics',           'Software Engineering','SE_Agile_Scrum.txt',      180200, 4),
    material('HTML & CSS Practice Questions',    'Web Technologies',    'Web_Practice_Set.txt',     90100, 2)
  ]);

  // --- Announcements (newest first) ---
  const notice = (title, message, priority, daysAgo) =>
    ({ id: uid(), title, message, priority, date: addDays(-daysAgo) });
  store.set('announcements', [
    notice('Mid-Term Exam Schedule Released', 'The mid-term exam timetable is now available in the Exam Schedule section. Please check your dates and venues.', 'Important', 0),
    notice('Library Timings Extended', 'The central library will stay open until 8 PM during the exam period.', 'Normal', 1),
    notice('Fee Payment Deadline', 'The last date to pay the semester fee without a late charge is this Friday.', 'Urgent', 3),
    notice('Technical Fest Registrations Open', 'Register for the annual technical fest at the student activity centre. Teams of up to 4 students can join.', 'Normal', 6)
  ]);
}

/** Deletes all ERP data from localStorage (except the login session) and creates fresh sample data. */
function resetData() {
  if (!confirm('This will delete all changes and restore the sample data. Continue?')) return;

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('erp_') && key !== 'erp_session') keysToRemove.push(key);
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  seedSampleData();
  showToast('Sample data restored.');
  showPage('dashboard');
}


/* ============================================================
   4. SMALL HELPER FUNCTIONS
   ============================================================ */
const $ = id => document.getElementById(id);

/** Makes text safe to put inside HTML (prevents broken layout / script injection). */
function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Creates a short random ID for new records. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Date helpers. Dates are stored as text like "2026-10-11". */
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function today() { return toDateString(new Date()); }
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateString(d);
}
function formatDate(dateString) {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function dayName(dateString) {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
}
function getTodayName() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}
function daysUntil(dateString) {
  const diff = new Date(dateString + 'T00:00:00') - new Date(today() + 'T00:00:00');
  return Math.round(diff / 86400000); // milliseconds in one day
}

/** Sorting helper for timetable entries. */
function byTime(a, b) { return a.time.localeCompare(b.time); }

/** Attendance numbers for one student. */
function getAttendanceStats(studentId) {
  const attendance = store.get('attendance', {});
  let present = 0;
  let total = 0;
  Object.values(attendance).forEach(day => {
    if (day[studentId]) {
      total++;
      if (day[studentId] === 'Present') present++;
    }
  });
  return { present, absent: total - present, total, percent: total ? Math.round((present / total) * 100) : 0 };
}

function statusBadge(status) {
  return `<span class="badge ${status === 'Present' ? 'badge-green' : 'badge-red'}">${status}</span>`;
}

function priorityBadge(priority) {
  const color = priority === 'Urgent' ? 'badge-red' : priority === 'Important' ? 'badge-orange' : 'badge-blue';
  return `<span class="badge ${color}">${esc(priority)}</span>`;
}

function statCard(icon, label, value, color) {
  return `
    <div class="card stat-card">
      <div class="stat-icon ${color}">${icon}</div>
      <div>
        <p class="stat-label">${label}</p>
        <h3 class="stat-value">${value}</h3>
      </div>
    </div>`;
}

function fileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (['ppt', 'pptx'].includes(ext)) return '📙';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📗';
  if (['zip', 'rar'].includes(ext)) return '📦';
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return '🖼️';
  return '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/** Deletes one record from a collection ("timetable", "exams", "materials", "announcements"). */
function deleteItem(collection, id) {
  if (!confirm('Delete this item?')) return;
  const items = store.get(collection).filter(item => item.id !== id);
  store.set(collection, items);
  showToast('Deleted.');
  showPage(currentPage);
}


/* ============================================================
   5. LOGIN / LOGOUT
   ============================================================ */
function handleLogin(event) {
  event.preventDefault();
  const role = $('login-role').value;
  const id = $('login-id').value.trim();
  const password = $('login-password').value;
  let user = null;

  if (role === 'admin') {
    if (id.toLowerCase() === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
      user = { role: 'admin', id: 'admin', name: ADMIN_ACCOUNT.name };
    }
  } else {
    const student = store.get('students').find(s => s.id.toLowerCase() === id.toLowerCase() && s.password === password);
    if (student) user = { role: 'student', id: student.id, name: student.name };
  }

  if (!user) {
    $('login-error').textContent = 'Wrong ID or password. Check the demo accounts below and try again.';
    return;
  }

  store.set('session', user);
  startApp(user);
}

function startApp(user) {
  currentUser = user;
  $('login-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('user-name').textContent = user.name;
  $('user-role').textContent = user.role === 'admin' ? 'Admin' : 'Student';
  buildNav();
  showPage('dashboard');
}

function logout() {
  store.remove('session');
  currentUser = null;
  $('app').classList.add('hidden');
  $('login-screen').classList.remove('hidden');
  $('login-form').reset();
  $('login-error').textContent = '';
  closeSidebar();
}


/* ============================================================
   6. NAVIGATION & DASHBOARDS
   ============================================================ */
function buildNav() {
  $('nav-menu').innerHTML = NAV[currentUser.role].map(([key, icon, label]) => `
    <a href="#" class="nav-link" data-page="${key}" onclick="showPage('${key}'); return false;">
      <span>${icon}</span> ${label}
    </a>`).join('');
}

/** Opens a page: highlights the menu item, sets the title and draws the content. */
function showPage(page) {
  currentPage = page;
  const item = NAV[currentUser.role].find(n => n[0] === page);
  $('page-title').textContent = item[2];
  $('content').innerHTML = pages[page]();
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  closeSidebar();
  window.scrollTo(0, 0);
}

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('overlay').classList.toggle('show');
}
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('overlay').classList.remove('show');
}

function renderDashboard() {
  return currentUser.role === 'admin' ? adminDashboard() : studentDashboard();
}

function studentDashboard() {
  const stats = getAttendanceStats(currentUser.id);
  const upcomingExams = store.get('exams').filter(e => daysUntil(e.date) >= 0).length;
  const todaysClasses = store.get('timetable').filter(c => c.day === getTodayName()).sort(byTime);

  return `
    <div class="welcome">
      <h3>Welcome back, ${esc(currentUser.name)}</h3>
      <p class="muted">${dayName(today())}, ${formatDate(today())}</p>
    </div>

    <div class="grid stats-grid">
      ${statCard('📅', 'Attendance', stats.total ? stats.percent + '%' : '-', stats.percent < MIN_ATTENDANCE ? 'red' : 'green')}
      ${statCard('📝', 'Upcoming exams', upcomingExams, 'orange')}
      ${statCard('📚', 'Study materials', store.get('materials').length, 'blue')}
      ${statCard('📢', 'Announcements', store.get('announcements').length, 'purple')}
    </div>

    <div class="grid two-col">
      <div class="card">
        <h3>Today's classes</h3>
        ${classListHtml(todaysClasses)}
      </div>
      <div class="card">
        <h3>Latest announcements</h3>
        ${announcementListHtml(3, false)}
      </div>
    </div>`;
}

function adminDashboard() {
  const students = store.get('students');
  const todayRecord = store.get('attendance', {})[today()];
  const presentToday = todayRecord
    ? students.filter(s => todayRecord[s.id] === 'Present').length + ' / ' + students.length
    : 'Not marked';

  return `
    <div class="welcome">
      <h3>Admin dashboard</h3>
      <p class="muted">${dayName(today())}, ${formatDate(today())}</p>
    </div>

    <div class="grid stats-grid">
      ${statCard('👥', 'Total students', students.length, 'blue')}
      ${statCard('✅', 'Present today', presentToday, 'green')}
      ${statCard('📢', 'Announcements', store.get('announcements').length, 'purple')}
      ${statCard('📚', 'Study materials', store.get('materials').length, 'orange')}
    </div>

    <div class="grid two-col">
      <div class="card">
        <h3>Quick actions</h3>
        <div class="actions-row">
          <button class="btn btn-primary" onclick="showPage('students'); openStudentForm()">Add student</button>
          <button class="btn btn-primary" onclick="showPage('mark-attendance')">Mark attendance</button>
          <button class="btn btn-primary" onclick="showPage('announcements'); openAnnouncementForm()">Post announcement</button>
          <button class="btn btn-primary" onclick="showPage('materials'); openMaterialForm()">Upload material</button>
        </div>
        <p class="muted" style="margin-top:18px">Want to start over? This removes all changes and brings back the sample data.</p>
        <button class="btn btn-danger btn-small" style="margin-top:8px" onclick="resetData()">Restore sample data</button>
      </div>
      <div class="card">
        <h3>Latest announcements</h3>
        ${announcementListHtml(3, false)}
      </div>
    </div>`;
}

/** Small list of classes, used on the student dashboard. */
function classListHtml(list) {
  if (!list.length) return '<p class="empty">No classes today.</p>';
  return list.map(c => `
    <div class="class-item">
      <div class="class-time">${esc(c.time)}</div>
      <div class="class-info"><strong>${esc(c.subject)}</strong><span>${esc(c.room)} - ${esc(c.faculty)}</span></div>
    </div>`).join('');
}


/* ============================================================
   7. STUDENT PAGES
   ============================================================ */
function renderMyAttendance() {
  const stats = getAttendanceStats(currentUser.id);
  const attendance = store.get('attendance', {});
  const low = stats.percent < MIN_ATTENDANCE;

  const dates = Object.keys(attendance).filter(d => attendance[d][currentUser.id]).sort().reverse();
  const rows = dates.map(d => `
    <tr>
      <td>${formatDate(d)}</td>
      <td>${dayName(d)}</td>
      <td>${statusBadge(attendance[d][currentUser.id])}</td>
    </tr>`).join('');

  return `
    <div class="card" style="margin-bottom:18px">
      <h3>Overall attendance: ${stats.percent}%</h3>
      <div class="progress"><div class="progress-bar ${low ? 'low' : ''}" style="width:${stats.percent}%"></div></div>
      <div class="attendance-summary">
        <span>Total days: <strong>${stats.total}</strong></span>
        <span>Present: <strong>${stats.present}</strong></span>
        <span>Absent: <strong>${stats.absent}</strong></span>
      </div>
      ${stats.total === 0 ? '' : low
        ? `<div class="alert alert-warn">Your attendance is below ${MIN_ATTENDANCE}%. Attend more classes to avoid problems with exam eligibility.</div>`
        : `<div class="alert alert-ok">Good work. Your attendance is above ${MIN_ATTENDANCE}%.</div>`}
    </div>

    <div class="card">
      <h3>Attendance history</h3>
      ${rows
        ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '<p class="empty">No attendance has been marked for you yet.</p>'}
    </div>`;
}


/* ============================================================
   8. SHARED PAGES (students view them, admin can also edit)
   ============================================================ */

/* ---------- Timetable ---------- */
function renderTimetable() {
  const isAdmin = currentUser.role === 'admin';
  const all = store.get('timetable');

  const dayCards = DAYS.map(day => {
    const list = all.filter(c => c.day === day).sort(byTime);
    const items = list.length
      ? list.map(c => `
          <div class="class-item">
            <div class="class-time">${esc(c.time)}</div>
            <div class="class-info"><strong>${esc(c.subject)}</strong><span>${esc(c.room)} - ${esc(c.faculty)}</span></div>
            ${isAdmin ? `<button class="icon-btn" title="Delete class" onclick="deleteItem('timetable', '${c.id}')">🗑️</button>` : ''}
          </div>`).join('')
      : '<p class="empty">No classes.</p>';
    return `<div class="card day-card ${day === getTodayName() ? 'today' : ''}"><h3>${day}</h3>${items}</div>`;
  }).join('');

  return `
    ${isAdmin ? '<div class="toolbar"><span></span><button class="btn btn-primary" onclick="openTimetableForm()">+ Add class</button></div>' : ''}
    <div class="grid day-grid">${dayCards}</div>`;
}

function openTimetableForm() {
  showModal('Add class', `
    <div class="form-grid">
      <div><label>Day</label><select name="day">${DAYS.map(d => `<option>${d}</option>`).join('')}</select></div>
      <div><label>Subject</label><input name="subject" required></div>
      <div><label>Start time</label><input type="time" name="start" required></div>
      <div><label>End time</label><input type="time" name="end" required></div>
      <div><label>Room</label><input name="room" required></div>
      <div><label>Faculty</label><input name="faculty" required></div>
    </div>`, form => {
    const data = Object.fromEntries(new FormData(form));
    if (data.end <= data.start) {
      showToast('End time must be after start time.', 'error');
      return false;
    }
    const list = store.get('timetable');
    list.push({ id: uid(), day: data.day, time: `${data.start} - ${data.end}`, subject: data.subject.trim(), room: data.room.trim(), faculty: data.faculty.trim() });
    store.set('timetable', list);
    showToast('Class added.');
    showPage('timetable');
  });
}

/* ---------- Exam schedule ---------- */
function renderExams() {
  const isAdmin = currentUser.role === 'admin';
  const exams = store.get('exams').slice().sort((a, b) => a.date.localeCompare(b.date));

  const rows = exams.map(e => {
    const left = daysUntil(e.date);
    let status;
    if (left < 0) status = '<span class="badge badge-gray">Completed</span>';
    else if (left === 0) status = '<span class="badge badge-red">Today</span>';
    else if (left <= 7) status = `<span class="badge badge-orange">In ${left} day${left > 1 ? 's' : ''}</span>`;
    else status = `<span class="badge badge-blue">In ${left} days</span>`;

    return `
      <tr>
        <td><strong>${esc(e.subject)}</strong></td>
        <td>${esc(e.type)}</td>
        <td>${formatDate(e.date)}</td>
        <td>${esc(e.time)}</td>
        <td>${esc(e.venue)}</td>
        <td>${status}</td>
        ${isAdmin ? `<td><button class="btn btn-danger btn-small" onclick="deleteItem('exams', '${e.id}')">Delete</button></td>` : ''}
      </tr>`;
  }).join('');

  return `
    ${isAdmin ? '<div class="toolbar"><span></span><button class="btn btn-primary" onclick="openExamForm()">+ Add exam</button></div>' : ''}
    <div class="card">
      ${rows
        ? `<div class="table-wrap"><table>
             <thead><tr><th>Subject</th><th>Type</th><th>Date</th><th>Time</th><th>Venue</th><th>Status</th>${isAdmin ? '<th>Action</th>' : ''}</tr></thead>
             <tbody>${rows}</tbody>
           </table></div>`
        : '<p class="empty">No exams have been scheduled yet.</p>'}
    </div>`;
}

function openExamForm() {
  showModal('Add exam', `
    <div class="form-grid">
      <div><label>Subject</label><input name="subject" required></div>
      <div><label>Type</label>
        <select name="type"><option>Unit Test</option><option>Mid-Term</option><option>Practical</option><option>Final</option></select></div>
      <div><label>Date</label><input type="date" name="date" required></div>
      <div><label>Time</label><input type="time" name="time" required></div>
      <div class="full"><label>Venue</label><input name="venue" required></div>
    </div>`, form => {
    const data = Object.fromEntries(new FormData(form));
    const list = store.get('exams');
    list.push({ id: uid(), subject: data.subject.trim(), type: data.type, date: data.date, time: data.time, venue: data.venue.trim() });
    store.set('exams', list);
    showToast('Exam added.');
    showPage('exams');
  });
}

/* ---------- Study materials ---------- */
function renderMaterials() {
  const isAdmin = currentUser.role === 'admin';
  const materials = store.get('materials');

  const cards = materials.map(m => `
    <div class="card material-card">
      <div class="material-icon">${fileIcon(m.fileName)}</div>
      <h3>${esc(m.title)}</h3>
      <span class="badge badge-purple" style="align-self:flex-start">${esc(m.subject)}</span>
      <p class="muted">${esc(m.fileName)} (${formatSize(m.size)})<br>Uploaded on ${formatDate(m.uploadedOn)}</p>
      <div class="actions-row">
        <button class="btn btn-primary btn-small" onclick="downloadMaterial('${m.id}')">Download</button>
        ${isAdmin ? `<button class="btn btn-danger btn-small" onclick="deleteItem('materials', '${m.id}')">Delete</button>` : ''}
      </div>
    </div>`).join('');

  return `
    ${isAdmin ? '<div class="toolbar"><span></span><button class="btn btn-primary" onclick="openMaterialForm()">+ Upload material</button></div>' : ''}
    ${cards ? `<div class="grid material-grid">${cards}</div>` : '<div class="card"><p class="empty">No study material has been uploaded yet.</p></div>'}`;
}

function openMaterialForm() {
  showModal('Upload study material', `
    <label>Title</label><input name="title" required>
    <label>Subject</label><input name="subject" required>
    <label>File (max 1 MB)</label><input type="file" name="file" required>`, form => {
    const title = form.elements.title.value.trim();
    const subject = form.elements.subject.value.trim();
    const file = form.elements.file.files[0];

    if (!file) {
      showToast('Please choose a file.', 'error');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('File is too large. Maximum size is 1 MB.', 'error');
      return false;
    }

    // Read the file and keep it in localStorage as text (data URL)
    const reader = new FileReader();
    reader.onload = () => {
      const list = store.get('materials');
      list.unshift({ id: uid(), title, subject, fileName: file.name, size: file.size, uploadedOn: today(), data: reader.result });
      if (store.set('materials', list)) {
        closeModal();
        showToast('Material uploaded.');
        showPage('materials');
      }
    };
    reader.readAsDataURL(file);
    return false; // keep the pop-up open until the file has been read
  });
}

function downloadMaterial(id) {
  const material = store.get('materials').find(m => m.id === id);
  if (!material) return;

  const link = document.createElement('a');
  if (material.data) {
    link.href = material.data;           // a file uploaded by the admin
    link.download = material.fileName;
  } else {
    // Sample materials have no real file, so create a small text file instead
    const text = `Sample study material\nTitle: ${material.title}\nSubject: ${material.subject}\n`;
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    link.download = material.fileName;
  }
  link.click();
}

/* ---------- Announcements ---------- */
function announcementListHtml(limit, showDelete) {
  let list = store.get('announcements').slice().sort((a, b) => b.date.localeCompare(a.date));
  if (limit) list = list.slice(0, limit);
  if (!list.length) return '<p class="empty">No announcements yet.</p>';

  return list.map(a => `
    <div class="notice ${a.priority === 'Urgent' ? 'urgent' : a.priority === 'Important' ? 'important' : ''}">
      <div class="notice-head">
        <strong>${esc(a.title)}</strong>
        ${priorityBadge(a.priority)}
        ${showDelete ? `<button class="icon-btn" title="Delete announcement" onclick="deleteItem('announcements', '${a.id}')">🗑️</button>` : ''}
      </div>
      <p>${esc(a.message)}</p>
      <small>${formatDate(a.date)}</small>
    </div>`).join('');
}

function renderAnnouncements() {
  const isAdmin = currentUser.role === 'admin';
  return `
    ${isAdmin ? '<div class="toolbar"><span></span><button class="btn btn-primary" onclick="openAnnouncementForm()">+ Post announcement</button></div>' : ''}
    <div class="card">${announcementListHtml(0, isAdmin)}</div>`;
}

function openAnnouncementForm() {
  showModal('Post announcement', `
    <label>Title</label><input name="title" required>
    <label>Message</label><textarea name="message" required></textarea>
    <label>Priority</label>
    <select name="priority"><option>Normal</option><option>Important</option><option>Urgent</option></select>`, form => {
    const data = Object.fromEntries(new FormData(form));
    const list = store.get('announcements');
    list.unshift({ id: uid(), title: data.title.trim(), message: data.message.trim(), priority: data.priority, date: today() });
    store.set('announcements', list);
    showToast('Announcement posted.');
    showPage('announcements');
  });
}


/* ============================================================
   9. ADMIN PAGES
   ============================================================ */

/* ---------- Student records ---------- */
function renderStudents() {
  return `
    <div class="toolbar">
      <input type="search" id="student-search" class="search" placeholder="Search by name or ID" oninput="searchStudents()">
      <button class="btn btn-primary" onclick="openStudentForm()">+ Add student</button>
    </div>
    <div class="card"><div id="student-table">${studentTableHtml('')}</div></div>`;
}

function searchStudents() {
  $('student-table').innerHTML = studentTableHtml($('student-search').value);
}

function studentTableHtml(query) {
  const q = query.trim().toLowerCase();
  const list = store.get('students').filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  if (!list.length) return '<p class="empty">No students found.</p>';

  const rows = list.map(s => {
    const stats = getAttendanceStats(s.id);
    return `
      <tr>
        <td>${esc(s.id)}</td>
        <td><strong>${esc(s.name)}</strong></td>
        <td>${esc(s.department)}</td>
        <td>${s.semester}</td>
        <td>${esc(s.email)}</td>
        <td>${esc(s.phone)}</td>
        <td><span class="badge ${stats.percent < MIN_ATTENDANCE ? 'badge-red' : 'badge-green'}">${stats.total ? stats.percent + '%' : '-'}</span></td>
        <td>
          <button class="btn btn-light btn-small" onclick="openStudentForm('${esc(s.id)}')">Edit</button>
          <button class="btn btn-danger btn-small" onclick="deleteStudent('${esc(s.id)}')">Delete</button>
        </td>
      </tr>`;
  }).join('');

  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Sem</th><th>Email</th><th>Phone</th><th>Attendance</th><th>Actions</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/** Opens the Add/Edit form. Pass a student ID to edit, or nothing to add. */
function openStudentForm(studentId) {
  const editing = Boolean(studentId);
  const s = editing
    ? store.get('students').find(x => x.id === studentId)
    : { id: '', name: '', email: '', department: DEPARTMENTS[0], semester: 1, phone: '', password: 'student123' };

  const departmentOptions = DEPARTMENTS.map(d => `<option ${d === s.department ? 'selected' : ''}>${d}</option>`).join('');
  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option ${n === s.semester ? 'selected' : ''}>${n}</option>`).join('');

  showModal(editing ? 'Edit student' : 'Add student', `
    <div class="form-grid">
      <div><label>Student ID</label><input name="id" value="${esc(s.id)}" ${editing ? 'readonly' : ''} pattern="[A-Za-z0-9_\\-]+" title="Letters, numbers, - and _ only" placeholder="e.g. STU007" required></div>
      <div><label>Full name</label><input name="name" value="${esc(s.name)}" required></div>
      <div><label>Email</label><input type="email" name="email" value="${esc(s.email)}" required></div>
      <div><label>Phone</label><input name="phone" value="${esc(s.phone)}" required></div>
      <div><label>Department</label><select name="department">${departmentOptions}</select></div>
      <div><label>Semester</label><select name="semester">${semesterOptions}</select></div>
      <div class="full"><label>Login password</label><input name="password" value="${esc(s.password)}" required></div>
    </div>`, form => saveStudent(Object.fromEntries(new FormData(form)), editing));
}

function saveStudent(data, editing) {
  data.id = data.id.trim().toUpperCase();
  data.name = data.name.trim();
  data.semester = Number(data.semester);

  const students = store.get('students');
  if (editing) {
    const index = students.findIndex(s => s.id === data.id);
    students[index] = data;
  } else {
    if (students.some(s => s.id === data.id)) {
      showToast('That student ID already exists.', 'error');
      return false; // keep the pop-up open
    }
    students.push(data);
  }

  store.set('students', students);
  showToast(editing ? 'Student updated.' : 'Student added.');
  showPage('students');
}

function deleteStudent(studentId) {
  if (!confirm(`Delete student ${studentId} and all of their attendance records?`)) return;

  store.set('students', store.get('students').filter(s => s.id !== studentId));

  const attendance = store.get('attendance', {});
  Object.values(attendance).forEach(day => delete day[studentId]);
  store.set('attendance', attendance);

  showToast('Student deleted.');
  showPage('students');
}

/* ---------- Mark attendance ---------- */
function renderMarkAttendance() {
  const date = selectedAttDate || today();
  const students = store.get('students');

  const reportRows = students.map(s => {
    const st = getAttendanceStats(s.id);
    return `
      <tr>
        <td>${esc(s.id)}</td>
        <td>${esc(s.name)}</td>
        <td>${st.present}</td>
        <td>${st.absent}</td>
        <td><span class="badge ${st.percent < MIN_ATTENDANCE ? 'badge-red' : 'badge-green'}">${st.total ? st.percent + '%' : '-'}</span></td>
      </tr>`;
  }).join('');

  return `
    <div class="card" style="margin-bottom:18px">
      <h3>Mark attendance</h3>
      <label for="att-date" style="margin-top:0">Select date</label>
      <input type="date" id="att-date" value="${date}" max="${today()}" onchange="loadAttendanceSheet()" style="max-width:220px">
      <div id="att-sheet" style="margin-top:16px">${attendanceSheetHtml(date)}</div>
    </div>

    <div class="card">
      <h3>Attendance report</h3>
      ${reportRows
        ? `<div class="table-wrap"><table>
             <thead><tr><th>ID</th><th>Name</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead>
             <tbody>${reportRows}</tbody>
           </table></div>`
        : '<p class="empty">Add students first to see the report.</p>'}
    </div>`;
}

/** Table with a Present/Absent choice for each student on the chosen date. */
function attendanceSheetHtml(date) {
  const students = store.get('students');
  if (!students.length) return '<p class="empty">No students yet. Add students in Student Records first.</p>';

  const saved = store.get('attendance', {})[date];
  const rows = students.map((s, index) => {
    const status = saved && saved[s.id] ? saved[s.id] : 'Present';
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(s.id)}</td>
        <td>${esc(s.name)}</td>
        <td>
          <label style="display:inline; margin-right:14px"><input type="radio" name="att-${esc(s.id)}" value="Present" ${status === 'Present' ? 'checked' : ''}> Present</label>
          <label style="display:inline"><input type="radio" name="att-${esc(s.id)}" value="Absent" ${status === 'Absent' ? 'checked' : ''}> Absent</label>
        </td>
      </tr>`;
  }).join('');

  return `
    <p class="muted" style="margin-bottom:10px">${saved ? 'Attendance was already saved for this date. You can change it below.' : 'Attendance has not been marked for this date yet.'}</p>
    <div class="actions-row" style="margin-bottom:12px">
      <button class="btn btn-light btn-small" onclick="setAllAttendance('Present')">Mark all present</button>
      <button class="btn btn-light btn-small" onclick="setAllAttendance('Absent')">Mark all absent</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>#</th><th>ID</th><th>Name</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="saveAttendance()">Save attendance</button>`;
}

function loadAttendanceSheet() {
  selectedAttDate = $('att-date').value;
  if (!selectedAttDate) return;
  $('att-sheet').innerHTML = attendanceSheetHtml(selectedAttDate);
}

function setAllAttendance(status) {
  document.querySelectorAll(`#att-sheet input[type="radio"][value="${status}"]`).forEach(radio => { radio.checked = true; });
}

function saveAttendance() {
  const date = $('att-date').value;
  if (!date) {
    showToast('Please select a date.', 'error');
    return;
  }

  const record = {};
  store.get('students').forEach(s => {
    const checked = document.querySelector(`input[name="att-${s.id}"]:checked`);
    record[s.id] = checked ? checked.value : 'Present';
  });

  const attendance = store.get('attendance', {});
  attendance[date] = record;
  store.set('attendance', attendance);

  selectedAttDate = date;
  showToast('Attendance saved for ' + formatDate(date) + '.');
  showPage('mark-attendance');
}


/* ============================================================
   10. POP-UP FORM & MESSAGES
   ============================================================ */

/**
 * Opens the pop-up form.
 *  title    - heading text
 *  bodyHtml - the form fields (HTML)
 *  onSave   - runs when the form is submitted. Return false to keep the
 *             pop-up open (for example after a validation error).
 */
function showModal(title, bodyHtml, onSave) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHtml;
  $('modal-form').onsubmit = event => {
    event.preventDefault();
    if (onSave(event.target) !== false) closeModal();
  };
  $('modal').classList.remove('hidden');
}

function closeModal() {
  $('modal').classList.add('hidden');
}

/** Shows a short message at the bottom of the screen. */
function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + (type === 'error' ? 'error' : '');
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}


/* ============================================================
   11. START THE APP
   ============================================================ */

// Which function draws each page
const pages = {
  'dashboard': renderDashboard,
  'attendance': renderMyAttendance,
  'students': renderStudents,
  'mark-attendance': renderMarkAttendance,
  'timetable': renderTimetable,
  'exams': renderExams,
  'materials': renderMaterials,
  'announcements': renderAnnouncements
};

function init() {
  // First visit: create the sample data
  if (localStorage.getItem('erp_students') === null) seedSampleData();

  $('login-form').addEventListener('submit', handleLogin);

  // If the user was already logged in, skip the login screen
  const session = store.get('session', null);
  if (session) {
    const stillValid = session.role === 'admin' || store.get('students').some(s => s.id === session.id);
    if (stillValid) startApp(session);
    else store.remove('session');
  }
}

init();
