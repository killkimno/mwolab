const FIREBASE_VERSION = "12.17.1";
const LIST_LIMIT = 10;
const TITLE_LIMIT = 20;
const MAX_PUBLIC_FITTINGS = 100;
const GOOGLE_IDENTITY_CLIENT_ID = "743748401179-u7uf1svvj8cbs64987om4969jq6eu0jo.apps.googleusercontent.com";
const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyAVs8fDgmsjhfh1KdHMRu_liF20dlcfGns",
  authDomain: "mwolab-2e145.firebaseapp.com",
  projectId: "mwolab-2e145",
  storageBucket: "mwolab-2e145.firebasestorage.app",
  messagingSenderId: "743748401179",
  appId: "1:743748401179:web:923e7edd0c705189e420be",
});

const bridge = globalThis.MwoLabCommunityBridge;
const language = bridge?.language === "en" ? "en" : "kr";
const COPY = {
  kr: {
    login: "Google 로그인", logout: "로그아웃", browserTitle: "핏팅 브라우저", saveTitle: "빌드 저장하기", browserEyebrow: "FITTING BROWSER", saveEyebrow: "SAVE BUILD",
    publicTab: "공개", localTab: "로컬", mineTab: "내가 올린 핏팅", search: "제목 검색", allMechs: "전체", selectMech: "멕 선택",
    newest: "최신순", likesSort: "좋아요순", loading: "핏팅을 불러오는 중입니다...",
    publicEmpty: "등록된 공개 핏팅이 없습니다.", localEmpty: "이 PC에 저장된 핏팅이 없습니다.",
    mineEmpty: "내가 올린 핏팅이 없습니다.", searchEmpty: "검색 조건에 맞는 핏팅이 없습니다.",
    publicLoadUnavailable: "현재 공개 핏팅을 불러올 수 없습니다. 로컬 핏팅은 계속 사용할 수 있습니다.",
    mineLoadUnavailable: "현재 내가 올린 핏팅을 불러올 수 없습니다. 로컬 핏팅은 계속 사용할 수 있습니다.",
    select: "목록에서 핏팅을 선택하세요.", invalid: "현재 데이터에서 열 수 없는 핏팅",
    apply: "이 핏팅 적용", like: "좋아요", delete: "삭제", deleteConfirm: "이 핏팅을 삭제하시겠습니까?",
    previousPage: "이전", nextPage: "다음", weapons: "장착 무기", details: "상세 정보", updated: "업데이트",
    tags: {
      highPower: "고화력", cooler: "쿨러", ghostHeat: "고스트 힛", fullArmor: "풀아머", glassArmor: "유리장갑",
      shortRange: "근거리", mediumRange: "중거리", longRange: "장거리", sniper: "스나이퍼", brawler: "브롤러",
    }, saveLocation: "1. 저장 위치 선택",
    publicLocation: "공개", publicHelp: "다른 사용자들이 볼 수 있습니다.", pcLocation: "내 PC", pcHelp: "이 PC에만 저장됩니다.",
    titleLabel: "2. 제목 (필수)", titlePlaceholder: "빌드 제목을 입력하세요.", titleHttpsBlocked: "제목에 https를 사용할 수 없습니다.",
    cancel: "취소", save: "저장하기", saving: "저장 중...", localSaved: "내 PC에 저장되었습니다.", publicSaved: "공개 핏팅으로 저장되었습니다.",
    loginRequired: "공개 저장, 내가 올린 핏팅과 좋아요는 Google 로그인이 필요합니다.", signInAction: "로그인하기",
    unavailable: "Firebase 연결을 사용할 수 없습니다. 잠시 후 다시 시도하세요.",
    httpRequired: "Firebase 연동은 localhost 또는 배포된 웹사이트에서 사용할 수 있습니다.", noFitting: "먼저 멕과 핏팅을 선택하세요.",
    loadFailed: "핏팅 목록을 불러오지 못했습니다.", saveFailed: "핏팅을 저장하지 못했습니다.", localSaveFailed: "이 PC에 핏팅을 저장할 수 없습니다.",
    deleteFailed: "핏팅을 삭제하지 못했습니다.", uploadLimit: "공개 핏팅은 계정당 최대 100개까지 올릴 수 있습니다.",
    firestorePermissionDenied: "Firestore 보안 규칙이 이 작업을 허용하지 않습니다. Firebase Console의 Firestore Database > Rules에 최신 규칙이 게시되었는지 확인하세요.",
    firestoreUnavailable: "Firestore에 연결하지 못했습니다. 잠시 후 다시 시도하세요.", likeFailed: "좋아요를 변경하지 못했습니다.",
    loginFailed: "Google 로그인에 실패했습니다.", unauthorizedDomain: "현재 주소({host})가 Firebase 승인된 도메인이 아닙니다.",
    popupClosed: "Google 로그인 창이 인증 완료 전에 닫혔습니다.", popupBlocked: "브라우저가 Google 로그인 팝업을 차단했습니다.",
    providerDisabled: "Firebase Authentication에서 Google 로그인 제공업체가 활성화되어 있지 않습니다.", networkFailed: "Google 로그인 서버에 연결하지 못했습니다.",
    stat: { armor: "아머", tons: "톤수", engine: "엔진", maxSpeed: "최대 속도", dps: "DPS", alphaDamage: "알파샷 데미지", heatEfficiency: "열 효율", heatSinks: "히트싱크 수" },
  },
  en: {
    login: "Google Sign in", logout: "Sign out", browserTitle: "Fitting Browser", saveTitle: "Save Build", browserEyebrow: "FITTING BROWSER", saveEyebrow: "SAVE BUILD",
    publicTab: "Public", localTab: "Local", mineTab: "My Uploads", search: "Search titles", allMechs: "All", selectMech: "Select mech",
    newest: "Newest", likesSort: "Most liked", loading: "Loading fittings...", publicEmpty: "No public fittings yet.",
    localEmpty: "No fittings are saved on this PC.", mineEmpty: "You have not uploaded a fitting.", searchEmpty: "No fitting matches the search.",
    publicLoadUnavailable: "Public fittings are currently unavailable. Local fittings remain available.",
    mineLoadUnavailable: "Your uploaded fittings are currently unavailable. Local fittings remain available.",
    select: "Select a fitting from the list.", invalid: "Fitting unavailable with current data", apply: "Apply fitting", like: "Like", delete: "Delete",
    deleteConfirm: "Delete this fitting?", previousPage: "Previous", nextPage: "Next", weapons: "Installed weapons", details: "Details", updated: "Updated",
    tags: {
      highPower: "High Power", cooler: "Cooler", ghostHeat: "Ghost Heat", fullArmor: "Full Armor", glassArmor: "Glass Armor",
      shortRange: "Short Range", mediumRange: "Medium Range", longRange: "Long Range", sniper: "Sniper", brawler: "Brawler",
    }, saveLocation: "1. Save location", publicLocation: "Public",
    publicHelp: "Other users can view this fitting.", pcLocation: "My PC", pcHelp: "Saved only on this PC.", titleLabel: "2. Title (required)",
    titlePlaceholder: "Enter a build title.", titleHttpsBlocked: "Titles cannot contain https.",
    cancel: "Cancel", save: "Save", saving: "Saving...", localSaved: "Saved on this PC.", publicSaved: "Saved as a public fitting.",
    loginRequired: "Google sign-in is required for public saves, uploads, and likes.", signInAction: "Sign in", unavailable: "Firebase is unavailable. Try again shortly.",
    httpRequired: "Firebase is available on localhost or the deployed website.", noFitting: "Select a mech and fitting first.", loadFailed: "Could not load fittings.",
    saveFailed: "Could not save the fitting.", localSaveFailed: "Could not save the fitting on this PC.", deleteFailed: "Could not delete the fitting.",
    uploadLimit: "Each account can upload up to 100 public fittings.",
    firestorePermissionDenied: "Firestore rules denied this action. Check that the latest rules are published in Firebase Console under Firestore Database > Rules.",
    firestoreUnavailable: "Could not connect to Firestore. Try again shortly.", likeFailed: "Could not update the like.", loginFailed: "Google sign-in failed.",
    unauthorizedDomain: "The current host ({host}) is not authorized.", popupClosed: "The Google sign-in window closed before authentication completed.",
    popupBlocked: "The browser blocked the Google sign-in popup.", providerDisabled: "The Google provider is not enabled in Firebase Authentication.", networkFailed: "Could not reach Google sign-in.",
    stat: { armor: "Armor", tons: "Tonnage", engine: "Engine", maxSpeed: "Max speed", dps: "DPS", alphaDamage: "Alpha damage", heatEfficiency: "Heat efficiency", heatSinks: "Heat sinks" },
  },
};
const copy = COPY[language];
const elements = {
  login: document.getElementById("community-login"), authStatus: document.getElementById("community-auth-status"),
  overlay: document.getElementById("community-overlay"), title: document.getElementById("community-title"), eyebrow: document.getElementById("community-eyebrow"),
  mechFilterTrigger: document.getElementById("community-mech-filter-trigger"), mechFilterMenu: document.getElementById("community-mech-filter-menu"),
  close: document.getElementById("close-community"), content: document.getElementById("community-content"), status: document.getElementById("community-status"),
};

let auth = null;
let db = null;
let currentUser = null;
let firebaseApi = null;
let firebaseReady = null;
let googleTokenClient = null;
let pendingSignInResolve = null;
let activeMode = "browse";
let activeBrowserTab = "public";
let sortMode = "newest";
let searchText = "";
let records = [];
let selectedId = null;
let currentPage = 1;
let selectedMechFilterId = "";
let lastDocument = null;
let remoteHasMore = true;
let hasMore = false;
let browserNotice = null;
let browserFooterNotice = null;
let returnFocus = null;
let loadRequestGeneration = 0;
const loadedLikeStates = new Set();
const expandedMechFilterChassis = new Set();
let authStatusTimer = null;

function format(text, values = {}) { return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? ""); }
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function setStatus(message = "", tone = "") {
  elements.status.textContent = message;
  elements.status.className = `community-status${tone ? ` ${tone}` : ""}`;
}
function setAuthStatus(message = "") {
  clearTimeout(authStatusTimer);
  elements.authStatus.textContent = message;
  elements.authStatus.hidden = !message;
  if (message) {
    authStatusTimer = setTimeout(() => {
      elements.authStatus.textContent = "";
      elements.authStatus.hidden = true;
    }, 3000);
  }
}
function firebaseErrorMessage(error, fallback) {
  const messages = {
    "auth/unauthorized-domain": format(copy.unauthorizedDomain, { host: location.hostname || location.host }),
    "auth/popup-closed-by-user": copy.popupClosed, "auth/popup-blocked": copy.popupBlocked,
    "auth/operation-not-allowed": copy.providerDisabled, "auth/network-request-failed": copy.networkFailed,
    "permission-denied": copy.firestorePermissionDenied, "firestore/permission-denied": copy.firestorePermissionDenied,
    unavailable: copy.firestoreUnavailable, "firestore/unavailable": copy.firestoreUnavailable,
    "upload-limit": copy.uploadLimit,
  };
  const message = messages[error?.code] || fallback;
  return error?.code ? `${message} (${error.code})` : message;
}
function updateLoginButton() {
  if (!elements.login) return;
  const label = currentUser ? copy.logout : copy.login;
  elements.login.textContent = label;
  elements.login.title = label;
  elements.login.setAttribute("aria-label", label);
  elements.login.classList.toggle("signed-in", Boolean(currentUser));
  elements.login.disabled = currentUser ? false : !googleTokenClient;
}
async function signIn() {
  await firebaseReady;
  if (!firebaseApi || !auth || !googleTokenClient) {
    setAuthStatus(location.protocol === "file:" ? copy.httpRequired : copy.unavailable);
    return null;
  }
  setAuthStatus();
  return new Promise((resolve) => {
    pendingSignInResolve?.(null);
    pendingSignInResolve = resolve;
    try { googleTokenClient.requestAccessToken({ prompt: "select_account" }); }
    catch (error) {
      pendingSignInResolve = null;
      console.error("Google sign-in popup failed", error);
      setAuthStatus(copy.loginFailed);
      resolve(null);
    }
  });
}
function loadGoogleIdentity() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve(globalThis.google.accounts);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity]");
    if (existing) {
      existing.addEventListener("load", () => resolve(globalThis.google?.accounts), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://accounts.google.com/gsi/client?hl=${language === "en" ? "en" : "ko"}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "";
    script.addEventListener("load", () => globalThis.google?.accounts?.oauth2 ? resolve(globalThis.google.accounts) : reject(new Error("Google Identity Services is unavailable")), { once: true });
    script.addEventListener("error", () => reject(new Error("Google Identity Services failed to load")), { once: true });
    document.head.append(script);
  });
}
function finishPendingSignIn(user = null) {
  const resolve = pendingSignInResolve;
  pendingSignInResolve = null;
  resolve?.(user);
}
function handleGooglePopupError(error) {
  setAuthStatus(error?.type === "popup_closed" ? copy.popupClosed : error?.type === "popup_failed_to_open" ? copy.popupBlocked : copy.loginFailed);
  finishPendingSignIn();
}
async function handleGoogleAccessToken(response) {
  if (response?.error || !response?.access_token || !firebaseApi || !auth) {
    setAuthStatus(response?.error ? `${copy.loginFailed} (${response.error})` : copy.loginFailed);
    finishPendingSignIn();
    return;
  }
  try {
    const credential = firebaseApi.GoogleAuthProvider.credential(null, response.access_token);
    const result = await firebaseApi.signInWithCredential(auth, credential);
    setAuthStatus();
    finishPendingSignIn(result.user);
  } catch (error) {
    setAuthStatus(firebaseErrorMessage(error, copy.loginFailed));
    finishPendingSignIn();
  }
}
function closeCommunity() {
  if (elements.overlay.hidden) return;
  loadRequestGeneration += 1;
  closeMechFilterMenu();
  elements.overlay.hidden = true;
  document.body.classList.remove("community-open");
  returnFocus?.focus?.();
  returnFocus = null;
}
async function openCommunity(mode, trigger) {
  loadRequestGeneration += 1;
  const requestedMode = mode === "save" ? "save" : "browse";
  activeMode = requestedMode;
  returnFocus = trigger || document.activeElement;
  elements.overlay.hidden = false;
  document.body.classList.add("community-open");
  elements.title.textContent = activeMode === "save" ? copy.saveTitle : copy.browserTitle;
  elements.eyebrow.textContent = activeMode === "save" ? copy.saveEyebrow : copy.browserEyebrow;
  elements.mechFilterTrigger.hidden = activeMode !== "browse";
  closeMechFilterMenu();
  if (activeMode === "browse") {
    selectedMechFilterId = trigger?.dataset.communityMechFilter === "all"
      ? ""
      : String(bridge.currentMechId?.() || "");
    expandSelectedMechFilterChassis();
    renderMechFilterControl();
  }
  const dialog = elements.overlay.querySelector(".community-dialog");
  dialog?.classList.toggle("browser-mode", activeMode === "browse");
  dialog?.classList.toggle("save-mode", activeMode === "save");
  setStatus();
  elements.close.focus();
  if (activeMode === "save") renderSaveForm();
  else await switchBrowserTab(activeBrowserTab, true);
}
function timestampMillis(value) {
  if (Number.isFinite(value)) return Number(value);
  const date = value?.toDate?.();
  return date instanceof Date ? date.getTime() : 0;
}
function fittingDate(value) {
  const millis = timestampMillis(value);
  return millis ? new Intl.DateTimeFormat(language === "en" ? "en" : "ko-KR", { dateStyle: "medium" }).format(new Date(millis)) : "";
}
function analyzeRecord(record) {
  try {
    if (![1, 2].includes(record.schemaVersion) || typeof record.loadoutCode !== "string") throw new Error("Invalid record");
    return { ...record, analysis: bridge.describeFitting(record.loadoutCode), valid: true };
  } catch { return { ...record, analysis: null, valid: false }; }
}
function normalizeSnapshot(snapshot, source) {
  const data = snapshot.data();
  return analyzeRecord({
    id: snapshot.id, ownerUid: data.ownerUid, mechId: String(data.mechId ?? ""), name: data.name,
    loadoutCode: data.loadoutCode, likeCount: Number.isInteger(data.likeCount) ? data.likeCount : 0,
    createdAt: data.createdAt, schemaVersion: data.schemaVersion, source, liked: false,
  });
}
function tagHtml(tags = []) {
  return tags.map((tag) => `<span class="community-tag tag-${escapeHtml(tag)}">${escapeHtml(copy.tags[tag] || tag)}</span>`).join("");
}
function likeIconHtml() {
  return `<svg class="community-like-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h4V9H1v12Zm21.8-10.7A2 2 0 0 0 21 9h-6.3l.9-4.6v-.3c0-.4-.2-.8-.4-1.1L14.2 2 7.6 8.6A2 2 0 0 0 7 10v9a2 2 0 0 0 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7c.3-.8.3-1.7 0-2.5Z"/></svg>`;
}
function hardpointsHtml(hardpoints = {}) {
  return [["energy", "E"], ["missile", "M"], ["ballistic", "B"], ["ams", "AMS"]]
    .filter(([type]) => Number(hardpoints[type]) > 0)
    .map(([type, label]) => `<span class="hardpoint-chip ${type}" title="${type}"><span class="hardpoint-icon">${label}</span><span class="hardpoint-count">${Number(hardpoints[type])}</span></span>`).join("");
}
function mechFilterSections() {
  return bridge.listFittingMechFilters?.() || [];
}
function selectedMechFilterOption() {
  for (const section of mechFilterSections()) {
    for (const chassis of section.chassis || []) {
      const option = (chassis.variants || []).find((variant) => String(variant.id) === selectedMechFilterId);
      if (option) return { ...option, chassisId: chassis.id };
    }
  }
  return null;
}
function expandSelectedMechFilterChassis() {
  const selected = selectedMechFilterOption();
  if (selected?.chassisId) expandedMechFilterChassis.add(String(selected.chassisId));
}
function closeMechFilterMenu() {
  if (!elements.mechFilterMenu || !elements.mechFilterTrigger) return;
  elements.mechFilterMenu.hidden = true;
  elements.mechFilterTrigger.setAttribute("aria-expanded", "false");
}
function renderMechFilterMenu({ preserveScroll = false } = {}) {
  if (!elements.mechFilterMenu) return;
  const previousScrollTop = preserveScroll
    ? elements.mechFilterMenu.querySelector(".community-mech-filter-list")?.scrollTop || 0
    : 0;
  const chassisGroups = mechFilterSections().flatMap((section) => section.chassis || []);
  const chassisHtml = chassisGroups.map((chassis) => {
    const expanded = expandedMechFilterChassis.has(String(chassis.id));
    return `<div class="chassis-group${expanded ? " expanded" : ""}">
      <button class="chassis-row" type="button" data-community-mech-filter-chassis="${escapeHtml(chassis.id)}" aria-expanded="${expanded}">
        <span class="row-title"><span class="chassis-title small-chassis-title"><span class="expand-indicator" aria-hidden="true">${expanded ? "-" : "+"}</span><strong>${escapeHtml(chassis.label)}</strong><span class="chassis-ton">${escapeHtml(chassis.tons)}t</span></span></span>
      </button>
      ${expanded ? `<div class="variant-list">${(chassis.variants || []).map((variant) => `
        <button class="mech-row variant-row${String(variant.id) === selectedMechFilterId ? " active" : ""}" type="button" data-community-mech-filter-option="${escapeHtml(variant.id)}">
          <span class="row-title"><span class="mech-title-main"><strong>${escapeHtml(variant.name)}</strong></span></span>
          <span class="badge-line mech-slot-tags">${variant.badgesHtml || ""}</span>
        </button>`).join("")}</div>` : ""}
    </div>`;
  }).join("");
  elements.mechFilterMenu.innerHTML = `<div class="community-mech-filter-list mech-list compact-mech-list"><button class="mech-row variant-row community-mech-filter-all${selectedMechFilterId ? "" : " active"}" type="button" data-community-mech-filter-option=""><span class="row-title"><span class="mech-title-main"><strong>${escapeHtml(copy.allMechs)}</strong></span></span></button>${chassisHtml}</div>`;
  if (preserveScroll) elements.mechFilterMenu.querySelector(".community-mech-filter-list").scrollTop = previousScrollTop;
}
function renderMechFilterControl() {
  if (!elements.mechFilterTrigger) return;
  const selected = selectedMechFilterOption();
  elements.mechFilterTrigger.textContent = `${selected?.name || copy.allMechs} ▾`;
  elements.mechFilterTrigger.title = copy.selectMech;
  renderMechFilterMenu();
}
async function selectMechFilter(mechId) {
  selectedMechFilterId = String(mechId || "");
  expandSelectedMechFilterChassis();
  selectedId = null;
  currentPage = 1;
  closeMechFilterMenu();
  renderMechFilterControl();
  if (activeBrowserTab === "local") {
    renderBrowser({ resetListScroll: true, resetDetailScroll: true });
    return;
  }
  await loadRemoteFittings(true);
}
function filteredRecords() {
  const query = searchText.trim().toLocaleLowerCase();
  return records.filter((record) => {
    if (selectedMechFilterId && String(record.mechId) !== selectedMechFilterId) return false;
    return !query || String(record.name || "").toLocaleLowerCase().includes(query);
  });
}
function fittingCardHtml(record) {
  const analysis = record.analysis;
  return `
    <button class="community-fitting-card${record.id === selectedId ? " selected" : ""}${record.valid ? "" : " invalid"}" type="button" data-community-select="${escapeHtml(record.id)}">
      <img src="${escapeHtml(analysis?.image || "")}" alt="" loading="lazy">
      <span class="community-card-main">
        <span class="community-card-title"><em>${escapeHtml(analysis?.mechName || "")}</em><strong>${escapeHtml(record.name || copy.invalid)}</strong></span>
        <span class="community-card-tags">${tagHtml(analysis?.tags)}</span>
        <span class="community-card-meta">${activeBrowserTab === "local" ? "" : `<span>${likeIconHtml()} ${Math.max(0, Number(record.likeCount) || 0)}</span>`}<span>${escapeHtml(fittingDate(record.createdAt ?? record.updatedAt))}</span></span>
      </span>
      <span class="community-card-hardpoints mech-slot-tags">${hardpointsHtml(analysis?.hardpoints)}</span>
    </button>`;
}
function statRowsHtml(analysis = {}) {
  const stats = analysis.stats || {};
  const metrics = analysis.metrics || {};
  const armorPercent = Number(stats.maxArmor) > 0 ? Math.max(0, Math.min(100, Number(stats.armor || 0) / Number(stats.maxArmor) * 100)) : 0;
  const armorLevel = Math.max(1, Math.min(5, Math.ceil(armorPercent / 20)));
  const rows = [
    [copy.stat.armor, `${armorPercent.toFixed(0)}%`, `community-armor-level-${armorLevel}`, `${Number(stats.armor || 0).toFixed(0)} / ${Number(stats.maxArmor || 0).toFixed(0)}`],
    [copy.stat.tons, `${Number(stats.tons || 0).toFixed(1)} / ${stats.maxTons ?? 0}`],
    [copy.stat.engine, stats.engine || "-"],
    [copy.stat.maxSpeed, `${Number(stats.maxSpeed || 0).toFixed(1)} kph`],
    [copy.stat.dps, Number(metrics.dps || 0).toFixed(1)],
    [copy.stat.alphaDamage, Number(metrics.alphaDamage || 0).toFixed(1)],
    [copy.stat.heatEfficiency, `${Number(metrics.heatEfficiency || 0).toFixed(1)}%`],
    [copy.stat.heatSinks, Number(stats.heatSinks || 0).toFixed(0)],
  ];
  return rows.map(([label, value, className = "", title = ""]) => `<div${className ? ` class="${className}"` : ""}${title ? ` title="${escapeHtml(title)}"` : ""}><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}
function fittingDetailHtml(record) {
  if (!record) return `<div class="community-detail-empty">${copy.select}</div>`;
  const analysis = record.analysis;
  if (!record.valid || !analysis) {
    const canDelete = activeBrowserTab === "local" || activeBrowserTab === "mine";
    return `<article class="community-fitting-detail community-invalid-detail"><div class="community-detail-empty">${copy.invalid}</div>${canDelete ? `<footer><button type="button" data-community-delete="${escapeHtml(record.id)}" class="community-delete-button">${copy.delete}</button></footer>` : ""}</article>`;
  }
  const weapons = analysis.weapons?.length
    ? analysis.weapons.map((weapon) => `<li class="${escapeHtml(weapon.type || "")}"><span>${escapeHtml(weapon.name)}</span><strong>×${weapon.count}</strong></li>`).join("")
    : `<li><span>-</span></li>`;
  const canLike = activeBrowserTab === "public" && Boolean(currentUser);
  const canDelete = activeBrowserTab === "local" || activeBrowserTab === "mine";
  return `
    <article class="community-fitting-detail" data-community-detail-id="${escapeHtml(record.id)}">
      <header><div class="community-detail-title"><span>${escapeHtml(analysis.mechName)}</span><h3>${escapeHtml(record.name)}</h3></div>
        <div class="community-card-tags">${tagHtml(analysis.tags)}</div>
        <div class="community-detail-meta">${activeBrowserTab === "local" ? "" : `<span class="community-detail-like-count">${likeIconHtml()} ${Math.max(0, Number(record.likeCount) || 0)}</span>`}<span>${copy.updated}: ${escapeHtml(fittingDate(record.createdAt ?? record.updatedAt))}</span></div>
      </header>
      <div class="community-detail-scroll">
        <section><h4>${copy.weapons}</h4><ul class="community-weapon-list">${weapons}</ul></section>
        <section><h4>${copy.details}</h4><div class="community-stat-grid">${statRowsHtml(analysis)}</div></section>
      </div>
      <footer>${activeBrowserTab === "public" ? `<button type="button" data-community-like="${escapeHtml(record.id)}" class="community-detail-like${record.liked ? " liked" : ""}" ${canLike ? "" : "disabled"} aria-label="${escapeHtml(copy.like)}" title="${escapeHtml(copy.like)}">${likeIconHtml()}</button>` : ""}
        ${canDelete ? `<button type="button" data-community-delete="${escapeHtml(record.id)}" class="community-delete-button">${copy.delete}</button>` : ""}
        <button type="button" data-community-apply="${escapeHtml(record.id)}" class="community-apply-button">${copy.apply}</button></footer>
    </article>`;
}
function paginationHtml(visible) {
  const loadedPages = Math.max(1, Math.ceil(visible.length / LIST_LIMIT));
  const canDiscoverNext = activeBrowserTab !== "local" && hasMore;
  const pageCount = loadedPages + (canDiscoverNext ? 1 : 0);
  if (pageCount <= 1) return "";
  const pageNumbers = pageCount <= 7
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : Array.from(new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]))
      .filter((page) => page >= 1 && page <= pageCount)
      .sort((left, right) => left - right);
  const pages = pageNumbers.map((page, index) => {
    const ellipsis = index > 0 && page - pageNumbers[index - 1] > 1 ? `<span class="community-page-ellipsis" aria-hidden="true">…</span>` : "";
    return `${ellipsis}<button type="button" data-community-page="${page}" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`;
  }).join("");
  return `<nav class="community-pagination" aria-label="Pagination"><button type="button" data-community-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""} aria-label="${copy.previousPage}">‹</button>${pages}<button type="button" data-community-page="${currentPage + 1}" ${currentPage >= pageCount ? "disabled" : ""} aria-label="${copy.nextPage}">›</button></nav>`;
}
function renderBrowser({ resetListScroll = false, resetDetailScroll = false, focusSort = false } = {}) {
  const previousListScroll = resetListScroll ? 0 : elements.content.querySelector(".community-list-scroll")?.scrollTop || 0;
  const previousDetailScroll = resetDetailScroll ? 0 : elements.content.querySelector(".community-detail-scroll")?.scrollTop || 0;
  const visible = filteredRecords();
  const loadedPages = Math.max(1, Math.ceil(visible.length / LIST_LIMIT));
  currentPage = Math.max(1, Math.min(currentPage, loadedPages));
  const pageRecords = visible.slice((currentPage - 1) * LIST_LIMIT, currentPage * LIST_LIMIT);
  if (!selectedId || !pageRecords.some((record) => record.id === selectedId)) selectedId = pageRecords[0]?.id || null;
  const selected = records.find((record) => record.id === selectedId) || null;
  const emptyText = searchText ? copy.searchEmpty : activeBrowserTab === "local" ? copy.localEmpty : activeBrowserTab === "mine" ? copy.mineEmpty : copy.publicEmpty;
  const listContent = browserNotice
    ? `<div class="community-empty${browserNotice.tone ? ` ${escapeHtml(browserNotice.tone)}` : ""}"><p>${escapeHtml(browserNotice.message)}</p>${browserNotice.action === "sign-in" ? `<button type="button" data-community-sign-in>${copy.signInAction}</button>` : ""}</div>`
    : pageRecords.length ? pageRecords.map(fittingCardHtml).join("") : `<div class="community-empty">${emptyText}</div>`;
  const sortLabel = sortMode === "likes" ? copy.likesSort : copy.newest;
  elements.content.innerHTML = `
    <div class="community-browser">
      <nav class="community-tabs" role="tablist">
        <button type="button" role="tab" data-community-tab="public" aria-selected="${activeBrowserTab === "public"}">${copy.publicTab}</button>
        <button type="button" role="tab" data-community-tab="local" aria-selected="${activeBrowserTab === "local"}">${copy.localTab}</button>
        <button type="button" role="tab" data-community-tab="mine" aria-selected="${activeBrowserTab === "mine"}">${copy.mineTab}</button>
      </nav>
      <div class="community-browser-body"><div class="community-list-pane">
        <div class="community-toolbar"><input type="search" data-community-search value="${escapeHtml(searchText)}" placeholder="${escapeHtml(copy.search)}">
          <div class="community-menu community-sort-menu"><button class="community-menu-trigger community-sort-trigger" type="button" data-community-menu-trigger data-community-sort-trigger aria-haspopup="menu" aria-expanded="false" ${activeBrowserTab === "local" ? "disabled" : ""}><span>${escapeHtml(sortLabel)}</span><span aria-hidden="true">▾</span></button><div class="community-menu-popover" role="menu" hidden><button type="button" role="menuitemradio" data-community-sort="newest" aria-checked="${sortMode === "newest"}">${copy.newest}</button><button type="button" role="menuitemradio" data-community-sort="likes" aria-checked="${sortMode === "likes"}">${copy.likesSort}</button></div></div></div>
        <div class="community-list-scroll"><div class="community-fitting-cards">${listContent}</div>
          ${browserFooterNotice ? `<div class="community-empty ${escapeHtml(browserFooterNotice.tone || "")}">${escapeHtml(browserFooterNotice.message)}</div>` : ""}</div>
        ${browserNotice ? "" : paginationHtml(visible)}
      </div><div class="community-detail-pane">${fittingDetailHtml(selected)}</div></div>
    </div>`;
  const listScroll = elements.content.querySelector(".community-list-scroll");
  const detailScroll = elements.content.querySelector(".community-detail-scroll");
  if (listScroll) listScroll.scrollTop = previousListScroll;
  if (detailScroll) detailScroll.scrollTop = previousDetailScroll;
  if (focusSort && !elements.overlay.hidden) elements.content.querySelector("[data-community-sort-trigger]")?.focus();
  if (selected && activeBrowserTab === "public" && currentUser) ensureLikeState(selected.id);
}
function renderLoginRequired({ focusSort = false } = {}) {
  records = [];
  hasMore = false;
  browserNotice = { message: copy.loginRequired, action: "sign-in" };
  renderBrowser({ resetListScroll: true, resetDetailScroll: true, focusSort });
}
async function loadRemoteFittings(reset = true, { focusSort = false } = {}) {
  const generation = ++loadRequestGeneration;
  const requestedTab = activeBrowserTab;
  const requestedSort = sortMode;
  const requestedMechFilterId = selectedMechFilterId;
  let requestLastDocument = reset ? null : lastDocument;
  let requestHasMore = reset ? true : remoteHasMore;
  if (reset) {
    records = [];
    currentPage = 1;
    hasMore = false;
    browserNotice = { message: copy.loading, tone: "loading" };
    browserFooterNotice = null;
    renderBrowser({ resetListScroll: true, resetDetailScroll: true, focusSort });
  }
  await firebaseReady;
  if (generation !== loadRequestGeneration || requestedTab !== activeBrowserTab) return;
  if (requestedTab === "mine" && !currentUser) {
    records = [];
    renderLoginRequired({ focusSort });
    return;
  }
  if (!firebaseApi || !db) {
    records = [];
    hasMore = false;
    browserNotice = { message: requestedTab === "mine" ? copy.mineLoadUnavailable : copy.publicLoadUnavailable, tone: "error" };
    renderBrowser({ resetListScroll: true, resetDetailScroll: true, focusSort });
    setStatus(location.protocol === "file:" ? copy.httpRequired : copy.unavailable, "error");
    return;
  }
  try {
    const constraints = [];
    if (requestedTab === "mine") constraints.push(firebaseApi.where("ownerUid", "==", currentUser.uid));
    if (requestedMechFilterId) constraints.push(firebaseApi.where("mechId", "==", requestedMechFilterId));
    constraints.push(firebaseApi.orderBy(requestedSort === "likes" ? "likeCount" : "createdAt", "desc"));
    if (requestLastDocument) constraints.push(firebaseApi.startAfter(requestLastDocument));
    constraints.push(firebaseApi.limit(LIST_LIMIT));
    const snapshot = await firebaseApi.getDocs(firebaseApi.query(firebaseApi.collection(db, "fittings"), ...constraints));
    if (generation !== loadRequestGeneration || requestedTab !== activeBrowserTab || requestedMechFilterId !== selectedMechFilterId) return;
    requestLastDocument = snapshot.docs.at(-1) || requestLastDocument;
    requestHasMore = snapshot.size === LIST_LIMIT;
    const nextRecords = snapshot.docs.map((documentSnapshot) => normalizeSnapshot(documentSnapshot, requestedTab));
    const merged = reset ? nextRecords : [...records, ...nextRecords];
    records = Array.from(new Map(merged.map((record) => [record.id, record])).values());
    lastDocument = requestLastDocument;
    remoteHasMore = requestHasMore;
    hasMore = requestHasMore;
    selectedId ||= records[0]?.id || null;
    browserNotice = null;
    browserFooterNotice = null;
    renderBrowser({ resetListScroll: true, resetDetailScroll: true, focusSort });
  } catch (error) {
    if (generation !== loadRequestGeneration || requestedTab !== activeBrowserTab) return;
    const message = firebaseErrorMessage(error, copy.loadFailed);
    if (!reset && records.length) {
      browserFooterNotice = { message: requestedTab === "mine" ? copy.mineLoadUnavailable : copy.publicLoadUnavailable, tone: "error" };
      renderBrowser({ resetListScroll: true, resetDetailScroll: true, focusSort });
      setStatus(message, "error");
      return;
    }
    records = [];
    hasMore = false;
    selectedId = null;
    browserNotice = { message: requestedTab === "mine" ? copy.mineLoadUnavailable : copy.publicLoadUnavailable, tone: "error" };
    renderBrowser({ resetListScroll: true, resetDetailScroll: true, focusSort });
    setStatus(message, "error");
  }
}
async function switchBrowserTab(tab, reset = true) {
  loadRequestGeneration += 1;
  activeBrowserTab = ["public", "local", "mine"].includes(tab) ? tab : "public";
  selectedId = null;
  currentPage = 1;
  searchText = "";
  browserNotice = null;
  browserFooterNotice = null;
  setStatus();
  if (activeBrowserTab === "local") {
    records = (bridge.listLocalFittings?.() || []).map((record) => analyzeRecord({ ...record, source: "local", likeCount: 0 }));
    hasMore = false;
    renderBrowser({ resetListScroll: true, resetDetailScroll: true });
    return;
  }
  await loadRemoteFittings(reset);
}
function renderSaveForm() {
  let fitting;
  try { fitting = bridge.getCurrentFitting(); }
  catch {
    elements.content.innerHTML = `<div class="community-empty">${copy.noFitting}</div>`;
    return;
  }
  elements.content.innerHTML = `
    <form class="community-save-form" data-community-save-form data-mech-id="${escapeHtml(fitting.mechId)}">
      <fieldset><legend>${copy.saveLocation}</legend><div class="community-save-locations">
        <label class="community-save-location${currentUser ? "" : " disabled"}"><input type="radio" name="save-location" value="public" ${currentUser ? "" : "disabled"}><i aria-hidden="true"></i><span><strong>${copy.publicLocation}</strong><small>${copy.publicHelp}</small></span></label>
        <label class="community-save-location selected"><input type="radio" name="save-location" value="local" checked><i aria-hidden="true"></i><span><strong>${copy.pcLocation}</strong><small>${copy.pcHelp}</small></span></label>
      </div>${currentUser ? "" : `<p class="community-save-login-note">${copy.loginRequired}</p>`}</fieldset>
      <label class="community-save-field"><span>${copy.titleLabel}</span><input type="text" name="title" maxlength="${TITLE_LIMIT}" placeholder="${escapeHtml(copy.titlePlaceholder)}" required><small data-title-count>0 / ${TITLE_LIMIT}</small></label>
      <div class="community-save-actions"><button type="button" data-community-cancel>${copy.cancel}</button><button type="submit" data-community-save disabled>${copy.save}</button></div>
    </form>`;
}
function updateSaveForm(form) {
  form.querySelectorAll(".community-save-location").forEach((label) => label.classList.toggle("selected", label.querySelector("input")?.checked));
  const title = form.elements.title.value.trim();
  const httpsBlocked = title.toLocaleLowerCase().includes("https");
  const titleStatus = form.querySelector("[data-title-count]");
  titleStatus.textContent = httpsBlocked ? copy.titleHttpsBlocked : `${form.elements.title.value.length} / ${TITLE_LIMIT}`;
  titleStatus.classList.toggle("error", httpsBlocked);
  form.querySelector("[data-community-save]").disabled = !title || httpsBlocked;
}
async function savePublicFitting(name) {
  const user = currentUser || await signIn();
  if (!user) throw new Error("login-required");
  const fitting = bridge.getCurrentFitting();
  const fittingRef = firebaseApi.doc(firebaseApi.collection(db, "fittings"));
  const usageRef = firebaseApi.doc(db, "publisherUsage", user.uid);
  await firebaseApi.runTransaction(db, async (transaction) => {
    const usageSnapshot = await transaction.get(usageRef);
    const count = usageSnapshot.exists() ? usageSnapshot.data().count : 0;
    if (!Number.isInteger(count) || count < 0) throw new Error("Invalid publisher usage");
    if (count >= MAX_PUBLIC_FITTINGS) {
      const error = new Error("Public fitting upload limit reached");
      error.code = "upload-limit";
      throw error;
    }
    const nextCount = count + 1;
    transaction.set(fittingRef, { ownerUid: user.uid, mechId: fitting.mechId, name, loadoutCode: fitting.loadoutCode, likeCount: 0, createdAt: firebaseApi.serverTimestamp(), schemaVersion: 2 });
    transaction.set(usageRef, { count: nextCount, lastFittingId: fittingRef.id, operation: "create", updatedAt: firebaseApi.serverTimestamp() });
  });
}
async function submitSaveForm(form) {
  const button = form.querySelector("[data-community-save]");
  const location = form.elements["save-location"].value;
  const name = form.elements.title.value.trim();
  if (!name) return;
  if (name.toLocaleLowerCase().includes("https")) {
    updateSaveForm(form);
    setStatus(copy.titleHttpsBlocked, "error");
    return;
  }
  button.disabled = true;
  button.textContent = copy.saving;
  try {
    if (location === "public") await savePublicFitting(name);
    else bridge.saveLocalFitting({ name });
    bridge.clearPublicFittingMode?.();
    setAuthStatus(location === "public" ? copy.publicSaved : copy.localSaved);
    closeCommunity();
  } catch (error) {
    const message = location === "local" ? copy.localSaveFailed : firebaseErrorMessage(error, copy.saveFailed);
    setStatus(message, "error");
    button.disabled = false;
    button.textContent = copy.save;
  }
}
function updateLikeViews(id, count, liked) {
  records.filter((record) => record.id === id).forEach((record) => Object.assign(record, { likeCount: count, liked }));
  bridge.updatePublicFittingLike?.(id, count, liked, Boolean(currentUser));
  if (!elements.overlay.hidden && activeMode === "browse") renderBrowser();
}
async function ensureLikeState(id) {
  if (!currentUser || !firebaseApi || !db) return;
  const key = `${currentUser.uid}:${id}`;
  if (loadedLikeStates.has(key)) return;
  loadedLikeStates.add(key);
  try {
    const snapshot = await firebaseApi.getDoc(firebaseApi.doc(db, "fittings", id, "likes", currentUser.uid));
    const record = records.find((entry) => entry.id === id);
    if (!record) return;
    record.liked = snapshot.exists();
    bridge.updatePublicFittingLike?.(id, record.likeCount, record.liked, true);
    if (!elements.overlay.hidden && activeMode === "browse" && selectedId === id) renderBrowser();
  } catch {
    loadedLikeStates.delete(key);
  }
}
async function syncActiveSourceLikeState() {
  const source = bridge.getPublicFittingSource?.();
  if (!currentUser || !source || !firebaseApi || !db) return;
  try {
    const snapshot = await firebaseApi.getDoc(firebaseApi.doc(db, "fittings", source.id, "likes", currentUser.uid));
    loadedLikeStates.add(`${currentUser.uid}:${source.id}`);
    bridge.updatePublicFittingLike?.(source.id, source.likeCount, snapshot.exists(), true);
  } catch {
    // The source panel remains usable and the transaction will resolve the state on click.
  }
}
async function toggleLike(id) {
  if (!currentUser || !firebaseApi || !db) return;
  try {
    const fittingRef = firebaseApi.doc(db, "fittings", id);
    const likeRef = firebaseApi.doc(db, "fittings", id, "likes", currentUser.uid);
    const result = await firebaseApi.runTransaction(db, async (transaction) => {
      const fittingSnapshot = await transaction.get(fittingRef);
      const likeSnapshot = await transaction.get(likeRef);
      if (!fittingSnapshot.exists()) throw new Error("Missing fitting");
      const count = fittingSnapshot.data().likeCount;
      if (!Number.isInteger(count) || count < 0) throw new Error("Invalid like count");
      if (likeSnapshot.exists()) {
        const next = Math.max(0, count - 1);
        transaction.delete(likeRef);
        transaction.update(fittingRef, { likeCount: next });
        return { count: next, liked: false };
      }
      transaction.set(likeRef, { createdAt: firebaseApi.serverTimestamp() });
      transaction.update(fittingRef, { likeCount: count + 1 });
      return { count: count + 1, liked: true };
    });
    loadedLikeStates.add(`${currentUser.uid}:${id}`);
    updateLikeViews(id, result.count, result.liked);
  } catch (error) { setStatus(firebaseErrorMessage(error, copy.likeFailed), "error"); }
}
async function deleteRemoteFitting(record) {
  const user = currentUser;
  if (!user || record.ownerUid !== user.uid) throw new Error("Not fitting owner");
  const fittingRef = firebaseApi.doc(db, "fittings", record.id);
  const deletionRequestRef = firebaseApi.doc(db, "deletionRequests", record.id);
  const usageRef = firebaseApi.doc(db, "publisherUsage", user.uid);
  await firebaseApi.runTransaction(db, async (transaction) => {
    const fittingSnapshot = await transaction.get(fittingRef);
    const usageSnapshot = await transaction.get(usageRef);
    if (!fittingSnapshot.exists()) throw new Error("Missing fitting");
    const fitting = fittingSnapshot.data();
    const count = usageSnapshot.exists() ? usageSnapshot.data().count : null;
    if (fitting.ownerUid !== user.uid || !Number.isInteger(count) || count < 1) {
      throw new Error("Invalid publisher usage");
    }
    const nextCount = count - 1;
    transaction.set(deletionRequestRef, {
      ownerUid: user.uid,
      mechId: fitting.mechId,
      createdAt: firebaseApi.serverTimestamp(),
    });
    transaction.delete(fittingRef);
    transaction.set(usageRef, { count: nextCount, lastFittingId: record.id, operation: "delete", updatedAt: firebaseApi.serverTimestamp() });
  });
}
async function deleteFitting(id) {
  const record = records.find((entry) => entry.id === id);
  if (!record || !globalThis.confirm(copy.deleteConfirm)) return;
  try {
    if (activeBrowserTab === "local") {
      if (!bridge.deleteLocalFitting(id)) throw new Error("Local delete failed");
    } else {
      await deleteRemoteFitting(record);
      bridge.clearPublicFittingIfMatches?.(id);
    }
    records = records.filter((entry) => entry.id !== id);
    selectedId = records[0]?.id || null;
    renderBrowser({ resetDetailScroll: true });
  } catch (error) { setStatus(firebaseErrorMessage(error, copy.deleteFailed), "error"); }
}
function applyFitting(id) {
  const record = records.find((entry) => entry.id === id);
  if (!record?.valid) return;
  const payload = { ...record, canLike: Boolean(currentUser) };
  if (activeBrowserTab === "local") bridge.openLocalFitting(payload);
  else bridge.openPublicFitting(payload);
  closeCommunity();
}
function closeAllMenus(except = null) {
  document.querySelectorAll(".community-menu-popover").forEach((menu) => {
    if (menu === except) return;
    menu.hidden = true;
    menu.closest(".community-menu")?.querySelector("[data-community-menu-trigger]")?.setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("click", (event) => {
  const mechFilterTrigger = event.target.closest("#community-mech-filter-trigger");
  if (mechFilterTrigger) {
    const opening = Boolean(elements.mechFilterMenu?.hidden);
    if (opening) renderMechFilterMenu();
    elements.mechFilterMenu.hidden = !opening;
    mechFilterTrigger.setAttribute("aria-expanded", String(opening));
    return;
  }
  const mechFilterOption = event.target.closest("[data-community-mech-filter-option]");
  if (mechFilterOption) {
    selectMechFilter(mechFilterOption.dataset.communityMechFilterOption);
    return;
  }
  const mechFilterChassis = event.target.closest("[data-community-mech-filter-chassis]");
  if (mechFilterChassis) {
    const chassisId = String(mechFilterChassis.dataset.communityMechFilterChassis);
    if (expandedMechFilterChassis.has(chassisId)) expandedMechFilterChassis.delete(chassisId);
    else expandedMechFilterChassis.add(chassisId);
    renderMechFilterMenu({ preserveScroll: true });
    elements.mechFilterMenu.hidden = false;
    elements.mechFilterTrigger.setAttribute("aria-expanded", "true");
    return;
  }
  if (!event.target.closest(".community-dialog-heading")) closeMechFilterMenu();
  const menuTrigger = event.target.closest("[data-community-menu-trigger]");
  if (menuTrigger) {
    const menu = menuTrigger.closest(".community-menu")?.querySelector(".community-menu-popover");
    const opening = Boolean(menu?.hidden);
    closeAllMenus(opening ? menu : null);
    if (menu) menu.hidden = !opening;
    menuTrigger.setAttribute("aria-expanded", String(opening));
    return;
  }
  const opener = event.target.closest("[data-community-open]");
  if (opener) {
    const returnTarget = opener.closest(".community-menu")?.querySelector("[data-community-menu-trigger]") || opener;
    closeAllMenus();
    openCommunity(opener.dataset.communityOpen, returnTarget);
    return;
  }
  if (!event.target.closest(".community-menu")) closeAllMenus();
  const sourceLike = event.target.closest("[data-community-source-like]");
  if (sourceLike) { toggleLike(sourceLike.dataset.communitySourceLike); return; }
  if (event.target.closest("[data-community-restore]")) bridge.restorePublicFitting?.();
});
elements.content.addEventListener("click", async (event) => {
  const tab = event.target.closest("[data-community-tab]");
  if (tab) return switchBrowserTab(tab.dataset.communityTab, true);
  const sort = event.target.closest("[data-community-sort]");
  if (sort) {
    sortMode = sort.dataset.communitySort === "likes" ? "likes" : "newest";
    closeAllMenus();
    await loadRemoteFittings(true, { focusSort: true });
    return;
  }
  if (event.target.closest("[data-community-sign-in]")) {
    const user = await signIn();
    if (user && !elements.overlay.hidden && activeMode === "browse" && activeBrowserTab === "mine") switchBrowserTab("mine", true);
    return;
  }
  const select = event.target.closest("[data-community-select]");
  if (select) { selectedId = select.dataset.communitySelect; renderBrowser({ resetDetailScroll: true }); return; }
  const like = event.target.closest("[data-community-like]");
  if (like) return toggleLike(like.dataset.communityLike);
  const remove = event.target.closest("[data-community-delete]");
  if (remove) return deleteFitting(remove.dataset.communityDelete);
  const apply = event.target.closest("[data-community-apply]");
  if (apply) return applyFitting(apply.dataset.communityApply);
  const pageButton = event.target.closest("[data-community-page]");
  if (pageButton) {
    const requestedPage = Number(pageButton.dataset.communityPage);
    if (!Number.isInteger(requestedPage) || requestedPage < 1) return;
    const loadedPages = Math.max(1, Math.ceil(filteredRecords().length / LIST_LIMIT));
    if (requestedPage > loadedPages && activeBrowserTab !== "local" && hasMore) {
      return loadRemoteFittings(false).then(() => {
        currentPage = Math.min(requestedPage, Math.max(1, Math.ceil(filteredRecords().length / LIST_LIMIT)));
        selectedId = null;
        renderBrowser({ resetListScroll: true, resetDetailScroll: true });
      });
    }
    currentPage = Math.min(requestedPage, loadedPages);
    selectedId = null;
    renderBrowser({ resetListScroll: true, resetDetailScroll: true });
    return;
  }
  if (event.target.closest("[data-community-cancel]")) closeCommunity();
});
elements.content.addEventListener("input", (event) => {
  const form = event.target.closest("[data-community-save-form]");
  if (form) return updateSaveForm(form);
  if (event.target.matches("[data-community-search]")) {
    searchText = event.target.value;
    currentPage = 1;
    renderBrowser({ resetListScroll: true, resetDetailScroll: true });
    const search = elements.content.querySelector("[data-community-search]");
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
  }
});
elements.content.addEventListener("change", (event) => {
  const form = event.target.closest("[data-community-save-form]");
  if (form) return updateSaveForm(form);
});
elements.content.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-community-save-form]");
  if (!form) return;
  event.preventDefault();
  submitSaveForm(form);
});
elements.login.addEventListener("click", async () => currentUser ? firebaseApi.signOut(auth) : signIn());
elements.close.addEventListener("click", closeCommunity);
elements.overlay.addEventListener("mousedown", (event) => { if (event.target === elements.overlay) closeCommunity(); });
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (elements.mechFilterMenu && !elements.mechFilterMenu.hidden) {
    closeMechFilterMenu();
    elements.mechFilterTrigger.focus();
    return;
  }
  const openSortMenu = elements.content.querySelector(".community-sort-menu .community-menu-popover:not([hidden])");
  if (openSortMenu) {
    const trigger = openSortMenu.closest(".community-sort-menu")?.querySelector("[data-community-sort-trigger]");
    closeAllMenus();
    trigger?.focus();
    return;
  }
  closeAllMenus();
  closeCommunity();
});

async function initializeFirebase() {
  updateLoginButton();
  if (!bridge || location.protocol === "file:") return false;
  try {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`),
    ]);
    firebaseApi = { ...appModule, ...authModule, ...firestoreModule };
    const app = appModule.initializeApp(firebaseConfig);
    auth = authModule.getAuth(app);
    db = firestoreModule.getFirestore(app);
    const googleAccounts = await loadGoogleIdentity();
    googleTokenClient = googleAccounts.oauth2.initTokenClient({ client_id: GOOGLE_IDENTITY_CLIENT_ID, scope: "openid email profile", callback: handleGoogleAccessToken, error_callback: handleGooglePopupError });
    authModule.onAuthStateChanged(auth, (user) => {
      currentUser = user;
      updateLoginButton();
      bridge.setPublicLikeCapability?.(Boolean(user));
      if (user) {
        syncActiveSourceLikeState();
        if (!elements.overlay.hidden && activeMode === "browse" && activeBrowserTab !== "mine") renderBrowser();
      } else {
        loadedLikeStates.clear();
        records.forEach((record) => { record.liked = false; });
        const source = bridge.getPublicFittingSource?.();
        if (source) bridge.updatePublicFittingLike?.(source.id, source.likeCount, false, false);
        if (!elements.overlay.hidden && activeMode === "browse" && activeBrowserTab !== "mine") renderBrowser();
      }
      if (user) setAuthStatus();
      if (!elements.overlay.hidden && activeMode === "browse" && activeBrowserTab === "mine") switchBrowserTab("mine", true);
    });
    await auth.authStateReady();
    currentUser = auth.currentUser;
    updateLoginButton();
    return true;
  } catch (error) {
    console.error("Firebase initialization failed", error);
    setAuthStatus(firebaseErrorMessage(error, copy.unavailable));
    updateLoginButton();
    return false;
  }
}

elements.close.setAttribute("aria-label", language === "en" ? "Close" : "닫기");
firebaseReady = initializeFirebase();
