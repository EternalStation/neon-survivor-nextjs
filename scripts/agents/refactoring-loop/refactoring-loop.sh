#!/bin/bash

RUNS=10
PROMPT="Identify one file for refactoring based on these criteria:1. Replace inline styles with CSS.2. Implement strict typing.Then refactor this file."

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

echo ""
echo "\033[1m=== run_loop.sh | $RUNS runs ===\033[0m"
echo "Dir:    $(pwd)"
echo "Claude: $(which claude 2>/dev/null || echo 'NOT FOUND')"
echo ""

for i in $(seq 1 $RUNS); do
  echo "\033[1;33m┌─ Task $i/$RUNS\033[0m  $(date '+%H:%M:%S')"
  echo ""

  start_spinner "Claude is thinking..."

  FIRST_LINE=true
  claude -p "$PROMPT" --permission-mode acceptEdits 2>&1 | while IFS= read -r line; do
    if [ "$FIRST_LINE" = true ]; then
      stop_spinner
      echo "\033[1;32m╔══ Claude response ══╗\033[0m"
      FIRST_LINE=false
    fi
    echo "  $line"
  done

  stop_spinner
  EXIT_CODE=${PIPESTATUS[0]}

  echo "\033[1;32m╚══ end of response ══╝\033[0m"
  echo ""
  echo "\033[1;33m└─ Task $i done\033[0m  exit: $EXIT_CODE  $(date '+%H:%M:%S')"
  echo ""
done

echo "\033[1m=== All $RUNS tasks completed ===\033[0m"
