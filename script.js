/* ============================================================
   EduQuiz — script.js
   All JavaScript Logic — Quiz, Code Runner, Leaderboard
   ============================================================ */

// ============================================================
//  SHARED STATE (LocalStorage)
// ============================================================
let questions  = JSON.parse(localStorage.getItem('eq_questions')   || '[]');
let leaderboard = JSON.parse(localStorage.getItem('eq_leaderboard') || '[]');

// ============================================================
//  TOAST NOTIFICATION (used on all pages)
// ============================================================
let toastTimer;

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ============================================================
//  TEACHER PAGE — teacher.html
// ============================================================

function addQuestion() {
  const q       = document.getElementById('questionInput').value.trim();
  const a       = document.getElementById('optA').value.trim();
  const b       = document.getElementById('optB').value.trim();
  const c       = document.getElementById('optC').value.trim();
  const d       = document.getElementById('optD').value.trim();
  const correct = document.getElementById('correctAns').value;
  const points  = parseInt(document.getElementById('pointsInput').value) || 10;

  if (!q || !a || !b || !c || !d) {
    showToast('⚠ Please fill in all fields', 'error');
    return;
  }

  const question = {
    id: Date.now(),
    q,
    options: { A: a, B: b, C: c, D: d },
    correct,
    points
  };

  questions.push(question);
  saveQuestions();
  renderQuestionsList();
  clearTeacherForm();
  showToast('✓ Question added successfully!', 'success');
}

function deleteQuestion(id) {
  questions = questions.filter(q => q.id !== id);
  saveQuestions();
  renderQuestionsList();
  showToast('Question removed', 'error');
}

function saveQuestions() {
  localStorage.setItem('eq_questions', JSON.stringify(questions));
  const tag = document.getElementById('questionCountTag');
  if (tag) {
    tag.textContent = questions.length + ' question' + (questions.length !== 1 ? 's' : '');
  }
}

function clearTeacherForm() {
  ['questionInput', 'optA', 'optB', 'optC', 'optD'].forEach(
    id => { const el = document.getElementById(id); if (el) el.value = ''; }
  );
  const pts = document.getElementById('pointsInput');
  if (pts) pts.value = '10';
}

function renderQuestionsList() {
  const el = document.getElementById('questionsList');
  if (!el) return;

  // Also update count tag
  saveQuestions();

  if (!questions.length) {
    el.innerHTML = '<div class="empty-state"><span class="emoji">📝</span><p>No questions yet. Add your first question above!</p></div>';
    return;
  }

  el.innerHTML = questions.map((q, i) => `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;
                padding:0.8rem 1rem;margin-top:0.6rem;
                display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.78rem;color:var(--accent);font-family:'Space Mono',monospace;margin-bottom:0.2rem;">
          Q${i + 1} &bull; ${q.points} pts
        </div>
        <div style="font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${q.q}
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.25rem;">
          Correct: (${q.correct}) ${q.options[q.correct]}
        </div>
      </div>
      <button onclick="deleteQuestion(${q.id})"
        style="background:rgba(245,75,0,0.12);border:1px solid rgba(245,75,0,0.3);
               color:var(--danger);border-radius:6px;padding:0.25rem 0.6rem;
               cursor:pointer;font-size:0.75rem;flex-shrink:0;">✕</button>
    </div>
  `).join('');
}

// ============================================================
//  STUDENT PAGE — student.html
// ============================================================

let currentQ    = 0;
let userAnswers = {};
let studentName = '';

function startQuiz() {
  const name = document.getElementById('studentName').value.trim();

  if (!name) {
    showToast('Please enter your name', 'error');
    return;
  }
  if (!questions.length) {
    document.getElementById('noQuestionsMsg').style.display = 'block';
    return;
  }

  studentName = name;
  currentQ    = 0;
  userAnswers = {};

  document.getElementById('quizStartScreen').style.display  = 'none';
  document.getElementById('quizContainer').classList.add('active');
  document.getElementById('resultsCard').classList.remove('active');

  renderQuestion();
}

function renderQuestion() {
  const q     = questions[currentQ];
  const total = questions.length;
  const pct   = ((currentQ + 1) / total) * 100;

  document.getElementById('progressFill').style.width      = pct + '%';
  document.getElementById('quizCounterText').textContent   = `Question ${currentQ + 1} of ${total}`;

  // Show/hide Prev / Next / Submit buttons
  document.getElementById('prevBtn').style.display   = currentQ > 0            ? 'inline-flex' : 'none';
  document.getElementById('nextBtn').style.display   = currentQ < total - 1    ? 'inline-flex' : 'none';
  document.getElementById('submitBtn').style.display = currentQ === total - 1  ? 'inline-flex' : 'none';

  const letters = ['A', 'B', 'C', 'D'];
  document.getElementById('questionsArea').innerHTML = `
    <div class="question-card">
      <div class="question-meta">
        <span class="q-number">Q${currentQ + 1}</span>
        <span class="q-points">${q.points} pts</span>
      </div>
      <div class="question-text">${q.q}</div>
      <div class="options-list">
        ${letters.map(l => `
          <button class="option-btn ${userAnswers[currentQ] === l ? 'selected' : ''}"
                  onclick="selectAnswer('${l}')">
            <span class="option-letter">${l}</span>
            ${q.options[l]}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectAnswer(letter) {
  userAnswers[currentQ] = letter;
  renderQuestion();
}

function nextQuestion() {
  if (currentQ < questions.length - 1) { currentQ++; renderQuestion(); }
}

function prevQuestion() {
  if (currentQ > 0) { currentQ--; renderQuestion(); }
}

function submitQuiz() {
  let score       = 0;
  let totalPoints = 0;
  let correct     = 0;

  questions.forEach((q, i) => {
    totalPoints += q.points;
    if (userAnswers[i] === q.correct) { score += q.points; correct++; }
  });

  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  // Save entry to leaderboard
  const entry = {
    name: studentName,
    score,
    totalPoints,
    percent: pct,
    correct,
    total: questions.length,
    date: new Date().toLocaleDateString()
  };
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.percent - a.percent);
  localStorage.setItem('eq_leaderboard', JSON.stringify(leaderboard));

  // Show results screen
  document.getElementById('quizContainer').classList.remove('active');
  document.getElementById('resultsCard').classList.add('active');
  document.getElementById('scorePercent').textContent      = pct + '%';
  document.getElementById('resultStudentName').textContent = studentName + "'s Result";
  document.getElementById('scoreDetail').textContent       =
    `${correct} / ${questions.length} correct  •  ${score} / ${totalPoints} points`;

  const feedback = pct >= 80 ? '🎉 Excellent work!'
                 : pct >= 60 ? '👍 Good job!'
                 : pct >= 40 ? '💪 Keep practicing!'
                 :             '📚 Study more and retry!';
  const color    = pct >= 80 ? 'var(--accent)'
                 : pct >= 60 ? 'var(--accent2)'
                 : pct >= 40 ? 'var(--accent3)'
                 :             'var(--danger)';

  document.getElementById('scoreFeedback').textContent  = feedback;
  document.getElementById('scoreFeedback').style.color  = color;
}

function retakeQuiz() {
  document.getElementById('quizStartScreen').style.display = 'block';
  document.getElementById('quizContainer').classList.remove('active');
  document.getElementById('resultsCard').classList.remove('active');
  document.getElementById('studentName').value = '';
}

// ============================================================
//  LEADERBOARD PAGE — leaderboard.html
// ============================================================

function renderLeaderboard() {
  const el = document.getElementById('leaderboardBody');
  if (!el) return;

  if (!leaderboard.length) {
    el.innerHTML = '<div class="empty-state"><span class="emoji">🏆</span><p>No scores yet. Take a quiz first!</p></div>';
    return;
  }

  el.innerHTML = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Student</th>
          <th>Score</th>
          <th>Correct</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${leaderboard.map((e, i) => `
          <tr>
            <td>
              <span class="rank-badge ${i < 3 ? 'rank-' + (i + 1) : 'rank-other'}">
                ${i + 1}
              </span>
            </td>
            <td><strong>${e.name}</strong></td>
            <td><span class="score-pill">${e.percent}%</span></td>
            <td style="color:var(--text-muted);font-family:'Space Mono',monospace;font-size:0.8rem;">
              ${e.correct}/${e.total}
            </td>
            <td style="color:var(--text-muted);font-size:0.8rem;">${e.date}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function clearLeaderboard() {
  if (!confirm('Clear all leaderboard data?')) return;
  leaderboard = [];
  localStorage.removeItem('eq_leaderboard');
  renderLeaderboard();
  showToast('Leaderboard cleared', 'error');
}

// ============================================================
//  CODE RUNNER PAGE — code.html
// ============================================================

const snippets = {
  hello: `// Hello World Example\nconsole.log("Hello, World!");\nconsole.log("Welcome to EduQuiz Code Runner!");`,

  loop: `// For Loop Example\nfor (let i = 1; i <= 5; i++) {\n  console.log("Iteration: " + i);\n}\n\n// While Loop\nlet n = 10;\nwhile (n > 0) {\n  console.log("Countdown: " + n);\n  n -= 3;\n}`,

  array: `// Array Methods\nconst fruits = ["Apple", "Banana", "Mango", "Orange"];\n\nconsole.log("Original:", fruits);\nconsole.log("Length:", fruits.length);\n\nconst upper = fruits.map(f => f.toUpperCase());\nconsole.log("Uppercase:", upper);\n\nconst long = fruits.filter(f => f.length > 5);\nconsole.log("Long names:", long);\n\nconst found = fruits.find(f => f.startsWith("M"));\nconsole.log("Starts with M:", found);`,

  function: `// Functions in JavaScript\n\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconst add = (a, b) => a + b;\n\nconst power = (base, exp = 2) => Math.pow(base, exp);\n\nconsole.log(greet("Student"));\nconsole.log("3 + 7 =", add(3, 7));\nconsole.log("5^3 =", power(5, 3));\nconsole.log("4^2 =", power(4));`,

  object: `// Objects in JavaScript\n\nconst student = {\n  name: "Ali",\n  age: 21,\n  university: "Riphah International",\n  skills: ["HTML", "CSS", "JavaScript"],\n  greet() {\n    return \`Hi, I'm \${this.name} from \${this.university}\`;\n  }\n};\n\nconsole.log(student.name);\nconsole.log(student.skills);\nconsole.log(student.greet());\n\nconst { name, age } = student;\nconsole.log(\`\${name} is \${age} years old\`);`,

  class: `// Classes in JavaScript\n\nclass Animal {\n  constructor(name, sound) {\n    this.name = name;\n    this.sound = sound;\n  }\n  speak() {\n    return \`\${this.name} says \${this.sound}!\`;\n  }\n}\n\nclass Dog extends Animal {\n  constructor(name) {\n    super(name, "Woof");\n  }\n  fetch(item) {\n    return \`\${this.name} fetched the \${item}!\`;\n  }\n}\n\nconst dog = new Dog("Buddy");\nconsole.log(dog.speak());\nconsole.log(dog.fetch("ball"));`
};

function loadSnippet(key) {
  const el = document.getElementById('codeInput');
  if (el) el.value = snippets[key];
}

function runCode() {
  const code     = document.getElementById('codeInput').value;
  const outputEl = document.getElementById('codeOutput');
  const statusEl = document.getElementById('outputStatus');
  const logs     = [];

  // Save original console methods
  const origConsole = {
    log:   console.log,
    error: console.error,
    warn:  console.warn
  };

  // Override console to capture output
  const capture = (...args) => logs.push(
    args.map(a => {
      if (typeof a === 'object' && a !== null) {
        try { return JSON.stringify(a, null, 2); } catch { return String(a); }
      }
      return String(a);
    }).join(' ')
  );

  console.log   = capture;
  console.warn  = capture;
  console.error = capture;

  try {
    const fn = new Function(code);
    fn();

    // Restore console
    console.log   = origConsole.log;
    console.warn  = origConsole.warn;
    console.error = origConsole.error;

    if (logs.length === 0) {
      outputEl.innerHTML = '<span class="output-success">// Code executed successfully (no output)</span>';
    } else {
      outputEl.innerHTML =
        '<span class="output-success">// ✓ Execution successful\n\n</span>' +
        logs.map(l => escapeHtml(l)).join('\n');
    }
    statusEl.textContent = '✓ Success';
    statusEl.className   = 'output-status success';
    showToast('✓ Code executed successfully', 'success');

  } catch (err) {
    // Restore console on error too
    console.log   = origConsole.log;
    console.warn  = origConsole.warn;
    console.error = origConsole.error;

    outputEl.innerHTML =
      `<span class="output-error">// ✕ Error\n\n` +
      `${escapeHtml(err.name)}: ${escapeHtml(err.message)}\n\n` +
      `${err.stack ? escapeHtml(err.stack.split('\n').slice(1, 3).join('\n')) : ''}</span>`;
    statusEl.textContent = '✕ Error';
    statusEl.className   = 'output-status error';
    showToast('✕ ' + err.message, 'error');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clearCode() {
  const el = document.getElementById('codeInput');
  if (el) el.value = '';
}

function clearOutput() {
  const out = document.getElementById('codeOutput');
  const st  = document.getElementById('outputStatus');
  if (out) out.innerHTML = '<span class="output-placeholder">// Output will appear here...</span>';
  if (st)  { st.textContent = 'Ready'; st.className = 'output-status'; }
}

// ============================================================
//  PAGE INIT — runs on DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // Tab key support inside code editor
  const codeInput = document.getElementById('codeInput');
  if (codeInput) {
    codeInput.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = e.target.selectionStart;
        e.target.value =
          e.target.value.substring(0, s) + '  ' +
          e.target.value.substring(e.target.selectionEnd);
        e.target.selectionStart = e.target.selectionEnd = s + 2;
      }
    });
  }

  // Teacher page init
  if (document.getElementById('questionsList')) {
    renderQuestionsList();
  }

  // Leaderboard page init
  if (document.getElementById('leaderboardBody')) {
    renderLeaderboard();
  }
});
