import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const declarations = (selector) => [...css.matchAll(new RegExp(`(?:^|\\n)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^{}]*)\\}`, "g"))].map((match) => match[1]);

test("question options stay readable and consistent at all viewport widths", () => {
  const grid = declarations(".scale");
  assert.equal(grid.length, 1, "the numeric grid must not be squeezed again at a breakpoint");
  assert.match(grid[0], /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(declarations(".scale--choices").join("\n"), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);

  const label = declarations(".scale__label").join("\n");
  assert.match(label, /min-height:\s*3(?:\.\d+)?rem/);
  assert.match(label, /font-size:\s*1rem/);
  assert.match(label, /line-height:\s*1\.\d+/);
  assert.match(label, /overflow-wrap:\s*anywhere/);
  assert.equal(declarations(".scale--choices .scale__label").length, 0, "text choices should share the same option styling");
  assert.match(css, /\.scale__input:checked \+ \.scale__label\s*\{/);
  assert.match(css, /\.scale__input:focus-visible \+ \.scale__label\s*\{/);
});
