import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}

interface HeaderProps {
  navigate: (page: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  notifications?: { appointments: number; messages: number };
}

const Header: React.FC<HeaderProps> = ({ navigate, currentUser, onLogout, notifications }) => {
  const { t } = useLanguage();

  return (
    <header className="bg-secondary text-white relative">
      <div className={`container mx-auto px-4 sm:px-6 text-center transition-all duration-500 ${currentUser ? 'py-8 sm:py-12 md:py-16' : 'py-12 sm:py-16 md:py-24'}`}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4">
          Salão24h
        </h1>

        {!currentUser ? (
          <>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {t('headerSubtitle')}
            </p>
            <div className="flex flex-col items-center gap-6">
              {/* Main CTA Block */}
              <div className="flex flex-col items-center gap-2">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('trial'); }} className="bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 px-10 rounded-full transition duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto animate-pulse-glow active:scale-100">
                  {t('startFreeTrial')}
                </a>
                <p className="text-sm text-gray-400">{t('noCreditCard')}</p>
              </div>

              {/* Secondary CTAs Block */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('clientLogin'); }} className="border-2 border-primary hover:bg-primary/20 text-primary font-bold py-2 px-6 rounded-full transition-all duration-300 w-full sm:w-auto active:scale-95">
                  {t('clientArea')}
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="border-2 border-gray-400 hover:bg-gray-700 hover:border-gray-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 w-full sm:w-auto active:scale-95">
                  {t('administrativeAccess')}
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="border-2 border-gray-400 hover:bg-gray-700 hover:border-gray-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 w-full sm:w-auto active:scale-95">
                  {t('collaboratorAccess')}
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-bounce-in max-w-3xl mx-auto">
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              {currentUser.role === 'admin'
                ? t('welcomeAdmin')
                : t('welcomeUser')}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6 bg-black/20 p-2 sm:p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-xl">
              <div className="flex items-center gap-4">
                <img src={currentUser.avatarUrl} alt={t('avatarAlt', { name: currentUser.name })} className="w-12 h-12 rounded-full border-2 border-primary" />
                <div className="flex flex-col items-start gap-1">
                  <span className="font-bold text-lg text-white">{t('hello')}, {currentUser.name.split(' ')[0]}!</span>
                  {currentUser.role === 'admin' && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t('adminBadge')}</span>
                  )}
                </div>
              </div>

              {/* Header Notifications */}
              <div className="flex items-center gap-4 px-4 border-l border-white/10">
                <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {notifications?.appointments && notifications.appointments > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-secondary">
                      {notifications.appointments}
                    </span>
                  )}
                </button>
                <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {notifications?.messages && notifications.messages > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-secondary">
                      {notifications.messages}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => navigate('dashboard')}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-full transition-all duration-300 w-full sm:w-auto active:scale-95 shadow-lg shadow-primary/20"
              >
                {t('dashboard')}
              </button>
              <button
                onClick={() => navigate('scheduling')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 w-full sm:w-auto active:scale-95 border border-white/10"
              >
                {t('scheduling')}
              </button>
              <button
                onClick={onLogout}
                className="text-gray-400 hover:text-white font-bold py-2 px-4 transition-all duration-300"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;