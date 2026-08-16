const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const loadouts = JSON.parse(fs.readFileSync(
  path.join(__dirname, "..", "public", "data", "loadouts.json"),
  "utf8",
));

test("MDF-declared fixed CT omnipods are preserved in generated loadouts", () => {
  const expected = {
    "exe-b-c": 31433,
    "hbr-f": 30755,
    "hbr-fc": 30755,
    "mdd-silgd": 31579,
    "vpr-sc": 31402,
  };

  for (const [mechName, omnipodId] of Object.entries(expected)) {
    assert.equal(
      loadouts[mechName]?.components?.centre_torso?.omnipod,
      omnipodId,
      `${mechName} centre_torso must keep MDF OmniPod ${omnipodId}`,
    );
  }
});
