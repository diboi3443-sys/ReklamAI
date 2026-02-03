import * as React from "react";
import type { TranslationKeys } from "./translations/types";
import { ru } from "./translations/ru";
import { en } from "./translations/en";
export type Language = "ru" | "en";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const translations: Record<Language, TranslationKeys> = {
  ru,
  en,
};

const LanguageContext = React.createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "reklamai-language";

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = "ru" }: LanguageProviderProps) {
  const [language, setLanguageState] = React.useState<Language>(() => {
    if (typeof window === "undefined") return defaultLanguage;
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored || defaultLanguage;
  });

  const setLanguage = React.useCallback((lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
    // Update document lang attribute for accessibility
    document.documentElement.lang = lang;
  }, []);

  // Set initial lang attribute
  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Shorthand hook for translations only
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
