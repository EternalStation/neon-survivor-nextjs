import { enPart1 } from './translations/ui/EnTranslationsPart1';
import { enPart2 } from './translations/ui/EnTranslationsPart2';
import { ruPart1 } from './translations/ui/RuTranslationsPart1';
import { ruPart2 } from './translations/ui/RuTranslationsPart2';

export type Language = 'en' | 'ru';

export const UI_TRANSLATIONS = {
    en: {
        ...enPart1,
        ...enPart2
    },
    ru: {
        ...ruPart1,
        ...ruPart2
    }
};

export const getUiTranslation = (lang: Language) => UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
