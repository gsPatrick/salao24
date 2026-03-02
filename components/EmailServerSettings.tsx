import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274 4.057-5.064 7-9.542-7 .847 0 1.673.124 2.468.352M10.582 10.582a3 3 0 114.243 4.243M1 1l22 22" />
    </svg>
);

const providerConfigs = {
  'Google': { server: 'smtp.gmail.com', port: '587' },
  'Hotmail': { server: 'smtp.office365.com', port: '587' },
  'Yahoo': { server: 'smtp.mail.yahoo.com', port: '587' },
  'iCloud': { server: 'smtp.mail.me.com', port: '587' },
};

export const EmailServerSettings: React.FC = () => {
    const { t } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        server: '',
        port: '',
        user: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [savedSettings, setSavedSettings] = useState<{ server: string; port: string; user: string; } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProviderDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            const { password, ...settingsToSave } = formData;
            setSavedSettings(settingsToSave);
            showNotification(t('changesSavedSuccess'));
        }, 1500);
    };

    const handleProviderSelect = (provider: keyof typeof providerConfigs) => {
        const config = providerConfigs[provider];
        setFormData(prev => ({ ...prev, ...config }));
        setShowProviderDropdown(false);
    };

    const handleEditSettings = () => {
        if (savedSettings) {
            setFormData(prev => ({ ...prev, ...savedSettings }));
        }
        setSavedSettings(null);
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
             {notification && (
                <div className="fixed top-24 right-8 z-50 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce-in flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{notification}</span>
                </div>
            )}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-secondary mb-1">{t('marketingTabServer')}</h2>
                <p className="text-sm text-gray-500 mb-6">Configure seu servidor SMTP para o envio de e-mails de marketing e notificações.</p>
                
                <form className="space-y-4" onSubmit={handleSave}>
                     <div>
                        <label htmlFor="server" className="block text-sm font-medium text-gray-700">Servidor SMTP</label>
                        <input id="server" name="server" type="text" placeholder="smtp.example.com" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" value={formData.server} onChange={handleChange} disabled={!!savedSettings}/>
                    </div>
                     <div>
                        <label htmlFor="port" className="block text-sm font-medium text-gray-700">Porta</label>
                        <input id="port" name="port" type="text" placeholder="587" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" value={formData.port} onChange={handleChange} disabled={!!savedSettings}/>
                    </div>

                    <div ref={dropdownRef} className="relative inline-block text-left">
                        <button 
                            type="button"
                            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                            className="font-semibold text-primary hover:underline inline-flex items-center text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {t('providerLookup')}
                        </button>

                        {showProviderDropdown && (
                            <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in-down">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    {Object.keys(providerConfigs).map(provider => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => handleProviderSelect(provider as keyof typeof providerConfigs)}
                                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                        >
                                            {provider}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                     <div>
                        <label htmlFor="user" className="block text-sm font-medium text-gray-700">Usuário</label>
                        <input id="user" name="user" type="text" placeholder="seu_email@example.com" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" value={formData.user} onChange={handleChange} disabled={!!savedSettings}/>
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                        <div className="relative mt-1">
                            <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm pr-10" value={formData.password} onChange={handleChange} disabled={!!savedSettings}/>
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                             </button>
                        </div>
                    </div>
                    {!savedSettings && (
                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isLoading} className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark flex items-center justify-center min-w-[170px] disabled:bg-primary/70">
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : t('saveChanges')}
                            </button>
                        </div>
                    )}
                </form>

                 {savedSettings && (
                    <div className="mt-8 pt-6 border-t animate-fade-in">
                        <h3 className="text-lg font-bold text-secondary">{t('savedSettingsTitle')}</h3>
                        <div className="mt-4 space-y-3 bg-light p-4 rounded-lg">
                            <p className="text-sm"><strong className="font-semibold text-gray-600">{t('serverLabel')}:</strong> {savedSettings.server}</p>
                            <p className="text-sm"><strong className="font-semibold text-gray-600">{t('portLabel')}:</strong> {savedSettings.port}</p>
                            <p className="text-sm"><strong className="font-semibold text-gray-600">{t('userLabel')}:</strong> {savedSettings.user}</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleEditSettings} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                {t('editConfig')}
                            </button>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};