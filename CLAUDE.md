# Project Rules & Guidelines

This document contains the core rules that the AI assistant must follow for every change, suggestion, or implementation.

## 1. File Length & Modularization
- **Maximum Line Limit**: No file should exceed **800 lines**.
- **Post-Edit Verification**: After every edit, verify if the file length has exceeded this limit.
- **Rule**: If a file exceeds (or is approaching) 800 lines, it must be split into logical sub-modules or parts.
- **Goal**: Facilitate easier navigation, maintainability, and more efficient AI processing (matching the 800-line tool visibility limit).
## 2. Do not leave any comments in the code, and delete any you find!
## 3. Describe all changes and new functionality in the docs folder in the project root.