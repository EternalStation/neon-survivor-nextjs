# UI Translation System

The translation system in Neon Survivor handles multi-language support (English and Russian) for all user interface elements.

## Architecture

To maintain code quality and manageability, the UI translations are modularized into separate parts. The main interface is located at `src/lib/UiTranslations.ts`, which aggregates specific language modules.

### Modular Structure

- **Core Module**: `src/lib/UiTranslations.ts`
  - Defines the `Language` type (`'en' | 'ru'`).
  - Exports `UI_TRANSLATIONS` which combines all part-based modules.
  - Provides the `getUiTranslation(lang)` utility function.

- **Language Parts**:
  - `src/lib/translations/ui/EnTranslationsPart1.ts`: Primary English UI (Menus, Leaderboard, Settings, HUD).
  - `src/lib/translations/ui/EnTranslationsPart2.ts`: Secondary English UI (Arenas, Stats, Recalibration, Matrix).
  - `src/lib/translations/ui/RuTranslationsPart1.ts`: Primary Russian UI.
  - `src/lib/translations/ui/RuTranslationsPart2.ts`: Secondary Russian UI.

## Guidelines

- **File Length**: No single translation file should exceed 800 lines. If a part grows beyond this limit, it must be further subdivided.
- **Key Consistency**: New translation keys must be added to all language parts simultaneously to prevent UI errors.
- **Comments**: No comments are permitted within the translation files.
- **Naming**: Use PascalCase for all part filenames.
