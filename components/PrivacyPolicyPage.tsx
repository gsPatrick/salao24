import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacyPolicyPageProps {
  goBack: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ goBack }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl space-y-8">
                <div>
                    <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-secondary">
                        {t('privacyPolicyTitle')}
                    </h1>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        {t('privacyPolicyLastUpdated')}
                    </p>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700">
                    <p>{t('privacyPolicyIntro')}</p>

                    <h2>{t('privacyPolicySection1Title')}</h2>
                    <p>{t('privacyPolicySection1Intro')}</p>
                    <ul>
                        <li><strong>{t('privacyPolicyS1List1Title')}:</strong> {t('privacyPolicyS1List1Desc')}</li>
                        <li><strong>{t('privacyPolicyS1List2Title')}:</strong> {t('privacyPolicyS1List2Desc')}</li>
                        <li><strong>{t('privacyPolicyS1List3Title')}:</strong> {t('privacyPolicyS1List3Desc')}</li>
                        <li><strong>{t('privacyPolicyS1List4Title')}:</strong> {t('privacyPolicyS1List4Desc')}</li>
                    </ul>

                    <h2>{t('privacyPolicySection2Title')}</h2>
                    <p>{t('privacyPolicySection2Intro')}</p>
                    <ul>
                        <li>{t('privacyPolicyS2List1')}</li>
                        <li>{t('privacyPolicyS2List2')}</li>
                        <li>{t('privacyPolicyS2List3')}</li>
                        <li>{t('privacyPolicyS2List4')}</li>
                    </ul>

                    <h2>{t('privacyPolicySection3Title')}</h2>
                    <p>{t('privacyPolicySection3Intro')}</p>
                    <ul>
                        <li><strong>{t('privacyPolicyS3List1Title')}:</strong> {t('privacyPolicyS3List1Desc')}</li>
                        <li><strong>{t('privacyPolicyS3List2Title')}:</strong> {t('privacyPolicyS3List2Desc')}</li>
                        <li><strong>{t('privacyPolicyS3List3Title')}:</strong> {t('privacyPolicyS3List3Desc')}</li>
                    </ul>
                    <p>{t('privacyPolicySection3Outro')}</p>


                    <h2>{t('privacyPolicySection4Title')}</h2>
                    <p>{t('privacyPolicySection4Desc')}</p>

                    <h2>{t('privacyPolicySection5Title')}</h2>
                    <p>{t('privacyPolicySection5Intro')}</p>
                    <ul>
                        <li>{t('privacyPolicyS5List1')}</li>
                        <li>{t('privacyPolicyS5List2')}</li>
                        <li>{t('privacyPolicyS5List3')}</li>
                    </ul>
                    <p>{t('privacyPolicySection5Outro')}</p>
                    
                    <h2>{t('privacyPolicySection6Title')}</h2>
                    <p>{t('privacyPolicySection6Desc')}</p>

                    <h2>{t('privacyPolicySection7Title')}</h2>
                    <p>{t('privacyPolicySection7Desc')}</p>
                </div>
                
                <div className="text-center text-sm text-gray-500 pt-8 border-t">
                    <a href="#" onClick={(e) => { e.preventDefault(); goBack(); }} className="font-medium text-primary hover:text-primary-dark">
                        &larr; {t('loginBack')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
