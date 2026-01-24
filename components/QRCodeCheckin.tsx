import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const QRCodeIcon = () => (
    <svg className="w-32 h-32 md:w-40 md:h-40 text-secondary" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 48h64v64H48zM64 64v32h32V64z" opacity="1"></path>
        <path d="M144 48h64v64h-64zM160 64v32h32V64z" opacity="1"></path>
        <path d="M48 144h64v64H48zM64 160v32h32v-32z" opacity="1"></path>
        <path d="M144 144h16v16h-16zM176 144h16v16h-16zM208 144h16v16h-16zM144 176h16v16h-16zM176 176h16v16h-16zM208 176h16v16h-16zM144 208h16v16h-16zM176 208h16v16h-16zM208 208h16v16h-16z" opacity="0.6"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);


const QRCodeCheckin: React.FC = () => {
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
        <section id="qr-checkin" className="py-16 sm:py-20 bg-light">
            <div className="container mx-auto px-6">
                <div ref={sectionRef} className={`grid md:grid-cols-2 gap-12 items-center transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('qrTitle')}</h2>
                        <p className="text-lg text-gray-600 mt-4 max-w-lg mx-auto md:mx-0">
                            {t('qrSubtitle')}
                        </p>
                        <ul className="mt-6 text-left space-y-3 inline-block">
                            <li className="flex items-center text-gray-700">
                                <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                                {t('qrFeature1')}
                            </li>
                            <li className="flex items-center text-gray-700">
                                <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                                {t('qrFeature2')}
                            </li>
                             <li className="flex items-center text-gray-700">
                                <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                                {t('qrFeature3')}
                            </li>
                        </ul>
                    </div>
                    <div className="flex justify-center items-center">
                        <div className="relative bg-white p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                            <QRCodeIcon />
                            <div className="absolute -bottom-5 -right-5 bg-primary text-white p-3 rounded-full shadow-lg flex items-center">
                                <PhoneIcon />
                                <span className="font-semibold text-sm">{t('qrScanButton')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default QRCodeCheckin;