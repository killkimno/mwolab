const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("검색 대상 페이지는 sitemap과 일치하는 canonical URL을 선언한다", () => {
  const index = read("public/index.html");
  const privacy = read("public/privacy.html");
  const sitemap = read("public/sitemap.xml");

  assert.match(
    index,
    /<link rel="canonical" href="https:\/\/kmonkeyhead\.github\.io\/mwolab\/">/,
  );
  assert.match(
    privacy,
    /<link rel="canonical" href="https:\/\/kmonkeyhead\.github\.io\/mwolab\/privacy\.html">/,
  );
  assert.match(sitemap, /<loc>https:\/\/kmonkeyhead\.github\.io\/mwolab\/<\/loc>/);
  assert.match(
    sitemap,
    /<loc>https:\/\/kmonkeyhead\.github\.io\/mwolab\/privacy\.html<\/loc>/,
  );
});
