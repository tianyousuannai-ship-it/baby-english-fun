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
const stickerCatalog = [
  { id: "apple-badge", emoji: "🍎", name: "Apple Badge", zh: "苹果贴纸" },
  { id: "star-badge", emoji: "🌟", name: "Star Badge", zh: "星星贴纸" },
  { id: "teddy-badge", emoji: "🧸", name: "Teddy Badge", zh: "小熊贴纸" },
  { id: "rainbow-badge", emoji: "🌈", name: "Rainbow Badge", zh: "彩虹贴纸" },
  { id: "car-badge", emoji: "🚗", name: "Car Badge", zh: "小车贴纸" },
  { id: "puppy-badge", emoji: "🐶", name: "Puppy Badge", zh: "小狗贴纸" },
  { id: "balloon-badge", emoji: "🎈", name: "Balloon Badge", zh: "气球贴纸" },
  { id: "berry-badge", emoji: "🍓", name: "Berry Badge", zh: "草莓贴纸" },
  { id: "dino-badge", emoji: "🦕", name: "Dino Badge", zh: "恐龙贴纸" },
  { id: "fox-badge", emoji: "🦊", name: "Fox Badge", zh: "狐狸贴纸" },
];

const friendCatalog = [
  { id: "teddy", emoji: "🧸", name: "Teddy", zh: "小熊 Teddy", needDays: 0 },
  { id: "puppy", emoji: "🐶", name: "Buddy", zh: "小狗 Buddy", needDays: 2 },
  { id: "fox", emoji: "🦊", name: "Fifi", zh: "小狐狸 Fifi", needDays: 4 },
  { id: "dino", emoji: "🦕", name: "Dino", zh: "小恐龙 Dino", needDays: 7 },
];

const storyWorlds = [
  {
    id: "fruit-shop",
    emoji: "🧺",
    title: "水果小店",
    titleEn: "Fruit Shop",
    taskPlace: "basket",
    mission: "把水果放进 Teddy 的小篮子。",
    line: "Let's go to the fruit shop!",
    color: "#ff8a65",
  },
  {
    id: "animal-park",
    emoji: "🌳",
    title: "动物公园",
    titleEn: "Animal Park",
    taskPlace: "park",
    mission: "帮小动物回到公园里。",
    line: "Welcome to the animal park!",
    color: "#57bf7d",
  },
  {
    id: "rainbow-room",
    emoji: "🌈",
    title: "彩虹颜色屋",
    titleEn: "Rainbow Room",
    taskPlace: "rainbow",
    mission: "找到 Teddy 想要的颜色。",
    line: "Let's play in the rainbow room!",
    color: "#66a6ff",
  },
  {
    id: "toy-room",
    emoji: "🧸",
    title: "玩具房间",
    titleEn: "Toy Room",
    taskPlace: "toy box",
    mission: "把玩具放进玩具箱。",
    line: "Time to play in the toy room!",
    color: "#ffb84d",
  },
  {
    id: "breakfast-table",
    emoji: "🥣",
    title: "早餐桌",
    titleEn: "Breakfast Table",
    taskPlace: "table",
    mission: "帮 Teddy 找到早餐食物。",
    line: "Let's have breakfast together!",
    color: "#f4a261",
  },
];

const state = {
  screen: "home",
  selectedCategoryKey: "fruits",
  selectedWordId: "",
  stepIndex: 0,
  gameTargetIndex: 0,
  storyCollected: [],
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

function getStoryWorld(day = state.progress.day) {
  return storyWorlds[(day - 1) % storyWorlds.length];
}

function getStickerReward(day = state.progress.day) {
  return stickerCatalog[(day - 1) % stickerCatalog.length];
}

function normalizeSticker(raw) {
  if (!raw) return null;
  if (typeof raw === "object" && raw.id) return raw;
  return (
    stickerCatalog.find((item) => item.id === raw || item.emoji === raw) || {
      id: `custom-${raw}`,
      emoji: raw,
      name: "Sticker",
      zh: "贴纸",
    }
  );
}

function unlockedFriends() {
  const completedDays = Math.max(0, state.progress.day - 1);
  return friendCatalog.filter((friend) => completedDays >= friend.needDays);
}

function nextFriendToUnlock() {
  const completedDays = Math.max(0, state.progress.day - 1);
  return friendCatalog.find((friend) => completedDays < friend.needDays) || null;
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
      ${renderScreen(step, words)}
      ${state.parentOpen ? renderParentDrawer(words) : ""}
      <footer class="footer-note">亲子 AI 英语陪伴工具 · 每天 10 到 15 分钟 · 适合手机、平板和电脑</footer>
    </div>
  `;

  bindEvents();
}

function renderScreen(step, words) {
  if (state.screen === "garden") return renderStickerGarden();
  if (state.screen === "category") return renderCategoryCards();
  if (state.screen === "word-card") return renderWordCard();
  if (state.screen === "lesson") return renderLesson(step, words);
  return renderHome(words);
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
  const featuredCategories = baseCategories.slice(0, 8);
  return `
    <main class="card-home">
      <section class="card-home-hero">
        <div class="hero-copy">
          <p class="eyebrow">Pick a card · 自由点读</p>
          <h1>今天想学什么？</h1>
          <p>自己选喜欢的卡片。点一下图片，Teddy 就读给你听。</p>
        </div>
        <button class="teddy-listen" data-action="speak-hello" aria-label="听 Teddy 问好">
          <span aria-hidden="true">🧸</span>
          <strong>Hello!</strong>
          <small>点我听一听</small>
        </button>
      </section>

      <section class="category-section" aria-labelledby="category-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Choose a topic</p>
            <h2 id="category-title">选择卡片分类</h2>
          </div>
          <span class="word-count">${wordBank.length} 张卡片</span>
        </div>
        <div class="category-grid">
          ${featuredCategories.map((category) => renderCategoryButton(category)).join("")}
        </div>
        ${baseCategories.length > featuredCategories.length ? `
          <details class="more-categories">
            <summary>更多分类</summary>
            <div class="category-grid more-grid">
              ${baseCategories.slice(featuredCategories.length).map((category) => renderCategoryButton(category)).join("")}
            </div>
          </details>
        ` : ""}
      </section>

      <section class="play-mode-section">
        <div>
          <p class="eyebrow">More ways to play</p>
          <h2>还想玩一会儿？</h2>
        </div>
        <div class="mode-buttons">
          <button class="mode-card quest" data-action="start-lesson">
            <span>🧺</span><strong>故事闯关</strong><small>跟 Teddy 完成今天的任务</small>
          </button>
          <button class="mode-card garden" data-action="open-garden">
            <span>🌟</span><strong>贴纸乐园</strong><small>看看收集的小伙伴</small>
          </button>
        </div>
      </section>
    </main>
  `;
}

function renderCategoryButton(category) {
  const count = wordBank.filter((word) => word.categoryKey === category.key).length;
  return `
    <button class="category-card" data-action="open-category" data-category-key="${escapeAttr(category.key)}" style="--category-color:${category.color}">
      <span class="category-art" aria-hidden="true">${category.emoji}</span>
      <span class="category-copy">
        <strong>${escapeHtml(category.labelZh)}</strong>
        <small>${escapeHtml(category.labelEn)} · ${count} 张</small>
      </span>
      <span class="category-arrow" aria-hidden="true">›</span>
    </button>
  `;
}

function selectedCategory() {
  return categoryByKey(state.selectedCategoryKey) || baseCategories[0];
}

function selectedCategoryWords() {
  return wordBank.filter((word) => word.categoryKey === selectedCategory().key);
}

function renderCategoryCards() {
  const category = selectedCategory();
  const words = selectedCategoryWords();
  return `
    <main class="cards-stage" style="--category-color:${category.color}">
      <header class="cards-stage-head">
        <button class="back-button" data-action="go-home" aria-label="返回分类首页">‹ 返回</button>
        <div class="category-title">
          <span>${category.emoji}</span>
          <div><p class="eyebrow">${escapeHtml(category.labelEn)}</p><h1>${escapeHtml(category.labelZh)}卡片</h1></div>
        </div>
        <p>想学哪一个，就点哪一张。每张卡片都可以反复听。</p>
      </header>
      <section class="word-card-grid" aria-label="${escapeHtml(category.labelZh)}单词卡">
        ${words.map((word) => `
          <button class="browse-word-card" data-action="open-word-card" data-word-id="${word.id}" style="--word-color:${word.color}" aria-label="打开 ${escapeHtml(word.en)} 卡片">
            <span class="browse-word-art" role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</span>
            <strong>${escapeHtml(word.en)}</strong>
            <small>点我听发音</small>
          </button>
        `).join("")}
      </section>
    </main>
  `;
}

function renderWordCard() {
  const words = selectedCategoryWords();
  let index = words.findIndex((word) => word.id === state.selectedWordId);
  if (index < 0) index = 0;
  const word = words[index];
  if (!word) return renderCategoryCards();
  return `
    <main class="single-card-stage" style="--word-color:${word.color}">
      <header class="single-card-nav">
        <button class="back-button" data-action="back-to-category">‹ ${escapeHtml(word.categoryLabelZh)}</button>
        <span>${index + 1} / ${words.length}</span>
      </header>
      <button class="learning-flashcard" data-action="speak-word" data-word-id="${word.id}" aria-label="播放 ${escapeHtml(word.en)} 的发音">
        <p class="eyebrow">Tap to listen · 点卡片听发音</p>
        <div class="flashcard-art" role="img" aria-label="${escapeHtml(word.en)}">${word.emoji}</div>
        <h1>${escapeHtml(word.en)}</h1>
        <p class="word-sentence">This is ${articleFor(word.en)} ${escapeHtml(word.en)}.</p>
        <span class="listen-button">🔊 点卡片再听一次</span>
      </button>
      <nav class="card-switcher" aria-label="切换单词卡">
        <button data-action="previous-card" ${index === 0 ? "disabled" : ""}>‹ 上一张</button>
        <button class="random-card" data-action="random-card">换一张</button>
        <button data-action="next-card" ${index === words.length - 1 ? "disabled" : ""}>下一张 ›</button>
      </nav>
    </main>
  `;
}

function renderStickerGarden() {
  const collected = state.progress.stickers.map(normalizeSticker).filter(Boolean);
  const collectedIds = new Set(collected.map((item) => item.id));
  const friends = unlockedFriends();
  return `
    <main class="garden-stage">
      <section class="garden-hero">
        <div class="teddy-small">🧸</div>
        <div>
          <p class="eyebrow">Sticker Garden</p>
          <h1>贴纸乐园</h1>
          <p>每完成一天，Teddy 就送一个新贴纸。连续坚持，还会有小动物来做朋友。</p>
        </div>
        <button class="soft-btn" data-action="go-home">回到首页</button>
      </section>

      <section class="collection-grid">
        <div class="collection-panel">
          <h2>我的贴纸</h2>
          <div class="sticker-grid">
            ${stickerCatalog
              .map(
                (sticker) => `
                  <div class="sticker-card ${collectedIds.has(sticker.id) ? "unlocked" : "locked"}">
                    <span>${collectedIds.has(sticker.id) ? sticker.emoji : "🔒"}</span>
                    <strong>${escapeHtml(sticker.zh)}</strong>
                    <small>${collectedIds.has(sticker.id) ? sticker.name : "完成学习解锁"}</small>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="collection-panel">
          <h2>小动物伙伴</h2>
          <div class="friend-grid">
            ${friendCatalog
              .map(
                (friend) => {
                  const unlocked = friends.some((item) => item.id === friend.id);
                  return `
                    <div class="friend-card ${unlocked ? "unlocked" : "locked"}">
                      <span>${unlocked ? friend.emoji : "🔒"}</span>
                      <strong>${escapeHtml(friend.zh)}</strong>
                      <small>${unlocked ? "已加入 Teddy 小队" : `${friend.needDays} 天后解锁`}</small>
                    </div>
                  `;
                }
              )
              .join("")}
          </div>
        </div>
      </section>
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
  const world = getStoryWorld();
  return `
    <div class="lesson-center">
      <div class="teddy-big">🧸</div>
      <p class="eyebrow">Story Quest · ${escapeHtml(world.titleEn)}</p>
      <h2>${escapeHtml(world.line)}</h2>
      <p class="large-copy">今天 Teddy 会陪你认识 3 个英语小朋友，然后一起完成${escapeHtml(world.title)}任务。</p>
      <div class="choice-row two">
        <button class="kid-choice" data-action="speak-line" data-line="${escapeAttr(`${world.line} Are you ready?`)}">🔊 听 Teddy</button>
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
  const world = getStoryWorld();
  const target = words[state.gameTargetIndex] || words[0];
  const options = buildGameOptions(target, words);
  const collectedWords = words.filter((word) => state.storyCollected.includes(word.id));
  return `
    <div class="game-wrap story-wrap" style="--world-color:${world.color}">
      <div class="game-prompt">
        <div class="teddy-small">${world.emoji}</div>
        <div>
          <p class="eyebrow">${escapeHtml(world.titleEn)} Quest</p>
          <h2>Put the ${escapeHtml(target.en)} in the ${escapeHtml(world.taskPlace)}!</h2>
          <p>${escapeHtml(world.mission)} 点对图片，它就会跑进场景里。</p>
        </div>
      </div>
      <div class="story-scene">
        <div class="scene-place">
          <span class="scene-emoji">${world.emoji}</span>
          <strong>${escapeHtml(world.title)}</strong>
          <small>${state.storyCollected.length} / ${words.length} completed</small>
        </div>
        <div class="scene-collected">
          ${words
            .map((word) => {
              const collected = collectedWords.some((item) => item.id === word.id);
              return `<span class="${collected ? "filled" : ""}">${collected ? word.emoji : "?"}</span>`;
            })
            .join("")}
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
  const sticker = getStickerReward();
  const nextFriend = nextFriendToUnlock();
  return `
    <div class="lesson-center reward-scene">
      <div class="confetti" aria-hidden="true">🎉 ⭐ 🎈</div>
      <div class="teddy-big clap">🧸</div>
      <p class="eyebrow">Star Reward</p>
      <h2>You did it!</h2>
      <p class="large-copy">今天完成后可以获得 8 颗星和一个新贴纸。</p>
      <div class="reward-box">
        <span>⭐ +8</span>
        <span>${sticker.emoji} ${escapeHtml(sticker.zh)}</span>
        <span>${nextFriend ? `再坚持，解锁 ${escapeHtml(nextFriend.zh)}` : "小动物小队已集齐"}</span>
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
  const world = session?.world || getStoryWorld(reportDay);
  const sticker = session?.sticker || getStickerReward(reportDay);
  return `
    <div class="report-grid">
      <section class="report-card">
        <p class="eyebrow">Bye bye report</p>
        <h2>Day ${reportDay}</h2>
        <p>Teddy 今天很开心，孩子完成了${escapeHtml(world.title)}的小闯关。</p>
        <div class="report-list">
          <strong>今日场景</strong>
          <span>${world.emoji} ${escapeHtml(world.title)} · ${escapeHtml(world.titleEn)}</span>
        </div>
        <div class="report-list">
          <strong>今天学习</strong>
          ${reportWords.map((word) => `<span>${word.emoji} ${escapeHtml(word.en)}</span>`).join("")}
        </div>
        <div class="report-list">
          <strong>今日奖励</strong>
          <span>⭐ +8 · ${sticker.emoji} ${escapeHtml(sticker.zh)}</span>
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
  const world = getStoryWorld();
  return {
    performance: `${easyWord.en} 反应很好，愿意帮 Teddy 完成${world.title}任务，参与感比单纯点读更强。`,
    tomorrow: `明天可以先复习 ${hardWord.en}，再去新的小场景继续闯关。`,
    parentTask: `今天只需要 3 到 5 分钟。指着 ${easyWord.en} 问孩子：What's this? 孩子回答 ${easyWord.en} 后，可以说 Put it in the ${world.taskPlace}.`,
  };
}

function finishDay() {
  const completedDay = state.progress.day;
  const world = getStoryWorld(completedDay);
  const words = getPlanWords();
  const sticker = getStickerReward(completedDay);
  const report = buildReport(words);

  state.progress.stars += 8;
  state.progress.streak += state.progress.lastCompleted === todayKey() ? 0 : 1;
  state.progress.lastCompleted = todayKey();
  state.progress.stickers = [sticker.id, ...state.progress.stickers.filter((item) => normalizeSticker(item)?.id !== sticker.id)].slice(0, 20);
  state.progress.reports = [
    {
      day: completedDay,
      date: todayKey(),
      world: world.title,
      sticker: sticker.zh,
      words: words.map((word) => word.en),
      ...report,
    },
    ...state.progress.reports,
  ].slice(0, 7);
  state.progress.day = completedDay + 1;
  state.sessionReport = { day: completedDay, world, sticker, words, report };
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
  state.storyCollected = [];
  state.feedback = "";
  state.feedbackTone = "";
  state.sessionReport = null;
  speakTeddy(`${getStoryWorld().line} Are you ready?`);
  render();
}

function goHome() {
  state.screen = "home";
  state.feedback = "";
  state.feedbackTone = "";
  state.sessionReport = null;
  render();
}

function openCategory(key) {
  state.selectedCategoryKey = key;
  state.selectedWordId = "";
  state.screen = "category";
  render();
}

function openWordCard(id) {
  state.selectedWordId = id;
  state.screen = "word-card";
  const word = wordBank.find((item) => item.id === id);
  render();
  if (word) speakTeddy(word.en);
}

function moveWordCard(direction) {
  const words = selectedCategoryWords();
  const currentIndex = Math.max(0, words.findIndex((word) => word.id === state.selectedWordId));
  let nextIndex = currentIndex + direction;
  if (direction === 0) nextIndex = Math.floor(Math.random() * words.length);
  nextIndex = Math.max(0, Math.min(words.length - 1, nextIndex));
  const word = words[nextIndex];
  if (!word) return;
  state.selectedWordId = word.id;
  render();
  speakTeddy(word.en);
}

function handleGamePick(id) {
  const words = getPlanWords();
  const world = getStoryWorld();
  const target = words[state.gameTargetIndex] || words[0];
  if (id === target.id) {
    const praise = praiseLines[Math.floor(Math.random() * praiseLines.length)];
    state.storyCollected = [...new Set([...state.storyCollected, target.id])];
    state.feedback = `${praise} The ${target.en} is in the ${world.taskPlace}!`;
    state.feedbackTone = "good";
    speakTeddy(`${praise} The ${target.en} is in the ${world.taskPlace}!`);
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
    if (action === "open-category") element.addEventListener("click", () => openCategory(element.dataset.categoryKey));
    if (action === "open-word-card") element.addEventListener("click", () => openWordCard(element.dataset.wordId));
    if (action === "back-to-category") {
      element.addEventListener("click", () => {
        state.screen = "category";
        render();
      });
    }
    if (action === "previous-card") element.addEventListener("click", () => moveWordCard(-1));
    if (action === "next-card") element.addEventListener("click", () => moveWordCard(1));
    if (action === "random-card") element.addEventListener("click", () => moveWordCard(0));
    if (action === "open-garden") {
      element.addEventListener("click", () => {
        state.screen = "garden";
        state.feedback = "";
        state.feedbackTone = "";
        render();
      });
    }
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
