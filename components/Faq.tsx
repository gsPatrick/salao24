import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const FaqItem: React.FC<{ item: { question: string; answer: string }; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-200 py-4">
      <button onClick={onClick} className="w-full flex justify-between items-center text-left text-lg font-semibold text-secondary focus:outline-none">
        <span>{item.question}</span>
        <svg className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div className={`overflow-hidden transition-max-height duration-500 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <p className="mt-2 text-gray-600 pr-6">
          {item.answer}
        </p>
      </div>
    </div>
  );
};


const Faq: React.FC = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const faqData = [
      {
        question: t('faqQ1'),
        answer: t('faqA1'),
      },
      {
        question: t('faqQ2'),
        answer: t('faqA2'),
      },
      {
        question: t('faqQ3'),
        answer: t('faqA3'),
      },
      {
        question: t('faqQ4'),
        answer: t('faqA4'),
      },
    ];

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

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20 bg-light">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('faqTitle')}</h2>
                    <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">{t('faqSubtitle')}</p>
                </div>
                <div ref={sectionRef} className={`max-w-3xl mx-auto transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
                    {faqData.map((item, index) => (
                        <FaqItem 
                            key={index} 
                            item={item} 
                            isOpen={openIndex === index} 
                            onClick={() => handleClick(index)} 
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Faq;