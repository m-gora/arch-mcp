# arc42 Documentation Evaluation: Shell Tools vs. `arch-mcp`

## 1. Executive Summary
* **Hypothesis:** Using `arch-mcp` enables a coding harness to browse and manipulate arc42 architecture documentation with higher accuracy and lower token consumption than standard shell tools.
* **Verdict:** *[Supported / Partially Supported / Refuted]*
* **Key Takeaway:** *[1–2 sentences summarizing when MCP wins vs. when shell tools win.]*

## 2. Experimental Setup
* **Repository:** `arch-mcp/docs` (*X* Markdown files, *Y* total lines)
* **Harness & Model:** OpenCode `vX.Y.Z`, Model: `provider/model`
* **Trials:** 3 isolated runs per scenario per setup (fresh `/tmp/arch-mcp-eval` workspace per trial)
* **Structural Validation:** `mkdocs build --strict`

## 3. Quantitative Results (Medians across 3 Trials)
*(Paste output of `node evaluation/scripts/parse-tokens.mjs` here and add your Accuracy % and Effective Tokens / Pass columns.)*

| Scenario | Setup | Structural Pass | Uncached Input | Cached Input | Output (+Reasoning) | Total Active Tokens |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: |
| s1-retrieval | shell | 3/3 | 9,839 | 32,303 | 309 | 10,148 |
| s1-retrieval | mcp | 3/3 | 9,264 | 25,182 | 338 | 9,602 |
| s2-synthesis | shell | 3/3 | 11,716 | 44,005 | 1,236 | 12,952 |
| s2-synthesis | mcp | 3/3 | 9,632 | 43,571 | 1,603 | 11,235 |
| s3-surgical-write | shell | 3/3 | 11,040 | 65,354 | 2,813 | 13,853 |
| s3-surgical-write | mcp | 3/3 | 10,971 | 64,969 | 2,546 | 13,517 |
| s4-audit | shell | 3/3 | 6,745 | 67,752 | 1,261 | 8,006 |
| s4-audit | mcp | 3/3 | 8,510 | 67,895 | 1,581 | 10,091 |
| s5-bulk-refactor | shell | 2/3 | 24,528 | 198,861 | 8,053 | 32,581 |
| s5-bulk-refactor | mcp | 3/3 | 13,393 | 81,957 | 3,111 | 16,504 |

## 4. Qualitative Analysis
* **MCP Tool-Schema Overhead (Turn 1 Baseline):** *[Compare Turn 1 input tokens between shell and MCP.]*
* **Where `arch-mcp` Won:** *[Specific traces where structured lookups avoided `grep`/`cat` token burn or prevented formatting errors.]*
* **Where Shell Tools Won:** *[e.g., bulk refactoring or simple 1-file lookups.]*
* **Failure Modes:** *[Hallucinations, missed files, malformed tool calls.]*

## 5. Conclusion & Next Steps
* **Recommendations:** *[When to use `arch-mcp` vs. shell tools.]*
* **Server Improvements:** *[Any tool description tweaks, missing tools, or error-message fixes uncovered during the benchmark.]*
