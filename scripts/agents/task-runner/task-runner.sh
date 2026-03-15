MapRenderer#!/bin/bash

usage() {
  echo "Usage: task-runner.sh <task-folder> [--provider claude|codex|gemini] [--skip <count>]"
}

TASK_DIR=""
PROVIDER="claude"
SKIP_COUNT=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --provider=*)
      PROVIDER="${1#--provider=}"
      shift
      ;;
    --provider)
      shift
      [ -n "$1" ] || { echo "Error: --provider requires a value."; usage; exit 1; }
      PROVIDER="$1"
      shift
      ;;
    --skip=*)
      SKIP_COUNT="${1#--skip=}"
      shift
      ;;
    --skip)
      shift
      [ -n "$1" ] || { echo "Error: --skip requires a value."; usage; exit 1; }
      SKIP_COUNT="$1"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --*)
      echo "Error: unknown option '$1'"
      usage
      exit 1
      ;;
    *)
      if [ -z "$TASK_DIR" ]; then
        TASK_DIR="$1"
        shift
      else
        echo "Error: unexpected argument '$1'"
        usage
        exit 1
      fi
      ;;
  esac
done

[ -n "$TASK_DIR" ] || { usage; exit 1; }

case "$PROVIDER" in
  claude|codex|gemini) ;;
  *) echo "Error: unknown provider '$PROVIDER'. Use claude, codex, or gemini."; exit 1 ;;
esac

case "$SKIP_COUNT" in
  ''|*[!0-9]*)
    echo "Error: --skip must be a non-negative integer."
    exit 1
    ;;
esac

LOG_FILE="task-runner-$(date '+%Y%m%d-%H%M%S').log"

if [ ! -d "$TASK_DIR" ]; then
  echo "Error: directory '$TASK_DIR' not found"
  exit 1
fi

TASKS=($(ls "$TASK_DIR"/*.md 2>/dev/null | sort))
ORIGINAL_TOTAL=${#TASKS[@]}

if [ "$ORIGINAL_TOTAL" -eq 0 ]; then
  echo "Error: no .md task files found in '$TASK_DIR'"
  exit 1
fi

if [ "$SKIP_COUNT" -gt "$ORIGINAL_TOTAL" ]; then
  echo "Error: --skip ($SKIP_COUNT) is greater than the number of tasks ($ORIGINAL_TOTAL)."
  exit 1
fi

TASKS=("${TASKS[@]:$SKIP_COUNT}")
TOTAL=${#TASKS[@]}

if [ "$TOTAL" -eq 0 ]; then
  echo "Error: no tasks left to run after skipping $SKIP_COUNT file(s)."
  exit 1
fi

SPINNER_PID=""
SPINNER_CHARS="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"

start_spinner() {
  local label="$1"
  (
    while true; do
      for (( i=0; i<${#SPINNER_CHARS}; i++ )); do
        printf "\r\033[36m%s\033[0m %s" "${SPINNER_CHARS:$i:1}" "$label"
        sleep 0.08
      done
    done
  ) &
  SPINNER_PID=$!
}

stop_spinner() {
  if [ -n "$SPINNER_PID" ]; then
    kill "$SPINNER_PID" 2>/dev/null
    wait "$SPINNER_PID" 2>/dev/null
    SPINNER_PID=""
    printf "\r\033[K"
  fi
}

PASS=0
FAIL=0
RESULTS=()

echo ""
echo -e "\033[1m=== task-runner.sh | $TOTAL of $ORIGINAL_TOTAL tasks from $TASK_DIR ===\033[0m"
echo "Log:      $LOG_FILE"
echo "Provider: $PROVIDER ($(which "$PROVIDER" 2>/dev/null || echo 'NOT FOUND'))"
echo "Skip:     $SKIP_COUNT"
echo ""

{
  echo "=== Task Runner Log ==="
  echo "Date:     $(date)"
  echo "Folder:   $TASK_DIR"
  echo "Provider: $PROVIDER"
  echo "Skip:     $SKIP_COUNT"
  echo "All tasks: $ORIGINAL_TOTAL"
  echo "Tasks:    $TOTAL"
  echo ""
} > "$LOG_FILE"

OVERALL_START=$(date +%s)

for idx in "${!TASKS[@]}"; do
  TASK_FILE="${TASKS[$idx]}"
  TASK_NAME=$(basename "$TASK_FILE")
  TASK_NUM=$((idx + 1))
  TASK_CONTENT=$(cat "$TASK_FILE")

  PROMPT="You have a task to complete. Here is the task definition:

$TASK_CONTENT

Complete this task. When done, output a short summary of what you did."

  echo -e "\033[1;33m┌─ [$TASK_NUM/$TOTAL] $TASK_NAME\033[0m  $(date '+%H:%M:%S')"
  echo ""

  TASK_START=$(date +%s)
  start_spinner "$PROVIDER is working on $TASK_NAME..."

  case "$PROVIDER" in
    claude)
      CMD=(env CLAUDECODE= claude -p "$PROMPT" --permission-mode acceptEdits --dangerously-skip-permissions)
      ;;
    codex)
      CMD=(codex exec --dangerously-bypass-approvals-and-sandbox "$PROMPT")
      ;;
    gemini)
      CMD=(gemini --yolo -p "$PROMPT")
      ;;
  esac

  RESPONSE=""
  FIRST_LINE=true
  TMP_FIFO=$(mktemp -u)
  mkfifo "$TMP_FIFO"
  "${CMD[@]}" >"$TMP_FIFO" 2>&1 &
  CMD_PID=$!

  while IFS= read -r line; do
    if [ "$FIRST_LINE" = true ]; then
      stop_spinner
      echo -e "\033[1;32m╔══ ${PROVIDER^} response ══╗\033[0m"
      FIRST_LINE=false
    fi
    echo "  $line"
    RESPONSE+="$line"$'\n'
  done < "$TMP_FIFO"

  wait "$CMD_PID"
  EXIT_CODE=$?
  rm -f "$TMP_FIFO"

  stop_spinner
  TASK_END=$(date +%s)
  TASK_DURATION=$((TASK_END - TASK_START))

  echo -e "\033[1;32m╚══ end of response ══╝\033[0m"
  echo ""

  if [ "$EXIT_CODE" -eq 0 ]; then
    STATUS="PASS"
    PASS=$((PASS + 1))
    echo -e "\033[1;33m└─ [$TASK_NUM/$TOTAL] $TASK_NAME\033[0m  \033[1;32mPASS\033[0m  ${TASK_DURATION}s  $(date '+%H:%M:%S')"
  else
    STATUS="FAIL"
    FAIL=$((FAIL + 1))
    echo -e "\033[1;33m└─ [$TASK_NUM/$TOTAL] $TASK_NAME\033[0m  \033[1;31mFAIL (exit $EXIT_CODE)\033[0m  ${TASK_DURATION}s  $(date '+%H:%M:%S')"
  fi

  RESULTS+=("$STATUS | ${TASK_DURATION}s | $TASK_NAME")

  {
    echo "────────────────────────────────────────"
    echo "Task:     $TASK_NAME ($TASK_NUM/$TOTAL)"
    echo "Status:   $STATUS (exit code: $EXIT_CODE)"
    echo "Duration: ${TASK_DURATION}s"
    echo "Started:  $(date -d @$TASK_START '+%H:%M:%S' 2>/dev/null || date -r $TASK_START '+%H:%M:%S' 2>/dev/null || echo $TASK_START)"
    echo ""
    echo "--- Task Content ---"
    echo "$TASK_CONTENT"
    echo ""
    echo "--- ${PROVIDER^} Response ---"
    echo "$RESPONSE"
    echo ""
  } >> "$LOG_FILE"

  echo ""
done

OVERALL_END=$(date +%s)
OVERALL_DURATION=$((OVERALL_END - OVERALL_START))

echo ""
echo -e "\033[1m╔══════════════════════════════════════╗\033[0m"
echo -e "\033[1m║           SUMMARY                    ║\033[0m"
echo -e "\033[1m╠══════════════════════════════════════╣\033[0m"
printf "\033[1m║\033[0m  Tasks: %-4s  \033[1;32mPass: %-4s\033[0m \033[1;31mFail: %-4s\033[0m\033[1m║\033[0m\n" "$TOTAL" "$PASS" "$FAIL"
echo -e "\033[1m║\033[0m  Total time: ${OVERALL_DURATION}s$(printf '%*s' $((22 - ${#OVERALL_DURATION})) '')\033[1m║\033[0m"
echo -e "\033[1m╠══════════════════════════════════════╣\033[0m"

for r in "${RESULTS[@]}"; do
  IFS='|' read -r stat dur name <<< "$r"
  stat=$(echo "$stat" | xargs)
  dur=$(echo "$dur" | xargs)
  name=$(echo "$name" | xargs)
  if [ "$stat" = "PASS" ]; then
    COLOR="\033[1;32m"
  else
    COLOR="\033[1;31m"
  fi
  printf "\033[1m║\033[0m  ${COLOR}%-4s\033[0m  %-6s  %-22s\033[1m║\033[0m\n" "$stat" "$dur" "$name"
done

echo -e "\033[1m╚══════════════════════════════════════╝\033[0m"
echo ""
echo "Full log: $LOG_FILE"

{
  echo "════════════════════════════════════════"
  echo "SUMMARY"
  echo "Tasks: $TOTAL  Pass: $PASS  Fail: $FAIL"
  echo "Total time: ${OVERALL_DURATION}s"
  echo ""
  for r in "${RESULTS[@]}"; do
    echo "  $r"
  done
  echo "════════════════════════════════════════"
} >> "$LOG_FILE"
