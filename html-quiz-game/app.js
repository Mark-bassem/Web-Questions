(() => {
  const $ = (id) => document.getElementById(id);

  const el = {
    intro: $("screen-intro"),
    quiz: $("screen-quiz"),
    result: $("screen-result"),
    leader: $("screen-leader"),

    playerName: $("playerName"),
    btnStart: $("btn-start"),
    btnShowLeader: $("btn-show-leader"),

    score: $("score"),
    qIndex: $("qIndex"),
    qTotal: $("qTotal"),

    timer: $("timer"),
    progressBar: $("progressBar"),

    questionText: $("questionText"),
    answers: $("answers"),
    feedbackBox: $("feedbackBox"),

    btnSubmit: $("btn-submit"),
    btnNext: $("btn-next"),

    finalScore: $("finalScore"),
    correctCount: $("correctCount"),
    totalCount: $("totalCount"),

    btnSave: $("btn-save"),
    btnRetry: $("btn-retry"),
    btnBack: $("btn-back"),
    btnContinueQuiz: $("btn-continue-quiz"),

    leaderBody: $("leaderBody")
  };

  const QUIZ_DATA = Array.isArray(window.QUIZ_DATA) ? window.QUIZ_DATA.slice() : [];
  if (!QUIZ_DATA.length) return;

  const STORAGE_KEY = "htmlQuizLeaderboard_v1";

  const state = {
    score: 0,
    correctCount: 0,
    idx: 0,
    selectedIndex: null,
    locked: false,
    timerId: null,
    timeLeft: 0,
    timePerQuestionSec: 20,
    order: []
  };

  const setScreen = (screen) => {
    for (const s of ["intro", "quiz", "result", "leader"]) {
      if (el[s]) el[s].classList.toggle("hidden", s !== screen);
    }
  };

  const formatName = (name) => {
    const n = (name || "").trim();
    if (!n) return "Player";
    return n.slice(0, 24);
  };

  const escapeHtml = (s) => {
    const str = String(s);
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const getLeaderboard = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const saveLeaderboard = (rows) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  };

  const updateScoreUI = () => {
    if (el.score) el.score.textContent = String(state.score);
  };

  const updateProgressUI = () => {
    if (el.qIndex) el.qIndex.textContent = String(state.idx + 1);
    if (el.qTotal) el.qTotal.textContent = String(state.order.length);

    if (el.progressBar) {
      const pct = state.order.length ? (state.idx / state.order.length) * 100 : 0;
      el.progressBar.style.width = `${Math.round(pct)}%`;
    }
  };

  const stopTimer = () => {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
  };

  const startTimer = () => {
    stopTimer();
    state.timeLeft = state.timePerQuestionSec;
    if (el.timer) el.timer.textContent = String(state.timeLeft);

    state.timerId = setInterval(() => {
      state.timeLeft -= 1;
      if (el.timer) el.timer.textContent = String(Math.max(0, state.timeLeft));
      if (state.timeLeft <= 0) {
        stopTimer();
        lockAndReveal(null);
      }
    }, 1000);
  };

  const getCurrentQuizItem = () => {
    const quizItem = QUIZ_DATA[state.order[state.idx]];
    return quizItem && typeof quizItem === "object" ? quizItem : null;
  };

  const renderQuestion = () => {
    const quizItem = getCurrentQuizItem();
    if (!quizItem) return;

    const q = quizItem.q ?? "";
    const options = Array.isArray(quizItem.options) ? quizItem.options : [];
    const answerIndex = Number(quizItem.answerIndex);

    state.selectedIndex = null;
    state.locked = false;

    if (el.questionText) el.questionText.textContent = q;

    if (el.feedbackBox) {
      el.feedbackBox.classList.add("hidden");
      el.feedbackBox.className = "feedback hidden";
      el.feedbackBox.textContent = "";
    }

    if (el.btnNext) el.btnNext.classList.add("hidden");
    if (el.btnSubmit) el.btnSubmit.disabled = false;

    if (!el.answers) return;

    el.answers.innerHTML = "";

    // If options are missing/empty, show a message and skip to avoid empty question UI.
    if (!options.length) {
      if (el.answers) {
        el.answers.innerHTML = "";
        const msg = document.createElement("div");
        msg.className = "feedback";
        msg.style.marginTop = "8px";
        msg.style.textAlign = "center";
        msg.textContent = "لا توجد اختيارات لهذا السؤال (تم تخطيه).";
        el.answers.appendChild(msg);
      }

      state.locked = true;
      stopTimer();
      setTimeout(() => nextOrFinish(), 600);
      return;
    }

    options.forEach((opt, i) => {
      const choiceEl = document.createElement("div");
      choiceEl.className = "choice";
      choiceEl.setAttribute("role", "button");
      choiceEl.setAttribute("tabindex", "0");
      choiceEl.dataset.index = String(i);
      choiceEl.innerHTML = ` ${escapeHtml(opt)} `;

      const select = () => {
        if (state.locked) return;
        state.selectedIndex = i;
        for (const child of el.answers.children) child.classList.remove("selected");
        choiceEl.classList.add("selected");
      };

      choiceEl.addEventListener("click", select);
      choiceEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });

      el.answers.appendChild(choiceEl);
    });

    if (el.progressBar) el.progressBar.style.width = "0%";
    updateScoreUI();
    updateProgressUI();
    startTimer();

    // Keep answerIndex validated for later lockAndReveal
    void answerIndex;
  };

  const lockAndReveal = (manualSelectedIndex) => {
    if (state.locked) return;
    state.locked = true;

    if (el.btnSubmit) el.btnSubmit.disabled = true;
    if (el.btnNext) el.btnNext.classList.remove("hidden");

    stopTimer();

    const quizItem = getCurrentQuizItem();
    if (!quizItem) return;

    const correctIndex = Number(quizItem.answerIndex);
    const selectedIndex = manualSelectedIndex ?? state.selectedIndex;

    if (el.answers) {
      for (const child of el.answers.children) {
        child.classList.remove("selected", "correct", "wrong");
      }

      for (const child of el.answers.children) {
        const i = Number(child.dataset.index);
        if (i === correctIndex) child.classList.add("correct");
        if (selectedIndex !== null && i === selectedIndex) {
          child.classList.add(selectedIndex === correctIndex ? "correct" : "wrong");
        }
      }
    }

    const isCorrect = selectedIndex !== null && selectedIndex === correctIndex;

    if (el.feedbackBox) {
      el.feedbackBox.classList.remove("hidden");
      el.feedbackBox.textContent = isCorrect ? "✅ إجابة صحيحة!" : "❌ إجابة غير صحيحة!";
      el.feedbackBox.classList.add(isCorrect ? "good" : "bad");
    }

    if (isCorrect) {
      const timeBonus = Math.max(0, state.timeLeft);
      const base = 10;
      const bonus = Math.round((timeBonus / state.timePerQuestionSec) * 5);
      state.score += base + bonus;
      state.correctCount += 1;
      updateScoreUI();
    }
  };

  const nextOrFinish = () => {
    state.idx += 1;

    if (state.idx >= state.order.length) {
      if (el.progressBar) el.progressBar.style.width = "100%";
      if (el.timer) el.timer.textContent = "—";

      if (el.finalScore) el.finalScore.textContent = String(state.score);
      if (el.correctCount) el.correctCount.textContent = String(state.correctCount);
      if (el.totalCount) el.totalCount.textContent = String(state.order.length);

      setScreen("result");
      return;
    }

    renderQuestion();
  };

  const resetGame = () => {
    stopTimer();
    state.score = 0;
    state.correctCount = 0;
    state.idx = 0;
    state.selectedIndex = null;
    state.locked = false;

    state.order = shuffle([...Array(QUIZ_DATA.length).keys()]);
    updateScoreUI();
    updateProgressUI();
  };

  const startGame = () => {
    state.playerName = formatName(el.playerName?.value);
    resetGame();
    setScreen("quiz");
    renderQuestion();
  };

  const showLeaderboard = () => {
    const rows = getLeaderboard()
      .slice()
      .sort((a, b) => (b.score - a.score) || (a.time - b.time))
      .slice(0, 10);

    if (!el.leaderBody) return;

    el.leaderBody.innerHTML = rows.length
      ? rows
          .map(
            (r, i) =>
              `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.score}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="color:var(--muted);text-align:center;">لا توجد نتائج بعد.</td></tr>`;

    setScreen("leader");
  };

  const saveResultToLeaderboard = () => {
    const name = formatName(el.playerName?.value);
    const score = state.score;
    const now = Date.now();

    const rows = getLeaderboard();
    const existing = rows.find((r) => r.name === name);

    if (existing) {
      if (score > existing.score) existing.score = score;
      existing.time = now;
    } else {
      rows.push({ name, score, time: now });
    }

    saveLeaderboard(rows);
    showLeaderboard();
  };

  if (el.btnStart) el.btnStart.addEventListener("click", startGame);
  if (el.btnShowLeader) el.btnShowLeader.addEventListener("click", showLeaderboard);

  if (el.btnSubmit) el.btnSubmit.addEventListener("click", () => lockAndReveal());
  if (el.btnNext) el.btnNext.addEventListener("click", nextOrFinish);

  if (el.btnSave) el.btnSave.addEventListener("click", saveResultToLeaderboard);
  if (el.btnRetry) el.btnRetry.addEventListener("click", () => setScreen("intro"));
  if (el.btnBack) el.btnBack.addEventListener("click", () => setScreen("intro"));
  if (el.btnContinueQuiz) el.btnContinueQuiz.addEventListener("click", () => setScreen("intro"));

  document.addEventListener("keydown", (e) => {
    if (el.quiz && !el.quiz.classList.contains("hidden")) {
      if (e.key === "Enter") {
        if (!state.locked) lockAndReveal();
        else if (el.btnNext && !el.btnNext.classList.contains("hidden")) nextOrFinish();
      }
    }
  });
})();
