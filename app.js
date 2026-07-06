import { buildWordBank, baseCategories } from "./data/vocabulary.js";

const CUSTOM_WORDS_KEY = "baby-english-custom-words-v1";
const PROGRESS_KEY = "baby-english-companion-progress-v1";
const app = document.querySelector("#app");
const toast = document.createElement("div");
toast.className = "toast";
document.body.appendChild(toast);

const dailyPlan = [
  ["apple", "banana", "strawberry"],
  ["dog", "cat", "rabbit"],
  ["red", "blue", "yellow"],
  ["one", "two", "three"],
  ["eyes", "nose", "mouth"],
  ["mom", "dad", "baby"],
  ["ball", "car", "teddy"],
  ["milk", "egg", "bread"],
  ["jump", "run", "clap"],
  ["orange", "grape", "watermelon"],
  ["bird", "fish", "bear"],
  ["green", "pink", "purple"],
  ["four", "five", "six"],
  ["hand", "foot", "head"],
  ["grandma", "grandpa", "friend"],
  ["blocks", "doll", "train"],
  ["water", "juice", "cookie"],
  ["sit", "stand", "sleep"],
  ["pear", "cherry", "peach"],
  ["duck", "panda", "monkey"],
  ["black", "white", "brown"],
  ["seven", "eight", "nine"],
  ["ears", "hair", "teeth"],
  ["sister", "brother", "family"],
  ["kite", "robot", "balloon"],
  ["rice", "cake", "soup"],
  ["walk", "dance", "smile"],
  ["blueberry", "mango", "pineapple"],
  ["lion", "tiger", "elephant"],
  ["circle", "star", "heart"],
];

const steps = [
  { key: "hello", label: "Hello", short: "问候" },
  { key: "word-0", label: "1", short: "新词" },
  { key: "word-1", label: "2", short: "新词" },
  { key: "word-2", label: "3", short: "新词" },
  { key: "game", label: "Game", short: "游戏" },
  { key: "speak", label: "Say", short: "跟读" },
  { key: "reward", label: "Star", short: "奖励" },
  { key: "report", label: "Bye", short: "报告" },
];

const praiseLines = ["Good job!", "Excellent!", "Great!", "You did it!", "Wow! High five!"];
const stickers = ["🍎", "🌟", "🧸", "🌈", "🚗", "🐶", "🎈", "🍓", "🦕", "🦊"];

const state = {
  screen: "home",
  stepIndex: 0,
  gameTargetIndex: 0,
  feedback: "",
  feedbackTone: "",
  parentOpen: false,
  sessionReport: null,
  customWords: loadCustomWords(),
  progress: loadProgress(),
  newWord: {
    categoryKey: baseCategories[0]?.key || "animals",
    en: "",
    emoji: "✨",
    color: "#ff7b54",
  },
};

let wordBank = buildWordBank(baseCategories, state.customWords);

function loadCustomWords() {
  try {
    const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomWords() {
  localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(state.customWords));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw);
    return {
      stars: Number(parsed.stars) || 0,
      day: Number(parsed.day) || 1,
      streak: Number(parsed.streak) || 0,
      stickers: Array.isArray(parsed.stickers) ? parsed.stickers : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      lastCompleted: parsed.lastCompleted || "",
    };
  } catch {
    return { stars: 0, day: 1, streak: 0, stickers: [], reports: [], lastCompleted: "" };
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
}

function refreshWordBank() {
  wordBank = buildWordBank(baseCategories, state.customWords);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getPlanWords(day = state.progress.day) {
  const plan = dailyPlan[(day - 1) % dailyPlan.length];
  const result = plan
    .map((name) => wordBank.find((word) => word.en.toLowerCase() === name.toLowerCase()))
    .filter(Boolean);

  if (result.length === 3) return result;

  const fallbackKeys = new Set(["fruits", "animals", "colors", "numbers", "body", "family", "toys", "snacks", "drinks", "actions"]);
  const fallback = wordBank.filter((word) => fallbackKeys.has(word.categoryKey));
  return [...result, ...fallback].slice(0, 3);
}

function getCurrentWord() {
  const words = getPlanWords();
  const step = steps[state.stepIndex]?.key || "hello";
  if (!step.startsWith("word-")) return words[0];
  const index = Number(step.split("-")[1]);
  return words[index] || words[0];
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => toast.classList.remove("show"), 1700);
}

function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.82;
  utterance.pitch = 1.16;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function speakTeddy(text) {
  speak(text);
}

function categoryByKey(key) {
  return baseCategories.find((item) => item.key === key);
}

function render() {
  const words = getPlanWords();
  const step = steps[state.stepIndex] || steps[0];

  app.innerHTML = `
    <div class="app-shell companion-shell">
      ${renderTopBar(words)}
      ${state.screen === "home" ? renderHome(words) : renderLesson(step, words)}
      ${state.parentOpen ? renderParentDrawer(words) : ""}
      <footer class="footer-note">亲子 AI 英语陪伴工具 · 每天 10 到 15 分钟 · 适合手机、平板和电脑</footer>
    </div>
  `;

  bindEvents();
}

function renderTopBar(words) {
  return `
    <header class="topbar">
      <button class="brand-button" data-action="go-home" aria-label="回到首页">
        <span class="teddy-mini">🧸</span>
        <span>
          <strong>宝宝英语陪伴乐园</strong>
          <small>Teddy 每日陪学</small>
        </span>
      </button>
      <div class="top-stats" aria-label="学习进度">
        <span>⭐ ${state.progress.stars}</span>
        <span>🔥 ${state.progress.streak} 天</span>
        <span>Day ${state.progress.day}</span>
      </div>
      <button class="parent-link" data-action="toggle-parent">${state.parentOpen ? "关闭家长区" : "家长区"}</button>
    </header>
  `;
}

function renderHome(words) {
  return `
    <main class="home-stage">
      <section class="teddy-card">
        <div class="soft-cloud cloud-one"></div>
        <div class="soft-cloud cloud-two"></div>
        <div class="teddy-face" aria-hidden="true">🧸</div>
        <div class="speech-bubble">
          <p class="eyebrow">Hello! I'm Teddy!</p>
          <h1>今天一起玩英语吧</h1>
          <p>每天只学 3 个生活小词，玩一个小游戏，再跟 Teddy 说一句英语。</p>
        </div>
        <div class="today-words" aria-label="今天的三个单词">
          ${words.map((word) => renderMiniWord(word)).join("")}
        </div>
        <div class="home-actions">
          <button class="start-btn" data-action="start-lesson">开始今天</button>
          <button class="soft-btn" data-action="speak-hello">听 Teddy 问好</button>
        </div>
      </section>

      <aside class="parent-tip-card">
        <h2>爸爸/妈妈今天怎么陪？</h2>
        <p>不用讲语法，也不用考试。陪孩子点图片、跟读一次、夸一句就很好。</p>
        <div class="parent-script">
          <span>今日亲子句子</span>
          <strong>What's this?</strong>
          <small>指着 ${escapeHtml(words[0]?.en || "apple")} 问孩子，答不出来就一起说。</small>
        </div>
      </aside>
    </main>
  `;
}

function renderMiniWord(word) {
  if (!word) return "";
  return `
    <button class="mini-word" data-action="speak-word" data-word-id="${word.id}" style="--word-color:${word.color}">
      <span role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</span>
      <strong>${escapeHtml(word.en)}</strong>
    </button>
  `;
}

function renderLesson(step, words) {
  return `
    <main class="lesson-stage">
      ${renderProgressRail()}
      <section class="lesson-card ${step.key}">
        ${renderStepContent(step, words)}
      </section>
    </main>
  `;
}

function renderProgressRail() {
  return `
    <nav class="step-rail" aria-label="今日学习流程">
      ${steps
        .map(
          (step, index) => `
            <button class="step-dot ${index === state.stepIndex ? "active" : ""} ${index < state.stepIndex ? "done" : ""}" data-action="jump-step" data-step-index="${index}">
              <span>${step.label}</span>
              <small>${step.short}</small>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderStepContent(step, words) {
  if (step.key === "hello") return renderHelloStep();
  if (step.key.startsWith("word-")) return renderWordStep(step, words);
  if (step.key === "game") return renderGameStep(words);
  if (step.key === "speak") return renderSpeakStep(words);
  if (step.key === "reward") return renderRewardStep(words);
  return renderReportStep(words);
}

function renderHelloStep() {
  return `
    <div class="lesson-center">
      <div class="teddy-big">🧸</div>
      <p class="eyebrow">Step 1 · Hello</p>
      <h2>Hello! I'm Teddy!</h2>
      <p class="large-copy">今天 Teddy 会陪你认识 3 个英语小朋友。</p>
      <div class="choice-row two">
        <button class="kid-choice" data-action="speak-line" data-line="Hello! I'm Teddy! Are you ready?">🔊 听 Teddy</button>
        <button class="kid-choice primary" data-action="next-step">Ready!</button>
      </div>
    </div>
  `;
}

function renderWordStep(step, words) {
  const index = Number(step.key.split("-")[1]);
  const word = words[index] || words[0];
  return `
    <div class="word-learn">
      <div class="word-picture" style="--word-color:${word.color}">
        <span role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</span>
      </div>
      <div class="word-copy">
        <p class="eyebrow">New Word ${index + 1} / 3</p>
        <h2>${escapeHtml(word.en)}</h2>
        <p>${escapeHtml(word.categoryLabelZh)} · Teddy 说：This is ${articleFor(word.en)} ${escapeHtml(word.en)}.</p>
      </div>
      <div class="choice-row two">
        <button class="kid-choice" data-action="speak-line" data-line="${escapeAttr(`This is ${articleFor(word.en)} ${word.en}. ${word.en}.`)}">🔊 听一听</button>
        <button class="kid-choice primary" data-action="next-step">我认识啦</button>
      </div>
    </div>
  `;
}

function renderGameStep(words) {
  const target = words[state.gameTargetIndex] || words[0];
  const options = buildGameOptions(target, words);
  return `
    <div class="game-wrap">
      <div class="game-prompt">
        <div class="teddy-small">🧸</div>
        <div>
          <p class="eyebrow">Game Time</p>
          <h2>Can you find the ${escapeHtml(target.en)}?</h2>
          <p>点一下正确的图片，Teddy 会给你星星。</p>
        </div>
      </div>
      <div class="game-options">
        ${options
          .map(
            (word) => `
              <button class="game-option" data-action="game-pick" data-word-id="${word.id}" style="--word-color:${word.color}">
                <span role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</span>
                <strong>${escapeHtml(word.en)}</strong>
              </button>
            `
          )
          .join("")}
      </div>
      <div class="feedback-line ${state.feedbackTone}">${state.feedback || "先听 Teddy 的问题，再找图片。"}</div>
    </div>
  `;
}

function renderSpeakStep(words) {
  const word = words[0];
  return `
    <div class="lesson-center">
      <div class="word-picture medium" style="--word-color:${word.color}">
        <span role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</span>
      </div>
      <p class="eyebrow">AI 口语跟读</p>
      <h2>Say ${escapeHtml(word.en)}</h2>
      <p class="large-copy">第一版先鼓励孩子开口。点麦克风后，和 Teddy 一起说。</p>
      <div class="choice-row two">
        <button class="kid-choice" data-action="speak-line" data-line="${escapeAttr(`Say ${word.en}. ${word.en}.`)}">🔊 Teddy 先说</button>
        <button class="kid-choice primary" data-action="pretend-record">🎤 我说啦</button>
      </div>
      <div class="feedback-line ${state.feedbackTone}">${state.feedback || "孩子愿意开口，就已经很棒。"}</div>
    </div>
  `;
}

function renderRewardStep() {
  return `
    <div class="lesson-center reward-scene">
      <div class="confetti" aria-hidden="true">🎉 ⭐ 🎈</div>
      <div class="teddy-big clap">🧸</div>
      <p class="eyebrow">Star Reward</p>
      <h2>You did it!</h2>
      <p class="large-copy">今天完成后可以获得 5 颗星和一个小贴纸。</p>
      <div class="reward-box">
        <span>⭐ +5</span>
        <span>${stickers[(state.progress.day - 1) % stickers.length]} 今日贴纸</span>
      </div>
      <button class="start-btn" data-action="finish-day">领取奖励</button>
    </div>
  `;
}

function renderReportStep(words) {
  const session = state.sessionReport;
  const reportWords = session?.words || words;
  const report = session?.report || buildReport(reportWords);
  const reportDay = session?.day || state.progress.day;
  return `
    <div class="report-grid">
      <section class="report-card">
        <p class="eyebrow">Bye bye report</p>
        <h2>Day ${reportDay}</h2>
        <p>Teddy 今天很开心，孩子完成了一次轻松英语陪伴。</p>
        <div class="report-list">
          <strong>今天学习</strong>
          ${reportWords.map((word) => `<span>${word.emoji} ${escapeHtml(word.en)}</span>`).join("")}
        </div>
        <div class="report-list">
          <strong>表现</strong>
          <span>${escapeHtml(report.performance)}</span>
        </div>
        <div class="report-list">
          <strong>明天建议</strong>
          <span>${escapeHtml(report.tomorrow)}</span>
        </div>
      </section>
      <section class="parent-tip-card report-parent">
        <h2>爸爸/妈妈陪练</h2>
        <p>${escapeHtml(report.parentTask)}</p>
        <button class="soft-btn" data-action="speak-line" data-line="What's this? ${escapeAttr(reportWords[0]?.en || "apple")}">🔊 播放亲子句子</button>
        <button class="start-btn" data-action="go-home">Bye bye</button>
      </section>
    </div>
  `;
}

function renderParentDrawer(words) {
  const latestReports = state.progress.reports.slice(0, 3);
  return `
    <aside class="parent-drawer">
      <div class="drawer-head">
        <div>
          <p class="eyebrow">Parent Mode</p>
          <h2>家长陪学与词库更新</h2>
        </div>
        <button class="parent-link" data-action="toggle-parent">关闭</button>
      </div>
      <div class="parent-grid">
        <section class="parent-box">
          <h3>今天陪学建议</h3>
          <p>指着 ${escapeHtml(words[0]?.en || "apple")} 的图片问：<strong>What's this?</strong></p>
          <p>孩子答不出也没关系，家长跟 Teddy 一起说一遍就可以。</p>
        </section>
        <section class="parent-box">
          <h3>最近报告</h3>
          ${
            latestReports.length
              ? latestReports.map((report) => `<p>Day ${report.day}：${report.words.join(", ")}</p>`).join("")
              : "<p>完成一次今日学习后，这里会出现成长报告。</p>"
          }
        </section>
        <section class="parent-box wide">
          <h3>新增词汇</h3>
          <div class="form-grid">
            <input class="form-field full" placeholder="English word, like apple" value="${escapeHtml(state.newWord.en)}" data-action="new-en" />
            <input class="form-field" placeholder="Emoji, like 🍎" value="${escapeHtml(state.newWord.emoji)}" data-action="new-emoji" />
            <input class="form-field" placeholder="Color, like #ff7b54" value="${escapeHtml(state.newWord.color)}" data-action="new-color" />
            <select class="form-field" data-action="new-category">
              ${baseCategories.map((category) => `<option value="${category.key}" ${category.key === state.newWord.categoryKey ? "selected" : ""}>${category.emoji} ${category.labelZh}</option>`).join("")}
            </select>
          </div>
          <div class="form-actions">
            <button class="soft-btn" data-action="add-word">添加到词库</button>
            <button class="soft-btn" data-action="export-custom">导出备份</button>
            <button class="soft-btn" data-action="clear-custom">清空自定义</button>
          </div>
        </section>
      </div>
    </aside>
  `;
}

function buildGameOptions(target, words) {
  const pool = wordBank.filter((word) => word.id !== target.id && word.categoryKey !== "all");
  return shuffle([target, ...shuffle(pool).slice(0, 3)]).slice(0, 4);
}

function buildReport(words) {
  const hardWord = words.find((word) => word.en.length > 6) || words[2] || words[0];
  const easyWord = words[0];
  return {
    performance: `${easyWord.en} 反应很好，愿意听声音和点图片就是很棒的开始。`,
    tomorrow: `明天可以先复习 ${hardWord.en}，再新增一个生活小词。`,
    parentTask: `今天只需要 3 到 5 分钟。指着 ${easyWord.en} 问孩子：What's this? 孩子回答 ${easyWord.en} 就完成。`,
  };
}

function finishDay() {
  const completedDay = state.progress.day;
  const words = getPlanWords();
  const sticker = stickers[(completedDay - 1) % stickers.length];
  const report = buildReport(words);

  state.progress.stars += 5;
  state.progress.streak += state.progress.lastCompleted === todayKey() ? 0 : 1;
  state.progress.lastCompleted = todayKey();
  state.progress.stickers = [sticker, ...state.progress.stickers].slice(0, 20);
  state.progress.reports = [
    {
      day: completedDay,
      date: todayKey(),
      words: words.map((word) => word.en),
      ...report,
    },
    ...state.progress.reports,
  ].slice(0, 7);
  state.progress.day = completedDay + 1;
  state.sessionReport = { day: completedDay, words, report };
  saveProgress();
  state.stepIndex = steps.findIndex((step) => step.key === "report");
  state.feedback = "";
  state.feedbackTone = "";
  speakTeddy("You did it! Good job! Bye bye!");
  render();
}

function nextStep() {
  state.stepIndex = Math.min(state.stepIndex + 1, steps.length - 1);
  state.feedback = "";
  state.feedbackTone = "";
  render();
}

function startLesson() {
  state.screen = "lesson";
  state.stepIndex = 0;
  state.gameTargetIndex = 0;
  state.feedback = "";
  state.feedbackTone = "";
  state.sessionReport = null;
  speakTeddy("Hello! I'm Teddy! Are you ready?");
  render();
}

function goHome() {
  state.screen = "home";
  state.feedback = "";
  state.feedbackTone = "";
  state.sessionReport = null;
  render();
}

function handleGamePick(id) {
  const words = getPlanWords();
  const target = words[state.gameTargetIndex] || words[0];
  if (id === target.id) {
    const praise = praiseLines[Math.floor(Math.random() * praiseLines.length)];
    state.feedback = `${praise} You found the ${target.en}!`;
    state.feedbackTone = "good";
    speakTeddy(`${praise} You found the ${target.en}!`);
    if (state.gameTargetIndex < words.length - 1) {
      state.gameTargetIndex += 1;
      window.setTimeout(() => render(), 650);
    } else {
      window.setTimeout(() => nextStep(), 900);
    }
    render();
    return;
  }
  state.feedback = "Nice try! Look again.";
  state.feedbackTone = "warm";
  speakTeddy("Nice try! Look again.");
  render();
}

function pretendRecord() {
  state.feedback = "Great! Teddy heard you. You did it!";
  state.feedbackTone = "good";
  speakTeddy("Great! You did it!");
  render();
  window.setTimeout(() => nextStep(), 900);
}

function addCustomWord() {
  const { en, emoji, color, categoryKey } = state.newWord;
  const cleaned = en.trim();
  if (!cleaned) {
    showToast("先输入一个英文单词");
    return;
  }

  const category = categoryByKey(categoryKey);
  state.customWords.unshift({
    id: `custom-${Date.now()}`,
    en: cleaned,
    emoji: emoji.trim() || "✨",
    color: color.trim() || "#ff7b54",
    categoryKey,
    categoryLabel: category?.labelEn || "Custom",
    categoryLabelZh: category?.labelZh || "自定义",
    categoryEmoji: category?.emoji || "✨",
    isCustom: true,
  });

  saveCustomWords();
  refreshWordBank();
  state.newWord.en = "";
  render();
  showToast("已经加进词库啦");
}

function exportCustomWords() {
  const blob = new Blob([JSON.stringify(state.customWords, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "english-kids-custom-words.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("备份已导出");
}

function clearCustomWords() {
  if (!window.confirm("要清空本地自定义单词吗？")) return;
  state.customWords = [];
  saveCustomWords();
  refreshWordBank();
  render();
  showToast("本地自定义已清空");
}

function updateForm(field, value) {
  state.newWord[field] = value;
}

function bindEvents() {
  app.querySelectorAll("[data-action]").forEach((element) => {
    const action = element.dataset.action;
    if (action === "start-lesson") element.addEventListener("click", startLesson);
    if (action === "go-home") element.addEventListener("click", goHome);
    if (action === "next-step") element.addEventListener("click", nextStep);
    if (action === "jump-step") {
      element.addEventListener("click", () => {
        state.screen = "lesson";
        state.stepIndex = Number(element.dataset.stepIndex) || 0;
        state.feedback = "";
        state.feedbackTone = "";
        render();
      });
    }
    if (action === "speak-hello") {
      element.addEventListener("click", () => speakTeddy("Hello! I'm Teddy! Are you ready?"));
    }
    if (action === "speak-line") {
      element.addEventListener("click", () => speakTeddy(element.dataset.line || "Good job!"));
    }
    if (action === "speak-word") {
      element.addEventListener("click", () => {
        const word = wordBank.find((item) => item.id === element.dataset.wordId);
        if (word) speakTeddy(word.en);
      });
    }
    if (action === "game-pick") element.addEventListener("click", () => handleGamePick(element.dataset.wordId));
    if (action === "pretend-record") element.addEventListener("click", pretendRecord);
    if (action === "finish-day") element.addEventListener("click", finishDay);
    if (action === "toggle-parent") {
      element.addEventListener("click", () => {
        state.parentOpen = !state.parentOpen;
        render();
      });
    }
    if (action === "new-en") element.addEventListener("input", (event) => updateForm("en", event.target.value));
    if (action === "new-emoji") element.addEventListener("input", (event) => updateForm("emoji", event.target.value || "✨"));
    if (action === "new-color") element.addEventListener("input", (event) => updateForm("color", event.target.value || "#ff7b54"));
    if (action === "new-category") element.addEventListener("change", (event) => updateForm("categoryKey", event.target.value));
    if (action === "add-word") element.addEventListener("click", addCustomWord);
    if (action === "export-custom") element.addEventListener("click", exportCustomWords);
    if (action === "clear-custom") element.addEventListener("click", clearCustomWords);
  });
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function articleFor(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function init() {
  refreshWordBank();
  render();
}

init();
