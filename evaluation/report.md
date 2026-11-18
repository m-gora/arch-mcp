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

| Scenario | Setup | Median Accuracy (%) | Structural Pass | Uncached Input | Cached Input | Output (+Reasoning) | Effective Tokens / Pass |
| :--- | :--- | ---: | :--- | ---: | ---: | ---: | ---: |
| **s1-retrieval** | shell | | | | | | |
| | mcp | | | | | | |

## 4. Qualitative Analysis
* **MCP Tool-Schema Overhead (Turn 1 Baseline):** *[Compare Turn 1 input tokens between shell and MCP.]*
* **Where `arch-mcp` Won:** *[Specific traces where structured lookups avoided `grep`/`cat` token burn or prevented formatting errors.]*
* **Where Shell Tools Won:** *[e.g., bulk refactoring or simple 1-file lookups.]*
* **Failure Modes:** *[Hallucinations, missed files, malformed tool calls.]*

## 5. Conclusion & Next Steps
* **Recommendations:** *[When to use `arch-mcp` vs. shell tools.]*
* **Server Improvements:** *[Any tool description tweaks, missing tools, or error-message fixes uncovered during the benchmark.]*
