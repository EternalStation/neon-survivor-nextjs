'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'en' | 'ru';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('game_language');
            if (saved === 'ru' || saved === 'en') return saved;
        } catch { }
        return 'en';
    });

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('game_language', lang);
        } catch { }
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

/** Read current language without React context (for use inside non-React hooks/logic) */
export const getStoredLanguage = (): Language => {
    try {
        const saved = localStorage.getItem('game_language');
        if (saved === 'ru' || saved === 'en') return saved;
    } catch { }
    return 'en';
};
