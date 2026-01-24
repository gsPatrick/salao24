import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YouTubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-4.481 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.59-11.018-3.714v-2.155z" />
  </svg>
);

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.55-1.97-1.9-4.42-1.12-6.66.79-2.26 2.66-4.01 5.02-4.41 2.37-.39 4.74.27 6.38 2.05.02 1.94-.01 3.88.02 5.82-.02.38-.06.77-.11 1.15-.36-1.16-.9-2.27-1.74-3.23-1.03-1.19-2.41-1.99-3.95-2.23-.49-.08-.98-.1-1.48-.05-1.28.12-2.5.6-3.56 1.45-1.12.92-1.84 2.22-1.88 3.61-.04 1.63.8 3.14 2.16 3.91 1.25.71 2.75.8 4.12.31.14-.05.28-.1.42-.16-.01-1.93.01-3.85-.02-5.77-.01-1.19.43-2.35 1.29-3.24.81-.84 1.88-1.34 2.99-1.42.34-.02.68-.04 1.02-.02z" />
  </svg>
);

interface FooterProps {
  navigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-white py-8">
      <div className="container mx-auto px-6 text-center">
        <div className="flex justify-center gap-4 sm:gap-6 mb-4">
          <a href="https://instagram.com/salao24h" target="_blank" rel="noopener noreferrer" aria-label={t('followInstagram')} className="text-gray-400 hover:text-primary transition-colors duration-300">
            <InstagramIcon />
          </a>
          <a href="https://youtube.com/@salao24h" target="_blank" rel="noopener noreferrer" aria-label={t('followYoutube')} className="text-gray-400 hover:text-primary transition-colors duration-300">
            <YouTubeIcon />
          </a>
          <a href="https://www.linkedin.com/company/sal%C3%A3o24h/about/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label={t('followLinkedIn')} className="text-gray-400 hover:text-primary transition-colors duration-300">
            <LinkedInIcon />
          </a>
          <a href="https://tiktok.com/@salao24h" target="_blank" rel="noopener noreferrer" aria-label={t('followTikTok')} className="text-gray-400 hover:text-primary transition-colors duration-300">
            <TikTokIcon />
          </a>
        </div>
        <p className="text-gray-400 mb-2">
          {t('footerCopyright')}
        </p>
        <p className="text-sm text-gray-500">
          {t('footerTagline')}
        </p>
        <div className="flex justify-center gap-4 text-sm text-gray-400 mb-6">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="hover:text-primary transition-colors duration-300">
            {t('administrativeAccess')}
          </a>
          <span className="text-gray-600">|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="hover:text-primary transition-colors duration-300">
            {t('collaboratorAccess')}
          </a>
          <span className="text-gray-600">|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('clientLogin'); }} className="hover:text-primary transition-colors duration-300">
            {t('clientArea')}
          </a>
          <span className="text-gray-600">|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('privacy'); }} className="hover:text-primary transition-colors duration-300">
            {t('footerPrivacy')}
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;