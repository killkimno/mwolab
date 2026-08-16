# 장비 Modifier 처리 규칙

이 문서는 장착 장비의 `weapon_stat_filters`를 무기 최종 수치에 적용하는 공통 규칙을 정의한다.
무기 계산의 상위 규칙은 `무기 관련 에이전트.md`, 현재 코드 경로는
`wiki/mwolab-implementation-wiki.html`을 따른다.

## 1. 데이터 추적

- 멕 이름이나 장비 표시명을 기준으로 효과를 하드코딩하지 않는다.
- 현재 멕의 유효 정의에서 고정 장비와 사용자가 장착한 모듈을 수집한다.
- 장비 ID로 `equipment.json`의 원본 장비를 찾고 `weapon_stat_filters`를 읽는다.
- 무기 원본 `name`과 필터의 `compatible_weapons`를 정규화한 뒤 정확히 일치시킨다.
- 표시명, alias 또는 무기 계열만으로 필터 대상을 확장하지 않는다.
- 하나의 무기가 여러 필터에 일치하면 일치한 필터를 모두 적용한다.

```text
effective mech definition
→ fixed / installed module
→ equipment item
→ weapon_stat_filters (원본 배열 순서)
→ compatible_weapons exact match
→ WeaponStats (원본 배열 순서)
```

## 2. 연산

- `operation: "+"`는 현재 값에 operand를 더한다.
- `operation: "*"`는 현재 값에 operand를 곱한다.
- 원본에 없는 숫자 필드에 `+`가 처음 적용되면 0을 기준으로 한다.
- 필터 배열 순서와 각 필터의 `weapon_stats` 배열 순서를 보존한다.
- 원본 장비 JSON과 무기 객체는 변경하지 않고 브라우저 메모리의 파생 스냅샷만 만든다.
- 필드 의미나 기본값을 장비명·접미사·유사 장비로 추정하지 않는다.

## 3. Modified Ballistic Loader

- BANE-L 이름이 아니라 유효 정의의 고정 장비 ID `9031`을 통해 찾는다.
- ID 9031의 모든 정확 일치 필터를 적용한다.
- 현재 수치 변환 스냅샷이 처리하는 필드는 다음과 같다.
  - `damage`
  - `numFiring`
  - `numPerShot`
  - `spread`
  - `volleydelay`
- 공통 Projectile 필터의 `speed`, `critChanceIncrease`와 Range 필터는 기존 Target Computer collector가 처리한다. 수치 변환 스냅샷에서 다시 적용하지 않는다.
- 9031의 크리티컬 가산은 `-1` 값에도 일반 `+` 연산으로 적용한다. 일반 Target Computer의 기존 `-1 → X` 규칙은 유지한다.
- C-UAC의 Ultra, Jam 확률과 Jam 지속시간 필드는 Loader가 변경하지 않는다.

### 결과 예시

- HAG: `spread +0.5`, `numPerShot +3`, `damage ×0.34`, `volleydelay ×0.7`
- Clan Gauss: `spread +0.25`, `numPerShot +4`, `damage ×0.25`
- C-AC/C-UAC: 필터별 `numFiring` 감소 후 `damage` 배율 적용

## 4. 계산 소비 경로

같은 유효 스냅샷을 다음 경로가 함께 사용해야 한다.

- 발사당 직격·스플래시·총 피해
- projectile 및 pellet 수
- 탄약 1회 소비량
- 발사 이벤트 수, 발사 간격, 예상 쿨다운
- spread와 Artemis·spread 쿼크의 후속 계산
- 무기 툴팁의 DAMAGE, SHOTS, SHOT INTERVAL, SPREAD, DPS, DPH
- 빌드 Alpha Damage와 탄약 요약
- DPS 시뮬레이션의 피해, shot count, shot delay, firing time

전역 장비 정보 표처럼 현재 멕과 무관한 화면은 빈 모듈 목록을 전달해 원본 무기 수치를 유지한다.

## 5. 쿼크 및 다른 장비와의 순서

- 장비 Modifier와 배리언트·옴니포드·세트·스킬 쿼크는 별도 계층이다.
- 먼저 장비 Modifier로 무기 기본 발사 구조를 만든 뒤, 해당 최종 스탯에 기존 쿼크 공식을 적용한다.
- BANE-L의 Gauss/HAG cooldown, 탄약 감소 등 기체 쿼크를 9031 필터에 섞지 않는다.
- Target Computer 공통 speed·critical·range 값은 한 번만 적용한다.
- Artemis와 Railgun Capacitor 같은 별도 장비 공식도 자신의 기존 계산 경로에서 한 번만 적용한다.

## 6. 표시

- 무기 툴팁의 `적용 효과`에는 장비 표시명을 출처 제목으로 사용한다.
- 기능 모드 다음에 실제 필터의 연산값을 원본 순서대로 표시한다.
- 예: `PELLETS / SHOT +3`, `DAMAGE / PROJECTILE ×0.34`, `SHOT INTERVAL ×0.7`.
- 장비 자체 툴팁에도 호환 무기와 필터 연산값을 데이터에서 읽어 표시한다.
- 표시값을 무기명에서 추론하거나 최종값의 차이로 역산하지 않는다.

## 7. 다른 특수 장비 확장

- ID `9032` Modified Missile Loader는 현재 `STREAM FIRE` 설명만 제공하며 수치 Modifier 계산에는 넣지 않는다.
- NAGA-AMAROK 등 다른 장비를 계산에 연결할 때는 해당 장비의 명시 필드와 공식이 확정된 뒤 지원 ID와 필드를 추가한다.
- 새 장비를 추가할 때는 정확 매칭, 여러 필터 중첩, 원본 순서, 비대상 장비 불변, 빌드·툴팁·시뮬레이션 일치를 함께 테스트한다.

