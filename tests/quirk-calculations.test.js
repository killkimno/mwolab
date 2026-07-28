"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const quirks = require("../public/quirk-calculations.js");

test("쿼크 이름과 +수치 공용 계산", async (t) => {
  await t.test("쿼크 이름을 공백·대소문자와 무관하게 정규화한다", () => {
    assert.equal(quirks.normalizeQuirkName("  Energy_Heat_Multiplier  "), "energy_heat_multiplier");
  });

  await t.test("동일한 쿼크 이름의 수치를 대소문자와 무관하게 합산한다", () => {
    const values = quirks.quirkValues([
      { name: "ArmorResist_All_Additive", value: 2 },
      { name: "armorresist_all_additive", value: 3 },
    ]);
    assert.equal(values.armorresist_all_additive, 5);
  });

  await t.test("collector는 쿼크 값·출처·기여도를 하나의 항목으로 합친다", () => {
    const collector = new Map();
    quirks.addQuirk(collector, { name: "Heat", value: 2 }, "Variant");
    quirks.addQuirk(collector, { name: "heat", value: 3 }, "Omnipod", { component: "left_arm" });
    const result = collector.get("heat");
    assert.equal(result.value, 5);
    assert.deepEqual(Array.from(result.sources), ["Variant", "Omnipod"]);
    assert.equal(result.contributions.length, 2);
    assert.equal(result.contributions[1].component, "left_arm");
  });

  await t.test("multiplier와 additive 쿼크를 표시 문자열로 변환한다", () => {
    assert.equal(quirks.quirkValueText("energy_heat_multiplier", -0.125), "-12.5%");
    assert.equal(quirks.quirkValueText("armorresist_all_additive", 5), "+5");
  });

  await t.test("전체와 부위별 additive 수치를 합산한다", () => {
    assert.equal(quirks.quirkAdd({
      armorresist_all_additive: 2,
      armorresist_ct_additive: 3,
    }, "ArmorResist", "CT"), 5);
  });

  await t.test("여러 multiplier 수치를 1에 더한다", () => {
    assert.equal(quirks.quirkMultiplier({
      mechtopspeed_multiplier: 0.1,
      masc_multiplier: 0.2,
    }, ["MechTopSpeed_Multiplier", "MASC_Multiplier"]), 1.3);
  });

  await t.test("감소·증가·부호 보존 수치를 각각 계산한다", () => {
    const values = [
      { name: "all_heat_multiplier", value: -0.1 },
      { name: "ALL_HEAT_MULTIPLIER", value: -0.05 },
      { name: "all_range_multiplier", value: 0.2 },
      { name: "all_duration_multiplier", value: 0.1 },
    ];
    assert.ok(Math.abs(quirks.quirkReduction(values, "all_heat_multiplier") - 0.15) < 1e-12);
    assert.equal(quirks.quirkIncrease(values, "all_range_multiplier"), 0.2);
    assert.equal(quirks.quirkSignedValue(values, "all_duration_multiplier"), 0.1);
  });

  await t.test("유해한 duration·spread 양수와 NARC 예외를 구분한다", () => {
    assert.equal(quirks.isHarmfulDurationOrSpreadQuirk({
      name: "energy_spread_multiplier",
      value: 0.1,
    }), true);
    assert.equal(quirks.isHarmfulDurationOrSpreadQuirk({
      name: "laser_duration_multiplier",
      value: 0.1,
    }), true);
    assert.equal(quirks.isHarmfulDurationOrSpreadQuirk({
      name: "narc_duration_multiplier",
      value: 0.1,
    }), false);
  });

  await t.test("내구 스킬 수치를 최종 합계에서 내림한다", () => {
    assert.equal(quirks.durabilitySkillFinalValue(101, 0.1), 111);
    assert.equal(quirks.durabilitySkillFinalValue(101, 0), 101);
  });
});
