"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadMechLab() {
  const quirkSource = fs.readFileSync(
    path.join(__dirname, "..", "public", "quirk-calculations.js"),
    "utf8",
  );
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");
  const sandbox = {
    __MWOLAB_TEST__: true,
    console,
    URL,
    URLSearchParams,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Object,
    Array,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    JSON,
    Date,
    Intl,
    Promise,
    performance: { now: () => 0 },
    navigator: { language: "en", languages: ["en"] },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    location: { protocol: "http:" },
    fetch: async () => { throw new Error("fetch must not run in unit tests"); },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {},
      body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
    },
  };
  sandbox.window = {
    location: { href: "http://localhost/?lang=en", search: "?lang=en" },
    history: { pushState: () => {}, replaceState: () => {} },
    addEventListener: () => {},
    setTimeout,
    clearTimeout,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(quirkSource, sandbox, { filename: "public/quirk-calculations.js" });
  vm.runInContext(source, sandbox, { filename: "public/app.js" });
  return sandbox.__MWOLAB_TEST_API__;
}

const api = loadMechLab();

function closeTo(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
}

function quirk(name, value) {
  return { name, value };
}

function weapon(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    item_type: "weapon",
    name: overrides.name ?? "TestWeapon",
    display_name: overrides.display_name ?? "Test Weapon",
    hardpoint_type: overrides.hardpoint_type ?? "energy",
    faction: overrides.faction ?? "InnerSphere",
    stats: {
      damage: 10,
      heat: 5,
      cooldown: 2,
      numFiring: 1,
      ...overrides.stats,
    },
    ranges: overrides.ranges || [],
    aliases: overrides.aliases || "",
    ctype: overrides.ctype,
  };
}

function resetEquipment(items = {}) {
  api.state.equipment = { items };
  api.state.currentBuild = {
    upgrades: { artemis: { Equipped: false } },
    components: {},
    rearArmor: {},
  };
  api.state.alwaysAppliedWeaponModuleBonusCache.clear();
  api.state.artemisSpreadMultiplierCache = null;
  api.state.ammoHardpointTypeCache = null;
}

test("기본 숫자와 장비 공식", async (t) => {
  await t.test("유효하지 않은 숫자는 지정한 기본값을 사용한다", () => {
    assert.equal(api.number(NaN, 7), 7);
    assert.equal(api.number("3", 7), 7);
    assert.equal(api.number(3, 7), 3);
  });

  await t.test("탄환형 무기는 발사 수와 펠릿 수를 모두 피해에 반영한다", () => {
    resetEquipment();
    const item = weapon({ stats: { damage: 2, numFiring: 3, projectileclass: "bullet", numPerShot: 4 } });
    assert.equal(api.weaponProjectilesPerFiring(item), 4);
    assert.equal(api.weaponBaseDirectDamage(item), 24);
  });

  await t.test("비탄환형 무기는 numPerShot을 피해에 중복 적용하지 않는다", () => {
    resetEquipment();
    const item = weapon({ stats: { damage: 2, numFiring: 3, projectileclass: "missile", numPerShot: 4 } });
    assert.equal(api.weaponProjectilesPerFiring(item), 1);
    assert.equal(api.weaponBaseDirectDamage(item), 6);
  });

  await t.test("항상 적용되는 무기 모듈의 피해와 발열을 수량만큼 더한다", () => {
    const item = weapon({ id: 10, name: "Laser_X", stats: { damage: 5, heat: 3, numFiring: 2 } });
    const module = {
      id: 20,
      item_type: "module",
      faction: "InnerSphere",
      stats: { amountAllowed: 2 },
      weapon_stat_filters: [{
        compatible_weapons: ["Laser_X"],
        weapon_stats: [{ operation: "+", damage: 1, heat: 0.5 }],
      }],
    };
    resetEquipment({ 10: item, 20: module });
    assert.equal(api.weaponBonusDirectDamage(item), 4);
    assert.equal(api.weaponDirectDamage(item), 14);
    assert.equal(api.itemHeat(item), 4);
  });

  await t.test("스플래시는 기본 피해 양쪽과 모듈 총 스플래시를 정확히 합산한다", () => {
    const item = weapon({ id: 11, name: "Splash_X", stats: { damage: 10, splashPercent: 0.2 } });
    const module = {
      item_type: "module",
      faction: "InnerSphere",
      stats: { amountAllowed: 2 },
      weapon_stat_filters: [{
        compatible_weapons: ["Splash_X"],
        weapon_stats: [{ operation: "+", damage: 2 }],
      }],
    };
    resetEquipment({ 11: item, 21: module });
    assert.equal(api.weaponDirectDamage(item), 14);
    assert.equal(api.weaponSplashDamage(item), 2.4);
    closeTo(api.weaponTotalDamage(item), 18.8);
    assert.equal(api.weaponTotalDamage(item, false), 14);
  });

  await t.test("톤수는 구조 0.5톤 올림과 장갑 환산을 사용한다", () => {
    assert.equal(api.structureUpgradeTonnage(55, { stats: { weightPerTon: 0.05 } }), 3);
    assert.equal(api.structureUpgradeTonnage(55, { stats: { weightPerTon: 0.1 } }), 5.5);
    assert.equal(api.armorTonnage(320, { stats: { armorPerTon: 32 } }), 10);
    assert.equal(api.armorTonnage(320, { stats: { armorPerTon: 0 } }), 0);
    assert.equal(api.internalItemTonnageModifier({ name: "CompactGyro", stats: { tons: -2 } }), 2);
  });

  await t.test("엔진 히트싱크와 사이드 슬롯은 소스 수치를 경계 처리한다", () => {
    const engine = { stats: { heatsinks: 13, sideSlots: 3 } };
    assert.equal(api.engineIncludedHeatSinkCount(engine), 10);
    assert.equal(api.engineAdditionalHeatSinkCapacity(engine), 3);
    assert.equal(api.engineSideSlots(engine), 3);
    assert.equal(api.engineSideSlots({ stats: { sideSlots: -2 } }), 0);
  });
});

test("탄약·Artemis·하드포인트 공식", async (t) => {
  await t.test("Artemis 장착 여부와 alwaysHasArtemis가 활성 탄종을 결정한다", () => {
    const item = weapon({ stats: { ammoType: "LRM", artemisAmmoType: "LRMArtemis" } });
    resetEquipment();
    assert.equal(api.activeWeaponAmmoType(item), "LRM");
    api.state.currentBuild.upgrades.artemis.Equipped = true;
    assert.equal(api.activeWeaponAmmoType(item), "LRMArtemis");
    api.state.currentBuild.upgrades.artemis.Equipped = false;
    item.stats.alwaysHasArtemis = 1;
    assert.equal(api.activeWeaponAmmoType(item), "LRMArtemis");
  });

  await t.test("탄약 소모량은 ammoPerShot과 순차 발사 수 중 큰 정수값이다", () => {
    resetEquipment();
    assert.equal(api.weaponAmmoPerTrigger(weapon({ stats: { ammoType: "AC", ammoPerShot: 1, numFiring: 4 } })), 4);
    assert.equal(api.weaponAmmoPerTrigger(weapon({ stats: { ammoType: "LBX", ammoPerShot: 1, numFiring: 1, numPerShot: 10 } })), 1);
    assert.equal(api.weaponAmmoPerTrigger(weapon({ stats: {} })), 0);
  });

  await t.test("탄약 쿼크는 정규화한 탄종과 톤수를 기반으로 발수를 늘린다", () => {
    const ammo = { item_type: "ammo", name: "Clan LRM Ammo", stats: { type: "ClanLRMAmmo", numShots: 120, tons: 0.5 } };
    assert.equal(api.ammoCapacityQuirkKey(ammo), "clrm");
    assert.equal(api.ammoCapacityQuirkBonus(ammo, [quirk("ammocapacity_clrm_additive", 20)]), 20);
    assert.equal(api.effectiveAmmoShots(ammo, [quirk("AmmoCapacity_CLRM_Additive", 20)]), 130);
  });

  await t.test("하드포인트 수는 weapon_slots를 합산하고 누락 시 1을 사용한다", () => {
    const definition = { components: {
      left_arm: { hardpoints: [
        { hardpoint_type: "energy", weapon_slots: 3 },
        { hardpoint_type: "energy" },
        { Type: "4", weapon_slots: 2 },
      ] },
    } };
    const counts = api.hardpointCountsFromDefinition(definition);
    assert.equal(counts.energy, 4);
    assert.equal(counts.ams, 2);
    assert.equal(api.hardpointSlots({ weapon_slots: 0 }), 1);
  });

  await t.test("구조·장갑 업그레이드 슬롯을 컴포넌트 여유 공간에 순서대로 배치한다", () => {
    resetEquipment();
    const definition = { components: {
      right_torso: { slots: 2 },
      centre_torso: { slots: 2 },
    } };
    const build = { components: {}, upgrades: {} };
    const allocation = api.allocateUpgradeSlots(3, definition, build, null, null);
    assert.equal(allocation.byComponent.right_torso, 2);
    assert.equal(allocation.byComponent.centre_torso, 1);
    assert.equal(allocation.unallocated, 0);
    const fixed = api.allocateFixedUpgradeSlots(
      { right_torso: 3, centre_torso: 1 },
      definition,
      build,
      null,
      null,
    );
    assert.equal(fixed.unallocated, 1);
  });
});

test("내구도 공식", async (t) => {
  const mech = {
    id: "fixture",
    faction: "InnerSphere",
    definition: {
      stats: { MaxTons: 50 },
      components: {
        head: { hp: 15 },
        centre_torso: { hp: 30 },
        left_torso: { hp: 20 },
        right_torso: { hp: 20 },
        left_arm: { hp: 16 },
        right_arm: { hp: 16 },
        left_leg: { hp: 22 },
        right_leg: { hp: 22 },
      },
    },
  };

  await t.test("내구 스킬 배율은 각 합계에 내림 적용한다", () => {
    assert.equal(api.durabilitySkillFinalValue(101, 0.1), 111);
    assert.equal(api.durabilitySkillFinalValue(101, 0), 101);
  });

  await t.test("머리 최대 장갑은 18, 나머지는 구조의 두 배다", () => {
    api.state.selectedMech = mech;
    assert.equal(api.baseMaxArmor("head", mech), 18);
    assert.equal(api.baseMaxArmor("centre_torso", mech), 60);
    assert.equal(api.componentArmorCapacity("left_arm", mech.definition.components.left_arm), 32);
  });

  await t.test("장갑·후면·구조 쿼크와 스킬을 합산한다", () => {
    api.state.selectedMech = mech;
    const values = {
      armorresist_all_additive: 2,
      armorresist_ct_additive: 3,
      armorresist_ctr_additive: 1,
      internalresist_all_additive: 1,
      internalresist_ct_additive: 4,
      increasedarmor_multiplier: 0.1,
      increasedstructure_multiplier: 0.1,
    };
    const armor = api.armorInfoRows(values, mech)[1];
    const structure = api.structureInfoRows(values, mech)[1];
    assert.equal(armor.frontBase, 60);
    assert.equal(armor.rear, 3);
    assert.equal(armor.total, 74);
    assert.equal(structure.base, 30);
    assert.equal(structure.total, 38);
    const combined = api.combinedDurabilityRows([armor], [structure])[0];
    assert.equal(combined.total, 112);
  });

  await t.test("현재 장갑은 전후면을 합친 뒤 스킬 내림을 한 번 적용한다", () => {
    api.state.selectedMech = mech;
    const build = {
      components: Object.fromEntries(Object.keys(mech.definition.components).map((key) => [key, { armor: key === "centre_torso" ? 50 : 0 }])),
      rearArmor: { centre_torso: 10 },
    };
    const values = {
      armorresist_all_additive: 1,
      armorresist_ct_additive: 2,
      armorresist_ctr_additive: 3,
      increasedarmor_multiplier: 0.1,
    };
    assert.equal(api.currentBuildArmorTotal(values, mech, build), 82);
    assert.equal(api.finalArmorAllocation(50, 3, 0.1, 10, 4), 59);
    assert.equal(api.finalArmorAllocation(10, 4, 0.1, 50, 3, false), 14);
  });

  await t.test("컴포넌트 내구 기여도는 구조 쿼크와 스킬 증가분을 합친다", () => {
    const values = {
      armorresist_all_additive: 1,
      armorresist_ct_additive: 2,
      armorresist_ctr_additive: 3,
      internalresist_all_additive: 1,
      internalresist_ct_additive: 4,
      increasedarmor_multiplier: 0.1,
      increasedstructure_multiplier: 0.1,
    };
    const result = api.componentDurabilityQuirkValues(
      "centre_torso",
      values,
      mech.definition.components.centre_torso,
    );
    assert.equal(result.frontArmor, 3);
    assert.equal(result.rearArmor, 4);
    assert.equal(result.armorSkillMultiplier, 0.1);
    assert.equal(result.structure, 8);
  });
});

test("기동·센서·점프젯 공식", async (t) => {
  const mech = {
    id: "mobility",
    faction: "InnerSphere",
    definition: {
      stats: { MaxTons: 50, MaxEngineRating: 300, SensorRange: 800 },
      movement: {
        MaxMovementSpeed: 10,
        ReverseSpeedMultiplier: 0.6,
        AccelLerpMidRate: 20,
        DecelLerpMidRate: 500,
        TurnLerpMidRate: Math.PI / 2,
        TorsoTurnSpeedYaw: 60,
        MaxTorsoAngleYaw: 90,
        MaxTorsoAnglePitch: 25,
        MaxArmRotationYaw: 15,
        MaxArmRotationPitch: 10,
      },
      components: {},
    },
  };

  await t.test("이동 공식은 엔진/톤수와 쿼크 합산 배율을 적용한다", () => {
    api.state.selectedMech = mech;
    const values = {
      mechtopspeed_multiplier: 0.1,
      reversespeed_multiplier: 0.2,
      mechacceleration_multiplier: 0.1,
      accellerp_all_multiplier: 0.05,
      mechdeceleration_multiplier: 0.2,
      turnrate_multiplier: 0.1,
      torso_yawangle_additive: 10,
      torso_yawangle_multiplier: 0.1,
      torso_pitchangle_additive: 5,
      torso_yawspeed_multiplier: 0.25,
    };
    const result = api.movementInfo(values, mech);
    assert.equal(result.baseMaxSpeed, 60);
    closeTo(result.maxSpeed, 66);
    closeTo(result.reverseSpeed, 47.52);
    closeTo(result.acceleration, 23);
    assert.equal(result.deceleration, 12);
    closeTo(result.turnSpeed, 99);
    closeTo(result.angleX[0], 110);
    assert.equal(result.angleY[0], 30);
    assert.equal(result.torsoSpeed, 75);
  });

  await t.test("점프젯은 burn-time과 initial-thrust 쿼크를 최종 높이에 반영한다", () => {
    const jets = [
      { stats: { duration: 2, boost_instant: 4, boost_z: 10, boost_fwd: 3 } },
      { stats: { duration: 1, boost_instant: 6, boost_z: 8, boost_fwd: 3 } },
    ];
    const quirks = [
      quirk("jumpjets_burntime_multiplier", 0.1),
      quirk("jumpjets_initialthrust_multiplier", 0.2),
    ];
    const final = api.jumpJetFinalStats(jets[0], quirks);
    closeTo(final.duration, 2.2);
    closeTo(final.initialThrust, 4.8);
    closeTo(api.jumpJetHeight(jets, 50, quirks), (7.5 * 18 + 2.2 * 0.75 * 7.2) / 50);
    assert.equal(api.jumpJetHeight([], 50, quirks), 0);
  });

  await t.test("센서 장비 보너스는 쿼크 적용 후 곱한다", () => {
    resetEquipment();
    api.state.selectedMech = mech;
    api.state.currentBuild = { components: {}, upgrades: {}, rearArmor: {} };
    closeTo(api.mechSensorRange([
      quirk("sensorrange_multiplier", 0.1),
      quirk("sensorrange_additive", 20),
    ], mech, api.state.currentBuild), 900);
    assert.equal(api.targetEquipmentSensorRangeBonus({ item_type: "module", name: "Not Sensor", stats: {} }), 0);
  });

  await t.test("타깃 컴퓨터 필터의 사거리·속도·치명타 보너스를 누적한다", () => {
    const item = weapon({ name: "PPC" });
    const module = {
      weapon_stat_filters: [{
        compatible_weapons: ["PPC"],
        ranges: [{ multiplier: 1.1 }],
        weapon_stats: [{ operation: "*", speed: 1.2 }, { operation: "+", critChanceIncrease: "0.1,0.2,-1" }],
      }],
    };
    const result = api.targetComputerWeaponModifiers(item, [module]);
    closeTo(result.rangeBonus, 0.1);
    closeTo(result.speedBonus, 0.2);
    closeTo(result.criticalChance[0], 0.1);
    closeTo(result.criticalChance[1], 0.2);
    assert.equal(result.criticalChance[2], -1);
  });
});

test("무기 쿼크·연사·사거리 공식", async (t) => {
  await t.test("감소·증가·부호 보존 쿼크를 구분한다", () => {
    const quirks = [
      quirk("all_cooldown_multiplier", -0.1),
      quirk("all_range_multiplier", 0.2),
      quirk("all_duration_multiplier", 0.15),
    ];
    assert.equal(api.quirkReduction(quirks, "all_cooldown_multiplier"), 0.1);
    assert.equal(api.quirkIncrease(quirks, "all_range_multiplier"), 0.2);
    assert.equal(api.quirkSignedValue(quirks, "all_duration_multiplier"), 0.15);
  });

  await t.test("무기별·계열·전체 쿨다운/듀레이션을 합산한다", () => {
    const item = weapon({ name: "ER_Large_Laser", aliases: "ERLL" });
    const quirks = [
      quirk("all_cooldown_multiplier", -0.1),
      quirk("energy_cooldown_multiplier", -0.1),
      quirk("er_large_laser_cooldown_multiplier", -0.05),
      quirk("all_duration_multiplier", -0.1),
      quirk("energy_duration_multiplier", 0.2),
    ];
    const timing = api.simulationWeaponTiming(item, quirks);
    assert.equal(timing.cooldown, 1.5);
    assert.equal(timing.duration, 0);
    assert.equal(timing.cycle, 1.5);
  });

  await t.test("ROF 무기는 증가 쿼크를 초당 발사 횟수에 적용한다", () => {
    const item = weapon({ name: "MachineGun", stats: { damage: 1, rof: 5 } });
    const timing = api.simulationWeaponTiming(item, [quirk("machinegun_rof_multiplier", 0.2)]);
    closeTo(timing.cycle, 1 / 6);
    const rate = api.weaponDamagePerSecond(item, [quirk("machinegun_rof_multiplier", 0.2)]);
    assert.equal(rate.base, 5);
    assert.equal(rate.final, 6);
  });

  await t.test("발사 이벤트와 발사 시간은 volley size로 묶는다", () => {
    const item = weapon({ hardpoint_type: "missile", stats: { numFiring: 10, volleysize: 4, volleydelay: 0.1 } });
    assert.equal(api.weaponVolleySize(item), 4);
    assert.equal(api.weaponFiringEventCount(item), 3);
    closeTo(api.weaponFiringTime(item), 0.2);
  });

  await t.test("기대 쿨다운은 충전·연속발사·듀레이션·쿨다운을 모두 더한다", () => {
    const item = weapon({ stats: {
      chargeTime: 1,
      numFiring: 3,
      volleydelay: 0.1,
      duration: 0.5,
      cooldown: 2,
    } });
    closeTo(api.weaponExpectedCooldown(item), 3.7);
  });

  await t.test("발열과 사거리 보너스는 전체·계열·무기별 쿼크를 합산한다", () => {
    const item = weapon({ name: "PPC", stats: { heat: 10 } });
    const quirks = [
      quirk("all_heat_multiplier", -0.1),
      quirk("energy_heat_multiplier", -0.2),
      quirk("ppc_heat_multiplier", -0.1),
      quirk("all_range_multiplier", 0.1),
      quirk("energy_range_multiplier", 0.2),
      quirk("ppc_range_multiplier", 0.1),
    ];
    resetEquipment();
    assert.equal(api.simulationWeaponHeat(item, quirks), 6);
    closeTo(api.simulationWeaponRangeBonus(item, quirks), 0.4);
  });

  await t.test("spread의 유해한 양수 쿼크도 부호를 보존한다", () => {
    const item = weapon({ name: "Laser", stats: { spread: 2 } });
    resetEquipment();
    const result = api.weaponSpreadValues(item, [quirk("energy_spread_multiplier", 0.25)]);
    assert.equal(result.modifier, 0.25);
    assert.equal(result.final, 2.5);
  });

  await t.test("사거리 프로필은 최소사거리를 고정하고 이후 구간만 늘린다", () => {
    const item = weapon({ ranges: [
      { start: 0, damageModifier: 0 },
      { start: 90, damageModifier: 1 },
      { start: 450, damageModifier: 1 },
      { start: 900, damageModifier: 0, interpolationToNextRange: "linear" },
    ] });
    const profile = api.simulationWeaponRangeProfile(item, 0.1, 0.1);
    assert.equal(profile.minimumRange, 90);
    closeTo(profile.optimalRange, 540);
    closeTo(profile.maximumRange, 1080);
    assert.equal(profile.ranges[1].start, 90);
  });

  await t.test("선형·step·지수 감쇠와 범위 밖 피해를 처리한다", () => {
    resetEquipment();
    const base = weapon();
    const linear = {
      item: base,
      rangeProfile: {
        minimumRange: 0,
        optimalRange: 100,
        maximumRange: 200,
        ranges: [
          { start: 100, modifier: 1, interpolation: "linear", exponent: 1 },
          { start: 200, modifier: 0, interpolation: "linear", exponent: 1 },
        ],
      },
    };
    closeTo(api.simulationWeaponDamageMultiplier(linear, 150), 0.5);
    assert.equal(api.simulationWeaponDamageMultiplier(linear, 201), 0);
    linear.rangeProfile.ranges[0].interpolation = "step";
    assert.equal(api.simulationWeaponDamageMultiplier(linear, 150), 1);
    linear.rangeProfile.ranges[0].interpolation = "exponential";
    linear.rangeProfile.ranges[0].exponent = 2;
    closeTo(api.simulationWeaponDamageMultiplier(linear, 150), 0.75);
  });

  await t.test("ATM은 거리대별 1.25/1/0.8 배율과 경계를 적용한다", () => {
    const item = weapon({ name: "Clan_ATM" });
    const profile = { rangeMultiplier: 1.1 };
    const wrapped = { item, rangeProfile: profile };
    assert.equal(api.simulationWeaponDamageMultiplier(wrapped, 59), 0);
    assert.equal(api.simulationWeaponDamageMultiplier(wrapped, 100), 1.25);
    assert.equal(api.simulationWeaponDamageMultiplier(wrapped, 500), 1);
    assert.equal(api.simulationWeaponDamageMultiplier(wrapped, 900), 0.8);
    assert.equal(api.simulationWeaponDamageMultiplier(wrapped, 1211), 0);
    const bands = api.atmTooltipDamageBands(item, 0.1);
    assert.equal(bands[0].start, 60);
    assert.equal(bands[2].end, 1210);
  });

  await t.test("UAC 재밍은 확률과 지속시간 감소를 각각 적용한다", () => {
    const item = weapon({ name: "UltraAutoCannon5", stats: { JammingChance: 0.2, JammedTime: 5 } });
    const result = api.ultraAutoCannonJamStats(item, [
      quirk("all_jamchance_multiplier", -0.25),
      quirk("ultraautocannon5_jamchance_multiplier", -0.25),
      quirk("all_jamduration_multiplier", -0.2),
    ]);
    assert.equal(result.chance, 0.1);
    assert.equal(result.duration, 4);
  });

  await t.test("AMS additive와 ROF 피해율의 총 스플래시 배율을 계산한다", () => {
    resetEquipment();
    const ams = weapon({ name: "LaserAntiMissileSystem", ctype: "WeaponAMS", stats: { damage: 3 } });
    const amsRate = api.amsDamagePerSecond(ams, [
      quirk("laserantimissilesystem_damage_additive", 2),
    ]);
    assert.equal(amsRate.base, 3);
    assert.equal(amsRate.final, 5);

    const machineGun = weapon({ name: "MachineGun", stats: { damage: 2, rof: 4, splashPercent: 0.25 } });
    const totalRate = api.weaponTotalDamageRate(
      machineGun,
      [quirk("machinegun_rof_multiplier", 0.25)],
    );
    assert.equal(totalRate.base, 12);
    assert.equal(totalRate.final, 15);
  });

  await t.test("시뮬레이션 피해 래퍼는 거리 배율·발사 수·스플래시 옵션을 반영한다", () => {
    const wrapped = {
      item: weapon(),
      directDamage: 10,
      damage: 14,
      directDamagePerSecond: 5,
      damagePerSecond: 7,
      rangeProfile: null,
    };
    api.state.simulation.applySplashDamage = true;
    assert.equal(api.simulationWeaponDamage(wrapped, 3), 42);
    assert.equal(api.simulationWeaponDamagePerSecond(wrapped), 7);
    api.state.simulation.applySplashDamage = false;
    assert.equal(api.simulationWeaponDamage(wrapped, 3), 30);
    assert.equal(api.simulationWeaponDamagePerSecond(wrapped), 5);
  });

  await t.test("툴팁 사거리는 최소·최적·최대 경계를 소스 구간에서 찾는다", () => {
    const ranges = api.weaponTooltipRanges(weapon({ ranges: [
      { start: 0, damageModifier: 0 },
      { start: 90, damageModifier: 1 },
      { start: 450, damageModifier: 1 },
      { start: 900, damageModifier: 0 },
    ] }));
    assert.equal(ranges.minRange, 90);
    assert.equal(ranges.optimalRange, 450);
    assert.equal(ranges.maxRange, 900);
  });
});

test("히트싱크·고스트 히트·요약 공식", async (t) => {
  await t.test("첫 10개와 외부 히트싱크의 용량/냉각 공식을 구분한다", () => {
    const sink = { stats: {
      engineHeatbase: -1,
      heatbase: -1.5,
      engineCooling: 0.1,
      cooling: 0.2,
    } };
    const result = api.simulationHeatSystemFromSink(sink, 12, 0.1, 0.2);
    assert.equal(result.maxHeat, 49.6);
    closeTo(result.coolingRate, 1.54);
  });

  await t.test("고스트 히트는 HSL 전에는 0이고 활성화 후 원래 단계부터 누적한다", () => {
    resetEquipment();
    const item = weapon({ name: "PPC", stats: {
      heat: 10,
      minheatpenaltylevel: 3,
      heatpenalty: 10,
      heatPenaltyID: 1,
    } });
    assert.equal(api.ghostHeatWeaponExtra(item, 3, 10, 1), 0);
    assert.equal(api.ghostHeatWeaponExtra(item, 4, 10, 1), 48);
    assert.equal(api.ghostHeatGroupKey(item), "shared:1");
  });

  await t.test("HSL 쿼크는 전체·계열·무기별 값을 합산한다", () => {
    const item = weapon({ name: "PPC" });
    assert.equal(api.ghostHeatHslBonus(item, [
      quirk("all_minheatpenaltylevel_additive", 1),
      quirk("energy_minheatpenaltylevel_additive", 1),
      quirk("ppc_minheatpenaltylevel_additive", 2),
    ]), 4);
  });

  await t.test("요약 DPS/DPH/HPS와 열효율·회복시간을 한 공식으로 계산한다", () => {
    const metrics = api.mechSummaryWeaponMetrics([
      { damage: 20, heat: 5, cycle: 2 },
      { damage: 15, heat: 3, cycle: 1 },
    ], 35, { coolingRate: 2, maxHeat: 40 });
    assert.equal(metrics.alphaHeat, 8);
    assert.equal(metrics.dps, 25);
    assert.equal(metrics.hps, 5.5);
    assert.equal(metrics.dph, 4.375);
    closeTo(metrics.heatEfficiency, 2 / 5.5 * 100);
    assert.equal(metrics.alphaHeatRecovery, 4);
    assert.equal(metrics.alphaHeatPercent, 20);
  });

  await t.test("발열이 없으면 DPH가 없고 냉각이 충분하면 열효율은 100이다", () => {
    const metrics = api.mechSummaryWeaponMetrics(
      [{ damage: 10, heat: 0, cycle: 1 }],
      10,
      { coolingRate: 1, maxHeat: 0 },
    );
    assert.equal(metrics.dph, null);
    assert.equal(metrics.heatEfficiency, 100);
    assert.equal(metrics.alphaHeatRecovery, 0);
    assert.equal(metrics.alphaHeatPercent, 0);
  });
});

test("빌드 집계 공식은 개별 공식과 같은 최종값을 만든다", () => {
  const engine = {
    id: 100,
    item_type: "engine",
    name: "StandardEngine_200",
    faction: "InnerSphere",
    stats: { tons: 5, slots: 6, rating: 200, heatsinks: 10, sideSlots: 0 },
  };
  const laser = weapon({
    id: 101,
    name: "MediumLaser",
    stats: { tons: 2, slots: 1, damage: 10, heat: 5, cooldown: 2 },
  });
  const structure = {
    id: 102,
    item_type: "upgrade",
    name: "StandardStructure",
    stats: { weightPerTon: 0.1 },
  };
  const armor = {
    id: 103,
    item_type: "upgrade",
    name: "StandardArmor",
    stats: { armorPerTon: 32 },
  };
  resetEquipment({ 100: engine, 101: laser, 102: structure, 103: armor });
  const componentNames = [
    "head",
    "centre_torso",
    "left_torso",
    "right_torso",
    "left_arm",
    "right_arm",
    "left_leg",
    "right_leg",
  ];
  const components = Object.fromEntries(componentNames.map((name) => [name, {
    hp: name === "head" ? 15 : 20,
    slots: 12,
    hardpoints: name === "left_arm"
      ? [{ hardpoint_type: "energy", weapon_slots: 1 }]
      : [],
    internals: [],
    fixed: [],
  }]));
  const mech = {
    id: "build-fixture",
    stock_loadout: "build-fixture",
    faction: "InnerSphere",
    definition: {
      stats: {
        MaxTons: 50,
        MinEngineRating: 100,
        MaxEngineRating: 300,
        MaxJumpJets: 0,
      },
      components,
      quirks: [],
    },
  };
  const buildComponents = Object.fromEntries(componentNames.map((name) => [name, {
    armor: name === "centre_torso" ? 32 : 0,
    items: name === "centre_torso"
      ? [{ item_id: 100 }]
      : name === "left_arm"
        ? [{ item_id: 101 }]
        : [],
  }]));
  api.state.loadouts = {};
  api.state.omnipods = {};
  api.state.selectedMech = mech;
  api.state.currentBuild = {
    components: buildComponents,
    engineHeatSinks: [],
    rearArmor: {},
    upgrades: {
      structure: { ItemID: 102 },
      armor: { ItemID: 103 },
      artemis: { Equipped: false },
    },
  };
  const result = api.calculateBuild();
  assert.equal(result.totalTons, 13);
  assert.equal(result.alpha, 10);
  assert.equal(result.heat, 5);
  assert.equal(result.armor, 32);
  assert.equal(result.totalHeatSinkCount, 10);
  assert.equal(result.currentSlotUsage, 7);
  assert.equal(result.warnings.some((warning) => warning.includes("Tonnage")), false);
});
