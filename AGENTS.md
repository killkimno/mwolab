# Agent Rules

- Do not start, inspect, probe, or verify the local preview/dev server unless the user explicitly asks for it.
- The user manually handles whether the server is running and whether the app can be opened.

## Formula and Data Evidence Rules

- Do not invent formulas, numeric meanings, counts, behavior, or mappings from equipment names, display names, suffixes, conventions, similar weapons, or outside assumptions. Use such a derivation only when the user or an authoritative project rule explicitly defines that exact mapping.
- Implement calculations and displayed values only from explicit extracted data fields or formulas and mappings explicitly provided by the user or an authoritative project rule.
- When the available data and a requested formula do not identify the required input unambiguously, report the missing evidence and ask for the authoritative field or formula instead of guessing.
- Tests and documentation must preserve the same evidence-based rule and must not encode an inferred value as fact.

## Where to Write a Rule

- Record intended product purpose, supported capabilities, target users, and product scope in `프로젝트 사양서.md`.
- Record reusable implementation, calculation, and UI requirements in the matching guide below.
- Record descriptive details of the current implementation in `wiki/mwolab-implementation-wiki.html`.
- When a topic spans layers, keep only the layer-appropriate statement in each document and link to the authoritative detail instead of copying the same rule.

## Related Guides

- For the project's purpose, supported capabilities, target users, and top-level constraints, read `프로젝트 사양서.md` first.
- For UI conventions, tab display specs, and slot/hardpoint display specs, follow `프로젝트 규약 에이전트.md`.
- For weapon damage, range, tooltip calculations, and MechLab equipment filtering, follow `무기 관련 에이전트.md`.
- For quirk-summary naming across the info and stats tabs, follow `쿼크 관련 에이전트.MD`.
- For implementation-wiki maintenance, follow `위키 관리 지침.md`.
- For game-data extraction or generated JSON changes, follow `JSON 추출 지침.md`.

## Subagent Workflow Rules

- Use project subagents for complex work that has at least two independent, non-trivial, read-heavy workstreams and where delegation materially improves speed or review quality. Do not delegate routine single-file or narrowly scoped changes.
- Use `code_explorer` to trace execution paths, data flow, shared calculations, caches, render paths, and change impact before implementation when the relevant code is not already clear.
- Use `data_evidence_reviewer` when a task depends on game-data fields, formulas, numeric meanings, equipment mappings, generated JSON, extraction overrides, or quirk/weapon calculations.
- Use `change_reviewer` after non-trivial code or generated-data changes to review the completed diff for correctness, regressions, evidence violations, validation gaps, and documentation drift.
- Keep project subagents read-only. The primary agent, or exactly one explicitly designated implementation worker, owns all file edits for a task. Do not run parallel write-heavy workflows against the shared worktree.
- Give every subagent a concrete, bounded question and required output. Wait for all requested results, then consolidate their evidence and resolve contradictions before editing or reporting completion.
- Do not use subagents merely to restate a domain guide. Reusable deterministic procedures, including the full JSON refresh workflow, belong in the matching skill or script; use subagents for independent investigation and verification.

## Simulation UI Rules

- Keep simulation controls and HUD placement close to the in-game layout when practical; otherwise prioritize clear sightlines, comfortable reach, and immediate readability.
- Place elapsed time, total damage, DPS, and heat together immediately above the weapon firing controls.
- DPH means damage per heat. Calculate it as damage divided by heat (`damage / heat`).

## MASC Tooltip Rules

- Calculate each MASC final mobility value from the quirk-adjusted current value: `quirk final value * (1 + MASC boost)`.
- Do not display a MASC boost or its corresponding final mobility row when that boost is zero.

## Jump Jet Rules

- Apply jump jet burn-time and initial-thrust quirks to installed jump jet calculations.
- In the MechLab fitting summary, calculate the jump height from the quirk-adjusted jump jet values and display only the final result.

## Statistics UI Rules

- Reuse the same complete hardpoint tag rendering used by other mech-slot displays, including hardpoint counts, `JJ`, and `MASC`.
- Keep the single-letter `E`, `M`, and `B` tags compact while allowing longer tags such as `AMS` and `ECM` to take their natural extra width.
- Keep the weight-class label and slot-area background as statistics-specific presentation.

## Quirk Parsing Rules

- Unless the user explicitly requests different colors, when a UI already displays both a quirk-adjusted final value and its quirk contribution, color the final value green and the quirk contribution yellow. Keep the base value, parentheses, and operators in the surrounding stat's normal base color. This is a color rule only; it does not require any particular calculation, text format, decomposition, ordering, or layout.
- Quirk names are parsed case-insensitively. Normalize quirk names and weapon lookup keys before matching.
- A multiplier quirk whose benefit is a reduction, such as cooldown, heat, duration, and spread, is stored as a negative value. Convert it to a positive summary value with `Math.max(0, -value)`.
- A positive weapon duration or spread multiplier is harmful. Preserve and apply its positive sign in weapon calculations instead of dropping it as a non-reduction; when a UI shows its final value and quirk contribution, color both red.
- A multiplier quirk whose benefit is an increase, such as range, velocity, heat dissipation, and ROF, is stored as a positive value. Convert it with `Math.max(0, value)`.
- Summary values stack the general quirk, the weapon family quirk, and the best matching weapon-specific quirk. For example, `all_cooldown_multiplier + energy_cooldown_multiplier + best energy weapon cooldown`.
- Weapon-specific quirks are detected by stripping the stat suffix, such as `_cooldown_multiplier`, `_heat_multiplier`, `_range_multiplier`, `_velocity_multiplier`, `_duration_multiplier`, or `_spread_multiplier`, then matching the remaining prefix against weapon names, display names, and aliases in equipment data.
- Do not hard-code individual weapon names when the equipment data can infer the weapon family. Use the equipment weapon `hardpoint_type` or `stats.type` family: `energy`, `missile`, or `ballistic`.
- Energy laser rules: laser-specific quirks affect laser weapons, energy quirks affect all energy weapons, PPC weapons are affected by energy quirks, and standard laser quirks are separate from ER or pulse laser variants when the quirk name distinguishes them.
- Cooldown and heat summaries include `MAX`, `ENERGY`, `MISSILE`, and `BALLISTIC`. Heat summaries also include `HEAT DISSIPATION` after those entries.
- Range and velocity summaries include `MAX`, `ENERGY`, `MISSILE`, and `BALLISTIC`.
- Duration summaries include `ENERGY DURATION`, `MG ROF`, `RAC ROF`, and `AMS ROF` only when AMS ROF exists.
- The top-level summary includes `듀레이션/ROF`. Show laser duration and the highest ROF value as one row in the form `5% / 3% rof`; use `-%` for missing duration and `- rof` for missing ROF.
- Spread summaries do not have an energy entry. Keep the missing energy position as an empty slot for visual consistency.
- Durability summaries are total-only, not per body part. `MAX` is armor plus structure, followed by armor, structure, and critical-hit prevention.

- The top-level `쿼크 서머리` is its own info card. Do not render it inside the `QUIRKS` list/card.
- The `쿼크 서머리` card contains cooldown, heat, durability, range, velocity, and owned special quirk categories. Recognized special categories are ECM, jump jets, and NARC duration.

## Optimization Notes

- Treat extracted mech, equipment, loadout, omnipod, and quirk numeric values as effectively static unless there is a specific data update or extraction change.
- Prefer browser-memory caches for repeated derived values such as mech summaries, quirk summaries, hardpoint badges, and weapon quirk lookup indexes.
- Do not persist derived summary/cache values into `public/data/*.json` unless there is a deliberate data-generation reason.
- When optimizing stats views, avoid recalculating all mech rows or rebuilding the full stats list for selection-only changes; update the active row and detail panel from the current rendered entries.
- For weapon-specific quirk matching, build reusable lookup indexes from equipment data instead of repeatedly scanning every weapon for every mech and category.
