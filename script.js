const coursesList = document.getElementById('coursesList');
const homeScreen = document.getElementById('homeScreen');
const courseScreen = document.getElementById('courseScreen');
const contentArea = document.getElementById('contentArea');
const backBtn = document.getElementById('backBtn');

async function loadCourses() {
    const res = await fetch('course.json');
    const data = await res.json();
    coursesList.innerHTML = '';
    data.courses.forEach(course => {
        const li = document.createElement('li');
        li.textContent = course.title;
        li.onclick = () => loadCourse(course, li);
        coursesList.appendChild(li);
    });
}

async function loadCourse(course, li) {
    document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
    li.classList.add('active');

    homeScreen.classList.add('hidden');
    courseScreen.classList.remove('hidden');

    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseDesc').textContent = course.description;
    contentArea.innerHTML = '';

    for (const ch of course.chapters) {
        const chDiv = document.createElement('div');
        chDiv.className = 'chapter';
        chDiv.innerHTML = `<h3>${ch.title}</h3>`;
        contentArea.appendChild(chDiv);

        if (ch.theoryPath) {
            const t = await fetch(ch.theoryPath).then(r => r.text());
            const theory = document.createElement('div');
            theory.innerHTML = `<h4>Theory</h4>${t}`;
            chDiv.appendChild(theory);
        }

        if (ch.mcqPath) {
            const mcqs = await fetch(ch.mcqPath).then(r => r.json());
            const mcqContainer = document.createElement('div');
            mcqContainer.innerHTML = `<h4>Multiple Choice</h4>`;
            mcqs.forEach((q, idx) => {
                const qDiv = document.createElement('div');
                qDiv.className = 'mcq';
                qDiv.innerHTML = `<p>${idx + 1}. ${q.question}</p>`;
                q.options.forEach((opt, i) => {
                    const lbl = document.createElement('label');
                    lbl.innerHTML = `<input type="radio" name="q${idx}" value="${i}"> ${opt}`;
                    lbl.querySelector('input').onchange = () => {
                        qDiv.querySelectorAll('label').forEach(l => l.classList.remove('correct', 'wrong'));
                        if (i === q.answerIndex) lbl.classList.add('correct');
                        else lbl.classList.add('wrong');
                    };
                    qDiv.appendChild(lbl);
                });
                mcqContainer.appendChild(qDiv);
            });
            chDiv.appendChild(mcqContainer);
        }

        if (ch.codePath) {
            const codeQs = await fetch(ch.codePath).then(r => r.json());
            const codeContainer = document.createElement('div');
            codeContainer.innerHTML = `<h4>Code Exercises</h4>`;
            codeQs.forEach((q, idx) => {
                const qDiv = document.createElement('div');
                qDiv.className = 'code-question';
                qDiv.innerHTML = `
                    <p>${idx + 1}. ${q.question}</p>
                    <textarea class="code-input language-pl1"></textarea>
                    <button class="show-btn">Show Solution</button>
                    <pre class="hidden"><code class="language-pl1">${q.answer}</code></pre>
                `;
                const btn = qDiv.querySelector('.show-btn');
                const ans = qDiv.querySelector('pre');
                btn.onclick = () => {
                    ans.classList.toggle('hidden');
                    Prism.highlightAll();
                    btn.textContent = ans.classList.contains('hidden') ? 'Show Solution' : 'Hide Solution';
                };
                codeContainer.appendChild(qDiv);
            });
            chDiv.appendChild(codeContainer);
        }
    }
    Prism.highlightAll();
}

backBtn.onclick = () => {
    document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
    homeScreen.classList.remove('hidden');
    courseScreen.classList.add('hidden');
    contentArea.innerHTML = '';
};

loadCourses();
