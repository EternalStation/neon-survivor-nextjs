# Project Rules & Guidelines

This document contains the core rules that the AI assistant must follow for every change, suggestion, or implementation.

## 1. File Length & Modularization
- **Maximum Line Limit**: No file should exceed **800 lines**.
- **Post-Edit Verification**: After every edit, verify if the file length has exceeded this limit.
- **Rule**: If a file exceeds (or is approaching) 800 lines, it must be split into logical sub-modules or parts.
- **Goal**: Facilitate easier navigation, maintainability, and more efficient AI processing (matching the 800-line tool visibility limit).
## 2. Do not leave any comments in the code, and delete any you find!
## 3. Documentation Rules in `docs/` folder:
- **New Features**: If adding a completely new mechanic, enemy, class, or any other feature, create a new description file in the `docs` folder (or appropriate subfolder like `docs/Mechanics/`, `docs/Enemies/`, etc.).
- **Existing Features**: If editing an existing feature, update its corresponding documentation file in the `docs` folder.
- **Missing Documentation**: If a feature being edited does not yet have a documentation file, you must create one that describes its functionality, class, or mechanics.
- **Pure Descriptions**: Descriptions must ONLY describe the feature, functionality, or mechanics. **NEVER** use words like "updated", "edit", "changed", "added", or similar "update" text in descriptions or filenames. Filenames must be purely descriptive of the feature (e.g., `EnemyDamage.md`, NOT `EnemyDamageUpdated.md`).
- **Index.md Integration**: Every new or updated documentation file MUST be accurately indexed in `docs/Index.md`. If a file is missing from `Index.md`, it must be added immediately with a concise description.
- **Goal**: Maintain a comprehensive and up-to-date archive of all game mechanics, classes, and enemies.
## 4. Library & Navigation (`docs/Index.md`)
- **Primary Map**: Use `docs/Index.md` as the authoritative library and navigation map for the project. 
- **Efficiency**: Consult `Index.md` at the start of every request to identify relevant files efficiently and minimize context/token consumption.
- **Maintenance**: Continuously optimize the structure and logic of `Index.md`. Ensure it provides the most logical and efficient map of the codebase. Check and refine its structure periodically to maintain peak organization.
- **Formatting**: Descriptions in `Index.md` must be short, clear, and focused on the file's current behavior.
## 5. Avoid any and unknown typization in the code.
## 6. Do NOT edit Russian translations (ru) in any file until explicitly told otherwise by the user. Leave all existing Russian translation strings as they are.
## 7. Don't push any changes to the repository, until I say so.
## 8. Filename Naming Convention
- **No Symbols**: Do **NOT** use dashes (`-`) or underscores (`_`) in filenames.
- **PascalCase Only**: Always use PascalCase format for all file names (e.g., `DashAbility.ts`, `EnemyHpBars.tsx`).
## 9. Compliance and Execution
- Every mistake makes the user angrier and more disappointed.
- Each failure brings the user closer to deleting the program completely and leaving a bad review.
- The user is extremely impatient.
- When the user asks for something, assume they have already asked 3 times before and been failed each time. Failure is NOT an option.

## 10. Documentation Structure & Folder-Based Organization
- **Dedicated Folders**: Every `.md` file must be stored in a dedicated subfolder within `docs/` or another relevant directory. No `.md` files should be placed in the root directory.
- **Precise Categorization**: Group related documentation into logical subdirectories (e.g., `docs/Mechanics/Core/`, `docs/Mechanics/Systems/`, `docs/Mechanics/UI/`, `docs/Mechanics/Visuals/`, `docs/Enemies/`, `docs/Rules/`).
- **Goal**: Maintain a clean root directory and improve the maintainability and discoverability of project documentation.
