const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("공개 핏팅 UI는 기능을 보존한 채 임시 스위치로 숨긴다", () => {
  const html = read("public/index.html");
  const app = read("public/app.js");
  const styles = read("public/styles.css");
  assert.match(html, /<html[^>]+data-community-ui="hidden"/);
  assert.ok(html.indexOf('id="community-login"') < html.indexOf('id="donate-link"'));
  assert.match(html, /<div id="community-login"[^>]+data-community-ui-entry/);
  assert.match(html, /id="community-auth-status"[^>]+role="status"/);
  assert.match(app, /class="community-menu" data-community-ui-entry/);
  assert.ok(app.indexOf('data-community-menu-trigger') < app.indexOf('id="open-simulation"'));
  assert.match(styles, /html\[data-community-ui="hidden"\] \[data-community-ui-entry\][^{]*\{[^}]*display:\s*none\s*!important;/s);
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

test("Google Identity Services ID 토큰을 Firebase credential로 교환한다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /https:\/\/accounts\.google\.com\/gsi\/client/);
  assert.match(client, /GoogleAuthProvider\.credential\(response\.credential\)/);
  assert.match(client, /signInWithCredential\(auth, credential\)/);
  assert.match(client, /googleIdentity\.renderButton/);
  assert.match(client, /googleIdentity\?\.disableAutoSelect\(\)/);
  assert.doesNotMatch(client, /signInWithPopup/);
});

test("Firestore 규칙 거부는 사용자에게 배포 확인 안내와 오류 코드를 보여 준다", () => {
  const client = read("public/firebase-community.js");
  assert.match(client, /"firestore\/permission-denied": copy\.firestorePermissionDenied/);
  assert.match(client, /Firestore > 규칙에서 프로젝트 규칙을 배포했는지 확인하세요/);
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
  assert.match(privacy, /publicFittings|공개 핏팅/);
  assert.match(privacy, /killkimno@gmail\.com/);
  assert.match(privacy, /Cloudflare Web Analytics/);
  assert.match(privacy, /실제 계정 정보는 공개 핏팅에 저장하거나 표시하지 않습니다/);
  assert.match(privacy, /로그인 버튼이나 공개 핏팅에 Google 표시 이름을 표시하지 않습니다/);
  assert.match(privacy, /does not expose the publisher's Google name, email address, profile photo, or user identifier/);
});

test("목록 제한과 Firestore list 규칙은 같은 최대 20개를 사용한다", () => {
  const client = read("public/firebase-community.js");
  const rules = read("firestore.rules");
  assert.match(client, /const LIST_LIMIT = 20;/);
  assert.match(rules, /request\.query\.limit <= 20/);
});

test("Firestore 규칙은 Google 게시와 원자적 소유권·좋아요 변경만 허용한다", () => {
  const rules = read("firestore.rules");
  assert.match(rules, /sign_in_provider == 'google\.com'/);
  assert.match(rules, /getAfter\(ownerPath\(fittingId\)\)\.data\.uid == request\.auth\.uid/);
  assert.match(rules, /getAfter\(usagePath\(request\.auth\.uid\)\)\.data\.publishCount <= 5/);
  assert.match(rules, /lastFittingId == fittingId/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['likeCount'\]\)/);
  assert.match(rules, /existsAfter\(likePath\(fittingId, request\.auth\.uid\)\)/);
  assert.match(rules, /allow read, write: if false;/);
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
