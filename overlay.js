const defaults = {
  edition: "JBS 第　回",
  title: "日本選手権",
  game: "バックギャモン",
  round: "",
  editionEn: "",
  titleEn: "",
  roundEn: "",
  topName: "",
  bottomName: "",
  topNameEn: "",
  bottomNameEn: "",
  english: false,
  boardPreset: "",
  frameColor: "#383838",
  panelMode: "gradient",
  panelColor: "#FFFFFF",
  accentColor: "#cf2933",
  topColor: "#cf2933",
  bottomColor: "#ffffff",
  personal: false,
  playerPhoto: false,
  guide: false,
  guideVerticalGap: 0,
  guideStart12: 500,
  guideStart6: 910,
  guideGoalStart: 1255,
  guidePointGap: 62,
  video: true,
  sponsors: true,
  sponsors2: false,
  rules: true,
  interval: 60000
};

const boardPresets = {
  japan: { topColor: "#2E3F48", bottomColor: "#ECECEC" },
  bansei: { topColor: "#5D2F47", bottomColor: "#ECECEC" },
  meijin: { topColor: "#56676C", bottomColor: "#ECECEC" },
  oui: { topColor: "#3B3F2F", bottomColor: "#ECECEC" },
  saiou: { topColor: "#595656", bottomColor: "#ECECEC" },
  kishino: { topColor: "#CF2933", bottomColor: "#ECECEC" }
};

const titleBoardPresets = {
  "日本選手権": "japan",
  "盤聖戦": "bansei",
  "名人戦": "meijin",
  "王位戦": "oui",
  "賽王戦": "saiou"
};

const titleEnglishPresets = {
  "日本選手権": "JAPAN OPEN",
  "盤聖戦": "BANSEI",
  "名人戦": "MEIJIN",
  "王位戦": "OUI",
  "賽王戦": "SAIO",
  "棋聖戦": "INVITATIONAL DOUBLES",
  "女王戦": "WOMEN'S CHAMPIONSHIP",
  "新鋭戦": "YOUTH CHAMPIONSHIP",
  "東京オープン": "TOKYO OPEN",
  "大阪オープン": "OSAKA OPEN",
  "名古屋オープン": "NAGOYA OPEN"
};

const titleThemePresets = {
  "日本選手権": "#3C3C3C",
  "盤聖戦": "#6B0D2F",
  "名人戦": "#6B670D",
  "王位戦": "#0D6B2F",
  "賽王戦": "#0D236B",
  "棋聖戦": "#6B230D",
  "女王戦": "#6B0D5B",
  "新鋭戦": "#0D676B",
  "大阪オープン": "#F8B62B",
  "東京オープン": "#009F40",
  "名古屋オープン": "#0C284D"
};

const roundEnglishPresets = {
  "決勝": "FINAL",
  "準決勝": "SEMIFINAL",
  "準々決勝": "QUARTERFINAL",
  "プレーオフ": "PLAY OFF",
  "３回戦": "Round of 16",
  "２回戦": "Round of 32",
  "１回戦": "Round of 64"
};

const ruleSlides = [
  {
    title: "バックギャモンとは？",
    lines: [
      "戦略性の高い「すごろく」です。",
      "🎲🎲を振って15枚のチェッカー(コマ)を進め、相手より先にすべてをゴールすれば得点となります。"
    ]
  },
  {
    title: "ルール① 進行方向",
    lines: [
      "🎲🎲の出目だけ、チェッカーをゴール方向へ進めます。",
      "逆方向には進めません。"
    ],
    note: "この試合では、手前(下)の選手は反時計回りに進み、ゴールは右下です。奥(上)の選手は時計回りに進み、ゴールは右上です。"
  },
  {
    title: "ルール② 出目の使い方",
    lines: [
      "🎲🎲は別々のチェッカーに使えます。",
      "1枚のチェッカーを2回動かすこともできます。"
    ],
    note: "6・5なら、2枚を6と5、または1枚を合計11進めます。1枚を2回動かす場合も、途中の着地点に止まれることが条件です。"
  },
  {
    title: "ルール③ ゾロ目",
    lines: [
      "🎲🎲がゾロ目なら、同じ目を4回使えます。",
      "1枚を4回、2枚を2回ずつなど、動かし方は自由に組み合わせられます。"
    ]
  },
  {
    title: "ルール④ ブロック",
    lines: [
      "同じマスにチェッカーを2枚以上重ねるとブロック(陣地)になります。",
      "相手はそのマスに止まれませんが、飛び越えることはできます。"
    ]
  },
  {
    title: "ルール⑤ ヒット",
    lines: [
      "相手が1枚だけいるマスに止まることで、そのチェッカーをヒット(攻撃)できます。",
      "ヒットされたチェッカーは、ボード中央の「バー」へ移動します。"
    ]
  },
  {
    title: "ルール⑥ エンター",
    lines: [
      "バーにチェッカーがある間は、ボードへの復帰が最優先です。",
      "🎲🎲に従い、相手側のインナー(ゴール側エリア)へ戻します。",
      "どの目でも入れない場合は、ダンス(1回休み)となります。"
    ]
  },
  {
    title: "ルール⑦ ベアイン",
    lines: [
      "ゴールの準備として、すべてのチェッカーを、自分のインナーへ集めます。",
      "ベアインが完了するまで、ゴールを始めることはできません。"
    ]
  },
  {
    title: "ルール⑧ ベアオフ",
    lines: [
      "ベアイン完了後、🎲🎲と同じマスのチェッカーをゴールさせていきます。"
    ],
    note: "該当マスに駒がなく、それより遠い駒もなければ、大きい目で最も遠い駒をゴールできます。"
  },
  {
    title: "ルール⑨ 得点",
    lines: [
      "ゴール完了時の相手の状況により得点が決まります。"
    ],
    note: "相手が1枚以上ゴールしていれば、シングル勝ち(1点)。1枚もゴールしていなければ、ギャモン勝ち(2点)。さらに相手がバー、または自分側インナーに残っていれば、バックギャモン勝ち(3点)となります。"
  },
  {
    title: "ルール⑩ ダブル",
    lines: [
      "🎲🎲を振る前に、得点を2倍にする提案ができます。",
      "相手はテイク(続行)か、パス(現在の点数で失点)を選べます。"
    ],
    note: "テイクした側はさらに2倍の提案をする「リダブル」ができます。"
  }
];

const query = new URLSearchParams(location.search);
const channel = query.get("channel") === "2" ? "2" : "1";
const storageKey = channel === "1" ? "jbs-overlay-state" : `jbs-overlay-state-${channel}`;
const fromQuery = Object.fromEntries([...query.entries()].filter(([key]) => key in defaults));
if ("sponsors" in fromQuery) fromQuery.sponsors = fromQuery.sponsors !== "false";
if ("sponsors2" in fromQuery) fromQuery.sponsors2 = fromQuery.sponsors2 !== "false";
if ("personal" in fromQuery) fromQuery.personal = fromQuery.personal !== "false";
if ("playerPhoto" in fromQuery) fromQuery.playerPhoto = fromQuery.playerPhoto !== "false";
if ("guide" in fromQuery) fromQuery.guide = fromQuery.guide !== "false";
if ("video" in fromQuery) fromQuery.video = fromQuery.video !== "false";
if ("rules" in fromQuery) fromQuery.rules = fromQuery.rules !== "false";
if ("interval" in fromQuery) fromQuery.interval = Number(fromQuery.interval) || defaults.interval;

let state = { ...defaults, ...fromQuery };
let sponsorIndex = 0;
let sponsorTimer;
let languageTimer;
let ruleTimer;
let languageMode = "ja";
let ruleIndex = 0;
let fitFrame;
const savedSettingsKey = "jbs-overlay-saved-settings";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function fitStage() {
  const wrap = $(".stage-wrap");
  const stage = $(".stage");
  if (!wrap || !stage) return;
  const scale = wrap.clientWidth / 1920;
  stage.style.transform = `scale(${scale})`;
  wrap.style.height = `${1080 * scale}px`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function luminance(r, g, b) {
  const channel = (value) => {
    const component = value / 255;
    return component <= 0.04045
      ? component / 12.92
      : ((component + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastText(hex) {
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b) > 0.179 ? "#000000" : "#ffffff";
}

function ordinal(number) {
  const remainder100 = number % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${number}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[number % 10] || "th";
  return `${number}${suffix}`;
}

function englishEdition(value) {
  const normalized = value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xFEE0));
  const match = normalized.match(/^(.*?)第\s*(\d+)\s*回(.*)$/);
  if (!match) return "";
  const prefix = match[1].trim();
  const suffix = match[3].trim();
  return [prefix, ordinal(Number(match[2])), suffix].filter(Boolean).join(" ");
}

function render() {
  const stage = $(".stage");
  if (!stage) return;
  if (state.rules && state.sponsors2) state.sponsors2 = false;
  stage.style.setProperty("--frame-color", state.frameColor);
  $$(".open-output").forEach((button) => {
    button.style.setProperty("--button-theme", state.frameColor);
    button.style.setProperty("--button-top", state.topColor);
    button.style.setProperty("--button-bottom", state.bottomColor);
  });
  stage.classList.toggle("personal-mode", state.personal);
  stage.classList.toggle("player-photo-mode", state.playerPhoto);
  const guideVerticalGap = Math.max(0, Number(state.guideVerticalGap) || 0);
  const guideStart12 = Number(state.guideStart12) || 0;
  const guideStart6 = Number(state.guideStart6) || 0;
  const guideGoalStart = Number(state.guideGoalStart) || 0;
  const guidePointGap = Math.max(20, Number(state.guidePointGap) || 20);
  const guideLeft = guideStart12 - guidePointGap / 2;
  const guideGoalWidth = 84;
  stage.style.setProperty("--guide-vertical-gap", `${guideVerticalGap}px`);
  stage.style.setProperty("--guide-left", `${guideLeft}px`);
  stage.style.setProperty("--guide-width", `${Math.max(guideGoalWidth, guideGoalStart + guideGoalWidth - guideLeft)}px`);
  stage.style.setProperty("--guide-half-width", `${guidePointGap * 6}px`);
  stage.style.setProperty("--guide-second-left", `${guideStart6 - guideLeft - guidePointGap / 2}px`);
  stage.style.setProperty("--guide-goal-left", `${guideGoalStart - guideLeft}px`);
  const frameInk = contrastText(state.frameColor);
  stage.style.setProperty("--frame-ink", frameInk);
  stage.style.setProperty("--frame-shadow", frameInk === "#000000" ? "transparent" : "rgba(0,0,0,.42)");
  stage.style.setProperty("--panel-background", state.panelMode === "gradient"
    ? "linear-gradient(118deg, var(--gold-soft), var(--gold))"
    : state.panelColor);
  const panelInk = state.panelMode === "gradient" ? "#11100d" : contrastText(state.panelColor);
  stage.style.setProperty("--panel-ink", panelInk);
  stage.style.setProperty("--accent", state.accentColor);
  const automaticEditionEn = englishEdition(state.edition);
  if (automaticEditionEn) {
    state.editionEn = automaticEditionEn;
    const editionEnInput = $("[data-field=editionEn]");
    if (editionEnInput) editionEnInput.value = automaticEditionEn;
  }
  const shown = (key) => state.english && languageMode === "en" ? (state[`${key}En`] || state[key]) : state[key];
  $("[data-output=edition]").textContent = shown("edition");
  const titleOutput = $("[data-output=title]");
  const shownTitle = shown("title");
  titleOutput.replaceChildren();
  const twoLineEnglishTitles = ["INVITATIONAL DOUBLES", "WOMEN'S CHAMPIONSHIP", "YOUTH CHAMPIONSHIP"];
  const isTwoLineEnglishTitle = languageMode === "en" && twoLineEnglishTitles.includes(shownTitle.toUpperCase());
  titleOutput.classList.toggle("is-two-line-title", isTwoLineEnglishTitle);
  const titleParts = isTwoLineEnglishTitle ? shownTitle.split(" ") : [shownTitle];
  titleParts.forEach((titlePart, titlePartIndex) => {
    if (titlePartIndex > 0) titleOutput.append(document.createElement("br"));
    titlePart.split(/(INVITATIONAL|CHAMPIONSHIP)/gi).filter(Boolean).forEach((part) => {
    if (/^(INVITATIONAL|CHAMPIONSHIP)$/i.test(part)) {
      const compactWord = document.createElement("span");
      compactWord.className = "compact-title-word";
      compactWord.textContent = part;
      titleOutput.append(compactWord);
    } else {
      titleOutput.append(document.createTextNode(part));
    }
    });
  });
  $("[data-output=game]").textContent = state.english && languageMode === "en"
    ? "BACKGAMMON"
    : state.game;
  const roundOutput = $("[data-output=round]");
  const shownRound = shown("round");
  roundOutput.textContent = shownRound;
  const isFinal = state.round.trim() === "決勝" || shownRound.trim().toUpperCase() === "FINAL";
  roundOutput.style.color = isFinal
    ? (panelInk.toUpperCase() === "#FFFFFF" ? "#FF6670" : "#CF2933")
    : "var(--panel-ink)";
  $("[data-output=topName]").textContent = shown("topName");
  $("[data-output=bottomName]").textContent = shown("bottomName");
  $(".player-dot.top").style.setProperty("--player-color", state.topColor);
  $(".player-dot.bottom").style.setProperty("--player-color", state.bottomColor);
  const topGuide = $(".point-guide.top");
  const bottomGuide = $(".point-guide.bottom");
  topGuide.style.setProperty("--guide-color", state.topColor);
  topGuide.style.setProperty("--guide-ink", contrastText(state.topColor));
  bottomGuide.style.setProperty("--guide-color", state.bottomColor);
  bottomGuide.style.setProperty("--guide-ink", contrastText(state.bottomColor));
  $$(".point-guide").forEach((guide) => { guide.hidden = !state.guide; });
  const guideFields = $(".guide-fields");
  if (guideFields) guideFields.hidden = !state.guide;
  $(".sponsor-rail").hidden = !state.sponsors;
  $(".sponsor-secondary").hidden = !state.sponsors2;
  $$(".personal-video").forEach((area) => { area.hidden = !(state.personal || state.playerPhoto); });
  $(".side-video-window").hidden = !state.video;
  $(".rules-panel").hidden = !state.rules;
  const sponsors2Toggle = $("[data-field=sponsors2]");
  const rulesToggle = $("[data-field=rules]");
  const personalToggle = $("[data-field=personal]");
  const playerPhotoToggle = $("[data-field=playerPhoto]");
  if (sponsors2Toggle) sponsors2Toggle.disabled = Boolean(state.rules);
  if (rulesToggle) rulesToggle.disabled = Boolean(state.sponsors2);
  if (personalToggle) personalToggle.disabled = Boolean(state.playerPhoto);
  if (playerPhotoToggle) playerPhotoToggle.disabled = Boolean(state.personal);
  rotateSponsor(sponsorIndex);
  cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(fitTitleTexts);
}

function fitTitleTexts() {
  $$('[data-output="edition"], [data-output="title"], [data-output="game"], [data-output="round"], [data-output="topName"], [data-output="bottomName"]').forEach((text) => {
    const inTitleCard = Boolean(text.closest(".title-card"));
    if (inTitleCard) text.style.letterSpacing = "";
    text.style.transform = inTitleCard ? "translate(-50%, -50%)" : "none";
    const parentStyle = getComputedStyle(text.parentElement);
    const available = text.parentElement.clientWidth
      - parseFloat(parentStyle.paddingLeft || 0)
      - parseFloat(parentStyle.paddingRight || 0);
    let width = text.offsetWidth;
    if (inTitleCard && width > available) {
      text.style.letterSpacing = "0em";
      width = text.offsetWidth;
    }
    const scale = width > available && width > 0 ? available / width : 1;
    text.style.transform = inTitleCard
      ? `translate(-50%, -50%) scaleX(${scale})`
      : `scaleX(${scale})`;
  });
}

function rotateSponsor(index) {
  const cards = $$(".sponsor-track .sponsor-card:not(.sponsor-clone)");
  if (!cards.length) return;
  const track = $(".sponsor-track");
  const fixedThreeUp = state.sponsors && state.sponsors2 && cards.length <= 3;
  if (fixedThreeUp) index = 0;
  const nextIndex = ((index % cards.length) + cards.length) % cards.length;
  const loopsForward = sponsorIndex === cards.length - 1 && nextIndex === 0 && index > sponsorIndex;
  if (loopsForward) {
    track.style.transform = `translateX(-${cards.length * 100}%)`;
    track.addEventListener("transitionend", () => {
      track.style.transition = "none";
      track.style.transform = "translateX(0)";
      track.offsetWidth;
      track.style.transition = "";
    }, { once: true });
  } else {
    track.style.transform = `translateX(-${nextIndex * 100}%)`;
  }
  sponsorIndex = nextIndex;
  rotateSecondarySponsors(nextIndex, loopsForward, cards.length);
}

function setupSecondarySponsors(index = sponsorIndex) {
  const cards = $$(".sponsor-track .sponsor-card:not(.sponsor-clone)");
  if (!cards.length) return;
  $$('[data-secondary-ad-slot]').forEach((slot, slotIndex) => {
    const secondaryTrack = document.createElement("div");
    secondaryTrack.className = "secondary-sponsor-track";
    const orderedCards = cards.map((_, cardIndex) => cards[(cardIndex + slotIndex + 1) % cards.length]);
    orderedCards.forEach((source) => {
      const card = source.cloneNode(true);
      card.classList.remove("sponsor-clone");
      card.removeAttribute("aria-hidden");
      secondaryTrack.append(card);
    });
    const loopClone = orderedCards[0].cloneNode(true);
    loopClone.classList.add("sponsor-clone");
    loopClone.setAttribute("aria-hidden", "true");
    secondaryTrack.append(loopClone);
    secondaryTrack.style.transition = "none";
    secondaryTrack.style.transform = `translateX(-${index * 100}%)`;
    slot.replaceChildren(secondaryTrack);
    secondaryTrack.offsetWidth;
    secondaryTrack.style.transition = "";
  });
}

function rotateSecondarySponsors(index, loopsForward, cardCount) {
  $$(".secondary-sponsor-track").forEach((track) => {
    if (loopsForward) {
      track.style.transform = `translateX(-${cardCount * 100}%)`;
      track.addEventListener("transitionend", () => {
        track.style.transition = "none";
        track.style.transform = "translateX(0)";
        track.offsetWidth;
        track.style.transition = "";
      }, { once: true });
    } else {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
  });
}

async function loadSponsorImages() {
  try {
    const response = await fetch(`ads.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const ads = await response.json();
    if (!Array.isArray(ads) || !ads.length) return;
    const validAds = ads.filter((ad) => typeof ad?.image === "string" && ad.image.trim());
    if (!validAds.length) return;
    const track = $(".sponsor-track");
    if (!track) return;
    const cards = validAds.map((ad) => {
      const card = document.createElement("article");
      card.className = "sponsor-card sponsor-image-card";
      const image = document.createElement("img");
      image.className = "sponsor-image";
      image.src = ad.image;
      image.alt = typeof ad.alt === "string" ? ad.alt : "スポンサー広告";
      image.decoding = "async";
      card.append(image);
      return card;
    });
    while (cards.length < 3) {
      const fallback = document.createElement("article");
      fallback.className = "sponsor-card sponsor-fallback";
      const logo = document.createElement("img");
      logo.className = "sponsor-fallback-logo";
      logo.src = "assets/ads/jbs-logo.png";
      logo.alt = "JBSロゴ";
      fallback.append(logo);
      cards.push(fallback);
    }
    track.replaceChildren(...cards);
    sponsorIndex = 0;
    setupSecondarySponsors(0);
    rotateSponsor(0);
  } catch (_) {
    /* ads.jsonが空または未配置の場合は仮広告を使用 */
  }
}

function startRotation() {
  clearInterval(sponsorTimer);
  const track = $(".sponsor-track");
  if (track && !track.querySelector(".sponsor-clone")) {
    const first = track.querySelector(".sponsor-card");
    if (first) {
      const clone = first.cloneNode(true);
      clone.classList.add("sponsor-clone");
      clone.setAttribute("aria-hidden", "true");
      track.append(clone);
    }
  }
  setupSecondarySponsors(sponsorIndex);
  const cardCount = $$(".sponsor-track .sponsor-card:not(.sponsor-clone)").length;
  if (state.sponsors && state.sponsors2 && cardCount <= 3) {
    sponsorIndex = 0;
    rotateSponsor(0);
    return;
  }
  sponsorTimer = setInterval(() => rotateSponsor(sponsorIndex + 1), state.interval);
}

function updateEnglishFields() {
  $$(".english-input").forEach((input) => { input.hidden = !state.english; });
}

function startLanguageRotation() {
  clearInterval(languageTimer);
  languageMode = state.english ? "en" : "ja";
  render();
  if (!state.english) return;
  languageTimer = setInterval(() => {
    languageMode = languageMode === "ja" ? "en" : "ja";
    render();
  }, 60000);
}

function rotateRule(index) {
  const slide = ruleSlides[((index % ruleSlides.length) + ruleSlides.length) % ruleSlides.length];
  const panel = $(".rules-slide");
  if (!slide || !panel) return;
  ruleIndex = ((index % ruleSlides.length) + ruleSlides.length) % ruleSlides.length;
  $("[data-rule-title]").textContent = slide.title;
  const copy = $("[data-rule-copy]");
  const paragraph = document.createElement("p");
  slide.lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      paragraph.append(slide.breakBefore?.includes(lineIndex)
        ? document.createElement("br")
        : document.createTextNode("　"));
    }
    paragraph.append(document.createTextNode(line));
  });
  copy.replaceChildren(paragraph);
  const note = $("[data-rule-note]");
  note.replaceChildren();
  note.classList.toggle("is-multiline", Boolean(slide.noteMultiline));
  if (slide.note) {
    const noteText = document.createElement("span");
    noteText.className = "rules-note-text";
    noteText.textContent = slide.note;
    note.append(noteText);
  }
  note.hidden = !slide.note;
  panel.classList.toggle("is-dense", Boolean(slide.note) || slide.lines.length > 2);
  panel.classList.remove("is-entering");
  requestAnimationFrame(() => {
    panel.classList.add("is-entering");
    const title = $("[data-rule-title]");
    title.style.transform = "none";
    const available = panel.clientWidth - 56;
    const scale = title.scrollWidth > available ? available / title.scrollWidth : 1;
    title.style.transform = `scaleX(${scale})`;
    fitRuleSlide(panel);
  });
}

function fitRuleSlide(panel) {
  panel.style.setProperty("--rule-body-size", "28px");
  panel.style.setProperty("--rule-note-size", "20px");
}

function startRuleRotation() {
  clearInterval(ruleTimer);
  rotateRule(ruleIndex);
  ruleTimer = setInterval(() => rotateRule(ruleIndex + 1), 30000);
}

function formatSavedAt(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function readSavedSettings() {
  try { return JSON.parse(localStorage.getItem(savedSettingsKey)) || []; }
  catch (_) { return []; }
}

function settingLabel(entry) {
  const saved = entry.state;
  return [formatSavedAt(entry.savedAt), saved.edition, saved.title, saved.round, saved.topName, saved.bottomName]
    .filter(Boolean)
    .join("・");
}

async function exportStageAsPng() {
  const stage = $(".stage");
  const button = $("#exportPng");
  if (!stage || !button) return;
  if (typeof window.html2canvas !== "function") {
    alert("PNG書出機能を読み込めませんでした。インターネット接続を確認して、ページを再読み込みしてください。");
    return;
  }

  const originalText = button.textContent;
  const originalTransform = stage.style.transform;
  button.disabled = true;
  button.textContent = "書出中…";
  try {
    await document.fonts?.ready;
    await Promise.all($$("img", stage).map((image) => image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })));
    stage.style.transform = "none";
    const canvas = await window.html2canvas(stage, {
      width: 1920,
      height: 1080,
      scale: 1,
      backgroundColor: null,
      useCORS: true,
      logging: false
    });
    const now = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const link = document.createElement("a");
    link.download = `配信盤面-${stamp}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error(error);
    alert("PNGの書き出しに失敗しました。ページを再読み込みして、もう一度お試しください。");
  } finally {
    stage.style.transform = originalTransform;
    button.disabled = false;
    button.textContent = originalText;
  }
}

function syncEditorFromState() {
  $$('[data-field]').forEach((input) => {
    const key = input.dataset.field;
    if (!(key in state)) return;
    if (input.type === "checkbox") input.checked = Boolean(state[key]);
    else input.value = state[key];
  });
  $$('[data-color-for]').forEach((input) => {
    const key = input.dataset.colorFor;
    if (key in state) input.value = state[key];
  });
  const boardSelect = $("[data-board-preset]");
  if (boardSelect) boardSelect.value = state.boardPreset || "";
  updateEnglishFields();
  startLanguageRotation();
  startRotation();
  render();
}

function renderSavedSettings() {
  const container = $("#savedSettings");
  if (!container) return;
  const entries = readSavedSettings();
  container.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "saved-settings-empty";
    empty.textContent = "保存された設定はありません。";
    container.append(empty);
    return;
  }
  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "saved-setting";
    button.textContent = settingLabel(entry);
    button.addEventListener("click", () => {
      state = { ...defaults, ...entry.state };
      localStorage.setItem(storageKey, JSON.stringify(state));
      syncEditorFromState();
      $("#settingsDialog").close();
    });
    container.append(button);
  });
}

function bindEditor() {
  const boardSelect = $("[data-board-preset]");
  if (boardSelect) boardSelect.value = state.boardPreset || "";

  $$('[data-field]').forEach((input) => {
    const key = input.dataset.field;
    input.value = state[key];
    if (input.type === "checkbox") input.checked = Boolean(state[key]);
    input.addEventListener("input", () => {
      const value = input.type === "checkbox" ? input.checked : input.value;
      if (input.classList.contains("hex-input") && !/^#[0-9a-fA-F]{6}$/.test(value)) return;
      state[key] = value;
      if (key === "rules" && value) state.sponsors2 = false;
      if (key === "sponsors2" && value) state.rules = false;
      if (key === "personal" && value) state.playerPhoto = false;
      if (key === "playerPhoto" && value) state.personal = false;
      if (key === "panelColor") {
        state.panelMode = "solid";
        const mode = $("[data-field=panelMode]");
        if (mode) mode.value = "solid";
      }
      $$(`[data-field="${key}"]`).forEach((peer) => {
        if (peer !== input) peer.value = value;
      });
      $$(`[data-color-for="${key}"]`).forEach((peer) => { peer.value = value; });
      render();
      if (["sponsors", "sponsors2", "rules"].includes(key)) startRotation();
      if (key === "english") {
        updateEnglishFields();
        startLanguageRotation();
      }
      localStorage.setItem(storageKey, JSON.stringify(state));
    });
  });

  $$('[data-color-for]').forEach((input) => {
    const key = input.dataset.colorFor;
    input.value = state[key];
    const applyColor = () => {
      state[key] = input.value;
      if (key === "panelColor") {
        state.panelMode = "solid";
        const mode = $("[data-field=panelMode]");
        if (mode) mode.value = "solid";
      }
      $$(`[data-field="${key}"]`).forEach((peer) => { peer.value = input.value.toUpperCase(); });
      render();
      localStorage.setItem(storageKey, JSON.stringify(state));
    };
    input.addEventListener("input", applyColor);
    input.addEventListener("change", applyColor);
  });

  $$('[data-preset-for]').forEach((select) => {
    select.addEventListener("change", () => {
      if (!select.value) return;
      const key = select.dataset.presetFor;
      state[key] = select.value;
      $(`[data-field="${key}"]`).value = select.value;
      if (key === "title") {
        state.titleEn = titleEnglishPresets[select.value] || "";
        $("[data-field=titleEn]").value = state.titleEn;
        const themeColor = titleThemePresets[select.value];
        if (themeColor) {
          state.frameColor = themeColor;
          $$('[data-field="frameColor"]').forEach((input) => { input.value = themeColor; });
          $$('[data-color-for="frameColor"]').forEach((input) => { input.value = themeColor; });
        }
        const boardKey = titleBoardPresets[select.value];
        const boardPreset = boardPresets[boardKey];
        if (boardPreset) {
          state.boardPreset = boardKey;
          if (boardSelect) boardSelect.value = boardKey;
          Object.entries(boardPreset).forEach(([colorKey, value]) => {
            state[colorKey] = value;
            $$(`[data-field="${colorKey}"]`).forEach((input) => { input.value = value; });
            $$(`[data-color-for="${colorKey}"]`).forEach((input) => { input.value = value; });
          });
        }
      }
      if (key === "round") {
        state.roundEn = roundEnglishPresets[select.value] || "";
        $("[data-field=roundEn]").value = state.roundEn;
      }
      render();
      localStorage.setItem(storageKey, JSON.stringify(state));
      select.value = "";
    });
  });

  boardSelect?.addEventListener("change", (event) => {
    state.boardPreset = event.currentTarget.value;
    const preset = boardPresets[state.boardPreset];
    if (!preset) {
      localStorage.setItem(storageKey, JSON.stringify(state));
      return;
    }
    Object.entries(preset).forEach(([key, value]) => {
      state[key] = value;
      $$(`[data-field="${key}"]`).forEach((input) => { input.value = value; });
      $$(`[data-color-for="${key}"]`).forEach((input) => { input.value = value; });
    });
    render();
    localStorage.setItem(storageKey, JSON.stringify(state));
  });

  $("#swapPlayerColors")?.addEventListener("click", () => {
    [state.topColor, state.bottomColor] = [state.bottomColor, state.topColor];
    ["topColor", "bottomColor"].forEach((key) => {
      $$(`[data-field="${key}"]`).forEach((input) => { input.value = state[key].toUpperCase(); });
      $$(`[data-color-for="${key}"]`).forEach((input) => { input.value = state[key]; });
    });
    render();
    localStorage.setItem(storageKey, JSON.stringify(state));
  });

  const channelSelect = $("#channelSelect");
  if (channelSelect) {
    channelSelect.value = channel;
    channelSelect.addEventListener("change", () => {
      location.href = `?channel=${channelSelect.value}`;
    });
  }

  $("#openOutput")?.addEventListener("click", () => {
    window.open(`output.html?channel=${channel}`, `jbs-overlay-output-${channel}`);
  });

  $("#saveSettings")?.addEventListener("click", () => {
    const entries = readSavedSettings();
    entries.unshift({ savedAt: new Date().toISOString(), state: { ...state } });
    localStorage.setItem(savedSettingsKey, JSON.stringify(entries.slice(0, 100)));
  });

  $("#loadSettings")?.addEventListener("click", () => {
    renderSavedSettings();
    $("#settingsDialog")?.showModal();
  });

  $("#exportPng")?.addEventListener("click", exportStageAsPng);

  $("#closeSettings")?.addEventListener("click", () => $("#settingsDialog")?.close());
  $("#settingsDialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
}

function loadSharedState() {
  if (!Object.keys(fromQuery).length) {
    try {
      const savedState = JSON.parse(localStorage.getItem(storageKey));
      const usesOldTextDefaults = savedState && (
        savedState.edition === "JBS 第54回"
        || savedState.round === "準決勝"
        || savedState.topName === ""
        || savedState.bottomName === ""
      );
      if (savedState?.edition === "JBS 第54回") savedState.edition = defaults.edition;
      if (savedState?.round === "準決勝") savedState.round = defaults.round;
      if (savedState?.round === "（未選択）") savedState.round = "";
      if (savedState?.topName === "（未入力）") savedState.topName = "";
      if (savedState?.bottomName === "（未入力）") savedState.bottomName = "";
      const usesOldGuideDefaults = savedState
        && Number(savedState.guideVerticalGap ?? 0) === 0
        && Number(savedState.guideStart12 ?? 492) === 492
        && Number(savedState.guideStart6 ?? 907) === 907
        && Number(savedState.guideGoalStart ?? 1270) === 1270
        && Number(savedState.guidePointGap ?? 63) === 63;
      if (usesOldGuideDefaults) {
        savedState.guideVerticalGap = defaults.guideVerticalGap;
        savedState.guideStart12 = defaults.guideStart12;
        savedState.guideStart6 = defaults.guideStart6;
        savedState.guideGoalStart = defaults.guideGoalStart;
        savedState.guidePointGap = defaults.guidePointGap;
      }
      state = { ...state, ...savedState };
      if (usesOldGuideDefaults || usesOldTextDefaults) localStorage.setItem(storageKey, JSON.stringify(state));
      if (state.panelColor?.toUpperCase() === "#CFB064") {
        state.panelColor = "#FFFFFF";
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    }
    catch (_) { /* use defaults */ }
  }
}

loadSharedState();
state.interval = 60000;
render();
bindEditor();
updateEnglishFields();
loadSponsorImages().finally(startRotation);
startLanguageRotation();
startRuleRotation();
addEventListener("resize", fitStage);
fitStage();
document.fonts?.ready.then(() => {
  fitTitleTexts();
});
