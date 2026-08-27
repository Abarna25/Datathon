import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import translations from '../translations/translations';
import { clearTranslationCache } from '../services/translationService';

const LanguageContext = createContext();

/** All supported language codes and their display labels */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN',     nativeLabel: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ', nativeLabel: 'Kannada' },
  { code: 'hi', label: 'हिन्दी', nativeLabel: 'Hindi'   }
];

const VALID_CODES = SUPPORTED_LANGUAGES.map(l => l.code);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('vikshana_lang');
      return VALID_CODES.includes(stored) ? stored : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vikshana_lang', language);
      document.documentElement.lang = language;
    } catch (e) {
      console.warn('[LanguageContext] Failed to persist language choice:', e);
    }
  }, [language]);

  const switchLanguage = useCallback((lang) => {
    if (!VALID_CODES.includes(lang)) return;
    // Clear the translation cache so stale entries from a previous language
    // don't bleed into the new language selection.
    clearTranslationCache();
    setLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'kn' : 'en';
      clearTranslationCache();
      return next;
    });
  }, []);

  /**
   * Helper function to retrieve nested translation strings by path.
   * Example: t('nav.dashboard') -> "Dashboard" or "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್"
   *
   * For languages without a static translation dictionary (hi, ta), the
   * static strings fall back to English while dynamic content goes through
   * the Zia API via useTranslateDynamic.
   */
  const t = useCallback((path, fallback = '') => {
    if (!path) return fallback;
    const keys = path.split('.');
    // Prefer exact language; fall back to English
    const langDict = translations[language] || translations['en'];
    let result = langDict;

    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        // Fallback to English if key missing in chosen language
        let enResult = translations.en;
        for (const k of keys) {
          if (enResult && enResult[k] !== undefined) enResult = enResult[k];
          else return fallback || path;
        }
        return enResult || fallback || path;
      }
    }

    return typeof result === 'string' ? result : (fallback || path);
  }, [language]);

  const value = {
    language,
    isKannada: language === 'kn',
    isEnglish: language === 'en',
    supportedLanguages: SUPPORTED_LANGUAGES,
    switchLanguage,
    toggleLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;

