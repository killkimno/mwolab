# JSON 추출 지침

## 생성 데이터

- 의도적인 게임 데이터 갱신에는 `tools/extract_mwo_data.py`를 사용한다. 생성되는 브라우저 데이터는 `public/data/index.json`, `mechs.json`, `equipment.json`, `loadouts.json`, `omnipods.json`, `shake_damping_mechs.json`, `skills.json`이다.
- 전체 추출은 `Libs/MechPilotTalents/MechSkillTreeNodes.xml`과 `MechSkillTreeNodesDisplay.xml`에서 `skills.json`을 갱신하고 다른 생성 데이터와 함께 배포해야 한다. `index.json`의 `skill_nodes` 개수가 추출된 모든 스킬 분류의 전체 노드 수와 일치하는지 검증한다.
- 로컬 MWO 설치 경로는 현재 `F:\Game\Steam\steamapps\common\MechWarrior Online`이다. 추출기는 `Game\GameData.pak`, `Game\Localized\English_xml.pak`, `Game\mechs\*.pak`의 섀시 아카이브를 읽는다.
- 전체 추출 명령은 `python tools/extract_mwo_data.py --game-dir "F:\Game\Steam\steamapps\common\MechWarrior Online" --out public\data`이다.
- 전체 추출은 현재 설치된 게임에서 모든 생성 데이터를 갱신하므로 무관한 밸런스 데이터나 숫자 형식 변경을 포함할 수 있다. 기존 장비와 로드아웃 데이터를 유지하면서 하드포인트만 갱신하려면 `python tools/extract_mwo_data.py --game-dir "F:\Game\Steam\steamapps\common\MechWarrior Online" --out public\data --hardpoints-only`를 사용한다.

## 누락 옴니포드 해결

- 의도적인 전체 추출 중 옴니포드를 가져야 하지만 원본 `OmniPod` 값이 없거나 `NULL`인 기본 로드아웃 컴포넌트를 탐지한다. 후방 장갑 의사 컴포넌트는 제외하고 해결되지 않은 모든 멕 배리언트와 컴포넌트를 추출 결과에 나열한다.
- 누락 바디는 다음 고정 순서로 해결한다: 정확히 같은 이름의 세트, 저장된 사용자 확정 숫자·`normal_body`·`shared_body`, 이름 끝 문자를 제거해 찾은 일반 멕과 그 정확한 매칭 또는 저장된 해결 기록, 여전히 해결되지 않은 일반 멕의 비일반 후보 보고, 두 미확정 보고 구역으로의 완전한 분류. 앞선 결정적 해결 단계를 건너뛰지 않는다.
- 누락 옴니포드는 먼저 멕 또는 기본 로드아웃 이름을 정규화하고, 정규화한 `set` 이름이 정확히 같으면서 `component`가 누락 컴포넌트와 일치하는 옴니포드를 찾는다. 정확히 하나가 일치하면 현재 ID를 자동 할당하고 미확정 보고에서 제외한다. 같은 이름의 정확한 매칭은 휴리스틱이 아니라 결정적인 원본 데이터다.
- 누락 옴니포드를 사용자에게 묻기 전에 `tools/omnipod_null_resolutions.json`을 확인한다. 해당 멕 배리언트와 컴포넌트에 사용자 확정 원본 멕 또는 옴니포드 세트가 기록되어 있으면 새로 추출한 `omnipods.json`에서 현재 ID를 찾아 자동 적용하며 다시 질문하지 않는다.
- `definition.stats.VariantType`이 없거나 빈 멕은 일반 배리언트, 값이 있는 멕은 특수 배리언트로 취급한다. 일반 옴니멕에는 완전한 동일 이름 옴니포드 세트가 있어야 한다.
- 사용자가 일반 배리언트가 숫자 옴니포드 없이 자체 섀시 바디를 사용한다고 확인하면 `normal_body` 해결로 저장한다. 로드아웃 옴니포드 값은 `NULL`로 유지하되 해결된 일반 바디 컴포넌트로 보고한다. 모든 일반 배리언트의 `NULL`을 자동으로 이렇게 분류하지 않는다.
- 사용자가 컴포넌트가 다른 옴니포드와 바디를 공유하고 별도 숫자 옴니포드 기록이 없다고 확인하면 확정된 바디 세트 라벨과 `resolution_mode: shared_body`를 저장한다. 로드아웃 값은 `NULL`로 유지하고 해결된 것으로 보고하며, 그 라벨이 멕 또는 옴니포드 레코드로 존재할 필요는 없다. 명시적인 사용자 확인 없이 공유 바디를 추론하지 않는다.
- 정확한 같은 이름 매칭이나 저장된 해결 기록이 없으면 원본 멕의 타입 값과 관계없이 정규화된 이름 끝에서 문자를 하나씩 제거하며 다시 시도한다. 짧아진 이름이 일반 멕을 가리키고 그 `set`과 컴포넌트에 정확히 하나의 옴니포드가 있을 때까지 반복한다. 처음 일치한 항목을 자동 할당하고 일치한 일반 멕과 포드 ID를 보고한다. 예: `sns-primes`는 `sns-prime`을 통해 해결한다.
- 짧아진 이름이 사용자 확정 숫자 컴포넌트 매핑을 가진 일반 멕을 가리키면, 짧아진 멕과 파생 멕의 컴포넌트 정의가 같을 때 확정 매핑을 자동 상속한다. 현재 옴니포드 데이터에서 기록된 세트를 다시 찾고 상속을 별도로 보고하며 다시 질문하지 않는다.
- 짧아진 이름이 대응 컴포넌트에도 숫자 옴니포드가 없는 일반 멕을 가리키면, 그 일반 컴포넌트에 사용자 확정 `normal_body` 해결이 있을 때만 해당 바디를 사용한다. 파생 멕과 일반 멕의 컴포넌트 정의가 같은 경우에만 파생 로드아웃 값을 `NULL`로 유지하고 허용한다. 다르면 미확정으로 유지하거나 차단 데이터 오류로 보고한다. 예: `hbr-fc`는 확정된 `hbr-f` 중앙 몸통 바디를 사용한다.
- 더 늦게 나온 일반 배리언트보다 비일반 배리언트가 원래 옴니포드 세트를 소유할 수 있다. 일반 배리언트가 미확정이면 완전한 일반 배리언트 이름으로 시작하는 더 긴 동일 섀시 비일반 멕 이름 중 해당 컴포넌트 포드가 정확히 하나인 항목을 찾는다. 후보 멕 이름, 멕 ID, `VariantType`, 옴니포드 세트, 옴니포드 ID, 컴포넌트 정의 일치 여부, 이미 후보 세트를 사용하는 기본 컴포넌트를 가능한 후보로 별도 보고한다.
- 가능한 비일반 후보는 증거일 뿐이다. 사용자가 적용할 후보를 명시적으로 선택하기 전에는 할당하거나 미확정 목록에서 제거하거나 `tools/omnipod_null_resolutions.json`에 저장하지 않는다.
- 모든 미확정 옴니포드 보고를 후보가 하나 이상인 `미확정 - 예상 후보`와 후보가 없는 `미확정 - 예상 후보 없음`으로 완전히 나눈다. 비어 있어도 두 제목을 항상 표시하고, 모든 미확정 멕·컴포넌트를 정확히 한 구역에 넣는다. 각 후보는 해당 미확정 항목 아래에 배치한다.
- 이름 끝 문자를 모두 제거한 뒤에도 유일한 일반 멕 옴니포드 매칭이 없으면 미확정 멕 배리언트와 컴포넌트를 보고하고 가능한 비일반 후보를 별도로 보여준 후, 사용할 멕 배리언트 또는 옴니포드 세트를 사용자에게 묻는다. 다수결, 로드아웃 우세, 알파벳순, 원본 데이터 근거 없는 출시 순서 추정 등의 휴리스틱으로 선택하지 않는다.
- 사용자가 확정한 모든 누락 옴니포드 답변을 멕 배리언트와 컴포넌트 기준으로 `tools/omnipod_null_resolutions.json`에 저장하여 이후 추출에서 재사용한다. 감사를 위해 원본 멕, 옴니포드 세트, 마지막 확정 옴니포드 ID를 기록하되, 오래됐을 수 있는 숫자 ID를 그대로 믿지 않고 현재 세트와 컴포넌트로 해결한다.
- `tools/omnipod_null_resolutions.json`은 생성 브라우저 데이터가 아니라 의도적인 추출 오버라이드 데이터다. 추출 중 기존 항목을 보존하고 새 확정 항목을 추출 변경 범위에 포함한다. 기록된 세트와 컴포넌트가 현재 옴니포드에서 정확히 하나로 해결되지 않으면 조용히 대체하지 말고 오류를 보고한다.

## Artemis 데이터

- Artemis 데이터는 `GameData.pak`의 `Libs/Items/Weapons/Weapons.xml`과 `Libs/Items/Modules/Ammo.xml`에서 가져온다. `equipment.json`에 무기의 `stats.ammoType`, `stats.artemisAmmoType`, `stats.alwaysHasArtemis`와 탄약의 `stats.type`, `stats.numShots` 원본 속성을 보존한다. 파생 매핑이나 하드코딩된 탄약 수로 대체하지 않는다.
- Artemis 적용 가능 일반 무기와 Artemis 무기는 별도 장비 레코드 및 ID다. 내부 이름은 `<WeaponName>`과 `<WeaponName>_Artemis`로 짝을 이룬다. 1톤 탄약은 `<AmmoName>`과 `<AmmoName>Artemis`, 반톤 탄약은 `<AmmoName>Half`와 `<AmmoName>ArtemisHalf`로 짝을 이룬다. Artemis는 반드시 `Half` 앞에 넣고 뒤에 붙이지 않는다.
- Artemis 업그레이드를 적용하거나 제거할 때 설치된 무기와 탄약 ID를 양방향으로 교체한다. 표시 라벨만 변경해서는 안 된다. 일반 → Artemis → 일반 왕복 후 원본 ID가 복원되어야 한다.
- 앱의 탄약 필터, 피팅 요약 및 탄약 계산은 정규화된 탄약 `stats.type`을 무기의 활성 탄약 타입과 비교한다. Artemis 적용 가능 무기에 업그레이드가 장착됐으면 `stats.artemisAmmoType`, 아니면 `stats.ammoType`을 사용한다. `stats.alwaysHasArtemis` 무기는 선택적 업그레이드 변환 대상이 아니며 원본에 선언된 탄약 타입을 사용한다.
- 탄약 수량은 1톤과 반톤 각각을 포함하여 장착 탄약 레코드의 `stats.numShots`에서 가져온다. Artemis 탄약 수가 항상 일반 탄약과 다르다고 가정하지 않는다. 정규화된 활성 탄약 타입이 같은 무기는 탄약 풀을 공유한다. 동시에 발사 가능한 일제 사격 횟수는 일치하는 탄약 상자를 합산하고 결합된 `ammoPerShot`으로 나누어 계산한다.
- Artemis 회귀 검사는 이너 스피어 및 클랜 LRM·SRM, 1톤과 반톤 탄약, 양방향 업그레이드, 장비 목록 필터, 피팅 정보 패널 총계를 포함해야 한다. 추출 후 `ammoType` 또는 `artemisAmmoType`이 참조하는 모든 일반·Artemis 무기 및 탄약 상대 레코드가 존재하는지 검증한다. 누락된 짝은 표시명 대체로 조용히 처리하지 말고 추출 또는 원본 데이터 문제로 취급한다.

## 하드포인트 데이터

- 일반 및 옴니포드 무기 용량은 각 섀시 아카이브의 `*-hardpoints.xml`에서 가져온다. MDF 또는 옴니포드의 하드포인트 `ID`를 `<Hardpoint id="...">`와 연결하고 직접 자식 `<WeaponSlot>`의 개수를 `weapon_slots`에 저장한다.
- 선행 0이 있는 숫자 ID도 같게 비교되도록 하드포인트 ID를 정규화한다. 예를 들어 XML ID `"02"`는 MDF 또는 옴니포드 ID `2`와 일치해야 하며 원시 문자열을 그대로 비교하지 않는다.
- MDF 하드포인트의 `Slots` 속성은 장착 가능한 무기 개수가 아니다. 하드포인트 용량으로 사용하지 않는다. 예를 들어 MDF `Slots="10"`이 `<WeaponSlot>` 세 개에 대응할 수 있다.
- 최대 하드포인트 용량을 기본 로드아웃에서 추론하지 않는다. 기본 장비는 현재 장착된 무기를 나타내며 섀시가 장착할 수 있는 전체 무기 수가 아니다.
- 앱의 하드포인트 개수, 피팅 제한, 컴포넌트 배지, 멕 목록 배지, 통계는 `hardpoint.weapon_slots`를 사용한다. 섀시 하드포인트 매핑에 실제로 대응 항목이 없을 때만 1을 대체값으로 사용한다.
- `Slots` 같은 원본 추출 속성을 보존하며 의미가 다른 값으로 덮어쓰지 않고 `weapon_slots`를 추가한다.
- 하드포인트 회귀 검사에서 `UM-SC`는 ballistic 2, energy 3, AMS 1이어야 한다. `UM-R60`은 ballistic 4, energy 2, `UM-R60L`은 ballistic 2, energy 4, `HBK-4G`는 ballistic 3이어야 하며 `FMT-AL` 왼팔 옴니포드는 energy 3이어야 한다.

## 변경 검증

- 추출 변경 후 일반 멕 정의와 옴니포드 정의를 모두 검증하고, Python 및 JavaScript 문법 검사와 `git diff --check`를 실행하며 생성 파일 범위를 확인한 뒤 결과를 유지한다.
