import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../lib/translations';

interface LanguageSelectorProps {
  theme?: 'light' | 'dark';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ theme = 'dark' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const buttonClass = theme === 'dark' 
    ? "flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all active:scale-90"
    : "flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-all active:scale-90";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        aria-label="Select language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-2xl">{currentLanguage?.flag}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-20 animate-fade-in-down" role="menu">
          <ul>
            {languages.map(lang => (
              <li key={lang.code} className="p-1">
                <button
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className="w-full text-left flex items-center p-2 rounded-md hover:bg-gray-100 active:bg-gray-200"
                  role="menuitem"
                >
                  <span className="mr-3 text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-800">{lang.name}</span>
                  {language === lang.code && <span className="ml-auto text-primary font-bold">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
