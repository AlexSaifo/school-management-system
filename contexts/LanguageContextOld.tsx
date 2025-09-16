'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntlProvider, useIntl } from 'react-intl';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  formatMessage: (descriptor: { id: string; defaultMessage?: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('ar'); // Default to Arabic
  const [messages, setMessages] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
  };

  const loadMessages = async (lang: Language) => {
    try {
      const response = await import(`../messages/${lang}.json`);
      setMessages(response.default);
    } catch (error) {
      console.error(`Failed to load messages for language: ${lang}`, error);
    }
  };

  useEffect(() => {
    // Load saved language from localStorage or use default
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Load messages when language changes
    loadMessages(language).then(() => {
      setIsLoading(false);
    });
    
    // Update document direction and language
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <IntlProvider
      locale={language}
      messages={messages}
      defaultLocale="ar"
    >
      <LanguageContextProvider 
        language={language}
        direction={direction}
        setLanguage={setLanguage}
        toggleLanguage={toggleLanguage}
        isRTL={isRTL}
      >
        {children}
      </LanguageContextProvider>
    </IntlProvider>
  );
}

function LanguageContextProvider({ 
  children, 
  language, 
  direction, 
  setLanguage, 
  toggleLanguage, 
  isRTL 
}: {
  children: React.ReactNode;
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
}) {
  const intl = useIntl();

  const value: LanguageContextType = {
    language,
    direction,
    setLanguage,
    toggleLanguage,
    isRTL,
    formatMessage: intl.formatMessage,
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
