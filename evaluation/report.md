# arc42 Documentation Evaluation: Shell Tools vs. `arch-mcp`

## 1. Executive Summary

- **Hypothesis:** Using `arch-mcp` helps a coding harness browse and edit arc42 documentation more accurately and with fewer active tokens than standard shell tools.
- **Verdict:** **Partially supported.** Across five scenarios, MCP used fewer median active tokens in four and substantially improved the bulk-refactor result. It used more tokens for the Section 5/7 audit. Structural validation alone does not establish semantic accuracy, so the accuracy part of the hypothesis remains unproven.
- **Key takeaway:** MCP was most valuable for the cross-document bulk refactor, where its median active-token total was about half the shell result and all three runs built successfully. For a focused audit, shell was cheaper in these trials. Treat the results as directional: only three trials were run per scenario and no independent content-accuracy rubric was applied.

## 2. Experimental Setup

- **Corpus:** `docs/` — 40 Markdown files and 1,242 lines in the checked-in corpus.
- **Tasks:** Section 2 constraint retrieval; cross-section quality-goal synthesis; a surgical ADR/glossary update; a Section 5/7/12 consistency audit; and a bulk terminology refactor.
- **Harness and model:** OpenCode. The actual OpenCode version and model are **not recoverable from the saved artifacts**: the configs contain the placeholder `provider/model`, and the JSONL records do not capture version metadata.
- **Trials:** Three runs per scenario and setup, with `run-benchmark.sh` resetting `/tmp/arch-mcp-eval` and copying in `docs/` and `mkdocs.yml` before each run.
- **Structural validation:** `mkdocs build --strict`, recorded as `PASS` or `FAIL` by the benchmark script after each run.
- **Scoring limitation:** No independent semantic-accuracy score was recorded. The structural pass rate measures whether the site builds, not whether answers or edits satisfy every task requirement.

## 3. Quantitative Results

Medians across the three trials. “Cached Input” is cache-read plus cache-write tokens. “Output (+Reasoning)” combines those token categories. **Total Active Tokens** is the median uncached input plus the median output/reasoning; cached input is excluded. It is the sum of category medians, not the median of per-run totals.

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

Across the five scenario-level medians, MCP totals 60,949 active tokens versus 77,540 for shell, a **21.4% reduction**. MCP uses fewer active tokens in four of five scenarios. Structural validation passes in **15/15 MCP runs** and **14/15 shell runs** (29/30 overall); the only failure is shell `s5-bulk-refactor-t1`.

## 4. Qualitative Analysis

- **Tool-schema overhead:** The early cached-context figures are close in the paired traces where they are available (about 7,100 tokens for shell and 7,104 for MCP). This suggests little fixed MCP overhead in these runs, but some logs begin with incomplete/atypical token events, so the difference should not be treated as a precise schema-cost measurement.
- **Where `arch-mcp` helped:** The clearest result is `s5-bulk-refactor`: MCP reduced median active tokens by about **49%** and passed structural validation in all three trials, compared with two of three shell trials. The other MCP token reductions were smaller: about 5% for retrieval, 13% for synthesis, and 2% for the surgical write. The task traces show both setups locating and editing documentation; the benchmark does not isolate which individual MCP operation caused the savings.
- **Where shell was better:** For `s4-audit`, shell used about **21% fewer** active tokens than MCP (8,006 vs. 10,091). In the MCP audit traces, exploration and response generation were more expensive; this is a workload-specific result, not evidence that shell is generally better for audits.
- **Failure and reporting caveats:** Shell `s5-bulk-refactor-t1` is the only recorded MkDocs failure. Some assistant final messages say MkDocs could not be run even when the external benchmark marker is `PASS`; use the recorded validator result rather than those claims. Conversely, a passing build does not verify complete renaming, correct citations, or edit scope. The benchmark currently has no independent semantic review, and its saved artifacts do not identify the model/version.

## 5. Conclusion & Next Steps

- **Recommendations:** Prefer MCP for broad, structured documentation changes where cross-file consistency matters, based on the strong bulk-refactor result. Either setup is reasonable for retrieval, synthesis, and a small targeted edit—the observed savings there are modest. For the tested Section 5/7 audit, shell was more token-efficient. Do not equate build success with task correctness.
- **Improve the evaluation:** Record the exact OpenCode version, provider/model, and config revision with each run. Add a task-specific semantic checklist or blinded human review (including completeness, citation correctness, and unintended edits), and retain per-trial validation details so failures can be diagnosed rather than represented only as `PASS`/`FAIL`. Repeat more trials before drawing general conclusions.
- **Server and harness follow-up:** The bulk-refactor result is a promising use case to retain in regression benchmarks. The audit result suggests investigating whether the MCP guidance or audit workflow can reduce repeated exploration. Also make the benchmark’s validator outcome the single source of truth in reports, since model-generated summaries can misstate whether validation ran.
