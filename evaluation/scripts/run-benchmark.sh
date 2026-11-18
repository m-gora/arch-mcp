#!/usr/bin/env bash
set -euo pipefail

MODE="${1:?Usage: ./evaluation/scripts/run-benchmark.sh <shell|mcp> [trials]}"
TRIALS="${2:-3}"
PORT="${OPENCODE_PORT:-4096}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVAL_DIR="${REPO_ROOT}/evaluation"
RESULTS_DIR="${EVAL_DIR}/results/${MODE}"
WORK_DIR="/tmp/arch-mcp-eval"
MKDOCS_BIN="${REPO_ROOT}/.venv/bin/mkdocs"
[[ -x "$MKDOCS_BIN" ]] || MKDOCS_BIN="mkdocs"

mkdir -p "$RESULTS_DIR"

echo "Running mode=${MODE} (${TRIALS} trials/scenario) against http://localhost:${PORT}"
echo "Make sure 'OPENCODE_CONFIG=${EVAL_DIR}/configs/opencode-${MODE}.json opencode serve --port ${PORT}' is running."

for prompt_file in "${EVAL_DIR}"/prompts/*.txt; do
  [[ -e "$prompt_file" ]] || { echo "No .txt prompts found in ${EVAL_DIR}/prompts/"; exit 1; }
  scenario="$(basename "$prompt_file" .txt)"
  prompt_text="$(cat "$prompt_file")"

  for trial in $(seq 1 "$TRIALS"); do
    run_id="${scenario}-t${trial}"
    echo ">>> [${MODE}] ${run_id}"

    # 1. Reset isolated workspace
    rm -rf "$WORK_DIR"
    mkdir -p "$WORK_DIR"
    cp -R "${REPO_ROOT}/docs" "${WORK_DIR}/docs"
    cp "${REPO_ROOT}/mkdocs.yml" "${WORK_DIR}/mkdocs.yml"

    # 2. Run OpenCode headlessly in the isolated workspace
    jsonl_out="${RESULTS_DIR}/${run_id}.jsonl"
    (
      cd "$WORK_DIR"
      opencode run --attach "http://localhost:${PORT}" --format json "$prompt_text" > "$jsonl_out"
    )

    # 3. Export full session JSON (prevents dropped final step_finish events)
    session_id="$(jq -r 'select(.sessionID) | .sessionID' "$jsonl_out" | head -n 1 || true)"
    if [[ -n "$session_id" ]]; then
      opencode export "$session_id" 2>/dev/null > "${RESULTS_DIR}/${run_id}-export.json" || true
    fi

    # 4. Structural check via MkDocs strict build
    mkdocs_status="PASS"
    if ! (cd "$WORK_DIR" && "$MKDOCS_BIN" build --strict -d "${WORK_DIR}/_site" > /dev/null 2>&1); then
      mkdocs_status="FAIL"
    fi
    echo "$mkdocs_status" > "${RESULTS_DIR}/${run_id}.mkdocs"
  done
done

echo "Done. Results saved to ${RESULTS_DIR}"
