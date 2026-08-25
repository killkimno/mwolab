const FIREBASE_VERSION = "12.17.1";
const LIST_LIMIT = 20;
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
    login: "Google 로그인",
    logout: "로그아웃",
    browserTitle: "핏팅 브라우저",
    publishTitle: "핏팅 올리기",
    loading: "공개 핏팅을 불러오는 중입니다...",
    empty: "아직 공개된 핏팅이 없습니다.",
    open: "열기",
    invalid: "현재 데이터에서 열 수 없는 핏팅",
    like: "좋아요",
    likeManage: "좋아요 관리",
    unlike: "좋아요 취소",
    publishHelp: "현재 활성 핏팅을 공개 목록에 올립니다. 무기 그룹과 스킬 설정은 포함되지 않습니다.",
    publish: "현재 핏팅 올리기",
    publishing: "올리는 중...",
    published: "핏팅을 공개 목록에 올렸습니다.",
    publishLimit: "계정당 공개 핏팅은 최대 5개까지 올릴 수 있습니다.",
    loginRequired: "이 기능을 사용하려면 Google 로그인이 필요합니다.",
    unavailable: "Firebase 연결을 사용할 수 없습니다. 잠시 후 다시 시도하세요.",
    httpRequired: "Firebase 연동은 localhost 또는 배포된 웹사이트에서 사용할 수 있습니다.",
    noFitting: "먼저 멕과 핏팅을 선택하세요.",
    loadFailed: "공개 핏팅을 불러오지 못했습니다.",
    publishFailed: "핏팅을 올리지 못했습니다.",
    firestorePermissionDenied: "Firestore 보안 규칙이 이 작업을 허용하지 않습니다. Firebase 콘솔의 Firestore > 규칙에서 프로젝트 규칙을 배포했는지 확인하세요.",
    firestoreUnavailable: "Firestore에 연결하지 못했습니다. 잠시 후 다시 시도하세요.",
    likeFailed: "좋아요를 변경하지 못했습니다.",
    loginFailed: "Google 로그인에 실패했습니다.",
    unauthorizedDomain: "현재 주소({host})가 Firebase 승인된 도메인이 아닙니다. Firebase Authentication > 설정 > 승인된 도메인에 {host}를 추가하세요.",
    popupClosed: "Google 로그인 창이 인증 완료 전에 닫혔습니다. 팝업 차단을 해제한 뒤 다시 시도하세요.",
    popupBlocked: "브라우저가 Google 로그인 팝업을 차단했습니다. 이 사이트의 팝업을 허용하세요.",
    providerDisabled: "Firebase Authentication에서 Google 로그인 제공업체가 활성화되어 있지 않습니다.",
    networkFailed: "Google 로그인 서버에 연결하지 못했습니다. 네트워크 연결을 확인하세요.",
  },
  en: {
    login: "Google Sign in",
    logout: "Sign out",
    browserTitle: "Fitting Browser",
    publishTitle: "Publish Fitting",
    loading: "Loading public fittings...",
    empty: "No public fittings yet.",
    open: "Open",
    invalid: "Fitting unavailable with current data",
    like: "Like",
    likeManage: "Manage like",
    unlike: "Remove like",
    publishHelp: "Publishes the active fitting. Weapon groups and skill selections are not included.",
    publish: "Publish current fitting",
    publishing: "Publishing...",
    published: "The fitting is now public.",
    publishLimit: "Each account can publish up to 5 public fittings.",
    loginRequired: "Google sign-in is required for this action.",
    unavailable: "Firebase is unavailable. Try again shortly.",
    httpRequired: "Firebase is available on localhost or the deployed website.",
    noFitting: "Select a mech and fitting first.",
    loadFailed: "Could not load public fittings.",
    publishFailed: "Could not publish the fitting.",
    firestorePermissionDenied: "Firestore security rules denied this action. Check that the project rules are published in Firebase Console > Firestore > Rules.",
    firestoreUnavailable: "Could not connect to Firestore. Try again shortly.",
    likeFailed: "Could not update the like.",
    loginFailed: "Google sign-in failed.",
    unauthorizedDomain: "The current host ({host}) is not authorized. Add {host} in Firebase Authentication > Settings > Authorized domains.",
    popupClosed: "The Google sign-in window closed before authentication completed. Allow popups and try again.",
    popupBlocked: "The browser blocked the Google sign-in popup. Allow popups for this site.",
    providerDisabled: "The Google provider is not enabled in Firebase Authentication.",
    networkFailed: "Could not reach Google sign-in. Check the network connection.",
  },
};
const copy = COPY[language];

const elements = {
  login: document.getElementById("community-login"),
  authStatus: document.getElementById("community-auth-status"),
  overlay: document.getElementById("community-overlay"),
  title: document.getElementById("community-title"),
  close: document.getElementById("close-community"),
  content: document.getElementById("community-content"),
  status: document.getElementById("community-status"),
};

let auth = null;
let db = null;
let provider = null;
let currentUser = null;
let firebaseApi = null;
let firebaseReady = null;
let activeMode = "browse";
let returnFocus = null;

function format(text, values = {}) {
  return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(message = "", tone = "") {
  elements.status.textContent = message;
  elements.status.className = `community-status${tone ? ` ${tone}` : ""}`;
}

function setAuthStatus(message = "") {
  elements.authStatus.textContent = message;
  elements.authStatus.hidden = !message;
}

function firebaseErrorMessage(error, fallback) {
  const messages = {
    "auth/unauthorized-domain": format(copy.unauthorizedDomain, { host: location.hostname || location.host }),
    "auth/popup-closed-by-user": copy.popupClosed,
    "auth/popup-blocked": copy.popupBlocked,
    "auth/operation-not-allowed": copy.providerDisabled,
    "auth/network-request-failed": copy.networkFailed,
    "permission-denied": copy.firestorePermissionDenied,
    "firestore/permission-denied": copy.firestorePermissionDenied,
    unavailable: copy.firestoreUnavailable,
    "firestore/unavailable": copy.firestoreUnavailable,
  };
  const message = messages[error?.code] || fallback;
  return error?.code ? `${message} (${error.code})` : message;
}

function updateLoginButton() {
  if (!elements.login) return;
  if (currentUser) {
    elements.login.textContent = copy.logout;
    elements.login.title = copy.logout;
    elements.login.classList.add("signed-in");
    elements.login.setAttribute("aria-label", copy.logout);
  } else {
    elements.login.textContent = copy.login;
    elements.login.title = copy.login;
    elements.login.classList.remove("signed-in");
    elements.login.setAttribute("aria-label", copy.login);
  }
}

async function signIn() {
  await firebaseReady;
  if (!firebaseApi || !auth || !provider) {
    setAuthStatus(location.protocol === "file:" ? copy.httpRequired : copy.unavailable);
    return null;
  }
  try {
    setAuthStatus();
    const result = await firebaseApi.signInWithPopup(auth, provider);
    setAuthStatus();
    return result.user;
  } catch (error) {
    const message = firebaseErrorMessage(error, copy.loginFailed);
    console.error("Google sign-in failed", error);
    setAuthStatus(message);
    return null;
  }
}

async function requireUser() {
  return currentUser || signIn();
}

function closeAllMenus(except = null) {
  document.querySelectorAll(".community-menu-popover").forEach((menu) => {
    if (menu === except) return;
    menu.hidden = true;
    menu.closest(".community-menu")?.querySelector("[data-community-menu-trigger]")?.setAttribute("aria-expanded", "false");
  });
}

function closeCommunity() {
  if (elements.overlay.hidden) return;
  elements.overlay.hidden = true;
  document.body.classList.remove("community-open");
  returnFocus?.focus?.();
  returnFocus = null;
}

async function openCommunity(mode, trigger) {
  activeMode = mode === "publish" ? "publish" : "browse";
  returnFocus = trigger || document.activeElement;
  closeAllMenus();
  elements.overlay.hidden = false;
  document.body.classList.add("community-open");
  elements.title.textContent = activeMode === "publish" ? copy.publishTitle : copy.browserTitle;
  setStatus();
  elements.close.focus();
  if (activeMode === "publish") renderPublish();
  else await loadFittings();
}

function fittingDate(timestamp) {
  const date = timestamp?.toDate?.();
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en" : "ko-KR", { dateStyle: "medium" }).format(date);
}

function safeFitting(record) {
  try {
    if (record.schemaVersion !== 1 || typeof record.loadoutCode !== "string") throw new Error("Invalid record");
    const fitting = bridge.describeFitting(record.loadoutCode);
    return { ...fitting, valid: true };
  } catch {
    return { mechName: copy.invalid, valid: false };
  }
}

function fittingItemHtml(snapshot) {
  const record = snapshot.data();
  const fitting = safeFitting(record);
  const count = Number.isInteger(record.likeCount) && record.likeCount >= 0 ? record.likeCount : 0;
  return `
    <article class="community-fitting-item${fitting.valid ? "" : " invalid"}" data-community-fitting-id="${escapeHtml(snapshot.id)}">
      <div>
        <strong>${escapeHtml(fitting.mechName)}</strong>
        <small>${escapeHtml(fittingDate(record.createdAt))}</small>
      </div>
      <button class="community-like-button" type="button" data-community-like data-community-like-known="false" aria-label="${escapeHtml(copy.likeManage)}">♥ ${count}</button>
      <button type="button" data-community-apply${fitting.valid ? "" : " disabled"}>${escapeHtml(copy.open)}</button>
      <input type="hidden" data-community-loadout value="${escapeHtml(record.loadoutCode)}">
    </article>
  `;
}

async function loadFittings() {
  elements.content.innerHTML = `<p class="community-loading">${escapeHtml(copy.loading)}</p>`;
  await firebaseReady;
  if (!firebaseApi || !db) {
    elements.content.innerHTML = `<p class="community-empty">${escapeHtml(location.protocol === "file:" ? copy.httpRequired : copy.unavailable)}</p>`;
    return;
  }
  try {
    const fittings = firebaseApi.collection(db, "publicFittings");
    const request = firebaseApi.query(fittings, firebaseApi.orderBy("createdAt", "desc"), firebaseApi.limit(LIST_LIMIT));
    const snapshot = await firebaseApi.getDocs(request);
    elements.content.innerHTML = snapshot.empty
      ? `<p class="community-empty">${escapeHtml(copy.empty)}</p>`
      : `<div class="community-fitting-list">${snapshot.docs.map(fittingItemHtml).join("")}</div>`;
  } catch (error) {
    console.error("Unable to load public fittings", error);
    const message = firebaseErrorMessage(error, copy.loadFailed);
    elements.content.innerHTML = `<p class="community-empty">${escapeHtml(message)}</p>`;
    setStatus(message, "error");
  }
}

function currentFitting() {
  try {
    return bridge.getCurrentFitting();
  } catch {
    return null;
  }
}

function renderPublish() {
  const fitting = currentFitting();
  if (!fitting) {
    elements.content.innerHTML = `<p class="community-empty">${escapeHtml(copy.noFitting)}</p>`;
    return;
  }
  elements.content.innerHTML = `
    <div class="community-publish-panel">
      <div class="community-publish-summary">
        <strong>${escapeHtml(fitting.mechName)}</strong>
        <p>${escapeHtml(copy.publishHelp)}</p>
      </div>
      <button class="community-publish-button" type="button" data-community-publish>${escapeHtml(copy.publish)}</button>
    </div>
  `;
}

async function publishCurrentFitting(button) {
  const user = await requireUser();
  if (!user) return;
  const fitting = currentFitting();
  if (!fitting) {
    setStatus(copy.noFitting, "error");
    return;
  }
  button.disabled = true;
  button.textContent = copy.publishing;
  try {
    const fittingRef = firebaseApi.doc(firebaseApi.collection(db, "publicFittings"));
    const ownerRef = firebaseApi.doc(db, "fittingOwners", fittingRef.id);
    const usageRef = firebaseApi.doc(db, "publisherUsage", user.uid);
    await firebaseApi.runTransaction(db, async (transaction) => {
      const usageSnapshot = await transaction.get(usageRef);
      const publishCount = usageSnapshot.exists() ? usageSnapshot.data().publishCount : 0;
      if (!Number.isInteger(publishCount) || publishCount < 0 || publishCount >= 5) {
        throw new Error("publish-limit");
      }
      transaction.set(fittingRef, {
        loadoutCode: fitting.loadoutCode,
        likeCount: 0,
        createdAt: firebaseApi.serverTimestamp(),
        schemaVersion: 1,
      });
      transaction.set(ownerRef, {
        uid: user.uid,
        createdAt: firebaseApi.serverTimestamp(),
      });
      transaction.set(usageRef, {
        publishCount: publishCount + 1,
        lastFittingId: fittingRef.id,
        updatedAt: firebaseApi.serverTimestamp(),
      });
    });
    setStatus(copy.published, "success");
    button.textContent = copy.publish;
  } catch (error) {
    console.error("Unable to publish fitting", error);
    setStatus(
      error?.message === "publish-limit"
        ? copy.publishLimit
        : firebaseErrorMessage(error, copy.publishFailed),
      "error",
    );
    button.textContent = copy.publish;
  } finally {
    button.disabled = false;
  }
}

async function toggleLike(item, button) {
  const user = await requireUser();
  if (!user) return;
  button.disabled = true;
  try {
    const fittingRef = firebaseApi.doc(db, "publicFittings", item.dataset.communityFittingId);
    const likeRef = firebaseApi.doc(db, "publicFittings", fittingRef.id, "likes", user.uid);
    const liked = await firebaseApi.runTransaction(db, async (transaction) => {
      const fittingSnapshot = await transaction.get(fittingRef);
      const likeSnapshot = await transaction.get(likeRef);
      if (!fittingSnapshot.exists()) throw new Error("Missing fitting");
      const count = fittingSnapshot.data().likeCount;
      if (!Number.isInteger(count) || count < 0) throw new Error("Invalid like count");
      const knownState = button.dataset.communityLikeKnown === "true";
      if (likeSnapshot.exists() && !knownState) {
        return { active: true, count };
      }
      if (likeSnapshot.exists()) {
        transaction.delete(likeRef);
        transaction.update(fittingRef, { likeCount: Math.max(0, count - 1) });
        return { active: false, count: Math.max(0, count - 1) };
      }
      transaction.set(likeRef, { createdAt: firebaseApi.serverTimestamp() });
      transaction.update(fittingRef, { likeCount: count + 1 });
      return { active: true, count: count + 1 };
    });
    button.classList.toggle("liked", liked.active);
    button.dataset.communityLikeKnown = "true";
    button.textContent = `${liked.active ? "♥" : "♡"} ${liked.count}`;
    button.setAttribute("aria-label", liked.active ? copy.unlike : copy.like);
  } catch (error) {
    console.error("Unable to update like", error);
    setStatus(firebaseErrorMessage(error, copy.likeFailed), "error");
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-community-menu-trigger]");
  if (trigger) {
    const menu = trigger.closest(".community-menu")?.querySelector(".community-menu-popover");
    const opening = Boolean(menu?.hidden);
    closeAllMenus(opening ? menu : null);
    if (menu) menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
    return;
  }
  const opener = event.target.closest("[data-community-open]");
  if (opener) {
    openCommunity(opener.dataset.communityOpen, opener);
    return;
  }
  if (!event.target.closest(".community-menu")) closeAllMenus();
});

elements.content.addEventListener("click", (event) => {
  const publishButton = event.target.closest("[data-community-publish]");
  if (publishButton) {
    publishCurrentFitting(publishButton);
    return;
  }
  const item = event.target.closest("[data-community-fitting-id]");
  if (!item) return;
  const likeButton = event.target.closest("[data-community-like]");
  if (likeButton) {
    toggleLike(item, likeButton);
    return;
  }
  if (event.target.closest("[data-community-apply]")) {
    try {
      bridge.openFitting(item.querySelector("[data-community-loadout]").value);
      closeCommunity();
    } catch {
      setStatus(copy.invalid, "error");
    }
  }
});

elements.login.addEventListener("click", async () => {
  if (currentUser) {
    await firebaseApi.signOut(auth);
    return;
  }
  await signIn();
});
elements.close.addEventListener("click", closeCommunity);
elements.overlay.addEventListener("mousedown", (event) => {
  if (event.target === elements.overlay) closeCommunity();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
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
    provider = new authModule.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    authModule.onAuthStateChanged(auth, (user) => {
      currentUser = user;
      updateLoginButton();
      if (user) setAuthStatus();
    });
    await auth.authStateReady();
    currentUser = auth.currentUser;
    updateLoginButton();
    return true;
  } catch (error) {
    console.error("Firebase initialization failed", error);
    elements.login.title = copy.unavailable;
    setAuthStatus(firebaseErrorMessage(error, copy.unavailable));
    return false;
  }
}

elements.close.setAttribute("aria-label", language === "en" ? "Close" : "닫기");
firebaseReady = initializeFirebase();
