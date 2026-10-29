// Used by parity_check.py. Runs the website's TypeScript engine on a list of cases.
// Needs Node 22.6 or newer (it reads the .ts file directly).
import { readFileSync, writeFileSync } from "node:fs";
import { triage } from "../frontend/lib/engine.ts";

const [casesPath, kbPath, outPath] = process.argv.slice(2);
const cases = JSON.parse(readFileSync(casesPath, "utf-8"));
const kb = JSON.parse(readFileSync(kbPath, "utf-8"));

const out = cases.map((c) => {
  try {
    return triage(kb, c);
  } catch (e) {
    return { error: String(e.message) };
  }
});
writeFileSync(outPath, JSON.stringify(out));
