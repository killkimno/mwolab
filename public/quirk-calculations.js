(function exposeQuirkCalculations(root, factory) {
  const api = Object.freeze(factory());
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MwoLabQuirkCalculations = api;
}(typeof globalThis === "object" ? globalThis : this, () => {
  "use strict";

  function finiteNumber(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  function normalizeQuirkName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function quirkValues(quirks = []) {
    return quirks.reduce((values, quirk) => {
      const name = normalizeQuirkName(quirk?.name);
      if (!name) return values;
      values[name] = finiteNumber(values[name]) + finiteNumber(quirk?.value);
      return values;
    }, {});
  }

  function addQuirk(collector, quirk, source, details = {}) {
    const key = normalizeQuirkName(quirk?.name);
    if (!key) return;
    if (!collector.has(key)) {
      collector.set(key, {
        name: key,
        display_name: quirk.display_name || quirk.name,
        value: 0,
        sources: new Set(),
        contributions: [],
      });
    }
    const entry = collector.get(key);
    entry.value += finiteNumber(quirk.value);
    if (source) entry.sources.add(source);
    entry.contributions.push({
      name: key,
      display_name: quirk.display_name || quirk.name,
      value: finiteNumber(quirk.value),
      source,
      ...details,
    });
  }

  function quirkValueText(name, value) {
    const numeric = finiteNumber(value, null);
    if (numeric === null) return `${value}`;
    const normalizedName = normalizeQuirkName(name);
    if (normalizedName.endsWith("_multiplier")) {
      const percent = numeric * 100;
      return `${percent > 0 ? "+" : ""}${percent.toFixed(1).replace(/\.0$/, "")}%`;
    }
    if (normalizedName.endsWith("_additive")) {
      return `${numeric > 0 ? "+" : ""}${numeric}`;
    }
    return `${numeric > 0 ? "+" : ""}${numeric}`;
  }

  function quirkAdd(values, prefix, suffix) {
    const normalizedPrefix = normalizeQuirkName(prefix);
    const normalizedSuffix = normalizeQuirkName(suffix);
    return finiteNumber(values?.[`${normalizedPrefix}_all_additive`])
      + finiteNumber(values?.[`${normalizedPrefix}_${normalizedSuffix}_additive`]);
  }

  function quirkMultiplier(values, names) {
    return 1 + names.reduce(
      (sum, name) => sum + finiteNumber(values?.[normalizeQuirkName(name)]),
      0,
    );
  }

  function matchingQuirkValue(quirks, name) {
    const expected = normalizeQuirkName(name);
    return quirks.reduce((sum, quirk) => (
      normalizeQuirkName(quirk?.name) === expected
        ? sum + finiteNumber(quirk?.value)
        : sum
    ), 0);
  }

  function quirkReduction(quirks, name) {
    return Math.max(0, -matchingQuirkValue(quirks, name));
  }

  function quirkIncrease(quirks, name) {
    return Math.max(0, matchingQuirkValue(quirks, name));
  }

  function quirkSignedValue(quirks, name) {
    return matchingQuirkValue(quirks, name);
  }

  function isHarmfulDurationOrSpreadQuirk(quirk) {
    if (!(finiteNumber(quirk?.value) > 0)) return false;
    const name = normalizeQuirkName(quirk?.name);
    if (name.endsWith("_spread_multiplier")) return true;
    return name.endsWith("_duration_multiplier") && !name.includes("narc");
  }

  function durabilitySkillFinalValue(value, multiplier) {
    const skillMultiplier = finiteNumber(multiplier);
    return skillMultiplier === 0
      ? value
      : Math.floor(value * (1 + skillMultiplier) + 1e-9);
  }

  return {
    finiteNumber,
    normalizeQuirkName,
    quirkValues,
    addQuirk,
    quirkValueText,
    quirkAdd,
    quirkMultiplier,
    quirkReduction,
    quirkIncrease,
    quirkSignedValue,
    isHarmfulDurationOrSpreadQuirk,
    durabilitySkillFinalValue,
  };
}));
