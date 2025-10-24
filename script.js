let coursesGrid = document.getElementById('coursesGrid');
let homeScreen = document.getElementById('home-screen');
let courseView = document.getElementById('course-view');
let sidebarTitle = document.getElementById('sidebarTitle');
let coursesList = document.getElementById('coursesList');
let contentArea = document.getElementById('contentArea');
let backBtn = document.getElementById('backBtn');
let themeToggle = document.getElementById('theme-toggle');

let allCourses = [];

async function loadCourses() {
  const res = await fetch('course.json');
  const data = await res.json();
  allCourses = data.courses;
  renderCourseGrid(allCourses);
}

function renderCourseGrid(courses) {
  coursesGrid.innerHTML = '';
  courses.forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <img src="${course.banner}" alt="${course.title}">
      <div class="course-info">
        <h3>${course.title}</h3>
        <p>${course.description}</p>
      </div>`;
    card.onclick = () => openCourse(course);
    coursesGrid.appendChild(card);
  });
}

async function openCourse(course) {
  homeScreen.classList.add('hidden');
  courseView.classList.remove('hidden');

  sidebarTitle.textContent = course.title;
  coursesList.innerHTML = '';
  contentArea.innerHTML = '';

  course.chapters.forEach(ch => {
    const li = document.createElement('li');
    li.textContent = ch.title;
    li.onclick = () => loadChapter(ch, li, course.title);
    coursesList.appendChild(li);
  });

  const savedChapterTitle = localStorage.getItem(`lastChapter_${course.title}`);
  let targetChapter = null;
  let targetLi = null;

  if (savedChapterTitle) {
    targetChapter = course.chapters.find(ch => ch.title === savedChapterTitle);
    targetLi = [...coursesList.children].find(li => li.textContent === savedChapterTitle);
  }

  if (!targetChapter) {
    targetChapter = course.chapters[0];
    targetLi = coursesList.children[0];
  }

  if (targetChapter && targetLi) await loadChapter(targetChapter, targetLi, course.title);

  localStorage.setItem('lastCourseTitle', course.title);
}

async function loadChapter(chapter, li, courseTitle) {
  document.querySelectorAll('.sidebar li').forEach(e => e.classList.remove('active'));
  li.classList.add('active');

  localStorage.setItem(`lastChapter_${courseTitle}`, chapter.title);

  const div = document.createElement('div');
  div.className = 'chapter';
  div.innerHTML = `<h3>${chapter.title}</h3>`;

  if (chapter.theoryPath) {
    const t = await fetch(chapter.theoryPath).then(r => r.text());
    const theory = document.createElement('div');
    theory.innerHTML = `<h4>Theory</h4>${t}`;
    div.appendChild(theory);
  }

  if (chapter.mcqPath) {
    const mcqs = await fetch(chapter.mcqPath).then(r => r.json());
    const container = document.createElement('div');
    container.innerHTML = `<h4>Theoretical Exercises</h4>`;
    mcqs.forEach((q, i) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'mcq';
      qDiv.innerHTML = `<p>${i + 1}. ${q.question}</p>`;
      q.options.forEach((opt, j) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="q${i}" value="${j}"> ${opt}`;
        label.querySelector('input').onchange = () => {
          label.parentElement.querySelectorAll('label').forEach(l => l.classList.remove('correct', 'wrong'));
          if (j === q.answerIndex) label.classList.add('correct');
          else label.classList.add('wrong');
        };
        qDiv.appendChild(label);
      });
      container.appendChild(qDiv);
    });
    div.appendChild(container);
  }

  if (chapter.codePath) {
    const codeQs = await fetch(chapter.codePath).then(r => r.json());
    const codeContainer = document.createElement('div');
    codeContainer.innerHTML = `<h4>Code Exercises</h4>`;

    codeQs.forEach((q, i) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'code-question';
      qDiv.innerHTML = `
        <p>${i + 1}. ${q.question}</p>
        <div class="code-window-bar">
          <div class="code-window-btn red"></div>
          <div class="code-window-btn yellow"></div>
          <div class="code-window-btn green"></div>
        </div>
        <div class="code-editor-wrap">
          <pre class="code-highlight"><code class="language-pl1"></code></pre>
          <textarea class="code-input"></textarea>
        </div>
        <button class="show-btn">Show Solution</button>
        <pre class="hidden"><code class="language-pl1">${q.answer}</code></pre>`;

      const btn = qDiv.querySelector('.show-btn');
      const ans = qDiv.querySelectorAll('pre')[1];
      btn.onclick = () => {
        ans.classList.toggle('hidden');
        Prism.highlightAll();
        btn.textContent = ans.classList.contains('hidden') ? 'Show Solution' : 'Hide Solution';
      };

      const wrapper = qDiv.querySelector(".code-editor-wrap");
      const input = wrapper.querySelector(".code-input");
      const code = wrapper.querySelector(".code-highlight code");

      function updateHighlight() {
        const val = input.value;
        const pos = input.selectionStart;
        const before = val.slice(0, pos);
        const after = val.slice(pos);
        const highlightedBefore = Prism.highlight(before, Prism.languages.pl1, "pl1");
        const highlightedAfter = Prism.highlight(after, Prism.languages.pl1, "pl1");
        code.innerHTML = highlightedBefore + '<span class="fake-caret"></span>' + highlightedAfter;
      }

      input.addEventListener("focus", () => {
        wrapper.classList.add("active");
        updateHighlight();
      });
      input.addEventListener("blur", () => {
        wrapper.classList.remove("active");
        updateHighlight();
      });
      function syncScroll() {
        const pre = wrapper.querySelector(".code-highlight");
        pre.scrollTop = input.scrollTop;
        pre.scrollLeft = input.scrollLeft;
      }
      input.addEventListener("scroll", syncScroll);
      

      input.addEventListener("input", updateHighlight);
      input.addEventListener("click", updateHighlight);
      input.addEventListener("keyup", updateHighlight);

      updateHighlight();


      codeContainer.appendChild(qDiv);
    });

    div.appendChild(codeContainer);
  }

  contentArea.innerHTML = '';
  contentArea.appendChild(div);
  Prism.highlightAll();
}

backBtn.onclick = () => {
  courseView.classList.add('hidden');
  homeScreen.classList.remove('hidden');
};

themeToggle.onchange = () => {
  document.body.classList.toggle('light', themeToggle.checked);
};

loadCourses();

Prism.languages.pl1 = {
  comment: /\/\*[\s\S]*?\*\//,
  string: /'(?:[^']|'')*'/,
  keyword: /\b(?:DECLARE|DO|END|IF|THEN|ELSE|SELECT|WHEN|OTHERWISE|CALL|RETURN|PUT|GET|ON|GO TO|PROCEDURE|BEGIN|FINISH|ALLOCATE|FREE|BY|TO|FROM|UNTIL|WHILE|REPEAT|INPUT|OUTPUT|OPEN|CLOSE|READ|WRITE|SKIP|LIST)\b/i,
  number: /\b\d+(?:\.\d+)?\b/,
  operator: /[-+*/=<>]/,
  punctuation: /[;:,()]/,
  variable: /\b[A-Z_][A-Z0-9_]*\b/i
};

Prism.highlightAllUnder(document);
