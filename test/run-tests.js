"use strict";
// Simple smoke test: run all example .fm files and make sure none of them throw.
const fs = require("fs");
const path = require("path");
const { run } = require("../src/index");

const examplesDir = path.join(__dirname, "..", "examples");
const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".fm"));

let failed = 0;
for (const file of files) {
  const fullPath = path.join(examplesDir, file);
  const source = fs.readFileSync(fullPath, "utf8");
  try {
    run(source, { output: () => {} }); // silence output during test
    console.log(`PASS  ${file}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${file} -> ${err.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed.`);
  process.exit(1);
} else {
  console.log(`\nSob (${files.length}) examples thik moto cholche! ✅`);
}
