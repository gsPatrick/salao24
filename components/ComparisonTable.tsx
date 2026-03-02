import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const comparisonDataKeys = [
    { key: 'Users', individual: '1', essencial: 'Até 5', pro: 'Até 10', premium: 'comparisonValueUnlimited' },
    { key: 'Units', individual: '1', essencial: '1', pro: 'Até 3', premium: 'Até 5' },
    { key: 'AIBasic', individual: true, essencial: true, pro: true, premium: true },
    { key: 'AIAdvanced', individual: false, essencial: false, pro: true, premium: true },
    { key: 'Reports', individual: true, essencial: true, pro: true, premium: true },
    { key: 'Stock', individual: true, essencial: true, pro: true, premium: true },
    { key: 'OnlineScheduling', individual: true, essencial: true, pro: true, premium: true },
    { key: 'PrioritySupport', individual: false, essencial: false, pro: false, premium: true },
    { key: 'FreeTrial', individual: 'comparisonValue30days', essencial: 'comparisonValue30days', pro: 'comparisonValue30days', premium: 'comparisonValue30days' },
];

const Checkmark: React.FC = () => (
    <svg className="w-6 h-6 text-primary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const Crossmark: React.FC = () => (
    <svg className="w-6 h-6 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
    </svg>
);


const ComparisonTable: React.FC = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const comparisonData = comparisonDataKeys.map(item => ({
        feature: t(`comparisonFeature${item.key}`),
        individual: typeof item.individual === 'string' ? t(item.individual) || item.individual : item.individual,
        essencial: typeof item.essencial === 'string' ? t(item.essencial as string) || item.essencial : item.essencial,
        pro: typeof item.pro === 'string' ? t(item.pro as string) || item.pro : item.pro,
        premium: typeof item.premium === 'string' ? t(item.premium as string) || item.premium : item.premium,
    }));


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
        <section id="compare" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('comparisonTitle')}</h2>
                    <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">{t('comparisonSubtitle')}</p>
                </div>

                <div ref={sectionRef} className={`max-w-6xl mx-auto overflow-x-auto transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
                    <div className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                        <div className="grid grid-cols-5 font-bold text-center text-secondary border-b border-gray-200">
                            <div className="p-4 text-left">{t('comparisonHeaderFeature')}</div>
                            <div className="p-4 bg-light/50">{t('pricingIndividualPlanName')}</div>
                            <div className="p-4 bg-primary/5">Empresa Essencial</div>
                            <div className="p-4 bg-primary/10">Empresa Pro</div>
                            <div className="p-4 bg-primary/20">Empresa Premium</div>
                        </div>

                        {comparisonData.map((item, index) => (
                            <div key={index} className="grid grid-cols-5 text-center border-b border-gray-200 last:border-b-0 items-center">
                                <div className="p-4 text-left text-gray-700">{item.feature}</div>
                                <div className="p-4 text-gray-600 bg-light/50">
                                    {item.individual === true ? <Checkmark /> : item.individual === false ? <Crossmark /> : item.individual}
                                </div>
                                <div className="p-4 text-gray-600 bg-primary/5">
                                    {item.essencial === true ? <Checkmark /> : item.essencial === false ? <Crossmark /> : <span className="font-semibold text-secondary">{item.essencial}</span>}
                                </div>
                                <div className="p-4 text-gray-600 bg-primary/10">
                                    {item.pro === true ? <Checkmark /> : item.pro === false ? <Crossmark /> : <span className="font-bold text-secondary">{item.pro}</span>}
                                </div>
                                 <div className="p-4 text-gray-600 bg-primary/20">
                                    {item.premium === true ? <Checkmark /> : item.premium === false ? <Crossmark /> : <span className="font-bold text-secondary">{item.premium}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ComparisonTable;