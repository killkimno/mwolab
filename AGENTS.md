# Agent Rules

- Do not start, inspect, probe, or verify the local preview/dev server unless the user explicitly asks for it.
- The user manually handles whether the server is running and whether the app can be opened.

## Implementation Wiki Rules

- Before implementing or changing project behavior, consult `wiki/mwolab-implementation-wiki.html` for the relevant shared rule, definition, tab guide, JSON parsing rule, or MechLab rule.
- Treat the current code and freshly extracted game data as the source of truth when they conflict with the implementation wiki. Confirm the actual behavior before changing either side.
- After completing a user-requested implementation or code change, decide whether it introduces, changes, or clarifies a reusable implementation rule. When a wiki update is judged necessary, update the implementation wiki immediately as part of that same task without waiting for a separate wiki-update request.
- When updating the wiki, verify the current implementation first and keep its tab guides, shared rules, definitions, JSON parser rules, MechLab rules, and ETC guidance consistent with the code.
- The implementation wiki is a separate internal HTML document. Do not add an application link to it unless the user explicitly requests one.

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
- The `쿼크 서머리` card currently contains cooldown, heat, durability, range, velocity, and owned special quirk categories. Special categories currently recognized are ECM, jump jets, and NARC duration.

## Optimization Notes

- Treat extracted mech, equipment, loadout, omnipod, and quirk numeric values as effectively static unless there is a specific data update or extraction change.
- Prefer browser-memory caches for repeated derived values such as mech summaries, quirk summaries, hardpoint badges, and weapon quirk lookup indexes.
- Do not persist derived summary/cache values into `public/data/*.json` unless there is a deliberate data-generation reason.
- When optimizing stats views, avoid recalculating all mech rows or rebuilding the full stats list for selection-only changes; update the active row and detail panel from the current rendered entries.
- For weapon-specific quirk matching, build reusable lookup indexes from equipment data instead of repeatedly scanning every weapon for every mech and category.

## JSON Extraction Rules

- Use `tools/extract_mwo_data.py` for deliberate game-data updates. The generated browser data lives in `public/data/index.json`, `mechs.json`, `equipment.json`, `loadouts.json`, `omnipods.json`, `shake_damping_mechs.json`, and `skills.json`.
- A full extraction must refresh `skills.json` from `Libs/MechPilotTalents/MechSkillTreeNodes.xml` and `MechSkillTreeNodesDisplay.xml`, publish it with the other generated datasets, and verify `index.json`'s `skill_nodes` count against the total nodes in every extracted skill category.
- During a deliberate full extraction, detect stock-loadout components that are expected to carry an omnipod but whose source `OmniPod` value is missing or `NULL`. Exclude rear-armor pseudo-components, and list every unresolved mech variant and component in the extraction result report.
- Apply missing-body resolution in this fixed order: exact same-name set; persistent user-confirmed numeric, `normal_body`, or `shared_body` resolution; trailing-character trimming to a normal mech and its exact or recorded resolution; non-normal candidate reporting for a still-unresolved normal mech; then exhaustive partitioning into the two unresolved report sections. Do not skip an earlier deterministic resolution.
- For a missing omnipod, first normalize the mech or stock-loadout name and look for an omnipod whose normalized `set` name is exactly identical and whose `component` is the missing component. If exactly one record matches, assign its current ID automatically and exclude that component from the unresolved report. This exact same-name match is deterministic source data, not a heuristic.
- Before asking about a missing omnipod, consult `tools/omnipod_null_resolutions.json`. If that file already records a user-confirmed source mech or omnipod set for the mech variant and component, resolve the current omnipod ID from the freshly extracted `omnipods.json` and apply it automatically. Do not ask the user again.
- Treat a mech whose `definition.stats.VariantType` is missing or empty as a normal variant and a mech with a non-empty value as a special variant. Normal omnimechs are expected to have complete exact same-name omnipod sets.
- If the user confirms that a normal variant intentionally uses its own chassis body without a numeric omnipod, persist that answer as a `normal_body` resolution. Keep the loadout omnipod value `NULL`, but report it as a resolved normal-body component. Do not automatically classify every normal-variant NULL this way.
- If the user confirms that a component intentionally shares a body used by other omnipods and has no separate numeric omnipod record, persist the confirmed body-set label with `resolution_mode: shared_body`. Keep the loadout value `NULL`, report it as resolved, and do not require that label to exist as a mech or omnipod record. Never infer a shared body without explicit user confirmation.
- If neither an exact same-name match nor a recorded resolution exists, remove one trailing character from the normalized name and try again, regardless of whether the source mech has a type value. Continue one character at a time until the shortened name identifies a normal mech and exactly one omnipod with that `set` and component. Assign the first such match automatically and report the matched normal mech and pod ID. For example, `sns-primes` resolves through `sns-prime`.
- When a shortened name identifies a normal mech with a user-confirmed numeric component mapping, inherit the confirmed mapping automatically if the shortened and derived mech component definitions are identical. Resolve the recorded set against the current omnipod data, report the inheritance separately, and do not ask the user again.
- When a shortened name identifies a normal mech whose corresponding component also has no numeric omnipod, use that normal mech's body only if the normal component has a user-confirmed `normal_body` resolution. Leave the derived loadout value `NULL` and accept it only when the derived and normal mech component definitions are identical; otherwise keep it unresolved or report a blocking data error. For example, `hbr-fc` uses the confirmed `hbr-f` centre torso body.
- A non-normal variant may own the original omnipod set when it was released before a later normal variant. If a normal variant remains unresolved, find longer same-chassis non-normal mech names that begin with the complete normal-variant name and have exactly one matching component pod. Report them separately as possible candidates with candidate mech name, mech ID, `VariantType`, omnipod set, omnipod ID, component-definition equality, and existing stock components that already use the candidate set.
- Possible non-normal candidates are evidence only. Do not assign them, remove the source from the unresolved list, or persist them in `tools/omnipod_null_resolutions.json` until the user explicitly chooses which candidates to apply.
- Split every unresolved-omnipod report into two exhaustive sections: `미확정 - 예상 후보` for entries with one or more candidates and `미확정 - 예상 후보 없음` for entries with none. Always show both headings, even when a section is empty, and place every unresolved mech/component in exactly one section. Nest all candidates under their matching unresolved entry.
- If there is still no unique normal-mech omnipod match after every trailing character has been removed, report the unresolved mech variant and component, show any possible non-normal candidates separately, and ask the user which mech variant or omnipod set it should use. Do not choose by majority, loadout dominance, alphabetical order, presumed release order without source data, or another heuristic.
- Persist every user-confirmed missing-omnipod answer in `tools/omnipod_null_resolutions.json`, keyed by mech variant and component, so later extractions reuse it without another question. Record the source mech, omnipod set, and last confirmed omnipod ID for auditability, but resolve by the current set and component rather than blindly trusting a potentially stale numeric ID.
- Treat `tools/omnipod_null_resolutions.json` as deliberate extraction override data, not generated browser data. Preserve existing entries during extraction, include newly confirmed entries in the extraction-change scope, and report an error instead of silently falling back if a recorded set/component no longer resolves to exactly one current omnipod.
- The local MWO installation is currently `F:\Game\Steam\steamapps\common\MechWarrior Online`. The extractor reads `Game\GameData.pak`, `Game\Localized\English_xml.pak`, and the chassis archives under `Game\mechs\*.pak`.
- A full extraction command is `python tools/extract_mwo_data.py --game-dir "F:\Game\Steam\steamapps\common\MechWarrior Online" --out public\data`.
- Full extraction refreshes every generated dataset from the currently installed game and can include unrelated balance-data or numeric-format changes. For a hardpoint-only refresh that preserves the existing equipment and loadout data, use `python tools/extract_mwo_data.py --game-dir "F:\Game\Steam\steamapps\common\MechWarrior Online" --out public\data --hardpoints-only`.
- Artemis data comes from `Libs/Items/Weapons/Weapons.xml` and `Libs/Items/Modules/Ammo.xml` in `GameData.pak`. Preserve the source attributes in `equipment.json`: weapon `stats.ammoType`, `stats.artemisAmmoType`, and `stats.alwaysHasArtemis`, plus ammo `stats.type` and `stats.numShots`. Do not replace these raw fields with a derived mapping or a hard-coded ammo count.
- Artemis-capable standard weapons and Artemis weapons are separate equipment records and IDs. Their internal-name pairing is `<WeaponName>` and `<WeaponName>_Artemis`. Full-ton ammo pairs are `<AmmoName>` and `<AmmoName>Artemis`; half-ton pairs are `<AmmoName>Half` and `<AmmoName>ArtemisHalf`. Artemis must be inserted before `Half`, never appended after it.
- Applying or removing the Artemis upgrade must replace the installed weapon and ammo IDs in both directions; changing only the displayed label is insufficient. A standard -> Artemis -> standard round trip must restore the original IDs.
- App-side ammo filtering, fitting summaries, and ammo calculations must match normalized ammo `stats.type` against the weapon's active ammo type: use `stats.artemisAmmoType` for an Artemis-capable weapon while the Artemis upgrade is equipped, and `stats.ammoType` otherwise. Weapons marked `stats.alwaysHasArtemis` are not optional-upgrade conversion targets; use their source-declared ammo type.
- Ammo quantities must come from the installed ammo record's `stats.numShots`, including separate full-ton and half-ton values. Do not assume Artemis ammo always has a different quantity from standard ammo. Weapons that share the same normalized active ammo type share a pool; sum the matching bins and divide by the combined `ammoPerShot` when calculating simultaneous volleys.
- Artemis regression checks must cover Inner Sphere and Clan LRM/SRM weapons, full-ton and half-ton ammo, both upgrade directions, the equipment-list filter, and the fitting information-panel totals. After extraction, verify that every extracted standard/Artemis weapon and ammo counterpart referenced by `ammoType`/`artemisAmmoType` exists, and treat missing pairs as extraction or source-data issues rather than silently falling back to display-name substitution.
- Standard and omnipod weapon capacities come from each chassis archive's `*-hardpoints.xml`. Match the MDF or omnipod hardpoint `ID` to `<Hardpoint id="...">` and store the number of direct `<WeaponSlot>` children as `weapon_slots`.
- Normalize hardpoint IDs before matching so numeric IDs with leading zeroes compare equally. For example, XML hardpoint ID `"02"` must match MDF or omnipod hardpoint ID `2`; do not compare their raw string forms.
- The MDF hardpoint `Slots` attribute is not the number of equippable weapons. Do not use it for hardpoint capacity. For example, an MDF value of `Slots="10"` can map to only three `<WeaponSlot>` entries.
- Do not infer maximum hardpoint capacity from the stock loadout. Stock equipment describes installed weapons, not all weapons the chassis can mount.
- App-side hardpoint counts, fitting limits, component badges, mech-list badges, and stats must use `hardpoint.weapon_slots`. Use a fallback of one only when the chassis hardpoint mapping genuinely has no matching entry.
- Preserve raw extracted attributes such as `Slots`; add `weapon_slots` instead of overwriting source fields with a different meaning.
- Hardpoint regression checks: `UM-SC` must be ballistic 2, energy 3, AMS 1; `UM-R60` ballistic 4, energy 2; `UM-R60L` ballistic 2, energy 4; `HBK-4G` ballistic 3; and the `FMT-AL` left-arm omnipod must be energy 3.
- After extraction changes, validate both standard mech definitions and omnipod definitions, run Python and JavaScript syntax checks, run `git diff --check`, and inspect generated-file scope before keeping the result.
