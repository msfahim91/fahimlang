#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { run } = require("../src/index");

function printUsage() {
  console.log(`FahimLang (fahimlang) — চালানোর নিয়ম:

  fahim <file.fm>        ফাইলের কোড রান করো
  fahim --version        version দেখাও
  fahim --help           এই সাহায্য বার্তা

উদাহরণ:
  fahim examples/hello.fm
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    const pkg = require("../package.json");
    console.log(`fahimlang v${pkg.version}`);
    process.exit(0);
  }

  const filePath = args[0];
  const resolved = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolved)) {
    console.error(`Error: file khuje pawa jay nai -> ${resolved}`);
    process.exit(1);
  }

  if (!resolved.endsWith(".fm")) {
    console.error("Warning: FahimLang file er extension '.fm' howa uchit.");
  }

  const source = fs.readFileSync(resolved, "utf8");

  try {
    run(source);
  } catch (err) {
    console.error(`FahimLang Error: ${err.message}`);
    process.exit(1);
  }
}

main();
