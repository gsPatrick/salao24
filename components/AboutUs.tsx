import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const MissionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const VisionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const AboutUs: React.FC = () => {
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
    <section id="about-us" className="py-20 bg-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('aboutUsTitle')}</h2>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
            {t('aboutUsSubtitle')}
          </p>
        </div>
        
        <div ref={sectionRef} className={`grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {/* Mission */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <MissionIcon />
              </div>
              <h3 className="text-2xl font-bold text-secondary">{t('aboutUsMissionTitle')}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {t('aboutUsMissionDesc')}
            </p>
          </div>
          
          {/* Vision */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <VisionIcon />
              </div>
              <h3 className="text-2xl font-bold text-secondary">{t('aboutUsVisionTitle')}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {t('aboutUsVisionDesc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;