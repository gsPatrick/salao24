import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AppStoreBadges: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="download-app" className="py-20 bg-white">
      <div className="container mx-auto px-6 text-center">
        <div ref={sectionRef} className={`transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('appBadgesTitle')}</h2>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            {t('appBadgesSubtitle')}
          </p>
          <div className="flex justify-center items-center gap-4 sm:gap-6 mt-8 flex-wrap">
            {/* Apple App Store Badge */}
            <a
              href="#"
              aria-label={t('downloadOn') + ' App Store'}
              className="inline-block transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg active:scale-100"
            >
              <svg
                width="160"
                height="54"
                viewBox="0 0 160 54"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="160" height="54" rx="10" fill="black" />
                <path
                  d="M34.9928 22.4277C35.0475 20.3155 36.6853 18.6777 38.8073 18.6231C40.9293 18.5684 42.6108 20.216 42.6556 22.3282C42.6655 22.372 42.6655 22.4158 42.6655 22.4695C42.6754 20.4566 44.4015 18.7972 46.4798 18.829C48.449 18.8608 50.0173 20.375 50.0491 22.3492C50.0491 22.3831 50.0491 22.417 50.0491 22.4509C50.0491 16.9631 45.9238 12.5698 40.8598 12.5152C35.7958 12.4605 31.3323 16.7198 31.3323 22.3282C31.3323 22.3621 31.3323 22.396 31.3323 22.4398C31.3323 20.402 32.9701 18.7228 35.0723 18.6231C35.0405 18.6231 35.0086 18.6231 34.9768 18.6231C34.9768 18.6231 34.9768 18.6231 34.9768 18.6231C33.1568 18.6231 31.6448 20.1272 31.601 22.0116C31.5911 22.1209 31.5911 22.2302 31.5911 22.338C31.5911 28.2741 36.4223 33.1491 42.3268 33.1491C48.2313 33.1491 52.8556 28.4931 53.1833 22.5684H46.3706C44.2048 24.8995 41.2598 25.1084 39.2906 22.7575C39.2906 22.7575 39.2807 22.7476 39.2708 22.7377C37.5248 25.0242 34.8233 25.0441 32.9833 22.9716C32.9634 22.9517 32.9435 22.9318 32.9236 22.9119C33.6853 22.7674 34.4033 22.6428 34.9928 22.4277Z"
                  fill="white"
                />
                <path
                  d="M40.8614 11.5269C43.0819 11.4574 44.9714 9.87413 45.1912 7.6437C45.2359 7.18956 45.0903 6.74534 44.8058 6.38053C44.5214 6.01571 44.1183 5.75971 43.6698 5.6683C41.4493 5.19429 39.3175 6.6437 38.8642 8.9437C38.8096 9.42966 38.9354 9.91562 39.2198 10.3107C39.5042 10.7058 39.9272 10.9812 40.4005 11.0627C40.5544 11.0925 40.7082 11.1024 40.8614 11.0925V11.5269Z"
                  fill="white"
                />
                <text
                  fill="white"
                  xmlSpace="preserve"
                  style={{ whiteSpace: 'pre' }}
                  fontFamily="Helvetica"
                  fontSize="12"
                  fontWeight="500"
                  letterSpacing="0.5"
                >
                  <tspan x="62" y="24">{t('downloadOn')}</tspan>
                </text>
                <text
                  fill="white"
                  xmlSpace="preserve"
                  style={{ whiteSpace: 'pre' }}
                  fontFamily="Helvetica"
                  fontSize="20"
                  fontWeight="600"
                  letterSpacing="0"
                >
                  <tspan x="62" y="44">App Store</tspan>
                </text>
              </svg>
            </a>
            {/* Google Play Store Badge */}
            <a
              href="#"
              aria-label={t('availableOn') + ' Google Play'}
              className="inline-block transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg active:scale-100"
            >
              <svg
                width="160"
                height="54"
                viewBox="0 0 160 54"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="160" height="54" rx="10" fill="black" />
                <path
                  d="M32.5455 13.5L47.2727 21.75L38.4545 26.25L32.5455 13.5Z"
                  fill="#FFD966"
                />
                <path
                  d="M32.5455 40.5L47.2727 32.25L38.4545 27.75L32.5455 40.5Z"
                  fill="#F4B400"
                />
                <path d="M51 27C51 26.1 50.3727 24.75 49.9091 24L38.4545 27.75V26.25L49.9091 30C50.3727 29.25 51 27.9 51 27Z"
                  fill="#4285F4"
                />
                <path
                  d="M26 27L32.5455 13.5V40.5L26 27Z"
                  fill="#DB4437"
                />
                <text
                  fill="white"
                  xmlSpace="preserve"
                  style={{ whiteSpace: 'pre' }}
                  fontFamily="Helvetica"
                  fontSize="11"
                  fontWeight="500"
                  letterSpacing="0.5"
                >
                  <tspan x="62" y="24">{t('availableOn')}</tspan>
                </text>
                <text
                  fill="white"
                  xmlSpace="preserve"
                  style={{ whiteSpace: 'pre' }}
                  fontFamily="Helvetica"
                  fontSize="20"
                  fontWeight="600"
                  letterSpacing="0"
                >
                  <tspan x="62" y="44">Google Play</tspan>
                </text>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppStoreBadges;
