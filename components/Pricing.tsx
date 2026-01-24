import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const Plan: React.FC<{
  name: string;
  description: string;
  price: string;
  oldPrice?: string;
  priceAfterYear?: string;
  features: string[];
  isFeatured?: boolean;
  onStartTrial: () => void;
  ctaText: string;
}> = ({ name, description, price, oldPrice, priceAfterYear, features, isFeatured = false, onStartTrial, ctaText }) => {
    const { t } = useLanguage();
    return (
        <div
          className={`relative border rounded-2xl p-6 md:p-8 flex flex-col h-full transition-transform transform hover:scale-105 hover:shadow-2xl ${
            isFeatured
              ? 'bg-secondary text-white border-primary shadow-2xl scale-105'
              : 'bg-white shadow-lg border-gray-100'
          }`}
        >
            {isFeatured && (
              <span className="absolute -top-3 left-6 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-md">
                Mais popular
              </span>
            )}

            <div className="mb-4">
              <h3 className={`text-2xl font-extrabold tracking-tight ${isFeatured ? 'text-primary' : 'text-secondary'}`}>{name}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${isFeatured ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
            </div>

            <div className="mb-6">
              {oldPrice && (
                <div className={`text-sm font-medium line-through ${isFeatured ? 'text-gray-400' : 'text-gray-400'}`}>
                    {t('fromPricePrefix')} {oldPrice}
                </div>
              )}
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold">{price}</span>
                <span className={`text-base sm:text-lg font-medium ${isFeatured ? 'text-gray-300' : 'text-gray-500'}`}>{t('perMonthSuffix')}</span>
              </div>
              {priceAfterYear && (
                <p className={`mt-2 text-xs leading-snug ${isFeatured ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('discountGuarantee')}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 text-sm">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                <CheckIcon />
                <span>{feature}</span>
                </li>
            ))}
            </ul>
            <a href="#" onClick={(e) => { e.preventDefault(); onStartTrial(); }} className={`w-full text-center font-bold py-3 px-8 rounded-full transition-all duration-300 active:scale-95 mt-auto ${isFeatured ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}>
            {ctaText}
            </a>
        </div>
    )
};

interface PricingProps {
  onSelectPlan: (plan: { name: string; price: string; }) => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
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
    <section id="pricing" className="py-20 bg-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('pricingTitle')}</h2>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">{t('pricingSubtitle')}</p>
        </div>
        <div ref={sectionRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <Plan
                name={t('pricingIndividualPlanName')}
                description={t('pricingIndividualPlanDesc')}
                price="R$ 79,87"
                features={[
                    t('pricingIndividualFeature1'),
                    t('pricingIndividualFeature2'),
                    t('pricingIndividualFeature3'),
                    t('pricingIndividualFeature4'),
                    t('pricingIndividualFeature5'),
                    t('pricingIndividualFeature6'),
                    t('pricingIndividualFeature7')
                ]}
                onStartTrial={() => onSelectPlan({ name: 'Individual', price: 'R$ 79,87' })}
                ctaText={t('pricingStartTrialButton')}
            />
            <Plan
                name='Empresa Essencial'
                description='Para equipes pequenas com as ferramentas essenciais para crescer.'
                price="R$ 199,90"
                features={[
                    t('Tudo do plano Individual'),
                    t('Até 5 usuários'),
                    t('1 Unidade'),
                    t('Gestão de Comissões'),
                ]}
                onStartTrial={() => onSelectPlan({ name: 'Empresa Essencial', price: 'R$ 199,90' })}
                ctaText={t('pricingStartTrialButton')}
            />
            <Plan
                name='Empresa Pro'
                description='A solução ideal para negócios em expansão, com IA por voz e mais automações.'
                price="R$ 349,90"
                features={[
                    t('Tudo do plano Essencial'),
                    t('Até 10 usuários'),
                    t('Até 3 Unidades'),
                    t('Assistente IA com Voz'),
                    t('Relatórios Avançados'),
                ]}
                isFeatured
                onStartTrial={() => onSelectPlan({ name: 'Empresa Pro', price: 'R$ 349,90' })}
                ctaText={t('pricingStartTrialButton')}
            />
            <Plan
                name='Empresa Premium'
                description='Para grandes operações e redes, com suporte dedicado e gerente de contas.'
                price="R$ 599,90"
                features={[
                    t('Tudo do plano Pro'),
                    t('Usuários Ilimitados'),
                    t('Até 5 Unidades'),
                    t('Suporte Prioritário'),
                    t('Gerente de Contas'),
                ]}
                onStartTrial={() => onSelectPlan({ name: 'Empresa Premium', price: 'R$ 599,90' })}
                ctaText={t('pricingStartTrialButton')}
            />
        </div>
      </div>
    </section>
  );
};

export default Pricing;