import { buildWordBank, baseCategories } from "./data/vocabulary.js";

const STORAGE_KEY = "baby-english-custom-words-v1";
const VIEW_KEY = "baby-english-view-mode-v1";
const app = document.querySelector("#app");
const toast = document.createElement("div");
toast.className = "toast";
document.body.appendChild(toast);

const state = {
  mode: "learn",
  category: "all",
  learnIndex: 0,
  quizScore: 0,
  quizStreak: 0,
  quizFeedback: "",
  quizTone: "",
  quizRound: 0,
  quizTarget: null,
  quizOptions: [],
  showParent: false,
  viewMode: loadViewMode(),
  search: "",
  customWords: loadCustomWords(),
  newWord: {
    categoryKey: baseCategories[0]?.key || "animals",
    en: "",
    emoji: "✨",
    color: "#ff7b54",
  },
};

let wordBank = buildWordBank(baseCategories, state.customWords);

function loadViewMode() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (raw === "kid" || raw === "full") return raw;
  } catch {
    // ignore
  }
  return window.innerWidth < 860 ? "kid" : "full";
}

function saveViewMode() {
  try {
    localStorage.setItem(VIEW_KEY, state.viewMode);
  } catch {
    // ignore
  }
}

function loadCustomWords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomWords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customWords));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.86;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function categoryByKey(key) {
  return baseCategories.find((item) => item.key === key);
}

function getVisibleWords() {
  const filtered =
    state.category === "all"
      ? wordBank
      : wordBank.filter((word) => word.categoryKey === state.category);
  const query = state.search.trim().toLowerCase();
  if (!query) return filtered;
  return filtered.filter((word) => {
    return (
      word.en.toLowerCase().includes(query) ||
      word.categoryLabel.toLowerCase().includes(query) ||
      word.categoryLabelZh.includes(query)
    );
  });
}

function refreshWordBank() {
  wordBank = buildWordBank(baseCategories, state.customWords);
  const visible = getVisibleWords();
  if (state.learnIndex >= visible.length) {
    state.learnIndex = 0;
  }
}

function clampLearnIndex(delta = 0) {
  const visible = getVisibleWords();
  if (!visible.length) {
    state.learnIndex = 0;
    return;
  }
  state.learnIndex = (state.learnIndex + delta + visible.length) % visible.length;
}

function currentLearnWord() {
  const visible = getVisibleWords();
  return visible[state.learnIndex] || visible[0] || null;
}

function buildQuizRound() {
  const pool = getVisibleWords();
  if (!pool.length) {
    state.quizTarget = null;
    state.quizOptions = [];
    return;
  }
  const target = pool[Math.floor(Math.random() * pool.length)];
  const others = pool.filter((item) => item.id !== target.id);
  const options = [target];
  shuffle(others).slice(0, 3).forEach((item) => options.push(item));
  state.quizTarget = target;
  state.quizOptions = shuffle(options);
  state.quizFeedback = "";
  state.quizTone = "";
  state.quizRound += 1;
  window.setTimeout(() => speak(target.en), 180);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setMode(mode) {
  state.mode = mode;
  if (mode === "quiz") {
    buildQuizRound();
  }
  render();
}

function setCategory(key) {
  state.category = key;
  state.learnIndex = 0;
  if (state.mode === "quiz") {
    buildQuizRound();
  }
  render();
}

function toggleViewMode() {
  state.viewMode = state.viewMode === "kid" ? "full" : "kid";
  saveViewMode();
  render();
}

function updateForm(field, value) {
  state.newWord[field] = value;
  render(false);
}

function render(showHelp = true) {
  const activeElement = document.activeElement;
  const activeAction = activeElement?.dataset?.action;
  const activeValue = activeElement?.value;
  const activeSelectionStart =
    typeof activeElement?.selectionStart === "number" ? activeElement.selectionStart : null;
  const activeSelectionEnd =
    typeof activeElement?.selectionEnd === "number" ? activeElement.selectionEnd : null;
  const visibleWords = getVisibleWords();
  const word = currentLearnWord();
  const currentCategory =
    state.category === "all"
      ? {
          key: "all",
          labelZh: "全部",
          labelEn: "All",
          emoji: "🌈",
          color: "#ff7b54",
        }
      : categoryByKey(state.category);
  const total = wordBank.length;
  const visibleCount = visibleWords.length;
  const categoryCount = baseCategories.length;
  const viewLabel = state.viewMode === "kid" ? "儿童专注" : "完整浏览";
  const showFullLibrary = state.viewMode === "full";

  app.innerHTML = `
    <div class="app-shell view-${state.viewMode}">
      <section class="hero">
        <div class="hero-card">
          <div class="masthead">
            <div class="brand">
              <div class="brand-mark">🐣</div>
              <div>
                <h1>宝宝英语乐园</h1>
                <p>适合 3 岁小朋友的点读英语小站</p>
              </div>
            </div>
            <div class="masthead-actions">
              <button class="control-btn" data-action="toggle-view">${viewLabel}</button>
              <button class="control-btn" data-action="toggle-parent">
                ${state.showParent ? "关闭家长区" : "家长更新"}
              </button>
            </div>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label">基础词汇</span>
              <span class="stat-value">${total}</span>
            </div>
            <div class="stat">
              <span class="stat-label">分类数量</span>
              <span class="stat-value">${categoryCount}</span>
            </div>
            <div class="stat">
              <span class="stat-label">当前筛选</span>
              <span class="stat-value">${visibleCount}</span>
            </div>
            <div class="stat">
              <span class="stat-label">家长添加</span>
              <span class="stat-value">${state.customWords.length}</span>
            </div>
          </div>

          <p class="hint">
            点击“听一听”可以直接读词，孩子也能用“找一找”来做小测验。
            所有基础词都放在一个文件里，后续你可以很轻松地继续加词。
          </p>

          <div class="mode-row">
            <button class="mode-pill ${state.mode === "learn" ? "active" : ""}" data-action="mode" data-mode="learn">📘 看一看</button>
            <button class="mode-pill ${state.mode === "quiz" ? "active" : ""}" data-action="mode" data-mode="quiz">🔍 找一找</button>
          </div>
        </div>

        <aside class="side-card">
          <h2>今天先学什么？</h2>
          <div class="big-word" style="--word-color:${currentCategory?.color || "#ff7b54"}">
            ${
              word
                ? `
                  <div class="big-emoji" role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</div>
                  <div class="big-en">${word.en}</div>
                  <div class="big-sub">${word.categoryLabelZh} · ${word.categoryLabel}</div>
                `
                : `
                  <div class="big-emoji">🌷</div>
                  <div class="big-en">No words</div>
                  <div class="big-sub">当前没有可看的词汇</div>
                `
            }
          </div>
          <div class="big-actions">
            <button class="primary-btn" data-action="speak-current">🔊 听一听</button>
            <button class="ghost-btn" data-action="next-word">下一张 ➜</button>
            <button class="ghost-btn" data-action="prev-word">⬅ 上一张</button>
            <button class="ghost-btn" data-action="random-word">🎲 随机</button>
          </div>
          <p class="section-note">现在筛选：${currentCategory?.labelZh || "全部"} · ${visibleCount} 个词</p>
        </aside>
      </section>

      ${
        showFullLibrary
          ? `
      <section class="content-grid">
        <div class="panel library">
          <div class="toolbar">
            <div class="toolbar-left">
              <strong>分类</strong>
              <span class="section-note">点一下就能切换。</span>
            </div>
            <div class="toolbar-right">
              <input class="search" placeholder="搜索单词，比如 dog / red / apple" value="${escapeHtml(state.search)}" data-action="search" />
            </div>
          </div>

          <div class="chip-row">
            <button class="chip ${state.category === "all" ? "active" : ""}" data-action="category" data-category="all">🌈 全部</button>
            ${baseCategories
              .map(
                (category) => `
                  <button class="chip ${state.category === category.key ? "active" : ""}" data-action="category" data-category="${category.key}" style="--chip-color:${category.color}">
                    ${category.emoji} ${category.labelZh}
                  </button>
                `
              )
              .join("")}
          </div>

          ${
            state.mode === "learn"
              ? renderLearnMode(visibleWords, word)
              : renderQuizMode(visibleWords)
          }
        </div>

        <div class="panel panel-grid">
          <div>
            <h2>家长更新区</h2>
            <p>可以现场新增单词，也可以导出一份 JSON 备份，后面把文件交给朋友或自己继续扩充。</p>
          </div>
          ${state.showParent ? renderParentPanel() : `
            <div class="word-preview">
              <strong>只想给孩子直接用？</strong>
              <p>不用打开家长区也能学。你只需要把这个文件放到 GitHub Pages，上线后就是一个可分享的小站。</p>
              <code>基础词汇 ${total} 个</code>
            </div>
          `}
        </div>
      </section>
      `
          : `
      <section class="panel kid-panel">
        <div class="kid-panel-head">
          <div>
            <h2>儿童专注模式</h2>
            <p>更少内容，更大按钮。适合孩子直接点。</p>
          </div>
          <button class="control-btn" data-action="toggle-view">切回完整浏览</button>
        </div>
        <div class="kid-card-shell">
          ${
            state.mode === "learn"
              ? renderLearnMode(visibleWords, word)
              : renderQuizMode(visibleWords)
          }
        </div>
      </section>
      `
      }

      <div class="footer-note">
        适合 3 岁左右孩子的英语启蒙 · 离线可用 · 可以直接放到 GitHub Pages
      </div>
    </div>
  `;

  bindEvents();
  if (activeAction) {
    const restored = app.querySelector(`[data-action="${activeAction}"]`);
    if (restored && typeof restored.focus === "function") {
      restored.focus();
      if (
        typeof restored.setSelectionRange === "function" &&
        activeSelectionStart !== null &&
        activeSelectionEnd !== null &&
        restored.value === activeValue
      ) {
        restored.setSelectionRange(activeSelectionStart, activeSelectionEnd);
      }
    }
  }
  if (showHelp) {
    if (state.mode === "quiz" && state.quizTarget) {
      showToast("听声音，找正确的卡片");
    } else if (word) {
      showToast("点一下“听一听”可以朗读");
    }
  }
}

function renderLearnMode(visibleWords, word) {
  if (!visibleWords.length) {
    return `
      <div class="word-preview">
        <strong>这个分类还没有词汇</strong>
        <p>你可以换一个分类，或者在家长区新增单词。</p>
      </div>
    `;
  }

  return `
    <div class="word-stack">
      ${word ? renderWordCard(word, visibleWords.length) : ""}
    </div>
  `;
}

function renderWordCard(word, total) {
  return `
    <article class="word-card" style="--word-color:${word.color}">
      <div class="word-icon" role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</div>
      <div>
        <h3 class="word-title">${escapeHtml(word.en)}</h3>
        <p class="word-meta">${escapeHtml(word.categoryLabelZh)} · ${escapeHtml(word.categoryLabel)} · 第 ${state.learnIndex + 1} / ${total} 个</p>
      </div>
      <div class="word-actions">
        <button class="tiny-btn" data-action="speak-current" aria-label="听一听">🔊</button>
        <button class="tiny-btn" data-action="prev-word" aria-label="上一张">⬅</button>
        <button class="tiny-btn" data-action="next-word" aria-label="下一张">➡</button>
      </div>
    </article>
  `;
}

function renderQuizMode(visibleWords) {
  if (visibleWords.length < 4) {
    return `
      <div class="word-preview">
        <strong>这个分类的词太少了</strong>
        <p>找一找至少需要 4 个词。你可以切到“全部”，或者换个更大的分类。</p>
      </div>
    `;
  }

  const target = state.quizTarget || visibleWords[0];
  return `
    <div class="quiz-board">
      <div class="quiz-head">
        <div>
          <h3>听一听，找出正确的单词</h3>
          <p class="section-note">每次只认 4 张卡，适合小朋友一眼看懂。</p>
        </div>
        <button class="control-btn" data-action="new-quiz">🎲 下一题</button>
      </div>

      <div class="quiz-prompt">
        <div class="quiz-word">${escapeHtml(target.en)}</div>
        <div class="form-actions">
          <button class="primary-btn" data-action="speak-target">🔊 再听一次</button>
          <div class="feedback ${state.quizTone === "good" ? "good" : state.quizTone === "bad" ? "bad" : ""}">
            ${
              state.quizFeedback
                ? `${state.quizFeedback} · 当前得分 ${state.quizScore}`
                : `先听声音，再点下面正确的卡片`
            }
          </div>
        </div>
      </div>

      <div class="quiz-options">
        ${state.quizOptions
          .map(
            (item) => `
              <button class="quiz-option ${state.quizTone === "good" && item.id === target.id ? "correct" : ""} ${state.quizTone === "bad" && item.id === target.id ? "correct" : ""}" data-action="quiz-pick" data-word-id="${item.id}">
                <span role="img" aria-label="${escapeHtml(item.en)}">${item.emoji}</span>
                <strong>${escapeHtml(item.en)}</strong>
                <small>${escapeHtml(item.categoryLabelZh)}</small>
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderParentPanel() {
  const newWord = state.newWord;
  return `
    <div class="panel-grid">
      <div class="form-grid">
        <input class="form-field full" placeholder="English word, like apple" value="${escapeHtml(newWord.en)}" data-action="new-en" />
        <input class="form-field" placeholder="Emoji, like 🍎" value="${escapeHtml(newWord.emoji)}" data-action="new-emoji" />
        <input class="form-field" placeholder="Color, like #ff7b54" value="${escapeHtml(newWord.color)}" data-action="new-color" />
        <select class="form-field" data-action="new-category">
          ${baseCategories
            .map(
              (category) => `
                <option value="${category.key}" ${category.key === newWord.categoryKey ? "selected" : ""}>
                  ${category.emoji} ${category.labelZh}
                </option>
              `
            )
            .join("")}
        </select>
      </div>

      <div class="form-actions">
        <button class="primary-btn" data-action="add-word">➕ 添加到词库</button>
        <button class="ghost-btn" data-action="export-custom">⬇ 导出备份</button>
        <button class="ghost-btn" data-action="clear-custom">🧹 清空自定义</button>
      </div>

      <div class="word-preview">
        <strong>将要添加的词</strong>
        <p>${escapeHtml(newWord.en || "还没输入单词")}</p>
        <code>${escapeHtml(newWord.emoji || "✨")} · ${escapeHtml(categoryByKey(newWord.categoryKey)?.labelZh || "")}</code>
      </div>

      <p class="section-note">
        提示：这个站点的基础词库集中在 <code>data/vocabulary.js</code>。
        你也可以先在这里加词，再把备份 JSON 合并回代码里。
      </p>
    </div>
  `;
}

function bindEvents() {
  app.querySelectorAll("[data-action]").forEach((element) => {
    const action = element.dataset.action;
    if (action === "mode") {
      element.addEventListener("click", () => setMode(element.dataset.mode));
      return;
    }
    if (action === "category") {
      element.addEventListener("click", () => setCategory(element.dataset.category));
      return;
    }
    if (action === "search") {
      element.addEventListener("input", (event) => {
        state.search = event.target.value;
        state.learnIndex = 0;
        if (state.mode === "quiz") {
          buildQuizRound();
        }
        render(false);
      });
      return;
    }
    if (action === "new-en") {
      element.addEventListener("input", (event) => updateForm("en", event.target.value));
      return;
    }
    if (action === "new-emoji") {
      element.addEventListener("input", (event) => updateForm("emoji", event.target.value || "✨"));
      return;
    }
    if (action === "new-color") {
      element.addEventListener("input", (event) => updateForm("color", event.target.value || "#ff7b54"));
      return;
    }
    if (action === "new-category") {
      element.addEventListener("change", (event) => updateForm("categoryKey", event.target.value));
      return;
    }
    if (action === "speak-current") {
      element.addEventListener("click", () => {
        const current = currentLearnWord();
        if (current) speak(current.en);
      });
      return;
    }
    if (action === "speak-target") {
      element.addEventListener("click", () => {
        if (state.quizTarget) speak(state.quizTarget.en);
      });
      return;
    }
    if (action === "next-word") {
      element.addEventListener("click", () => {
        clampLearnIndex(1);
        render();
      });
      return;
    }
    if (action === "prev-word") {
      element.addEventListener("click", () => {
        clampLearnIndex(-1);
        render();
      });
      return;
    }
    if (action === "random-word") {
      element.addEventListener("click", () => {
        const visible = getVisibleWords();
        if (!visible.length) return;
        state.learnIndex = Math.floor(Math.random() * visible.length);
        render();
      });
      return;
    }
    if (action === "new-quiz") {
      element.addEventListener("click", () => {
        buildQuizRound();
        render();
      });
      return;
    }
    if (action === "quiz-pick") {
      element.addEventListener("click", () => handleQuizPick(element.dataset.wordId));
      return;
    }
    if (action === "toggle-parent") {
      element.addEventListener("click", () => {
        state.showParent = !state.showParent;
        render();
      });
      return;
    }
    if (action === "toggle-view") {
      element.addEventListener("click", toggleViewMode);
      return;
    }
    if (action === "add-word") {
      element.addEventListener("click", addCustomWord);
      return;
    }
    if (action === "export-custom") {
      element.addEventListener("click", exportCustomWords);
      return;
    }
    if (action === "clear-custom") {
      element.addEventListener("click", clearCustomWords);
      return;
    }
  });
}

function handleQuizPick(id) {
  const target = state.quizTarget;
  if (!target || state.quizOptions.length === 0) return;
  const selected = state.quizOptions.find((item) => item.id === id);
  if (!selected) return;

  if (selected.id === target.id) {
    state.quizScore += 1;
    state.quizStreak += 1;
    state.quizFeedback = "太棒了！";
    state.quizTone = "good";
    render(false);
    showToast("答对了，继续下一题");
    window.setTimeout(() => {
      buildQuizRound();
      render();
    }, 700);
    return;
  }

  state.quizStreak = 0;
  state.quizFeedback = "再试一次";
  state.quizTone = "bad";
  render(false);
  showToast("再听一遍，选正确的卡片");
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
  const blob = new Blob([JSON.stringify(state.customWords, null, 2)], {
    type: "application/json",
  });
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function init() {
  refreshWordBank();
  if (wordBank.length && !state.quizTarget) {
    buildQuizRound();
  }
  render(false);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    clampLearnIndex(-1);
    render();
  }
  if (event.key === "ArrowRight") {
    clampLearnIndex(1);
    render();
  }
  if (event.key === " " && state.mode === "learn") {
    event.preventDefault();
    const current = currentLearnWord();
    if (current) speak(current.en);
  }
});

init();
