const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("로그인과 통합 핏팅 브라우저를 운영 페이지에 표시한다", () => {
  const html = read("public/index.html");
  const app = read("public/app.js");
  assert.doesNotMatch(html, /<html[^>]+data-community-ui="hidden"/);
  assert.ok(html.indexOf('id="community-login"') < html.indexOf('id="donate-link"'));
  assert.match(html, /<button id="community-login"/);
  assert.match(html, /id="community-auth-status"[^>]+role="status"/);
  assert.match(app, /data-community-open="browse"/);
  assert.match(app, /data-community-open="save"/);
  assert.match(html, /id="mech-toolbar-community"[^>]+data-community-open="browse"[^>]+data-community-mech-filter="all"/);
  assert.doesNotMatch(app, /id="local-save-build"|id="local-load-build"/);
});

test("Firebase 공개 설정에는 서버 비밀키를 포함하지 않는다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /projectId:\s*"mwolab-2e145"/);
  assert.match(client, /GOOGLE_IDENTITY_CLIENT_ID\s*=\s*"743748401179-[^"]+\.apps\.googleusercontent\.com"/);
  assert.doesNotMatch(client, /clientSecret|privateKey|serviceAccount/i);
  assert.match(client, /logout: "로그아웃"/);
  assert.match(client, /logout: "Sign out"/);
  assert.doesNotMatch(client, /currentUser\.displayName/);
});

test("기존 UI 버튼이 Google OAuth 토큰을 Firebase credential로 교환한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /https:\/\/accounts\.google\.com\/gsi\/client/);
  assert.match(client, /oauth2\.initTokenClient/);
  assert.match(client, /requestAccessToken\(\{ prompt: "select_account" \}\)/);
  assert.match(client, /GoogleAuthProvider\.credential\(null, response\.access_token\)/);
  assert.match(client, /signInWithCredential\(auth, credential\)/);
  assert.doesNotMatch(client, /renderButton/);
  assert.doesNotMatch(client, /signInWithPopup/);
});

test("Firestore 규칙 거부는 사용자에게 배포 확인 안내와 오류 코드를 보여 준다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /"firestore\/permission-denied": copy\.firestorePermissionDenied/);
  assert.match(client, /Firebase Console의 Firestore Database > Rules에 최신 규칙이 게시되었는지 확인하세요/);
  assert.match(client, /return error\?\.code \? `\$\{message\} \(\$\{error\.code\}\)` : message/);
});

test("홈페이지는 공개 개인정보처리방침을 연결하고 실제 Firebase 데이터 범위를 고지한다", () => {
  const html = read("public/index.html");
  const app = read("public/app.js");
  const privacy = read("public/privacy.html");
  assert.match(html, /href="privacy\.html"[^>]+data-i18n="privacy\.link"/);
  assert.ok(html.indexOf('class="language-switch"') < html.indexOf('class="privacy-link"'));
  assert.doesNotMatch(html, /help\.cloudflare/);
  assert.doesNotMatch(app, /help\.cloudflare/);
  assert.match(privacy, /Firebase Authentication/);
  assert.match(privacy, /Cloud Firestore/);
  assert.match(privacy, /Firebase 사용자 식별자\(UID\)|Firebase user identifier \(UID\)/);
  assert.match(privacy, /killkimno@gmail\.com/);
  assert.match(privacy, /Cloudflare Web Analytics/);
  assert.match(privacy, /Google 표시 이름을 닉네임이나 공개 핏팅 작성자명으로 사용하지 않습니다/);
  assert.match(privacy, /users\/\{uid\}[\s\S]*nicknames\/\{key\}[\s\S]*Pilot/);
  assert.match(privacy, /ownership checks[\s\S]*nickname lookup/);
});

test("선택형 고유 닉네임은 UID 소유권과 분리해 예약하고 공개 핏팅 작성자로 표시한다", () => {
  const html = read("public/index.html");
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  const rules = read("admin/firestore.rules");
  const privacy = read("public/privacy.html");
  const styles = read("public/styles.css");

  assert.match(html, /id="community-account-menu"[\s\S]*id="community-set-nickname"[\s\S]*id="community-logout"/);
  assert.doesNotMatch(html, /id="community-account-name"/);
  assert.match(html, /id="nickname-overlay"[\s\S]*id="nickname-form"[\s\S]*id="nickname-later-notice"[\s\S]*id="nickname-input"[\s\S]*maxlength="20"/);
  assert.match(client, /const NICKNAME_MIN = 2;[\s\S]*const NICKNAME_MAX = 20;[\s\S]*const PILOT_NAME = "Pilot";[\s\S]*const PROFILE_CACHE_TTL_MS = 60_000/);
  assert.match(client, /function nicknameParts\(value\)[\s\S]*\.trim\(\)[\s\S]*\.toLowerCase\(\)[\s\S]*\^\[A-Za-z0-9\]\+\$/);
  assert.doesNotMatch(client, /A-Za-z0-9가-힣|nicknameCancel/);
  assert.match(client, /nicknameKey !== "pilot"/);
  assert.doesNotMatch(client, /currentUser\.displayName|user\.displayName/);
  assert.match(client, /onAuthStateChanged\(auth, \(user\) => \{[\s\S]*initializeCurrentProfile\(user\)/);
  assert.match(client, /nicknamePrompted: true[\s\S]*createdAt: firebaseApi\.serverTimestamp\(\)[\s\S]*updatedAt: firebaseApi\.serverTimestamp\(\)/);
  assert.match(client, /runTransaction\(db, async \(transaction\) => \{[\s\S]*transaction\.get\(userRef\)[\s\S]*transaction\.get\(nicknameRef\)[\s\S]*transaction\.set\(nicknameRef[\s\S]*transaction\.set\(userRef/);
  assert.match(client, /const profileCache = new Map\(\);[\s\S]*const profileDataCache = new Map\(\);[\s\S]*const profileRequests = new Map\(\)/);
  assert.match(client, /function getProfileData\(uid\)[\s\S]*profileDataCache\.has[\s\S]*profileRequests\.has/);
  assert.match(client, /cacheAge < PROFILE_CACHE_TTL_MS[\s\S]*profileDataCache\.delete\(normalizedUid\)/);
  assert.match(client, /skipNicknamePrompt[\s\S]*if \(currentUser\?\.uid !== user\.uid\) return;[\s\S]*closeNicknameDialog\(\)/);
  assert.match(client, /const buttonLabel = signedIn \? copy\.profile : copy\.login;[\s\S]*elements\.login\.textContent = buttonLabel/);
  assert.match(client, /elements\.login\.setAttribute\("aria-label", signedIn \? copy\.account : buttonLabel\)/);
  assert.doesNotMatch(client, /elements\.accountName|accountName: document\.getElementById/);
  assert.match(client, /setNickname\.textContent = currentProfile\?\.nickname \? copy\.nicknameChangeTitle : copy\.nicknameTitle;[\s\S]*setNickname\.hidden = !signedIn/);
  assert.match(client, /nicknameLaterNotice\.hidden = nicknamePromptMode !== "first"[\s\S]*nicknameLater\.hidden = nicknamePromptMode !== "first"/);
  assert.match(client, /const changingNickname = nicknamePromptMode === "account"[\s\S]*nicknameInput\.value = changingNickname \? currentProfile\.nickname : ""/);
  assert.match(client, /if \(!profile \|\| \(!currentProfile\?\.nickname && currentProfile\?\.nicknamePrompted !== true\)\) \{\s*openNicknameDialog\("first"\)/);
  const initializeProfile = client.match(/async function initializeCurrentProfile\(user\) \{[\s\S]*?(?=\nasync function signIn)/)?.[0] || "";
  assert.doesNotMatch(initializeProfile, /setAuthStatus|copy\.nicknameCheckFailed/);
  assert.match(client, /async function registerNickname[\s\S]*catch \(error\) \{\s*if \(currentUser\?\.uid !== user\.uid\) return;[\s\S]*nicknameAvailableKey = ""/);
  assert.match(client, /previousNicknameRef[\s\S]*transaction\.get\(previousNicknameRef\)[\s\S]*transaction\.set\(nicknameRef[\s\S]*transaction\.delete\(previousNicknameRef\)[\s\S]*transaction\.set\(userRef/);
  assert.match(client, /new Set\(remoteRecords\.map\(\(record\) => String\(record\.ownerUid/);
  assert.match(client, /await hydrateRecordAuthors\(nextRecords\)/);
  assert.match(client, /normalizeSnapshot\(snapshot, "shared"\)[\s\S]*await hydrateRecordAuthors\(\[record\]\)[\s\S]*bridge\.openPublicFitting/);
  assert.match(client, /community-author[^\n]+record\.authorName \|\| PILOT_NAME/);
  assert.match(app, /ownerUid: record\.ownerUid[\s\S]*authorName: record\.authorName \|\| "Pilot"/);
  assert.match(app, /public-fitting-source-author[\s\S]*source\.authorName \|\| "Pilot"/);
  assert.doesNotMatch(client, /transaction\.set\(fittingRef, \{[^}]*nickname/s);
  assert.match(rules, /function validNickname\(nickname, nicknameKey\)[\s\S]*nickname\.matches\('\^\[A-Za-z0-9\]\{2,20\}\$'\)[\s\S]*nicknameKey == nickname\.lower\(\)[\s\S]*nicknameKey != 'pilot'/);
  assert.match(rules, /match \/users\/\{uid\}[\s\S]*allow get: if true;[\s\S]*allow list: if false;/);
  assert.match(rules, /match \/nicknames\/\{nicknameKey\}[\s\S]*validNicknameReservationCreate\(nicknameKey\)[\s\S]*allow update: if false;[\s\S]*validNicknameReservationDelete\(nicknameKey\)/);
  assert.match(rules, /validNicknameProfileCreate\(\)[\s\S]*getAfter\(nicknamePath\(request\.resource\.data\.nicknameKey\)\)/);
  assert.match(rules, /validNicknameProfileUpdate\(\)[\s\S]*request\.resource\.data\.nicknameKey != resource\.data\.nicknameKey[\s\S]*!existsAfter\(nicknamePath\(resource\.data\.nicknameKey\)\)/);
  assert.match(rules, /function validNicknameReservationCreate\(nicknameKey\)[\s\S]*let profileBefore = get\(profilePath\)[\s\S]*let profileAfter = getAfter\(profilePath\)[\s\S]*!existsAfter\(oldNicknamePath\)/);
  assert.match(rules, /function validNicknameReservationDelete\(nicknameKey\)[\s\S]*profileBefore\.data\.nicknameKey == nicknameKey[\s\S]*nextNicknameKey != nicknameKey[\s\S]*getAfter\(nextNicknamePath\)\.data\.ownerUid/);
  assert.match(privacy, /닉네임은 핏팅 문서에 복제하지 않으며/);
  assert.match(styles, /\.community-account-menu[\s\S]*\.nickname-overlay[\s\S]*\.nickname-dialog/);
});

test("통합 브라우저는 공개·로컬·내 업로드 탭과 설명 없는 v2 저장 스키마를 사용한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /data-community-tab="public"/);
  assert.match(client, /data-community-tab="local"/);
  assert.match(client, /data-community-tab="mine"/);
  assert.match(client, /collection\(db, "fittings"\)/);
  assert.match(client, /ownerUid: user\.uid/);
  assert.match(client, /name, loadoutCode: fitting\.loadoutCode/);
  assert.match(client, /schemaVersion: 2/);
  assert.doesNotMatch(client, /name, description, loadoutCode/);
  assert.doesNotMatch(client, /name="description"/);
  assert.doesNotMatch(client, /userMechUsage/);
  assert.doesNotMatch(client, /publicFittings|fittingOwners/);
});

test("공개 핏팅 공유는 문서 ID를 단건 조회해 기존 공개 적용과 좋아요 경로를 재사용한다", () => {
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  const html = read("public/index.html");
  const rules = read("admin/firestore.rules");
  const styles = read("public/styles.css");

  assert.match(client, /share: "URL로 공유하기"/);
  assert.match(client, /share: "Share URL"/);
  assert.match(client, /const canShare = activeBrowserTab !== "local"/);
  assert.match(client, /data-community-share="\$\{escapeHtml\(record\.id\)\}"/);
  assert.doesNotMatch(client, /navigator\.share/);
  assert.match(html, /id="community-share-url-overlay"[\s\S]*id="community-share-url-text"[\s\S]*readonly[\s\S]*id="copy-community-share-url"/);
  assert.match(client, /function shareFitting\(id, trigger[\s\S]*elements\.shareUrl\.value = sharedFittingUrl\(record\.id\)[\s\S]*elements\.shareUrl\.focus\(\)[\s\S]*elements\.shareUrl\.select\(\)/);
  assert.match(client, /async function copyShareUrl\(\)[\s\S]*navigator\.clipboard\.writeText\(url\)[\s\S]*document\.execCommand\("copy"\)/);
  assert.match(client, /value\.length >= 1[\s\S]*value\.length <= 128[\s\S]*!value\.includes\("\/"\)/);
  assert.match(client, /function sharedFittingUrl\(fittingId\)[\s\S]*const languageParam[\s\S]*url\.search = ""[\s\S]*url\.searchParams\.set\("fitting", fittingId\)/);
  assert.match(client, /function loadSharedFitting\(fittingId\)[\s\S]*Promise\.all\([\s\S]*firebaseReady[\s\S]*bridge\?\.ready/);
  assert.match(client, /getDoc\(firebaseApi\.doc\(db, "fittings", fittingId\)\)/);
  assert.match(client, /normalizeSnapshot\(snapshot, "shared"\)[\s\S]*bridge\.openPublicFitting/);
  assert.match(client, /if \(currentUser\) await syncActiveSourceLikeState\(\)/);
  assert.match(client, /if \(!shared\.present\) \{[\s\S]*syncActiveSourceLikeState\(\)/);
  assert.doesNotMatch(
    client.match(/async function loadSharedFitting\(fittingId\) \{[\s\S]*?\n\}/)?.[0] || "",
    /getDocs|loadRemoteFittings|switchBrowserTab/,
  );
  assert.match(app, /const SHARED_PUBLIC_FITTING_QUERY_PARAM = "fitting"/);
  assert.match(app, /if \(params\.has\(SHARED_PUBLIC_FITTING_QUERY_PARAM\)\) return/);
  assert.match(app, /ready: communityBridgeReady/);
  assert.match(app, /updatePublicFittingNavigation\(record\.id, record\.navigationMode === "replace" \? "replace" : "push"\)/);
  assert.match(app, /if \(isPublic && record\.navigationMode !== "replace"\) preserveCurrentFittingHistoryEntry\(\)/);
  assert.match(app, /mechlabSnapshot: snapshot/);
  assert.match(app, /restoreMechlabHistorySnapshot\(window\.history\.state\?\.mechlabSnapshot\)/);
  assert.match(app, /rememberActiveMechlabTabBuild\(\);[\s\S]*applyMechlabHistorySnapshotToTab\(tab, snapshot, communityLikeCapability\);[\s\S]*applyActiveMechlabTabSelection\(\)/);
  assert.match(app, /importMwoCode\(source\.loadoutCode, \{ closeDialog: false, updateNavigation: false \}\)/);
  assert.doesNotMatch(app, /public-fitting-source-like-count/);
  assert.match(app, /data-community-source-like="\$\{escapeHtml\(source\.id\)\}"[\s\S]*class="\$\{source\.liked \? "liked" : ""\}\$\{source\.canLike \? "" : " login-required"\}"/);
  assert.match(rules, /match \/fittings\/\{fittingId\} \{[\s\S]*allow get: if true;[\s\S]*allow list: if request\.query\.limit/);
  assert.match(styles, /\.community-share-button/);
  assert.match(styles, /\.community-share-url-overlay \{ z-index: 1750; \}/);
});

test("공개 핏팅은 사용자별 원자적 카운터로 100개를 제한하고 탭에는 수량을 표시하지 않는다", () => {
  const client = read("public/firebase-community.js");
  const rules = read("admin/firestore.rules");
  const admin = read("admin/server.mjs");
  const sync = read("admin/sync-publisher-usage.mjs");
  const maintenanceRules = read("admin/firestore.maintenance.rules");
  const adminPackage = read("admin/package.json");
  const adminReadme = read("admin/README.md");
  assert.match(client, /const MAX_PUBLIC_FITTINGS = 100/);
  assert.doesNotMatch(client, /community-tab-count|mineUploadCount|refreshMineUploadCount/);
  assert.match(client, /runTransaction\(db, async \(transaction\) => \{[\s\S]*transaction\.get\(usageRef\)[\s\S]*count >= MAX_PUBLIC_FITTINGS[\s\S]*operation: "create"/);
  assert.match(client, /deleteRemoteFitting[\s\S]*transaction\.get\(usageRef\)[\s\S]*operation: "delete"/);
  assert.match(rules, /function usagePath\(uid\)/);
  assert.match(rules, /getAfter\(usagePath\(request\.auth\.uid\)\)\.data\.count <= 100/);
  assert.match(rules, /validUsageCreateAdvance\(fittingId\)/);
  assert.match(rules, /validUsageDeleteAdvance\(fittingId\)/);
  assert.match(rules, /allow create: if signedInWithGoogle\(\)[\s\S]*request\.resource\.data\.count == 1/);
  assert.match(rules, /allow update: if signedInWithGoogle\(\)[\s\S]*request\.resource\.data\.operation == 'create'[\s\S]*request\.resource\.data\.operation == 'delete'/);
  assert.match(rules, /match \/publisherUsage\/\{uid\}/);
  assert.match(admin, /collection\("publisherUsage"\)[\s\S]*operation: "admin-delete"/);
  assert.match(admin, /publisher-usage-invalid/);
  assert.doesNotMatch(admin, /where\("ownerUid", "==", usageResult\.ownerUid\)/);
  assert.ok(
    admin.indexOf("await db.runTransaction") < admin.indexOf("const deletedLikes = await purgeLikes(fittingId)"),
    "관리자 삭제는 핏팅·카운터 트랜잭션이 성공한 뒤에만 좋아요를 정리해야 한다",
  );
  assert.match(admin, /transaction\.delete\(fittingRef\);[\s\S]*transaction\.set\(deletionRequestRef,[\s\S]*const deletedLikes = await purgeLikes\(fittingId\);[\s\S]*await deletionRequestRef\.delete\(\)/);
  assert.match(sync, /collection\("fittings"\)\.get\(\)[\s\S]*collection\("publisherUsage"\)\.get\(\)/);
  assert.match(sync, /Publisher usage verification failed/);
  assert.match(maintenanceRules, /match \/fittings\/\{fittingId\}[\s\S]*allow write: if false/);
  assert.match(adminPackage, /deploy-maintenance-rules[\s\S]*sync-usage[\s\S]*deploy-rules/);
  assert.match(adminReadme, /관리자 서버[\s\S]*deploy-maintenance-rules[\s\S]*sync-usage[\s\S]*deploy-rules/);
});

test("핏팅 제목은 영문·숫자·ASCII 특수문자만 허용하고 https를 차단한다", () => {
  const client = read("public/firebase-community.js");
  const rules = read("admin/firestore.rules");
  const styles = read("public/styles.css");
  assert.match(client, /function fittingTitleParts\(value\)[\s\S]*validCharacters: \/\^\[\\x20-\\x7E\]\+\$\/[\s\S]*httpsBlocked: title\.toLocaleLowerCase\(\)\.includes\("https"\)/);
  assert.match(client, /titleCharactersOnly: "영문, 숫자, 특수문자만 사용할 수 있습니다\."/);
  assert.match(client, /titleCharactersOnly: "Use only English letters, numbers, and special characters\."/);
  assert.match(client, /disabled = !title \|\| invalidCharacters \|\| httpsBlocked/);
  assert.match(client, /titleHttpsBlocked: "제목에 https를 사용할 수 없습니다\."/);
  assert.match(rules, /request\.resource\.data\.name == request\.resource\.data\.name\.trim\(\)/);
  assert.match(rules, /request\.resource\.data\.name\.matches\('\^\[ -~\]\{1,20\}\$'\)/);
  assert.match(rules, /!request\.resource\.data\.name\.matches\('\.\*\[hH\]\[tT\]\[tT\]\[pP\]\[sS\]\.\*'\)/);
});

test("상세 좋아요는 상태별 헤더 컨트롤과 공용 메뉴형 정렬을 사용한다", () => {
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(client, /const detailLike = activeBrowserTab === "public"[\s\S]*data-community-like/);
  assert.match(client, /activeBrowserTab === "mine"[\s\S]*community-detail-like-readonly/);
  assert.doesNotMatch(client, /<footer>[^`]*data-community-like/);
  assert.match(client, /if \(selected && activeBrowserTab === "public" && currentUser\) ensureLikeState/);
  assert.match(client, /community-menu community-sort-menu[\s\S]*data-community-menu-trigger[\s\S]*data-community-sort="newest"[\s\S]*data-community-sort="likes"/);
  assert.doesNotMatch(client, /<select data-community-sort/);
  assert.match(styles, /\.community-sort-menu \.community-menu-popover button\[aria-checked="true"\]/);
  assert.match(client, /await loadRemoteFittings\(true, \{ focusSort: true \}\)/);
  assert.match(client, /function renderBrowser\(\{[^}]*focusSort = false[^}]*\}[\s\S]*if \(focusSort && !elements\.overlay\.hidden\)[^\n]*data-community-sort-trigger/);
  assert.match(client, /openSortMenu[\s\S]*closeAllMenus\(\);[\s\S]*trigger\?\.focus\(\);[\s\S]*return;/);
});

test("비로그인 좋아요 버튼은 어두운 상태로 클릭 안내를 제공한다", () => {
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(client, /likeLoginRequired: "좋아요를 사용하려면 Google 로그인이 필요합니다\."/);
  assert.match(client, /class="community-detail-like[^`]*login-required[^`]*aria-disabled="true"/);
  assert.match(client, /function requestLike\(id\) \{[\s\S]*if \(!currentUser\) \{[\s\S]*setAuthStatus\(copy\.likeLoginRequired\)[\s\S]*toggleLike\(id\)/);
  assert.match(client, /if \(like\) return requestLike\(like\.dataset\.communityLike\)/);
  assert.match(app, /data-community-source-like[^`]*login-required[^`]*aria-disabled="true"/);
  assert.match(styles, /\.community-detail-like\.login-required,[\s\S]*background: #080c0e;[\s\S]*opacity: 1/);
});

test("좋아요 상태 캐시는 좋아요한 핏팅만 보관하고 재조회 레코드에 복원한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /const likedFittingKeys = new Set\(\);/);
  assert.match(client, /liked: likedFittingKeys\.has\(likeKey\)/);
  assert.match(client, /if \(liked\) likedFittingKeys\.add\(key\);[\s\S]*else likedFittingKeys\.delete\(key\)/);
  assert.match(client, /if \(result\.liked\) likedFittingKeys\.add\(key\);[\s\S]*else likedFittingKeys\.delete\(key\)/);
  assert.doesNotMatch(client, /loadedLikeStates/);
});

test("자동 태그와 하드포인트 배지는 DB 필드가 아닌 현재 피팅 계산에서 파생한다", () => {
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  assert.match(app, /function communityFittingTags/);
  assert.match(app, /dps >= 20/);
  assert.match(app, /number\(metrics\?\.heatEfficiency\) >= 80/);
  assert.match(app, /rangeValue > 5 && dps > 0 && rangeValue \/ dps >= 0\.4/);
  assert.match(app, /number\(metrics\?\.sniperAlpha\) >= 20[\s\S]*\/ alphaDamage >= 0\.4/);
  assert.match(app, /number\(metrics\?\.brawlerAlpha\) >= 30[\s\S]*\/ alphaDamage >= 0\.7/);
  assert.match(app, /ghostHeatForSimulationWeapons\(simulationWeapons\) > 0/);
  assert.match(app, /COMMUNITY_SNIPER_WEAPON_IDS = new Set\(\[[\s\S]*1005[\s\S]*1079[\s\S]*1257/);
  assert.match(app, /COMMUNITY_SNIPER_WEAPON_IDS\.has\(number\(item\?\.id\)\)/);
  assert.doesNotMatch(app, /function communitySniperWeapon\(item\) \{\s*[^}]*item\?\.(?:aliases|name|display_name)/);
  assert.match(app, /installedMechItems\("weapon"\)/);
  assert.match(app, /equipmentHardpointType\(item\)/);
  assert.match(client, /ghostHeat: "고스트 힛"[\s\S]*fullArmor: "풀아머"[\s\S]*glassArmor: "유리장갑"/);
  assert.doesNotMatch(client, /transaction\.set\(fittingRef, \{[^}]*tags/s);
});

test("공개 핏팅 클라이언트는 100개를 미리 읽고 페이지당 25개씩 표시한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /const PAGE_SIZE = 25;[\s\S]*const FETCH_LIMIT = 100;[\s\S]*const PAGE_GROUP_SIZE = 5;/);
  assert.match(client, /if \(requestedMechFilterId\) constraints\.push\(firebaseApi\.where\("mechId", "==", requestedMechFilterId\)\)/);
  assert.match(client, /let requestLastDocument = reset \? null : lastDocument/);
  assert.match(client, /constraints\.push\(firebaseApi\.limit\(FETCH_LIMIT \+ 1\)\)/);
  assert.match(client, /const batchDocuments = snapshot\.docs\.slice\(0, FETCH_LIMIT\)[\s\S]*requestHasMore = snapshot\.size > FETCH_LIMIT/);
  assert.match(client, /selectedMechFilterId = trigger\?\.dataset\.communityMechFilter === "all"[\s\S]*bridge\.currentMechId/);
  assert.doesNotMatch(client, /requestPriority|requestGeneral|priorityLastDocument|generalLastDocument/);
  assert.match(client, /generation !== loadRequestGeneration/);
});

test("핏팅 브라우저 검색은 제목만 사용하고 제목 옆 멕 선택 목록을 제공한다", () => {
  const html = read("public/index.html");
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  assert.match(html, /id="community-title"[\s\S]*id="community-mech-filter-trigger"/);
  assert.match(html, /id="community-mech-filter-trigger"[^>]+aria-controls="community-mech-filter-menu"/);
  assert.match(client, /search: "제목 검색"/);
  assert.match(client, /return !query \|\| String\(record\.name \|\| ""\)\.toLocaleLowerCase\(\)\.includes\(query\)/);
  assert.doesNotMatch(client, /record\.analysis\?\.mechName, record\.analysis\?\.chassisName/);
  assert.match(client, /data-community-mech-filter-option/);
  assert.match(client, /community-mech-filter-list mech-list compact-mech-list/);
  assert.match(app, /listFittingMechFilters: communityFittingMechFilterOptions/);
  assert.match(client, /if \(elements\.mechFilterMenu && !elements\.mechFilterMenu\.hidden\) \{[\s\S]*closeMechFilterMenu\(\);[\s\S]*elements\.mechFilterTrigger\.focus\(\);[\s\S]*return;/);
  assert.match(client, /const chassisGroups = mechFilterSections\(\)\.flatMap\(\(section\) => section\.chassis \|\| \[\]\)/);
  assert.match(client, /class="mech-row variant-row community-mech-filter-all/);
  assert.doesNotMatch(client, /class="class-heading"><strong>\$\{escapeHtml\(section\.label\)\}/);
  assert.doesNotMatch(client, /class="badge">\$\{\(chassis\.variants \|\| \[\]\)\.length\}/);
  assert.match(client, /const previousScrollTop = preserveScroll[\s\S]*scrollTop = previousScrollTop/);
  assert.match(client, /renderMechFilterMenu\(\{ preserveScroll: true \}\)/);
});

test("핏팅 관련 드롭다운은 같은 아래 삼각형 화살표를 사용한다", () => {
  const html = read("public/index.html");
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  assert.match(html, /id="community-mech-filter-trigger"[^>]*>전체 ▾<\/button>/);
  assert.match(app, /data-community-menu-trigger[^>]*>[\s\S]*?<span aria-hidden="true">▾<\/span>/);
  assert.match(client, /data-community-sort-trigger[^>]*>[\s\S]*?<span aria-hidden="true">▾<\/span>/);
  assert.doesNotMatch(`${app}\n${client}`, /<span aria-hidden="true">⌄<\/span>/);
});

test("원격 핏팅 로드 실패와 로그인 요구 상태에서도 브라우저 탭과 로컬 기능을 유지한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /publicLoadUnavailable: "현재 공개 핏팅을 불러올 수 없습니다\. 로컬 핏팅은 계속 사용할 수 있습니다\."/);
  assert.match(client, /browserNotice = \{ message: requestedTab === "mine" \? copy\.mineLoadUnavailable : copy\.publicLoadUnavailable, tone: "error" \}/);
  assert.match(client, /function renderLoginRequired\([^)]*\) \{[\s\S]*browserNotice = \{ message: copy\.loginRequired, action: "sign-in" \};[\s\S]*renderBrowser\(/);
  assert.match(client, /if \(!reset && records\.length\) \{[\s\S]*browserFooterNotice = \{ message: requestedTab === "mine" \? copy\.mineLoadUnavailable : copy\.publicLoadUnavailable, tone: "error" \};[\s\S]*renderBrowser\(\)/);
  assert.match(client, /function closeCommunity\(\) \{[\s\S]*loadRequestGeneration \+= 1/);
  assert.match(client, /async function openCommunity\(mode, trigger\) \{[\s\S]*loadRequestGeneration \+= 1/);
  assert.match(client, /elements\.close\.focus\(\);[\s\S]*if \(activeMode === "save"\) renderSaveForm\(\);[\s\S]*else await switchBrowserTab/);
  assert.match(client, /let requestLastDocument = reset \? null : lastDocument/);
  assert.match(client, /lastDocument = requestLastDocument;[\s\S]*remoteHasMore = requestHasMore/);
  assert.match(client, /user && !elements\.overlay\.hidden && activeMode === "browse" && activeBrowserTab === "mine"/);
  assert.doesNotMatch(client, /elements\.content\.innerHTML = `<div class="community-empty">\$\{escapeHtml\(message\)\}<\/div>`/);
});

test("핏팅 브라우저는 확장 크기·25개 페이지·5개 번호 그룹과 단일 상세 스크롤을 사용한다", () => {
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(styles, /\.community-dialog\.browser-mode \{[\s\S]*height: min\(64rem, calc\(100vh - 2rem\)\)/);
  assert.match(styles, /\.community-dialog\.browser-mode \.community-content \{ overflow: hidden; \}/);
  assert.match(styles, /\.community-browser \{[\s\S]*height: 100%;[\s\S]*min-height: 0/);
  assert.match(styles, /@media \(max-width: 900px\) \{[\s\S]*\.community-browser-body \{[\s\S]*grid-template-rows: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*\.community-detail-pane \{ min-height: 0; \}/);
  assert.match(client, /visible\.slice\(\(currentPage - 1\) \* PAGE_SIZE, currentPage \* PAGE_SIZE\)/);
  assert.match(client, /data-community-page/);
  assert.match(client, /const groupStart = Math\.floor\(\(currentPage - 1\) \/ PAGE_GROUP_SIZE\) \* PAGE_GROUP_SIZE \+ 1/);
  assert.match(client, /const groupEnd = Math\.min\(pageCount, groupStart \+ PAGE_GROUP_SIZE - 1\)/);
  assert.doesNotMatch(client, /community-page-ellipsis/);
  assert.match(client, /const rows = \[[\s\S]*copy\.stat\.armor[\s\S]*copy\.stat\.tons[\s\S]*copy\.stat\.engine[\s\S]*copy\.stat\.maxSpeed[\s\S]*copy\.stat\.dps[\s\S]*copy\.stat\.alphaDamage[\s\S]*copy\.stat\.heatEfficiency[\s\S]*copy\.stat\.heatSinks[\s\S]*\];/);
  assert.match(styles, /\.community-detail-pane \{ overflow: hidden; \}/);
  assert.match(styles, /\.community-detail-scroll \{[\s\S]*overflow: auto/);
  assert.match(styles, /\.community-fitting-detail \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.community-fitting-detail > header \.community-card-tags \{[\s\S]*margin-top: 0\.7rem/);
  assert.match(client, /const armorLevel = Math\.max\(1, Math\.min\(5, Math\.ceil\(armorPercent \/ 20\)\)\)/);
  [1, 2, 3, 4, 5].forEach((level) => {
    assert.match(styles, new RegExp(`\\.community-stat-grid \\.community-armor-level-${level} strong`));
  });
  assert.match(client, /statRowsHtml\(analysis\)/);
});

test("설명 없는 v2 Firestore 생성 규칙과 기존 v1 읽기 호환을 유지한다", () => {
  const client = read("public/firebase-community.js");
  const rules = read("admin/firestore.rules");
  assert.match(client, /\[1, 2\]\.includes\(record\.schemaVersion\)/);
  assert.match(rules, /request\.resource\.data\.schemaVersion == 2/);
  assert.match(rules, /request\.query\.limit <= 101/);
  assert.match(client, /const TITLE_LIMIT = 20;/);
  assert.match(rules, /request\.resource\.data\.name\.size\(\) <= 20/);
  assert.doesNotMatch(rules, /request\.resource\.data\.description/);
  assert.doesNotMatch(rules, /'description'/);
});

test("통합 액션 드롭다운과 3초 상태 메시지 제거를 사용한다", () => {
  const app = read("public/app.js");
  const styles = read("public/styles.css");
  const client = read("public/firebase-community.js");
  assert.match(app, /<div class="community-menu" data-community-ui-entry>/);
  assert.match(app, /data-community-menu-trigger/);
  assert.match(app, /class="community-menu-popover" role="menu" hidden/);
  assert.match(app, /community\.actions/);
  assert.match(app, /data-community-open="browse"/);
  assert.match(app, /data-community-open="save"/);
  assert.match(app, /"community\.publish": "저장하기\/공유하기"/);
  assert.match(styles, /\.mechlab-action-panel \.community-menu-trigger \{[\s\S]*justify-content: center;[\s\S]*text-align: center/);
  assert.match(client, /setTimeout\(\(\) => \{[\s\S]*elements\.authStatus\.hidden = true;[\s\S]*\}, 3000\)/);
  assert.match(client, /function closeAllMenus/);
  assert.match(client, /const returnTarget = opener\.closest\("\.community-menu"\)\?\.querySelector\("\[data-community-menu-trigger\]"\) \|\| opener/);
});

test("공개 핏팅 원상복귀는 불러온 코드를 다시 적용하고 목록 표시는 공용 하드포인트 규약을 따른다", () => {
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(app, /tab\.communitySource = \{[\s\S]*loadoutCode: record\.loadoutCode/);
  assert.match(app, /function restoreCommunityFitting\(\) \{[\s\S]*importMwoCode\(source\.loadoutCode, \{ closeDialog: false, updateNavigation: false \}\)/);
  assert.match(client, /\[\["energy", "E"\], \["missile", "M"\], \["ballistic", "B"\], \["ams", "AMS"\]\]/);
  assert.match(client, /class="hardpoint-chip \$\{type\}"/);
  assert.match(client, /community-card-title"><em>\$\{escapeHtml\(analysis\?\.mechName[\s\S]*<strong>\$\{escapeHtml\(record\.name/);
  assert.match(client, /community-detail-title"><span>\$\{escapeHtml\(analysis\.mechName[\s\S]*<h3>\$\{escapeHtml\(record\.name/);
  assert.match(client, /community-card-thumbnail[\s\S]*community-card-weapons[\s\S]*community-card-meta[\s\S]*community-card-hardpoints/);
  assert.match(client, /function likeIconHtml\(\)[\s\S]*community-like-icon/);
  assert.doesNotMatch(client, /community-card-bottom/);
  assert.match(styles, /\.community-card-meta \{[\s\S]*justify-content: flex-start/);
  assert.match(styles, /\.community-card-meta \{[\s\S]*font-size: 0\.82rem/);
  assert.match(styles, /\.community-card-hardpoints \{[\s\S]*justify-content: flex-end/);
  assert.match(styles, /\.community-like-icon \{[\s\S]*fill: currentColor/);
  assert.doesNotMatch(client, /[♡♥]/);
  assert.doesNotMatch(app, /[♡♥]/);
  assert.match(styles, /\.community-card-like-count \{[\s\S]*justify-content: center/);
  assert.match(client, /community-card-like-count" aria-label="\$\{escapeHtml\(`\$\{copy\.like\}: \$\{likeCount\}`\)\}"/);
  assert.match(client, /representativeWeaponsHtml\(analysis\?\.representativeWeapons\)/);
  assert.match(client, /representativeWeaponsHtml\(weapons = \[\]\) \{[\s\S]*weapons\.slice\(0, 4\)/);
  assert.doesNotMatch(client, /representativeWeapons: "대표무기"|representativeWeapons: "Representative weapons"|community-card-weapons-label/);
  assert.doesNotMatch(client, /community-representative-more|more installed|추가 장착 무기|\[\+\]/i);
  assert.match(styles, /\.community-weapon-list li\.energy span \{ color: var\(--yellow\); \}/);
  assert.match(styles, /\.community-weapon-list li\.ams span \{ color: var\(--ams\); \}/);
  assert.match(client, /data-community-like="\$\{escapeHtml\(record\.id\)\}"[\s\S]*aria-pressed="\$\{record\.liked \? "true" : "false"\}"[\s\S]*\$\{likeIconHtml\(\)\}<strong>\$\{likeCount\}<\/strong><\/button>/);
  assert.doesNotMatch(client, /\$\{likeIconHtml\(\)\}<span>\$\{escapeHtml\(likeAction\)\}<\/span>/);
  assert.match(styles, /\.community-detail-like \{[\s\S]*min-width: 5\.25rem;[\s\S]*min-height: 3rem;[\s\S]*padding: 0\.6rem 1rem/);
  assert.match(app, /const likeAction = source\.liked \? t\("community\.unlike"\) : t\("community\.like"\)/);
  assert.match(app, /data-community-source-like="\$\{escapeHtml\(source\.id\)\}"[\s\S]*aria-pressed="\$\{source\.liked \? "true" : "false"\}"[\s\S]*aria-label="\$\{escapeHtml\(source\.canLike \? likeAction : t\("community\.loginToLike"\)\)\}"[\s\S]*>\$\{communityLikeIconHtml\(\)\}<\/button>/);
  assert.match(styles, /\.community-detail-like,[\s\S]*\.public-fitting-source-actions \[data-community-source-like\] \{[\s\S]*justify-content: center/);
  assert.match(app, /function publicFittingHasChanges\(source\) \{[\s\S]*currentCode !== \(source\.baselineLoadoutCode \|\| source\.loadoutCode\)/);
  assert.match(app, /baselineLoadoutCode: MWOCodec\.encode\(currentBuildAsMwoLoadout\(\)\)/);
  assert.match(app, /data-community-restore \$\{canRestore \? "" : "disabled"\}/);
});

test("공개 핏팅 상태는 새 탭에서는 유지하고 같은 탭 교체에서만 해제한다", () => {
  const app = read("public/app.js");
  const styles = read("public/styles.css");
  assert.match(app, /function replaceActiveMechlabTabRecord\(mech, build\) \{[\s\S]*delete tab\.communitySource/);
  assert.doesNotMatch(app, /function setMechlabFitting\(mech, build, mode = "replace"\) \{\s*const previousTab[\s\S]*delete previousTab\.communitySource/);
  assert.match(styles, /\.mechlab-fitting-tab\.public-fitting:not\(\.active\)/);
  assert.match(styles, /\.mechlab-fitting-tab\.public-fitting\.active/);
});

test("빌드 저장 대화상자는 소형 모드와 20자 제목 제한을 사용한다", () => {
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(client, /dialog\?\.classList\.toggle\("save-mode", activeMode === "save"\)/);
  assert.match(styles, /\.community-dialog\.save-mode \{[\s\S]*width: min\(34rem, 100%\);[\s\S]*max-height: min\(32rem, calc\(100vh - 3rem\)\)/);
  assert.match(client, /maxlength="\$\{TITLE_LIMIT\}"/);
});

test("내 업로드 삭제는 비공개 좋아요 정리 요청과 필요한 복합 인덱스를 함께 사용한다", () => {
  const client = read("public/firebase-community.js");
  const indexes = JSON.parse(read("firestore.indexes.json"));
  assert.match(client, /doc\(db, "deletionRequests", record\.id\)/);
  assert.match(client, /transaction\.set\(deletionRequestRef/);
  const signatures = indexes.indexes.map(({ fields }) => fields.map(({ fieldPath, order }) => `${fieldPath}:${order}`).join(","));
  assert.ok(signatures.includes("ownerUid:ASCENDING,mechId:ASCENDING,createdAt:DESCENDING"));
  assert.ok(signatures.includes("ownerUid:ASCENDING,mechId:ASCENDING,likeCount:DESCENDING"));
});

test("Firestore의 로드아웃 문자열 형태는 MWO 코덱 출력과 일치한다", () => {
  const codec = require("../public/mwo-codec.js");
  const components = Object.fromEntries(codec.COMPONENTS.map(({ name }) => [name, {
    armor: 0,
    omnipod: null,
    itemIds: [],
  }]));
  const code = codec.encode({
    chassisId: 1,
    isOmni: false,
    actuatorState: 0,
    upgrades: {},
    components,
    rearArmor: {},
  });
  const storedCodePattern = /^A[0-o|]+p[0-o|]+q[0-o|]+r[0-o|]+s[0-o|]+t[0-o|]+u[0-o|]+v[0-o|]+w[0-o]+$/;
  assert.ok(code.length >= 36);
  assert.match(code, storedCodePattern);
  assert.equal(codec.decode(code).chassisId, 1);
});
