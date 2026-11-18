import fs from "node:fs";
import path from "node:path";

const resultsRoot = path.resolve("evaluation/results");
const modes = ["shell", "mcp"];

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function extractTokensFromExport(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const messages = data.messages ?? data.info?.messages ?? [];
  const totals = { uncached: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0 };

  for (const msg of messages) {
    const parts = msg.parts ?? [];
    for (const part of parts) {
      if (part.type === "step-finish" && part.tokens) {
        totals.uncached += part.tokens.input ?? 0;
        totals.cacheRead += part.tokens.cache?.read ?? 0;
        totals.cacheWrite += part.tokens.cache?.write ?? 0;
        totals.output += part.tokens.output ?? 0;
        totals.reasoning += part.tokens.reasoning ?? 0;
      }
    }
  }
  return totals;
}

function extractTokensFromJsonl(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  const totals = { uncached: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0 };

  for (const line of lines) {
    try {
      const evt = JSON.parse(line);
      if (evt.type === "step_finish" && evt.part?.tokens) {
        const t = evt.part.tokens;
        totals.uncached += t.input ?? 0;
        totals.cacheRead += t.cache?.read ?? 0;
        totals.cacheWrite += t.cache?.write ?? 0;
        totals.output += t.output ?? 0;
        totals.reasoning += t.reasoning ?? 0;
      }
    } catch {
      // ignore non-JSON lines
    }
  }
  return totals;
}

const grouped = new Map();

for (const mode of modes) {
  const dir = path.join(resultsRoot, mode);
  if (!fs.existsSync(dir)) continue;

  const jsonlFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
  for (const file of jsonlFiles) {
    const runId = file.replace(/\.jsonl$/, "");
    const scenario = runId.replace(/-t\d+$/, "");
    const exportPath = path.join(dir, `${runId}-export.json`);
    const mkdocsPath = path.join(dir, `${runId}.mkdocs`);

    const tokens = fs.existsSync(exportPath) && fs.statSync(exportPath).size > 0
      ? extractTokensFromExport(exportPath)
      : extractTokensFromJsonl(path.join(dir, file));

    const mkdocsPass = fs.existsSync(mkdocsPath)
      ? fs.readFileSync(mkdocsPath, "utf8").trim() === "PASS"
      : null;

    const key = `${scenario}::${mode}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ ...tokens, mkdocsPass });
  }
}

console.log("| Scenario | Setup | Structural Pass | Uncached Input | Cached Input | Output (+Reasoning) | Total Active Tokens |");
console.log("| :--- | :--- | :--- | ---: | ---: | ---: | ---: |");

const scenarios = [...new Set([...grouped.keys()].map((k) => k.split("::")[0]))].sort();

for (const scenario of scenarios) {
  for (const mode of modes) {
    const runs = grouped.get(`${scenario}::${mode}`);
    if (!runs) continue;

    const medUncached = median(runs.map((r) => r.uncached));
    const medCached = median(runs.map((r) => r.cacheRead + r.cacheWrite));
    const medOutput = median(runs.map((r) => r.output + r.reasoning));
    const activeTotal = medUncached + medOutput;
    const passes = runs.filter((r) => r.mkdocsPass === true).length;

    console.log(
      `| ${scenario} | ${mode} | ${passes}/${runs.length} | ${medUncached.toLocaleString()} | ${medCached.toLocaleString()} | ${medOutput.toLocaleString()} | ${activeTotal.toLocaleString()} |`
    );
  }
}
