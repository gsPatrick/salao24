
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, languages } from '../lib/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('pt'); // Default language

  useEffect(() => {
    document.documentElement.lang = language;
    const currentLang = languages.find(l => l.code === language);
    document.documentElement.dir = currentLang?.dir || 'ltr';
  }, [language]);

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const langTranslations = translations[language as keyof typeof translations] || translations.pt;
    let translation = langTranslations[key as keyof typeof langTranslations] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
