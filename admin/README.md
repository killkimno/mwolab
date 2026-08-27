# MwoLab 로컬 관리자

이 폴더의 관리자 서버와 로컬 의존성은 루트 `.gitignore`에서 Git 추적을 제외한다.
서비스 계정 키를 만들거나 이 폴더에 저장하지 않는다.

비밀정보를 포함하지 않는 `firestore.rules`, `firestore-rules.test.mjs`, `README.md`는
운영 배포 소스와 검증 기준이 Git 이력에서 어긋나지 않도록 선택적으로 추적한다.
루트 `firebase.json`은 Firebase CLI가 추적되는 `admin/firestore.rules`를 배포하도록
해당 경로를 참조한다.

## 최초 준비

1. Google Cloud CLI에서 프로젝트 소유자 계정으로 로그인한다.

   ```powershell
   gcloud auth application-default login
   gcloud auth application-default set-quota-project mwolab-2e145
   ```

2. 이 폴더에서 의존성을 설치한다.

   ```powershell
   npm install
   ```

## 실행

`start-admin.bat`을 더블클릭한다. 명령줄에서 실행하려면 다음과 같이 입력한다.

```bat
start-admin.bat
```

브라우저에서 `http://127.0.0.1:8787`을 연다. 서버는 외부 인터페이스가 아닌
`127.0.0.1`에만 바인딩된다. 프로젝트 ID를 바꿔야 할 때만
`MWOLAB_FIREBASE_PROJECT_ID` 환경 변수를 사용한다.

## Firestore Rules 검사

```powershell
npm test
```

## 공개 핏팅 게시 수 카운터

사용자당 공개 핏팅 100개 제한은 `publisherUsage/{uid}` 카운터를 사용한다.
기존 `fittings`가 있는 프로젝트에서는 읽기 스냅샷과 카운터 기록 사이의 게시·삭제를 막아야 한다.
다음 순서를 바꾸지 않는다.

1. 실행 중인 로컬 관리자 서버와 다른 Admin SDK 작업을 모두 종료한다.
2. 공개 조회는 유지하고 모든 클라이언트 쓰기만 잠그는 임시 Rules를 배포한다.

   ```powershell
   pnpm run deploy-maintenance-rules
   ```

3. 관리자 인증 환경에서 기존 `fittings.ownerUid`를 집계하고 카운터를 검증한다.

   ```powershell
   pnpm run sync-usage
   ```

4. `sync-usage`가 오류 없이 검증까지 마친 경우에만 운영 Rules를 배포한다.

   ```powershell
   pnpm run deploy-rules
   ```

`sync-usage`는 사용자별 카운터를 만들고 게시물이 없는 오래된 카운터를 제거한 뒤,
현재 핏팅 수와 모든 카운터가 정확히 일치하는지 다시 읽어 검증한다. 실패하면 임시 Rules를 유지하고
원인을 확인한 뒤 `sync-usage`를 다시 실행한다. 운영 Rules를 백필보다 먼저 배포하면 기존 게시물을
카운트하지 않은 `0 → 1` 카운터가 만들어질 수 있으므로 100개 제한을 우회할 수 있다.

## 사용자 닉네임

- `users/{uid}`에는 선택 닉네임, 소문자 중복 키, 최초 안내 여부와 생성·수정 시각만 저장한다.
- `nicknames/{nicknameKey}`에는 닉네임 예약 소유 UID와 생성 시각만 저장한다.
- 닉네임 설정은 두 문서를 같은 Firestore 트랜잭션에서 기록하며 Rules의 상호 `getAfter()` 검증을 통과해야 한다.
- 닉네임은 앞뒤 공백을 제외한 2~20자의 영문과 숫자만 허용하며 대소문자를 구분하지 않고 중복 처리한다.
- 닉네임 변경은 새 예약 생성, 프로필 변경, 기존 예약 삭제를 같은 트랜잭션에서 처리한다. 예약 문서 수정과 단독 삭제는 허용하지 않는다. 소유권 검사는 계속 Firebase Auth UID를 사용한다.
- 공개 작성자 조회를 위해 `users/{uid}` 단건 읽기는 공개하지만 컬렉션 목록 읽기는 막는다. 이 프로필에는 Google 이름, 이메일, 사진이나 다른 민감정보를 추가하지 않는다.

## 삭제 범위

- `fittings/{fittingId}`
- `fittings/{fittingId}/likes/*`
- `publisherUsage/{ownerUid}` 카운터 감소

웹에서 작성자가 직접 삭제하면 `deletionRequests/{fittingId}`가 함께 생성된다.
관리자 목록을 불러올 때 이 요청을 먼저 처리해 남은 `likes/*`와 정리 요청을 삭제한다.
관리자 화면에서 직접 삭제하는 경우에도 정리 요청을 먼저 남기고 좋아요 정리가 성공한 뒤 제거한다.
정리가 일시 실패하면 다음 관리자 목록 조회가 남은 요청을 다시 처리한다.

관리자 페이지에는 사용자 이메일이나 Google 프로필을 표시하지 않는다.
