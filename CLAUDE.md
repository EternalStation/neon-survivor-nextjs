# Project Rules & Guidelines

This document contains the core rules that the AI assistant must follow for every change, suggestion, or implementation.

## 1. File Length & Modularization
- **Maximum Line Limit**: No file should exceed **800 lines**.
- **Post-Edit Verification**: After every edit, verify if the file length has exceeded this limit.
- **Rule**: If a file exceeds (or is approaching) 800 lines, it must be split into logical sub-modules or parts.
- **Goal**: Facilitate easier navigation, maintainability, and more efficient AI processing (matching the 800-line tool visibility limit).
## 2. Do not leave any comments in the code, and delete any you find!
## 3. Documentation Rules in `docs/` folder:
- **New Features**: If adding a completely new mechanic, enemy, class, or any other feature, create a new description file in the `docs` folder (or appropriate subfolder like `docs/mechanics`, `docs/enemies`, etc.).
- **Existing Features**: If editing an existing feature, update its corresponding documentation file in the `docs` folder.
- **Missing Documentation**: If a feature being edited does not yet have a documentation file, you must create one that describes its functionality, class, or mechanics.
- **Goal**: Maintain a comprehensive and up-to-date archive of all game mechanics, classes, and enemies.
## 4. Avoid any and unknown typization in the code.
## 5. Do NOT edit Russian translations (ru) in any file until explicitly told otherwise by the user. Leave all existing Russian translation strings as they are.
## 6. Don't push any changes to the repository, until I say so.
