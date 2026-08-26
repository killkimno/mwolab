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
  assert.match(privacy, /로그인 버튼이나 공개 핏팅에 Google 표시 이름을 표시하지 않습니다/);
  assert.match(privacy, /ownership UID/);
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
  assert.match(rules, /function publisherUsagePath\(uid\)/);
  assert.match(rules, /usage\.count <= 100/);
  assert.match(rules, /validUsageCreateForFitting\(fittingId\)/);
  assert.match(rules, /validUsageDeleteForFitting\(fittingId\)/);
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

test("핏팅 제목의 https를 차단하고 내 업로드에서는 좋아요 버튼을 숨기며 공용 메뉴형 정렬을 사용한다", () => {
  const client = read("public/firebase-community.js");
  const rules = read("admin/firestore.rules");
  const styles = read("public/styles.css");
  assert.match(client, /title\.toLocaleLowerCase\(\)\.includes\("https"\)/);
  assert.match(client, /name\.toLocaleLowerCase\(\)\.includes\("https"\)/);
  assert.match(client, /titleHttpsBlocked: "제목에 https를 사용할 수 없습니다\."/);
  assert.match(rules, /!request\.resource\.data\.name\.matches\('\.\*\[hH\]\[tT\]\[tT\]\[pP\]\[sS\]\.\*'\)/);
  assert.match(client, /<footer>\$\{activeBrowserTab === "public" \? `<button[^`]+data-community-like/);
  assert.match(client, /if \(selected && activeBrowserTab === "public" && currentUser\) ensureLikeState/);
  assert.match(client, /community-menu community-sort-menu[\s\S]*data-community-menu-trigger[\s\S]*data-community-sort="newest"[\s\S]*data-community-sort="likes"/);
  assert.doesNotMatch(client, /<select data-community-sort/);
  assert.match(styles, /\.community-sort-menu \.community-menu-popover button\[aria-checked="true"\]/);
  assert.match(client, /await loadRemoteFittings\(true, \{ focusSort: true \}\)/);
  assert.match(client, /function renderBrowser\(\{[^}]*focusSort = false[^}]*\}[\s\S]*if \(focusSort && !elements\.overlay\.hidden\)[^\n]*data-community-sort-trigger/);
  assert.match(client, /openSortMenu[\s\S]*closeAllMenus\(\);[\s\S]*trigger\?\.focus\(\);[\s\S]*return;/);
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
  assert.match(app, /\["erppc", "erlaser", "gaussrifle"\]/);
  assert.match(app, /String\(item\?\.aliases \|\| ""\)[\s\S]*\.split\(","\)[\s\S]*\.map\(normalizeLookupKey\)/);
  assert.match(app, /"clanhyperassaultgaussrifle20"[\s\S]*"clanhyperassaultgaussrifle30"[\s\S]*"clanhyperassaultgaussrifle40"/);
  assert.match(app, /installedMechItems\("weapon"\)/);
  assert.match(app, /equipmentHardpointType\(item\)/);
  assert.match(client, /ghostHeat: "고스트 힛"[\s\S]*fullArmor: "풀아머"[\s\S]*glassArmor: "유리장갑"/);
  assert.doesNotMatch(client, /transaction\.set\(fittingRef, \{[^}]*tags/s);
});

test("공개 핏팅 클라이언트는 전체 또는 선택 멕 하나를 페이지당 10개씩 조회한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /const LIST_LIMIT = 10;/);
  assert.match(client, /if \(requestedMechFilterId\) constraints\.push\(firebaseApi\.where\("mechId", "==", requestedMechFilterId\)\)/);
  assert.match(client, /let requestLastDocument = reset \? null : lastDocument/);
  assert.match(client, /constraints\.push\(firebaseApi\.limit\(LIST_LIMIT\)\)/);
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

test("핏팅 브라우저는 고정 크기·10개 페이지·단일 상세 스크롤과 여덟 개 상세 수치를 사용한다", () => {
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(styles, /\.community-dialog\.browser-mode \{[\s\S]*height: min\(54rem, calc\(100vh - 3rem\)\)/);
  assert.match(styles, /\.community-dialog\.browser-mode \.community-content \{ overflow: hidden; \}/);
  assert.match(styles, /\.community-browser \{[\s\S]*height: 100%;[\s\S]*min-height: 0/);
  assert.match(styles, /@media \(max-width: 900px\) \{[\s\S]*\.community-browser-body \{[\s\S]*grid-template-rows: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*\.community-detail-pane \{ min-height: 0; \}/);
  assert.match(client, /visible\.slice\(\(currentPage - 1\) \* LIST_LIMIT, currentPage \* LIST_LIMIT\)/);
  assert.match(client, /data-community-page/);
  assert.match(client, /pageCount <= 7/);
  assert.match(client, /community-page-ellipsis/);
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
  assert.match(rules, /request\.query\.limit <= 10/);
  assert.match(client, /const TITLE_LIMIT = 20;/);
  assert.match(rules, /request\.resource\.data\.name\.size\(\) <= 20/);
  assert.doesNotMatch(rules, /request\.resource\.data\.description/);
  assert.doesNotMatch(rules, /'description'/);
});

test("통합 액션 드롭다운과 3초 상태 메시지 제거를 사용한다", () => {
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  assert.match(app, /<div class="community-menu" data-community-ui-entry>/);
  assert.match(app, /data-community-menu-trigger/);
  assert.match(app, /class="community-menu-popover" role="menu" hidden/);
  assert.match(app, /community\.actions/);
  assert.match(app, /data-community-open="browse"/);
  assert.match(app, /data-community-open="save"/);
  assert.match(client, /setTimeout\(\(\) => \{[\s\S]*elements\.authStatus\.hidden = true;[\s\S]*\}, 3000\)/);
  assert.match(client, /function closeAllMenus/);
  assert.match(client, /const returnTarget = opener\.closest\("\.community-menu"\)\?\.querySelector\("\[data-community-menu-trigger\]"\) \|\| opener/);
});

test("공개 핏팅 원상복귀는 불러온 코드를 다시 적용하고 목록 표시는 공용 하드포인트 규약을 따른다", () => {
  const app = read("public/app.js");
  const client = read("public/firebase-community.js");
  const styles = read("public/styles.css");
  assert.match(app, /tab\.communitySource = \{[\s\S]*loadoutCode: record\.loadoutCode/);
  assert.match(app, /function restoreCommunityFitting\(\) \{[\s\S]*importMwoCode\(source\.loadoutCode, \{ closeDialog: false \}\)/);
  assert.match(client, /\[\["energy", "E"\], \["missile", "M"\], \["ballistic", "B"\], \["ams", "AMS"\]\]/);
  assert.match(client, /class="hardpoint-chip \$\{type\}"/);
  assert.match(client, /community-card-title"><em>\$\{escapeHtml\(analysis\?\.mechName[\s\S]*<strong>\$\{escapeHtml\(record\.name/);
  assert.match(client, /community-detail-title"><span>\$\{escapeHtml\(analysis\.mechName[\s\S]*<h3>\$\{escapeHtml\(record\.name/);
  assert.match(client, /community-card-meta[\s\S]*community-card-hardpoints/);
  assert.match(client, /function likeIconHtml\(\)[\s\S]*community-like-icon/);
  assert.doesNotMatch(client, /community-card-bottom/);
  assert.match(styles, /\.community-card-meta \{[\s\S]*justify-content: flex-start/);
  assert.match(styles, /\.community-card-meta \{[\s\S]*font-size: 0\.82rem/);
  assert.match(styles, /\.community-card-hardpoints \{[\s\S]*justify-content: flex-end/);
  assert.match(styles, /\.community-like-icon \{[\s\S]*fill: currentColor/);
  assert.doesNotMatch(client, /[♡♥]/);
  assert.doesNotMatch(app, /[♡♥]/);
  assert.doesNotMatch(styles, /\.community-card-like-count/);
  assert.match(styles, /\.community-weapon-list li\.energy span \{ color: var\(--yellow\); \}/);
  assert.match(styles, /\.community-weapon-list li\.ams span \{ color: var\(--ams\); \}/);
  assert.match(client, /data-community-like="\$\{escapeHtml\(record\.id\)\}"[\s\S]*aria-label="\$\{escapeHtml\(copy\.like\)\}"[\s\S]*>\$\{likeIconHtml\(\)\}<\/button>/);
  assert.match(app, /data-community-source-like="\$\{escapeHtml\(source\.id\)\}"[\s\S]*aria-label="\$\{escapeHtml\(t\("community\.like"\)\)\}"[\s\S]*>\$\{communityLikeIconHtml\(\)\}<\/button>/);
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
