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
  // Kept separately from the board/panel/player colors: common's secondary theme shade.
  themeSubColor: "",
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
  right1Mode: "title",
  right2Mode: "none",
  right3Mode: "sponsors",
  right4Mode: "rules",
  right1Thumbnail: "",
  right2Thumbnail: "",
  interval: 60000
};

const defaultPlayerPhoto = "assets/dummy.png";
const memberPhotoByName = new Map();
const mediaLibrary = { thumbnails: [], ads: [] };
let thumbnailIndex = 0;
let thumbnailTimer = null;
const IMAGE_MODE_PREFIX = { thumbnail: "thumbnail:", sponsor: "sponsor:" };

function mediaMode(mode, kind) {
  if (kind === "thumbnail") return mode === "thumbnail" || String(mode).startsWith(IMAGE_MODE_PREFIX.thumbnail);
  return mode === "sponsors" || mode === "sponsors2" || mode === "sponsors2bottom"
    || String(mode).startsWith(IMAGE_MODE_PREFIX.sponsor);
}

function fixedMediaPath(mode, kind) {
  const prefix = IMAGE_MODE_PREFIX[kind];
  return typeof mode === "string" && mode.startsWith(prefix) ? mode.slice(prefix.length) : "";
}

function normalizeLegacyMediaModes(target) {
  for (const slot of ["right1", "right2"]) {
    const old = target[`${slot}Thumbnail`];
    if (target[`${slot}Mode`] !== "thumbnail" || typeof old !== "string" || !old) continue;
    // The former second dropdown selected a single thumbnail URL; preserve it.
    try {
      const url = new URL(old, document.baseURI);
      const decoded = decodeURI(url.pathname);
      const segment = decoded.indexOf("assets/thumbnail/");
      if (segment >= 0) target[`${slot}Mode`] = `thumbnail:${decoded.slice(segment)}`;
    } catch (_) { /* unsupported (e.g. a temporary blob URL): use slideshow */ }
  }
  return target;
}

function updateMediaOptions() {
  const groups = [
    ["right1Mode", mediaLibrary.thumbnails, IMAGE_MODE_PREFIX.thumbnail],
    ["right2Mode", mediaLibrary.thumbnails, IMAGE_MODE_PREFIX.thumbnail],
    ["right3Mode", mediaLibrary.ads, IMAGE_MODE_PREFIX.sponsor],
    ["right4Mode", mediaLibrary.ads, IMAGE_MODE_PREFIX.sponsor]
  ];
  for (const [id, entries, prefix] of groups) {
    const select = document.getElementById(id);
    if (!select) continue;
    const selected = state[id];
    // Remove only manifest options; retain defaults, including the legacy bottom-only mode.
    select.querySelectorAll('option[data-media-option]').forEach(option => option.remove());
    entries.forEach((entry) => {
      const option = new Option(entry.name, prefix + entry.path);
      option.dataset.mediaOption = "true";
      select.append(option);
    });
    // Keep the old right4 bottom-only mode available, after the fixed-image choices.
    if (id === "right4Mode") {
      const legacy = select.querySelector('option[value="sponsors2bottom"]');
      if (legacy) select.append(legacy);
    }
    // Options for a previously selected but now removed file remain visible
    // until the user changes their selection, rather than silently overwriting state.
    if (selected && ![...select.options].some(option => option.value === selected)) {
      if (selected.startsWith(prefix)) {
        const missing = new Option(`（ファイルなし）${selected.slice(prefix.length).split("/").pop()}`, selected);
        missing.dataset.mediaOption = "true";
        select.append(missing);
      }
    }
    select.value = selected;
  }
}

function validateMediaEntries(list, folder) {
  if (!Array.isArray(list)) return [];
  const prefix = `assets/${folder}/`;
  return list.filter(entry => entry && typeof entry.path === "string"
      && entry.path.startsWith(prefix) && !entry.path.includes("..")
      && /\.(?:png|jpe?g|webp|gif)$/i.test(entry.path))
    .map(entry => ({ path: entry.path, name: entry.path.slice(prefix.length) }));
}

async function loadMediaLibrary() {
  try {
    const response = await fetch(`media.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`media.json: ${response.status}`);
    const data = await response.json();
    mediaLibrary.thumbnails = validateMediaEntries(data.thumbnails, "thumbnail");
    mediaLibrary.ads = validateMediaEntries(data.ads, "ads")
      .filter(entry => entry.name.toLowerCase() !== "jbs-logo.png");
    updateMediaOptions();
    buildSponsorCards();
    startRotation();
    thumbnailIndex = 0;
    startThumbnailRotation();
    render();
  } catch (error) {
    console.warn("画像一覧を取得できませんでした。現在の広告設定を維持します。", error);
    // A missing manifest must not prevent the usual ads.json fallback.
    loadSponsorImages().finally(startRotation);
  }
}

function currentThumbnail(slot, offset = 0) {
  const mode = state[`${slot}Mode`];
  const fixedPath = fixedMediaPath(mode, "thumbnail");
  if (fixedPath) return fixedPath;
  if (mode !== "thumbnail") return "";
  const images = mediaLibrary.thumbnails;
  if (!images.length) return "";
  return images[(thumbnailIndex + offset) % images.length].path;
}

function renderThumbnails() {
  const rotating = ["right1", "right2"].filter(slot => state[`${slot}Mode`] === "thumbnail");
  const titleCard = $(".title-card");
  if (titleCard) {
    const imagePath = currentThumbnail("right1", rotating.indexOf("right1"));
    titleCard.style.backgroundImage = mediaMode(state.right1Mode, "thumbnail") && imagePath
      ? `url(${JSON.stringify(imagePath)})` : "";
  }
  const thumbnail = $(".side-thumbnail");
  if (thumbnail) {
    const imagePath = currentThumbnail("right2", Math.max(0, rotating.indexOf("right2")));
    thumbnail.hidden = !mediaMode(state.right2Mode, "thumbnail") || !imagePath;
    if (imagePath && thumbnail.getAttribute("src") !== imagePath) thumbnail.src = imagePath;
  }
}

function startThumbnailRotation() {
  clearInterval(thumbnailTimer);
  renderThumbnails();
  if (!["right1", "right2"].some(slot => state[`${slot}Mode`] === "thumbnail")
      || mediaLibrary.thumbnails.length < 2) return;
  thumbnailTimer = setInterval(() => {
    const count = ["right1", "right2"].filter(slot => state[`${slot}Mode`] === "thumbnail").length;
    // When both slots use the entire library (currently two images), swap
    // the pair instead of leaving an apparently stopped slideshow.
    const step = count >= mediaLibrary.thumbnails.length ? 1 : count;
    thumbnailIndex = (thumbnailIndex + step) % mediaLibrary.thumbnails.length;
    renderThumbnails();
  }, state.interval);
}


function isForeignMember(member) {
  const name = member.nameJa;
  return /[A-Za-z]/.test(name) && !/[\u3040-\u30ff\u3400-\u9fff]/.test(name);
}

function katakanaToHiragana(value) {
  return String(value || '').replace(/[\u30a1-\u30f6]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60)
  );
}

const ROMAJI_TO_HIRAGANA = new Map(Object.entries({
  kya:'きゃ', kyu:'きゅ', kyo:'きょ', gya:'ぎゃ', gyu:'ぎゅ', gyo:'ぎょ',
  sha:'しゃ', shu:'しゅ', sho:'しょ', sya:'しゃ', syu:'しゅ', syo:'しょ',
  ja:'じゃ', ju:'じゅ', jo:'じょ', jya:'じゃ', jyu:'じゅ', jyo:'じょ',
  cha:'ちゃ', chu:'ちゅ', cho:'ちょ', cya:'ちゃ', cyu:'ちゅ', cyo:'ちょ',
  tya:'ちゃ', tyu:'ちゅ', tyo:'ちょ', nya:'にゃ', nyu:'にゅ', nyo:'にょ',
  hya:'ひゃ', hyu:'ひゅ', hyo:'ひょ', bya:'びゃ', byu:'びゅ', byo:'びょ',
  pya:'ぴゃ', pyu:'ぴゅ', pyo:'ぴょ', mya:'みゃ', myu:'みゅ', myo:'みょ',
  rya:'りゃ', ryu:'りゅ', ryo:'りょ', fa:'ふぁ', fi:'ふぃ', fe:'ふぇ', fo:'ふぉ',
  va:'ゔぁ', vi:'ゔぃ', vu:'ゔ', ve:'ゔぇ', vo:'ゔぉ', shi:'し', chi:'ち', tsu:'つ',
  si:'し', ti:'ち', tu:'つ', hu:'ふ', ji:'じ', zi:'じ',
  a:'あ', i:'い', u:'う', e:'え', o:'お', ka:'か', ki:'き', ku:'く', ke:'け', ko:'こ',
  ga:'が', gi:'ぎ', gu:'ぐ', ge:'げ', go:'ご', sa:'さ', su:'す', se:'せ', so:'そ',
  za:'ざ', zu:'ず', ze:'ぜ', zo:'ぞ', ta:'た', te:'て', to:'と', da:'だ', di:'ぢ',
  du:'づ', de:'で', do:'ど', na:'な', ni:'に', nu:'ぬ', ne:'ね', no:'の',
  ha:'は', hi:'ひ', fu:'ふ', he:'へ', ho:'ほ', ba:'ば', bi:'び', bu:'ぶ', be:'べ', bo:'ぼ',
  pa:'ぱ', pi:'ぴ', pu:'ぷ', pe:'ぺ', po:'ぽ', ma:'ま', mi:'み', mu:'む', me:'め', mo:'も',
  ya:'や', yu:'ゆ', yo:'よ', ra:'ら', ri:'り', ru:'る', re:'れ', ro:'ろ',
  wa:'わ', wi:'ゐ', we:'ゑ', wo:'を', n:'ん'
}));

function romajiToHiragana(value) {
  const source = String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'").replace(/[^A-Za-z'-]/g, '').toLowerCase();
  if (!source) return '';
  let result = '';
  let index = 0;
  while (index < source.length) {
    if (source[index] === '-' || source[index] === "'") { index += 1; continue; }
    if (index > 0 && source[index] === 'h' && source[index - 1] === 'o') { index += 1; continue; }
    if (index + 1 < source.length && source[index] === source[index + 1]
      && /[bcdfghjklmpqrstvwxyz]/.test(source[index]) && source[index] !== 'n') {
      result += 'っ'; index += 1; continue;
    }
    if (source[index] === 'm' && index + 1 < source.length && /[bmp]/.test(source[index + 1])) {
      result += 'ん'; index += 1; continue;
    }
    if (source[index] === 'n' && (index === source.length - 1 || source[index + 1] === "'" || !/[aiueoy]/.test(source[index + 1]))) {
      result += 'ん'; index += 1; if (source[index] === "'") index += 1; continue;
    }
    let matched = false;
    for (const length of [3, 2, 1]) {
      const kana = ROMAJI_TO_HIRAGANA.get(source.slice(index, index + length));
      if (kana) { result += kana; index += length; matched = true; break; }
    }
    if (!matched) return '';
  }
  return result;
}

function japaneseSurnameSortKey(member) {
  const surnameJa = String(member.nameJa || '').trim().split(/\s+/)[0] || '';
  if (surnameJa && /^[\u3040-\u30ffー]+$/.test(surnameJa)) return katakanaToHiragana(surnameJa);
  const tokens = String(member.nameEn || '').trim().split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '')).filter(Boolean);
  const uppercaseSurname = tokens.find((token) => /[A-Z]/.test(token) && token === token.toUpperCase() && /^[A-Z'-]+$/.test(token));
  const japaneseLikeTokens = tokens.filter((token) => romajiToHiragana(token));
  const surnameRomaji = uppercaseSurname || japaneseLikeTokens.at(-1) || tokens[0] || '';
  return romajiToHiragana(surnameRomaji) || surnameRomaji.toLocaleLowerCase('en');
}

function foreignFirstNameSortKey(member) {
  return String(member.nameJa || '').trim().split(/\s+/)[0].toLocaleLowerCase('en');
}

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

// Common is the authoritative tournament master.  These existing tables above
// remain as fallbacks when the shared brand script or JSON is unavailable.
function commonTournament(name) {
  const brand = window.JBSBrand;
  if (!brand || !brand.getConfig?.()) return null;
  return brand.getTournament(name);
}

function refreshTournamentOptions() {
  const brand = window.JBSBrand;
  const select = document.getElementById("titlePreset");
  if (!brand?.getConfig?.() || !select) return;
  const tournaments = brand.getTournaments();
  if (!tournaments.length) return;
  const previous = select.value;
  select.replaceChildren(new Option("選択", ""));
  tournaments.forEach((entry) => select.add(new Option(entry.name, entry.name)));
  if ([...select.options].some((option) => option.value === previous)) select.value = previous;
}

async function loadCommonBrand() {
  if (!window.JBSBrand?.load) return;
  try {
    await window.JBSBrand.load();
    refreshTournamentOptions();
    // Use the shared contrast rule without resetting a saved or manually
    // edited title, edition or theme color when the download finishes.
    render();
  } catch (error) {
    console.warn("JBS commonを取得できなかったため、既存の大会設定を使用します。", error);
  }
}

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
const stateChannelName = `jbs-overlay-live-${channel}`;
const stateChannel = typeof BroadcastChannel === "function" ? new BroadcastChannel(stateChannelName) : null;

function encodeOutputState(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeOutputState(value) {
  if (!value) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  catch (_) {
    return null;
  }
}

const embeddedState = decodeOutputState(query.get("state"));
const fromQuery = Object.fromEntries([...query.entries()].filter(([key]) => key in defaults));
if ("sponsors" in fromQuery) fromQuery.sponsors = fromQuery.sponsors !== "false";
if ("sponsors2" in fromQuery) fromQuery.sponsors2 = fromQuery.sponsors2 !== "false";
if ("personal" in fromQuery) fromQuery.personal = fromQuery.personal !== "false";
if ("playerPhoto" in fromQuery) fromQuery.playerPhoto = fromQuery.playerPhoto !== "false";
if ("guide" in fromQuery) fromQuery.guide = fromQuery.guide !== "false";
if ("video" in fromQuery) fromQuery.video = fromQuery.video !== "false";
if ("rules" in fromQuery) fromQuery.rules = fromQuery.rules !== "false";
if ("interval" in fromQuery) fromQuery.interval = Number(fromQuery.interval) || defaults.interval;

let state = normalizeLegacyMediaModes({ ...defaults, ...(embeddedState || {}), ...fromQuery });
if (!state.right1Mode) state.right1Mode = "title";
let sponsorIndex = 0;
let sponsorTimer;
let languageTimer;
let ruleTimer;
let languageMode = "ja";
let ruleIndex = 0;
let fitFrame;
let lastStoredState = embeddedState ? null : localStorage.getItem(storageKey);
const savedSettingsKey = "jbs-overlay-saved-settings";
let pendingPngDownload = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function persistState() {
  const serialized = JSON.stringify(state);
  lastStoredState = serialized;
  localStorage.setItem(storageKey, serialized);
  stateChannel?.postMessage({ type: "state", state });
}

function applyExternalState(nextState) {
  if (!nextState || typeof nextState !== "object" || Array.isArray(nextState)) return;
  state = normalizeLegacyMediaModes({ ...defaults, ...nextState });
  if (!state.right1Mode) state.right1Mode = "title";
  syncEditorFromState();
}

stateChannel?.addEventListener("message", (event) => {
  if (event.data?.type === "state") applyExternalState(event.data.state);
});

addEventListener("storage", (event) => {
  if (event.key !== storageKey || !event.newValue) return;
  lastStoredState = event.newValue;
  try { applyExternalState(JSON.parse(event.newValue)); }
  catch (_) { /* ignore malformed shared state */ }
});

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
  // Threshold and ink colors are centrally maintained by common.
  if (window.JBSBrand?.getConfig?.()) {
    const shared = window.JBSBrand.getTextColor(hex);
    if (shared) return shared;
  }
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b) > 0.179 ? "#000000" : "#ffffff";
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ordinal(number) {
  const remainder100 = number % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${number}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[number % 10] || "th";
  return `${number}${suffix}`;
}

function englishEdition(value) {
  const normalized = value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xFEE0));
  const match = normalized.match(/^(.*?)第\s*(\d+)\s*(?:回|期)(.*)$/);
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
  // Expose the common sub color without changing existing board/panel styling.
  stage.style.setProperty("--tournament-sub-color", state.themeSubColor || state.frameColor);
  $$(".open-output").forEach((button) => {
    button.style.setProperty("--button-theme", state.frameColor);
    button.style.setProperty("--button-top", state.topColor);
    button.style.setProperty("--button-bottom", state.bottomColor);
  });
  stage.classList.toggle("personal-mode", state.personal);
  stage.classList.toggle("player-photo-mode", state.playerPhoto);
  stage.dataset.right1Mode = mediaMode(state.right1Mode, "thumbnail") ? "thumbnail" : (state.right1Mode || "title");
  stage.dataset.right2Mode = mediaMode(state.right2Mode, "thumbnail") ? "thumbnail" : (state.right2Mode || "none");
  stage.dataset.right3Mode = state.right3Mode || "sponsors";
  stage.dataset.right4Mode = fixedMediaPath(state.right4Mode, "sponsor")
    ? "sponsors2bottom" : (state.right4Mode || "rules");
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
  const topGuideInk = contrastText(state.topColor);
  topGuide.style.setProperty("--guide-ink", topGuideInk);
  topGuide.style.setProperty("--guide-background", rgba(state.topColor, 0.7));
  topGuide.style.setProperty("--guide-border", rgba(topGuideInk, 0.34));
  bottomGuide.style.setProperty("--guide-color", state.bottomColor);
  const bottomGuideInk = contrastText(state.bottomColor);
  bottomGuide.style.setProperty("--guide-ink", bottomGuideInk);
  bottomGuide.style.setProperty("--guide-background", rgba(state.bottomColor, 0.7));
  bottomGuide.style.setProperty("--guide-border", rgba(bottomGuideInk, 0.34));
  $$(".point-guide").forEach((guide) => { guide.hidden = !state.guide; });
  const guideFields = $(".guide-fields");
  if (guideFields) guideFields.hidden = !state.guide;
  $(".sponsor-rail").hidden = !state.sponsors;
  $(".sponsor-secondary").hidden = !state.sponsors2;
  const titleFields = $(".title-fields");
  if (titleFields) {
    // Keep the entire row in place; either title slot enables editing.
    // Other modes disable inputs without clearing values or moving the preview.
    const titleActive = ["right1Mode", "right2Mode"].some((key) => state[key] === "title");
    titleFields.hidden = false;
    titleFields.classList.toggle("is-inactive", !titleActive);
    titleFields.setAttribute("aria-disabled", String(!titleActive));
    titleFields.querySelectorAll("input, select").forEach((control) => {
      control.disabled = !titleActive;
    });
  }
  const titleCard = $(".stage > .title-card");
  if (titleCard) titleCard.hidden = (state.right1Mode || "title") === "none";
  // Right2 has its own 480x270 panel. Mirror the current tournament content
  // (including text coloring and English display) without mutating right1.
  const right2Title = $(".title-card-right2");
  if (titleCard && right2Title) {
    right2Title.replaceChildren(...Array.from(titleCard.children, node => node.cloneNode(true)));
  }
  const panelActive = ["right1Mode", "right2Mode"].some((key) => state[key] === "title");
  const panelField = $(".panel-color-field");
  if (panelField) {
    panelField.classList.toggle("is-inactive", !panelActive);
    panelField.setAttribute("aria-disabled", String(!panelActive));
    panelField.querySelectorAll("input, select").forEach((control) => {
      control.disabled = !panelActive;
    });
  }
  renderThumbnails();
  $$(".personal-video").forEach((area) => { area.hidden = !(state.personal || state.playerPhoto); });
  ["top", "bottom"].forEach((side) => {
    const image = $(`.personal-video.${side} .personal-photo`);
    if (!image) return;
    if (!image.dataset.fallbackBound) {
      image.addEventListener("error", () => {
        if (!image.src.endsWith(`/${defaultPlayerPhoto}`)) image.src = defaultPlayerPhoto;
      });
      image.dataset.fallbackBound = "true";
    }
    const requestedSrc = memberPhotoByName.get(state[`${side}Name`]) || defaultPlayerPhoto;
    if (image.dataset.requestedSrc !== requestedSrc) {
      image.dataset.requestedSrc = requestedSrc;
      image.src = requestedSrc;
    }
  });
  $(".side-video-window").hidden = !["reference", "thumbnail"].includes(stage.dataset.right2Mode);
  $(".rules-panel").hidden = state.right4Mode !== "rules";
  $(".sponsor-rail").hidden = !mediaMode(state.right3Mode, "sponsor");
  $(".sponsor-secondary").hidden = !mediaMode(state.right4Mode, "sponsor");
  $(".slot-reference-3").hidden = state.right3Mode !== "reference";
  $(".slot-reference-4").hidden = state.right4Mode !== "reference";
  const primaryFixed = $(".primary-fixed-ad");
  const fixedRight3 = fixedMediaPath(state.right3Mode, "sponsor");
  if (primaryFixed) {
    primaryFixed.hidden = !fixedRight3;
    if (fixedRight3 && primaryFixed.getAttribute("src") !== fixedRight3) primaryFixed.src = fixedRight3;
  }
  const sponsorTrack = $(".sponsor-rail .sponsor-track");
  if (sponsorTrack) sponsorTrack.hidden = Boolean(fixedRight3);
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
  const fixedAllVisible = getActiveSponsorSlotCount() >= cards.length;
  if (fixedAllVisible) index = 0;
  const nextIndex = ((index % cards.length) + cards.length) % cards.length;
  const loopsForward = index >= cards.length && index > sponsorIndex;
  if (loopsForward) {
    track.style.transform = `translateX(-${index * 100}%)`;
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
  rotateSecondarySponsors(nextIndex, loopsForward, index);
}

function getActiveSponsorSlotCount() {
  const primaryCount = state.right3Mode === "sponsors" ? 1 : 0;
  const right4Mode = state.right4Mode || "rules";
  const secondaryCount = right4Mode === "sponsors2" ? 2 : right4Mode === "sponsors2bottom" ? 1 : 0;
  return primaryCount + secondaryCount;
}

function setupSecondarySponsors(index = sponsorIndex) {
  const cards = $$(".sponsor-track .sponsor-card:not(.sponsor-clone)");
  if (!cards.length) return;
  const primaryOffset = state.right3Mode === "sponsors" ? 1 : 0;
  const right4Mode = state.right4Mode || "rules";
  const activeSlotIndexes = right4Mode === "sponsors2" ? [0, 1] : right4Mode === "sponsors2bottom" ? [1] : [];
  const right4Fixed = fixedMediaPath(right4Mode, "sponsor");
  $$('[data-secondary-ad-slot]').forEach((slot, slotIndex) => {
    if (right4Fixed) {
      if (slotIndex === 1) {
        const image = document.createElement("img");
        image.className = "secondary-fixed-ad";
        image.src = right4Fixed;
        image.alt = "固定広告";
        slot.replaceChildren(image);
      } else slot.replaceChildren();
      return;
    }
    const secondaryTrack = document.createElement("div");
    secondaryTrack.className = "secondary-sponsor-track";
    const activePosition = Math.max(0, activeSlotIndexes.indexOf(slotIndex));
    const slotOffset = primaryOffset + activePosition;
    const orderedCards = cards.map((_, cardIndex) => cards[(cardIndex + slotOffset) % cards.length]);
    orderedCards.forEach((source) => {
      const card = source.cloneNode(true);
      card.classList.remove("sponsor-clone");
      card.removeAttribute("aria-hidden");
      secondaryTrack.append(card);
    });
    const cloneCount = Math.max(1, getActiveSponsorSlotCount());
    orderedCards.slice(0, cloneCount).forEach((source) => {
      const loopClone = source.cloneNode(true);
      loopClone.classList.add("sponsor-clone");
      loopClone.setAttribute("aria-hidden", "true");
      secondaryTrack.append(loopClone);
    });
    secondaryTrack.style.transition = "none";
    secondaryTrack.style.transform = `translateX(-${index * 100}%)`;
    slot.replaceChildren(secondaryTrack);
    secondaryTrack.offsetWidth;
    secondaryTrack.style.transition = "";
  });
}

function rotateSecondarySponsors(index, loopsForward, rawIndex) {
  $$(".secondary-sponsor-track").forEach((track) => {
    if (loopsForward) {
      track.style.transform = `translateX(-${rawIndex * 100}%)`;
      track.addEventListener("transitionend", () => {
        track.style.transition = "none";
        track.style.transform = `translateX(-${index * 100}%)`;
        track.offsetWidth;
        track.style.transition = "";
      }, { once: true });
    } else {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
  });
}

function buildSponsorCards() {
  const track = $(".sponsor-track");
  if (!track) return;
  const cards = mediaLibrary.ads.map(ad => {
    const card = document.createElement("article");
    card.className = "sponsor-card sponsor-image-card";
    const image = document.createElement("img");
    image.className = "sponsor-image";
    image.src = ad.path;
    image.alt = ad.name;
    image.decoding = "async";
    card.append(image);
    return card;
  });
  if (!cards.length) {
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
}

async function loadSponsorImages() {
  try {
    const response = await fetch(`ads.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const ads = await response.json();
    if (!Array.isArray(ads)) return;
    mediaLibrary.ads = validateMediaEntries(
      ads.filter(ad => typeof ad?.image === "string").map(ad => ({ path: ad.image })), "ads");
    buildSponsorCards();
    updateMediaOptions();
  } catch (_) {
    /* ads.json が未配置の場合は元のJBSロゴを使用 */
  }
}

function startRotation() {
  clearInterval(sponsorTimer);
  const track = $(".sponsor-track");
  if (track) {
    track.querySelectorAll(".sponsor-clone").forEach((clone) => clone.remove());
    const cards = [...track.querySelectorAll(".sponsor-card")];
    const cloneCount = Math.max(1, getActiveSponsorSlotCount());
    cards.slice(0, cloneCount).forEach((first) => {
      const clone = first.cloneNode(true);
      clone.classList.add("sponsor-clone");
      clone.setAttribute("aria-hidden", "true");
      track.append(clone);
    });
  }
  setupSecondarySponsors(sponsorIndex);
  const cardCount = $$(".sponsor-track .sponsor-card:not(.sponsor-clone)").length;
  if (!getActiveSponsorSlotCount() || getActiveSponsorSlotCount() >= cardCount) {
    sponsorIndex = 0;
    rotateSponsor(0);
    return;
  }
  const step = Math.max(1, getActiveSponsorSlotCount());
  sponsorTimer = setInterval(() => rotateSponsor(sponsorIndex + step), state.interval);
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

function downloadJson() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), state: { ...state } };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  link.download = `配信盤面設定-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importJsonFile(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = parsed?.state && typeof parsed.state === "object" ? parsed.state : parsed;
    if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error();
    const allowed = Object.fromEntries(Object.entries(imported).filter(([key]) => key in defaults));
    state = { ...defaults, ...allowed };
    persistState();
    syncEditorFromState();
  }
  catch (_) {
    alert("JSON設定を読み込めませんでした。配信盤面から出力したJSONファイルを選択してください。");
  }
}

async function loadMembers() {
  const selects = $$('[data-member-for]');
  try {
    const response = await fetch('https://jbsbackgammon.github.io/member/data/members.json', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const source = Array.isArray(data) ? data : data?.members;
    if (!Array.isArray(source)) throw new Error();
    const members = source
      .map((member) => ({
        nameJa: String(member?.name ?? member?.nameJa ?? '').trim(),
        nameEn: String(member?.nameEn ?? '').trim(),
        photo: String(member?.photo ?? '').trim()
      }))
      .filter((member) => member.nameJa)
      .sort((a, b) => {
        const aForeign = isForeignMember(a);
        const bForeign = isForeignMember(b);
        if (aForeign !== bForeign) return aForeign ? 1 : -1;
        if (!aForeign) {
          return japaneseSurnameSortKey(a).localeCompare(japaneseSurnameSortKey(b), 'ja', { sensitivity: 'base', numeric: true })
            || a.nameEn.localeCompare(b.nameEn, 'en', { sensitivity: 'base', numeric: true })
            || a.nameJa.localeCompare(b.nameJa, 'ja', { sensitivity: 'base', numeric: true });
        }
        return foreignFirstNameSortKey(a).localeCompare(foreignFirstNameSortKey(b), 'en', { sensitivity: 'base', numeric: true })
          || a.nameJa.localeCompare(b.nameJa, 'en', { sensitivity: 'base', numeric: true });
      });
    memberPhotoByName.clear();
    members.forEach((member) => {
      const fallbackFilename = member.nameEn ? `${member.nameJa}_${member.nameEn}.png` : '';
      const photoPath = member.photo.replace(/^\.\.\//, '').replace(/^\//, '');
      const photoUrl = photoPath
        ? new URL(photoPath, 'https://jbsbackgammon.github.io/member/').href
        : fallbackFilename
          ? `https://jbsbackgammon.github.io/member/images/${encodeURIComponent(fallbackFilename)}`
          : '';
      if (photoUrl) memberPhotoByName.set(member.nameJa, photoUrl);
    });
    selects.forEach((select) => {
      members.forEach((member) => {
        const option = document.createElement('option');
        option.value = member.nameJa;
        option.textContent = member.nameJa;
        option.dataset.nameEn = member.nameEn;
        select.append(option);
      });
      select.addEventListener('change', () => {
        if (!select.value) return;
        const side = select.dataset.memberFor;
        const option = select.selectedOptions[0];
        state[`${side}Name`] = select.value;
        state[`${side}NameEn`] = option.dataset.nameEn || '';
        $(`[data-field="${side}Name"]`).value = state[`${side}Name`];
        $(`[data-field="${side}NameEn"]`).value = state[`${side}NameEn`];
        persistState();
        render();
        select.value = '';
      });
    });
    render();
  }
  catch (_) {
    selects.forEach((select) => {
      select.title = '選手一覧を取得できませんでした。直接入力してください。';
    });
  }
}

async function exportStageAsPng() {
  const stage = $(".stage");
  const button = $("#exportPng");
  if (!stage || !button) return;
  if (pendingPngDownload) {
    const { filename, url } = pendingPngDownload;
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    pendingPngDownload = null;
    button.textContent = "PNG書出";
    return;
  }
  if (!window.htmlToImage && typeof window.html2canvas !== "function") {
    alert("PNG書出機能を読み込めませんでした。インターネット接続を確認して、ページを再読み込みしてください。");
    return;
  }

  const originalText = button.textContent;
  const originalTransform = stage.style.transform;
  let readyToSave = false;
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
    let blob;
    if (window.htmlToImage?.toBlob) {
      blob = await window.htmlToImage.toBlob(stage, {
        width: 1920,
        height: 1080,
        canvasWidth: 1920,
        canvasHeight: 1080,
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true,
        backgroundColor: "transparent",
        style: {
          width: "1920px",
          height: "1080px",
          transform: "none",
          transformOrigin: "top left"
        }
      });
      if (!blob) throw new Error("PNG blob creation failed");
    } else {
      const canvas = await window.html2canvas(stage, {
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        imageTimeout: 5000,
        logging: false
      });
      blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG blob creation failed")), "image/png");
      });
    }
    const now = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const downloadUrl = URL.createObjectURL(blob);
    pendingPngDownload = {
      filename: `配信盤面-${stamp}.png`,
      url: downloadUrl
    };
    readyToSave = true;
  } catch (error) {
    console.error(error);
    alert("PNGの書き出しに失敗しました。ページを再読み込みして、もう一度お試しください。");
  } finally {
    stage.style.transform = originalTransform;
    button.disabled = false;
    button.textContent = readyToSave ? "PNG保存" : originalText;
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
  updateMediaOptions();
  startLanguageRotation();
  startRotation();
  startThumbnailRotation();
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
      state = normalizeLegacyMediaModes({ ...defaults, ...entry.state });
      persistState();
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
      if (["sponsors", "sponsors2", "rules", "right3Mode", "right4Mode"].includes(key)) startRotation();
      if (["right1Mode", "right2Mode"].includes(key)) startThumbnailRotation();
      if (key === "english") {
        updateEnglishFields();
        startLanguageRotation();
      }
      persistState();
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
      persistState();
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
        const shared = commonTournament(select.value);
        state.titleEn = shared?.nameEn || titleEnglishPresets[select.value] || "";
        $("[data-field=titleEn]").value = state.titleEn;
        // Common's edition follows the current date in JST (including the
        // July rollover for 盤聖戦 and 賽王戦). Do not alter editions offline.
        if (shared?.edition) {
          state.edition = shared.edition;
          state.editionEn = englishEdition(shared.edition);
          $("[data-field=edition]").value = state.edition;
          $("[data-field=editionEn]").value = state.editionEn;
        }
        const themeColor = shared?.color || titleThemePresets[select.value];
        if (themeColor) {
          state.frameColor = themeColor;
          $$('[data-field="frameColor"]').forEach((input) => { input.value = themeColor; });
          $$('[data-color-for="frameColor"]').forEach((input) => { input.value = themeColor; });
        }
        // Store the secondary color independently. Unlike the theme's main
        // color it has no existing editable field / visible element in overlay.
        state.themeSubColor = shared?.subColor || "";
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
      persistState();
      select.value = "";
    });
  });

  boardSelect?.addEventListener("change", (event) => {
    state.boardPreset = event.currentTarget.value;
    const preset = boardPresets[state.boardPreset];
    if (!preset) {
      persistState();
      return;
    }
    Object.entries(preset).forEach(([key, value]) => {
      state[key] = value;
      $$(`[data-field="${key}"]`).forEach((input) => { input.value = value; });
      $$(`[data-color-for="${key}"]`).forEach((input) => { input.value = value; });
    });
    render();
    persistState();
  });

  $("#swapPlayerColors")?.addEventListener("click", () => {
    [state.topColor, state.bottomColor] = [state.bottomColor, state.topColor];
    ["topColor", "bottomColor"].forEach((key) => {
      $$(`[data-field="${key}"]`).forEach((input) => { input.value = state[key].toUpperCase(); });
      $$(`[data-color-for="${key}"]`).forEach((input) => { input.value = state[key]; });
    });
    render();
    persistState();
  });

  $("#swapPlayerNames")?.addEventListener("click", () => {
    [state.topName, state.bottomName] = [state.bottomName, state.topName];
    [state.topNameEn, state.bottomNameEn] = [state.bottomNameEn, state.topNameEn];
    ["topName", "bottomName", "topNameEn", "bottomNameEn"].forEach((key) => {
      $$(`[data-field="${key}"]`).forEach((input) => { input.value = state[key] || ""; });
    });
    render();
    persistState();
  });

  const channelSelect = $("#channelSelect");
  if (channelSelect) {
    channelSelect.value = channel;
    channelSelect.addEventListener("change", () => {
      location.href = `?channel=${channelSelect.value}`;
    });
  }

  $("#openOutput")?.addEventListener("click", () => {
    const outputUrl = new URL("output.html", location.href);
    outputUrl.searchParams.set("channel", channel);
    outputUrl.searchParams.set("v", "20261005-obsfit1");
    outputUrl.searchParams.set("state", encodeOutputState(state));
    window.open(outputUrl.href, `jbs-overlay-output-${channel}`);
  });

  $("#saveSettings")?.addEventListener("click", () => {
    const entries = readSavedSettings();
    entries.unshift({ savedAt: new Date().toISOString(), state: { ...state } });
    localStorage.setItem(savedSettingsKey, JSON.stringify(entries.slice(0, 100)));
  });

  $("#exportJson")?.addEventListener("click", downloadJson);
  $("#importJson")?.addEventListener("click", () => $("#importJsonFile")?.click());
  $("#importJsonFile")?.addEventListener("change", async (event) => {
    await importJsonFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
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
  if (!embeddedState && !Object.keys(fromQuery).length) {
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
      state = normalizeLegacyMediaModes({ ...state, ...savedState });
      if (!state.right1Mode) state.right1Mode = "title";
      if (usesOldGuideDefaults || usesOldTextDefaults) persistState();
      if (state.panelColor?.toUpperCase() === "#CFB064") {
        state.panelColor = "#FFFFFF";
        persistState();
      }
    }
    catch (_) { /* use defaults */ }
  }
}

loadSharedState();
state.interval = 60000;
render();
bindEditor();
loadCommonBrand();
loadMembers();
updateEnglishFields();
loadMediaLibrary();
startLanguageRotation();
startRuleRotation();
setInterval(() => {
  const serialized = localStorage.getItem(storageKey);
  if (!serialized || serialized === lastStoredState) return;
  lastStoredState = serialized;
  try { applyExternalState(JSON.parse(serialized)); }
  catch (_) { /* ignore malformed shared state */ }
}, 1000);
addEventListener("resize", fitStage);
fitStage();
document.fonts?.ready.then(() => {
  fitTitleTexts();
});
