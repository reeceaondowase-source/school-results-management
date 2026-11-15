const STORAGE_KEY = 'classroom-school-results-v1';
const DEFAULT_CLASSES = ['Grade 7A', 'Grade 7B', 'Grade 8A', 'Grade 8B', 'Grade 9A', 'Grade 9B'];
const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT'];
const COLORS = ['#7666e7', '#38ad85', '#e4a941', '#e07888', '#5d8ed0', '#b177cb'];
const starterData = {
  students: [
    { id: 'GH-201', firstName: 'Maya', lastName: 'Johnson', className: 'Grade 8A', gender: 'Female' },
    { id: 'GH-202', firstName: 'Ethan', lastName: 'Williams', className: 'Grade 8A', gender: 'Male' },
    { id: 'GH-203', firstName: 'Ava', lastName: 'Martinez', className: 'Grade 9A', gender: 'Female' },
    { id: 'GH-204', firstName: 'Noah', lastName: 'Davis', className: 'Grade 7B', gender: 'Male' },
    { id: 'GH-205', firstName: 'Zoe', lastName: 'Wilson', className: 'Grade 9B', gender: 'Female' },
    { id: 'GH-206', firstName: 'Liam', lastName: 'Brown', className: 'Grade 7A', gender: 'Male' },
    { id: 'GH-207', firstName: 'Amara', lastName: 'Okafor', className: 'Grade 8B', gender: 'Female' },
    { id: 'GH-208', firstName: 'Oliver', lastName: 'Taylor', className: 'Grade 9A', gender: 'Male' },
    { id: 'GH-209', firstName: 'Sofia', lastName: 'Anderson', className: 'Grade 7A', gender: 'Female' }
  ],
  results: [
    { studentId: 'GH-201', subject: 'Mathematics', assessment: 'Mid-term exam', term: 'Term 2', score: 92 },
    { studentId: 'GH-202', subject: 'Science', assessment: 'Class test', term: 'Term 2', score: 84 },
    { studentId: 'GH-203', subject: 'English', assessment: 'Mid-term exam', term: 'Term 2', score: 89 },
    { studentId: 'GH-204', subject: 'Mathematics', assessment: 'Class test', term: 'Term 2', score: 76 },
    { studentId: 'GH-205', subject: 'ICT', assessment: 'Project', term: 'Term 2', score: 95 },
    { studentId: 'GH-206', subject: 'History', assessment: 'Mid-term exam', term: 'Term 2', score: 68 },
    { studentId: 'GH-207', subject: 'Geography', assessment: 'Class test', term: 'Term 2', score: 81 },
    { studentId: 'GH-208', subject: 'Science', assessment: 'Mid-term exam', term: 'Term 2', score: 73 },
    { studentId: 'GH-209', subject: 'English', assessment: 'Class test', term: 'Term 2', score: 88 },
    { studentId: 'GH-201', subject: 'Science', assessment: 'Class test', term: 'Term 2', score: 87 },
    { studentId: 'GH-202', subject: 'Mathematics', assessment: 'Mid-term exam', term: 'Term 2', score: 78 },
    { studentId: 'GH-203', subject: 'ICT', assessment: 'Project', term: 'Term 2', score: 94 },
    { studentId: 'GH-204', subject: 'English', assessment: 'Class test', term: 'Term 2', score: 72 },
    { studentId: 'GH-205', subject: 'Geography', assessment: 'Mid-term exam', term: 'Term 2', score: 86 },
    { studentId: 'GH-206', subject: 'Science', assessment: 'Class test', term: 'Term 2', score: 79 },
    { studentId: 'GH-207', subject: 'Mathematics', assessment: 'Mid-term exam', term: 'Term 2', score: 91 },
    { studentId: 'GH-208', subject: 'History', assessment: 'Class test', term: 'Term 2', score: 67 },
    { studentId: 'GH-209', subject: 'ICT', assessment: 'Project', term: 'Term 2', score: 96 }
  ]
};
let data = loadData();
let toastTimer;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.students) && Array.isArray(saved.results)) return saved;
  } catch (error) { console.warn('Could not load saved school data.', error); }
  return JSON.parse(JSON.stringify(starterData));
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (error) { showToast('Could not save data in this browser.'); }
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function studentFor(id) { return data.students.find(student => student.id === id); }
function fullName(student) { return student ? `${student.firstName} ${student.lastName}` : 'Unknown student'; }
function average(scores) { return scores.length ? Math.round(scores.reduce((sum, score) => sum + Number(score), 0) / scores.length) : 0; }
function gradeFor(score) { if (score >= 90) return 'A'; if (score >= 80) return 'B'; if (score >= 70) return 'C'; if (score >= 60) return 'D'; return 'F'; }
function gradeClass(score) { const grade = gradeFor(score); return grade === 'A' ? '' : ` grade-${grade.toLowerCase()}`; }
function initials(student) { return `${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase(); }
function avatar(student, index) { return `<span class="student-avatar avatar-${index % 5}">${escapeHTML(initials(student))}</span>`; }
function studentCell(student, index) { return `<span class="student-cell">${avatar(student, index)}${escapeHTML(fullName(student))}</span>`; }
function resultRows() { return [...data.results].reverse().map(result => ({ ...result, student: studentFor(result.studentId) })).filter(row => row.student); }
function uniqueClasses() { return [...new Set([...DEFAULT_CLASSES, ...data.students.map(student => student.className)])].sort((a, b) => a.localeCompare(b)); }
function avgForStudent(studentId) { return average(data.results.filter(result => result.studentId === studentId).map(result => result.score)); }
function scoreLabel(score) { return `<span class="score-cell">${Number(score)}<span class="muted"> / 100</span></span>`; }
function showToast(message) {
  const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function populateClassFilters() {
  const classes = uniqueClasses();
  ['studentClassFilter', 'resultClassFilter'].forEach(id => {
    const select = document.getElementById(id); const current = select.value;
    select.innerHTML = `<option value="all">All classes</option>${classes.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('')}`;
    if ([...select.options].some(option => option.value === current)) select.value = current;
  });
  const subjectSelect = document.getElementById('resultSubjectFilter'); const currentSubject = subjectSelect.value;
  subjectSelect.innerHTML = `<option value="all">All subjects</option>${SUBJECTS.map(subject => `<option>${escapeHTML(subject)}</option>`).join('')}`;
  if ([...subjectSelect.options].some(option => option.value === currentSubject)) subjectSelect.value = currentSubject;
}
function renderDashboard() {
  const total = data.students.length; const resultCount = data.results.length;
  document.getElementById('totalStudents').textContent = total;
  document.getElementById('studentNavCount').textContent = total;
  document.getElementById('resultsRecorded').textContent = resultCount;
  document.getElementById('resultCoverage').textContent = `${Math.min(100, Math.round(resultCount / Math.max(1, total * SUBJECTS.length) * 100))}%`;
  document.getElementById('averageScore').textContent = average(data.results.map(result => result.score));
  document.getElementById('totalClasses').textContent = new Set(data.students.map(student => student.className)).size || DEFAULT_CLASSES.length;
  renderChart(); renderSubjects(); renderRecentResults();
}
function renderChart() {
  const classes = uniqueClasses().filter(name => data.students.some(student => student.className === name));
  const chart = document.getElementById('performanceChart');
  chart.innerHTML = classes.map(name => {
    const ids = data.students.filter(student => student.className === name).map(student => student.id);
    const scores = data.results.filter(result => ids.includes(result.studentId)).map(result => result.score);
    const value = average(scores);
    return `<div class="chart-bar-group"><div class="chart-bar" style="--bar-height:${value || 3}%" title="${value}%"></div><span>${escapeHTML(name.replace('Grade ', 'Gr '))}</span></div>`;
  }).join('') || '<span class="empty-state">Add students and results to see class performance.</span>';
}
function renderSubjects() {
  const overview = document.getElementById('subjectOverview');
  overview.innerHTML = SUBJECTS.map((subject, index) => {
    const scores = data.results.filter(result => result.subject === subject).map(result => result.score);
    const value = average(scores);
    return `<div class="subject-item"><span class="subject-name">${escapeHTML(subject)}</span><div class="subject-track"><div class="subject-fill" style="--fill:${value}%;--subject-color:${COLORS[index]}"></div></div><span class="subject-score">${scores.length ? `${value}%` : '—'}</span></div>`;
  }).join('');
}
function renderRecentResults() {
  const body = document.getElementById('recentResultsBody');
  body.innerHTML = resultRows().slice(0, 5).map((result, index) => `<tr><td>${studentCell(result.student, index)}</td><td>${escapeHTML(result.student.className)}</td><td>${escapeHTML(result.subject)}</td><td>${escapeHTML(result.assessment)}</td><td>${scoreLabel(result.score)}</td><td><span class="grade-badge${gradeClass(result.score)}">${gradeFor(result.score)}</span></td></tr>`).join('') || '<tr><td colspan="6" class="empty-state">No results yet. Enter your first result to get started.</td></tr>';
}
function renderStudents() {
  const query = document.getElementById('studentSearch').value.trim().toLowerCase();
  const selectedClass = document.getElementById('studentClassFilter').value;
  const students = [...data.students].sort((a, b) => fullName(a).localeCompare(fullName(b))).filter(student => `${fullName(student)} ${student.id} ${student.className}`.toLowerCase().includes(query) && (selectedClass === 'all' || student.className === selectedClass));
  document.getElementById('studentCountLabel').textContent = `${students.length} student${students.length === 1 ? '' : 's'}`;
  document.getElementById('studentsTableBody').innerHTML = students.map((student, index) => {
    const results = data.results.filter(result => result.studentId === student.id); const avg = average(results.map(result => result.score));
    return `<tr><td>${studentCell(student, index)}</td><td>${escapeHTML(student.id)}</td><td>${escapeHTML(student.className)}</td><td>${escapeHTML(student.gender)}</td><td>${results.length}</td><td>${results.length ? `<span class="grade-badge${gradeClass(avg)}">${avg}%</span>` : '<span class="muted">No scores</span>'}</td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty-state">No students match your search.</td></tr>';
}
function renderResults() {
  const query = document.getElementById('resultSearch').value.trim().toLowerCase();
  const selectedClass = document.getElementById('resultClassFilter').value; const selectedSubject = document.getElementById('resultSubjectFilter').value;
  const rows = resultRows().filter(result => `${fullName(result.student)} ${result.subject} ${result.assessment} ${result.student.className}`.toLowerCase().includes(query) && (selectedClass === 'all' || result.student.className === selectedClass) && (selectedSubject === 'all' || result.subject === selectedSubject));
  document.getElementById('resultsTableBody').innerHTML = rows.map((result, index) => `<tr><td>${studentCell(result.student, index)}</td><td>${escapeHTML(result.student.className)}</td><td>${escapeHTML(result.subject)}</td><td>${escapeHTML(result.assessment)}</td><td>${escapeHTML(result.term)}</td><td>${scoreLabel(result.score)}</td><td><span class="grade-badge${gradeClass(result.score)}">${gradeFor(result.score)}</span></td></tr>`).join('');
  document.getElementById('emptyResults').classList.toggle('hidden', rows.length > 0);
}
function renderClasses() {
  const classNames = uniqueClasses().filter(name => data.students.some(student => student.className === name));
  document.getElementById('classGrid').innerHTML = classNames.map((name, index) => {
    const students = data.students.filter(student => student.className === name); const ids = students.map(student => student.id);
    const scores = data.results.filter(result => ids.includes(result.studentId));
    const subjects = [...new Set(scores.map(result => result.subject))];
    return `<article class="class-card"><div class="class-card-top"><h2>${escapeHTML(name)}</h2><span class="class-tag">2024 / 2025</span></div><p class="class-meta">${students.length} student${students.length === 1 ? '' : 's'} · ${subjects.length} subject${subjects.length === 1 ? '' : 's'} assessed</p><div class="class-performance"><span>Average performance</span><strong>${scores.length ? `${average(scores.map(result => result.score))}%` : '—'}</strong></div><div class="class-subjects">${(subjects.length ? subjects : SUBJECTS.slice(0, 3)).map(subject => `<span>${escapeHTML(subject)}</span>`).join('')}</div></article>`;
  }).join('') || '<article class="panel empty-state">No classes yet. Add a student to get started.</article>';
}
function renderReports() {
  const schoolAverage = average(data.results.map(result => result.score));
  const studentAverages = data.students.map(student => avgForStudent(student.id)).filter((value, index) => data.results.some(result => result.studentId === data.students[index].id));
  document.getElementById('reportAverage').textContent = schoolAverage;
  document.getElementById('passingStudents').textContent = studentAverages.filter(value => value >= 50).length;
  document.getElementById('reportResultCount').textContent = data.results.length;
  const subjectStats = SUBJECTS.map(subject => ({ subject, scores: data.results.filter(result => result.subject === subject).map(result => result.score) })).filter(item => item.scores.length).map(item => ({ ...item, average: average(item.scores) })).sort((a, b) => b.average - a.average);
  document.getElementById('topSubject').textContent = subjectStats[0]?.subject || '—';
  document.getElementById('topSubjectAverage').textContent = subjectStats[0] ? `${subjectStats[0].average}% average score` : 'No scores yet';
  document.getElementById('classSummaryBody').innerHTML = uniqueClasses().filter(name => data.students.some(student => student.className === name)).map(name => {
    const students = data.students.filter(student => student.className === name); const ids = students.map(student => student.id);
    const scores = data.results.filter(result => ids.includes(result.studentId));
    const averages = students.map(student => avgForStudent(student.id)).filter(value => data.results.some(result => result.studentId === student.id));
    const passRate = averages.length ? Math.round(averages.filter(value => value >= 50).length / averages.length * 100) : 0;
    return `<tr><td><strong>${escapeHTML(name)}</strong></td><td>${students.length}</td><td>${scores.length}</td><td>${scores.length ? `<span class="grade-badge${gradeClass(average(scores.map(result => result.score)))}">${average(scores.map(result => result.score))}%</span>` : '—'}</td><td>${averages.length ? `${passRate}%` : '—'}</td></tr>`;
  }).join('') || '<tr><td colspan="5" class="empty-state">No class data yet.</td></tr>';
}
function renderAll() { populateClassFilters(); renderDashboard(); renderStudents(); renderResults(); renderClasses(); renderReports(); }
function switchView(name) {
  const valid = ['dashboard', 'students', 'results', 'classes', 'reports'].includes(name) ? name : 'dashboard';
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${valid}`));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === valid));
  const titles = { dashboard: 'Overview', students: 'Students', results: 'Results', classes: 'Classes', reports: 'Reports' };
  document.getElementById('breadcrumbCurrent').textContent = titles[valid];
  document.getElementById('sidebar').classList.remove('open');
  history.replaceState(null, '', `#${valid}`);
}
function openStudentModal() {
  const form = document.getElementById('studentForm'); form.reset();
  form.elements.className.innerHTML = uniqueClasses().map(name => `<option>${escapeHTML(name)}</option>`).join('');
  document.getElementById('modalBackdrop').classList.remove('hidden'); form.elements.firstName.focus();
}
function closeStudentModal() { document.getElementById('modalBackdrop').classList.add('hidden'); }
function openResultModal() {
  const form = document.getElementById('resultForm'); form.reset();
  form.elements.studentId.innerHTML = data.students.map(student => `<option value="${escapeHTML(student.id)}">${escapeHTML(fullName(student))} · ${escapeHTML(student.className)}</option>`).join('');
  form.elements.subject.innerHTML = SUBJECTS.map(subject => `<option>${escapeHTML(subject)}</option>`).join('');
  if (!data.students.length) { showToast('Add a student before entering results.'); switchView('students'); return; }
  document.getElementById('resultModalBackdrop').classList.remove('hidden'); form.elements.studentId.focus();
}
function closeResultModal() { document.getElementById('resultModalBackdrop').classList.add('hidden'); }
function exportCSV() {
  const rows = resultRows();
  const csv = [['Student', 'Student ID', 'Class', 'Subject', 'Assessment', 'Term', 'Score', 'Grade'], ...rows.map(result => [fullName(result.student), result.student.id, result.student.className, result.subject, result.assessment, result.term, result.score, gradeFor(result.score)])]
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'greenwood-high-results.csv'; link.click(); URL.revokeObjectURL(link.href); showToast('Results exported as CSV.');
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('[data-action="add-student"]').forEach(button => button.addEventListener('click', openStudentModal));
document.querySelectorAll('[data-action="add-result"]').forEach(button => button.addEventListener('click', openResultModal));
document.getElementById('studentSearch').addEventListener('input', renderStudents);
document.getElementById('studentClassFilter').addEventListener('change', renderStudents);
document.getElementById('resultSearch').addEventListener('input', renderResults);
document.getElementById('resultClassFilter').addEventListener('change', renderResults);
document.getElementById('resultSubjectFilter').addEventListener('change', renderResults);
document.getElementById('exportResults').addEventListener('click', exportCSV);
document.getElementById('printReport').addEventListener('click', () => window.print());
document.getElementById('mobileMenu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('modalClose').addEventListener('click', closeStudentModal);
document.getElementById('cancelModal').addEventListener('click', closeStudentModal);
document.getElementById('resultModalClose').addEventListener('click', closeResultModal);
document.getElementById('cancelResultModal').addEventListener('click', closeResultModal);
document.getElementById('modalBackdrop').addEventListener('click', event => { if (event.target.id === 'modalBackdrop') closeStudentModal(); });
document.getElementById('resultModalBackdrop').addEventListener('click', event => { if (event.target.id === 'resultModalBackdrop') closeResultModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeStudentModal(); closeResultModal(); } });
document.getElementById('studentForm').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
  const id = String(values.get('studentId')).trim().toUpperCase();
  if (data.students.some(student => student.id.toLowerCase() === id.toLowerCase())) { showToast('That student ID is already in use.'); form.elements.studentId.focus(); return; }
  const student = { id, firstName: String(values.get('firstName')).trim(), lastName: String(values.get('lastName')).trim(), className: String(values.get('className')), gender: String(values.get('gender')) };
  data.students.push(student); saveData(); renderAll(); closeStudentModal(); showToast(`${fullName(student)} added successfully.`);
});
document.getElementById('resultForm').addEventListener('submit', event => {
  event.preventDefault(); const values = new FormData(event.currentTarget);
  data.results.push({ studentId: String(values.get('studentId')), subject: String(values.get('subject')), assessment: String(values.get('assessment')).trim(), term: String(values.get('term')), score: Number(values.get('score')) });
  saveData(); renderAll(); closeResultModal(); showToast('Result saved successfully.');
});
window.addEventListener('hashchange', () => switchView(location.hash.slice(1)));
renderAll();
if (location.hash) switchView(location.hash.slice(1));
