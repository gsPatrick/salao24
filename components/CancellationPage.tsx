import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CancellationPageProps {
  onLogout: () => void;
}

const CancellationPage: React.FC<CancellationPageProps> = ({ onLogout }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto mb-6">
          <svg className="w-24 h-24 text-primary" fill="none" viewBox="0 0 52 52">
            <circle className="animate-scale-in stroke-current text-primary/20" cx="26" cy="26" r="25" strokeWidth="4"/>
            <path 
                className="animate-draw-check stroke-current" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ strokeDasharray: 34, strokeDashoffset: 34 }}
                d="M14 27l8 8 16-16"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-secondary mb-4">{t('cancellationSuccessTitle')}</h2>
        <p className="text-gray-600 mb-8">{t('cancellationSuccessMessage')}</p>
        <button
          onClick={onLogout}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-8 py-3 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {t('cancellationReturnHome')}
        </button>
      </div>
    </div>
  );
};

export default CancellationPage;