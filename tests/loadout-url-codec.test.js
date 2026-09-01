"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadCodec() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "public", "loadout-url-codec.js"),
    "utf8",
  );
  const context = {
    Uint8Array,
    TextEncoder,
    TextDecoder,
    CompressionStream,
    DecompressionStream,
    Blob,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: "public/loadout-url-codec.js" });
  return context.LoadoutUrlCodec;
}

test("압축 공유 코드는 URL-safe 형식으로 원본 MWO 코드를 왕복한다", async () => {
  const codec = loadCodec();
  const code = "A?:E60B0|Ze|h^|kBp\\@0|iB|iB|iB|iB|iB|iB|iRq\\@0|iB|iB|iB|iB|iB|iB|iRr<0|lBs<0|lBt<0|h^u<0|h^v\\@0w604040";
  const compressed = await codec.encode(code);

  assert.match(compressed, /^z[A-Za-z0-9_-]+$/);
  assert.ok(compressed.length < encodeURIComponent(code).length);
  assert.equal(await codec.decode(compressed), code);
});

test("손상되거나 제한을 넘는 압축 공유 코드는 거부한다", async () => {
  const codec = loadCodec();

  await assert.rejects(codec.decode("z%%%"), /Invalid compressed loadout URL/);
  await assert.rejects(codec.decode(`z${"A".repeat(8193)}`), /Invalid compressed loadout URL/);
});
