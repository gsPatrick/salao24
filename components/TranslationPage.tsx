import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useLanguage } from '../contexts/LanguageContext';

const TranslateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const TranslationPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();

    // State
    const [targetLang, setTargetLang] = useState<'en' | 'es'>('en');
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Settings State
    const [quality, setQuality] = useState(2);
    const [formality, setFormality] = useState(2);
    const [contextAware, setContextAware] = useState(true);
    const [preserveIdioms, setPreserveIdioms] = useState(true);
    const [culturalAdapt, setCulturalAdapt] = useState(false);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleTranslate = async () => {
        if (!inputText.trim()) {
            showNotification(t('textToTranslateEmpty'), 'error');
            return;
        }
        setIsLoading(true);
        setTranslatedText('');

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

            const qualityMap = { 1: t('qualityFast'), 2: t('qualityBalanced'), 3: t('qualityAccurate') };
            const formalityMap = { 1: t('formalityInformal'), 2: t('formalityNeutral'), 3: t('formalityFormal') };
            const targetLangName = targetLang === 'en' ? t('english') : t('spanish');

            let instruction = `Translate the following text from Brazilian Portuguese to ${targetLangName}.\n`;
            instruction += `The desired translation quality is: ${qualityMap[quality as keyof typeof qualityMap]}.\n`;
            instruction += `The desired tone of formality is: ${formalityMap[formality as keyof typeof formalityMap]}.\n`;
            if (contextAware) instruction += "Pay close attention to the context of the phrases to ensure accuracy.\n";
            if (preserveIdioms) instruction += "If there are idiomatic expressions, try to find an equivalent idiom in the target language. If not possible, provide a natural-sounding translation that preserves the meaning.\n";
            if (culturalAdapt) instruction += "Adapt cultural references to be easily understood by a native speaker of the target language.\n";
            instruction += "Provide only the translated text as a direct response, without any additional explanations or introductory phrases.";

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: inputText,
                config: {
                    systemInstruction: instruction,
                }
            });

            setTranslatedText(response.text);

        } catch (error) {
            console.error("Translation Error:", error);
            showNotification(t('translationError'), 'error');
            setTranslatedText('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!translatedText) return;
        navigator.clipboard.writeText(translatedText);
        showNotification(t('textCopied'), 'success');
    };

    const handleSpeak = () => {
        if (!translatedText) return;
        const utterance = new SpeechSynthesisUtterance(translatedText);
        const voiceLang = targetLang === 'en' ? 'en-US' : 'es-ES';
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.lang === voiceLang) || null;
        window.speechSynthesis.speak(utterance);
    };

    const handleClear = () => {
        setInputText('');
        setTranslatedText('');
    };

    const qualityLabel = useCallback((val: number) => {
        if (val === 1) return t('qualityFast');
        if (val === 3) return t('qualityAccurate');
        return t('qualityBalanced');
    }, [t]);

    const formalityLabel = useCallback((val: number) => {
        if (val === 1) return t('formalityInformal');
        if (val === 3) return t('formalityFormal');
        return t('formalityNeutral');
    }, [t]);

    return (
        <div className="container mx-auto px-6 py-8">
            {notification && (
                <div className={`fixed top-24 right-8 z-50 py-2 px-4 rounded-lg shadow-lg text-white animate-bounce-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
            {onBack && (
                <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">
                    &larr; {t('back')}
                </button>
            )}

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-secondary">{t('translationCenterTitle')}</h1>
                <p className="text-gray-600 mt-2">{t('translationCenterSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2"><TranslateIcon /> {t('translationAction')}</h2>

                    <div className="flex gap-2 mb-4 p-1 bg-light rounded-lg">
                        <button onClick={() => setTargetLang('en')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${targetLang === 'en' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-primary/10'}`}>
                            {t('translateFromTo', { language: t('english') })}
                        </button>
                        <button onClick={() => setTargetLang('es')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${targetLang === 'es' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-primary/10'}`}>
                            {t('translateFromTo', { language: t('spanish') })}
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="input-text" className="font-medium text-gray-700">{t('portugueseText')}</label>
                            <span className="text-xs text-gray-500">{t('charCount', { count: inputText.length })}</span>
                        </div>
                        <textarea
                            id="input-text"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder={t('inputTextPlaceholder')}
                            rows={6}
                            maxLength={5000}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <button onClick={handleTranslate} disabled={isLoading} className="flex-1 py-3 px-5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:bg-primary/70">
                            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('translateButton')}
                        </button>
                        <button onClick={handleClear} className="py-3 px-5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors">{t('clearButton')}</button>
                    </div>

                    <div className="mt-6">
                        <label className="font-medium text-gray-700">{t('translationLabel')}</label>
                        <div className="mt-1 p-3 border-2 border-gray-200 rounded-lg bg-light min-h-[150px]">
                            {isLoading ? (
                                <p className="text-gray-500 italic">{t('translationProcessing')}</p>
                            ) : translatedText ? (
                                <p className="text-secondary">{translatedText}</p>
                            ) : (
                                <p className="text-gray-500 italic">{t('translationPlaceholder')}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <button onClick={handleCopy} disabled={!translatedText} className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">{t('copyButton')}</button>
                        <button onClick={handleSpeak} disabled={!translatedText} className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">{t('speakButton')}</button>
                    </div>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2"><SettingsIcon /> {t('translationSettings')}</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between font-medium text-gray-700 text-sm"><span>{t('translationQuality')}</span><span>{qualityLabel(quality)}</span></div>
                            <input type="range" min="1" max="3" step="1" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mt-1" />
                        </div>
                        <div>
                            <div className="flex justify-between font-medium text-gray-700 text-sm"><span>{t('formality')}</span><span>{formalityLabel(formality)}</span></div>
                            <input type="range" min="1" max="3" step="1" value={formality} onChange={e => setFormality(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mt-1" />
                        </div>
                        <div className="space-y-3 pt-4 border-t">
                            <label className="flex items-center">
                                <input type="checkbox" checked={contextAware} onChange={e => setContextAware(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <span className="ml-2 text-sm text-gray-700">{t('contextAware')}</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" checked={preserveIdioms} onChange={e => setPreserveIdioms(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <span className="ml-2 text-sm text-gray-700">{t('preserveIdioms')}</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" checked={culturalAdapt} onChange={e => setCulturalAdapt(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <span className="ml-2 text-sm text-gray-700">{t('culturalAdapt')}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslationPage;
