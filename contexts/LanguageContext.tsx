'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Initialize with a function to avoid hydration mismatch
  const [language, setLanguageState] = useState<Language>(() => {
    // Only access localStorage on client-side
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
        return savedLanguage;
      }
    }
    // Default to English for both server and initial client render
    return 'en';
  });

  const [initialized, setInitialized] = useState(() => {
    // Check if we're on client and have localStorage
    return typeof window === 'undefined';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Only access localStorage on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // Change i18next language
      i18n.changeLanguage(lang);
      // Update document direction
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
  };

  useEffect(() => {
    // This effect should only run once on client-side to ensure i18n is initialized
    if (typeof window !== 'undefined' && !initialized) {
      // Ensure i18n is set to the correct language
      i18n.changeLanguage(language);
      // Update document properties
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      setInitialized(true);
    }
  }, [language, initialized]);
  
  // Effect to update document properties when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Update document direction and language
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
    }
  }, [language, direction]);

  const value: LanguageContextType = {
    language,
    direction,
    setLanguage,
    toggleLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { LanguageContext };
