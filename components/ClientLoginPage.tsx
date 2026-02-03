import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import LanguageSelector from './LanguageSelector';


const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057-5.064 7-9.542-7 .847 0 1.673.124 2.468.352M10.582 10.582a3 3 0 114.243 4.243M1 1l22 22" />
    </svg>
);

interface ClientLoginPageProps {
    navigate: (page: string) => void;
    goBack: () => void;
    onLoginSuccess: (client: any) => void;
}

const ClientLoginPage: React.FC<ClientLoginPageProps> = ({ navigate, goBack, onLoginSuccess }) => {
    const { t } = useLanguage();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');

    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const email = emailRef.current?.value.trim() || '';
        const password = passwordRef.current?.value || '';

        const result = await login(email, password, false);

        if (result.success) {
            const storedUser = localStorage.getItem('authUser');
            if (storedUser) {
                onLoginSuccess(JSON.parse(storedUser));
            }
        } else {
            setError(result.error || t('loginInvalidCredentials'));
            setIsLoading(false);
        }
    };

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const name = nameRef.current?.value || '';
        const email = emailRef.current?.value.trim() || '';
        const phone = phoneRef.current?.value || '';
        const password = passwordRef.current?.value || '';

        try {
            const response = await authAPI.register({
                userName: name,
                email,
                phone,
                password,
                userType: 'client'
            });

            if (response.success) {
                // After signup, automatically login
                const loginResult = await login(email, password, false);
                if (loginResult.success) {
                    const storedUser = localStorage.getItem('authUser');
                    if (storedUser) {
                        onLoginSuccess(JSON.parse(storedUser));
                    }
                }
            } else {
                setError(response.message || 'Erro ao realizar cadastro');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao realizar cadastro');
        } finally {
            setIsLoading(false);
        }
    };


    const SubmitButtonContent = () => (
        <>
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{mode === 'login' ? (t('loginEntering') || 'Entrando...') : 'Cadastrando...'}</span>
                </>
            ) : (
                mode === 'login' ? (t('clientLoginEnter') || 'Entrar na Área do Cliente') : 'Criar minha Conta'
            )}
        </>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-4 right-4 z-10">
                <LanguageSelector />
            </div>
            <div className="max-w-md w-full space-y-8">
                <div>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="text-center block text-4xl sm:text-5xl font-extrabold text-secondary no-underline">
                        Salão24h
                    </a>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                    <div>
                        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-secondary">
                            {mode === 'login' ? (t('clientLoginTitle') || 'Bem-vindo, Cliente!') : 'Criar sua Conta'}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {mode === 'login'
                                ? (t('clientLoginSubtitle') || 'Acesse seus agendamentos e histórico')
                                : 'Preencha seus dados para começar'}
                        </p>
                    </div>
                    <form className="space-y-4" onSubmit={mode === 'login' ? handleLogin : handleSignUp}>
                        {mode === 'signup' && (
                            <>
                                <div>
                                    <label htmlFor="user-name" className="sr-only font-bold">Nome Completo</label>
                                    <input
                                        id="user-name"
                                        name="name"
                                        type="text"
                                        ref={nameRef}
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="user-phone" className="sr-only font-bold">WhatsApp</label>
                                    <input
                                        id="user-phone"
                                        name="phone"
                                        type="tel"
                                        ref={phoneRef}
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300"
                                        placeholder="Seu WhatsApp"
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only font-bold">{t('loginEmailAddress') || 'E-mail'}</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                ref={emailRef}
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300"
                                placeholder={t('loginYourEmail') || 'Seu e-mail'}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only font-bold">{t('password') || 'Senha'}</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                ref={passwordRef}
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm pr-10 transition-all duration-300"
                                placeholder={t('loginPassword') || 'Senha'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors duration-300 disabled:bg-primary/70 disabled:cursor-not-allowed"
                        >
                            <SubmitButtonContent />
                        </button>
                    </form>

                    {mode === 'login' && (
                        <div className="text-center text-sm">
                            <span className="text-gray-600">Ainda não tem conta? </span>
                            <button
                                onClick={() => { setMode('signup'); setError(null); }}
                                className="font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                Cadastre-se aqui
                            </button>
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="text-center text-sm">
                            <span className="text-gray-600">Já possui uma conta? </span>
                            <button
                                onClick={() => { setMode('login'); setError(null); }}
                                className="font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                Faça login
                            </button>
                        </div>
                    )}


                    <div className="pt-4 text-center text-xs text-gray-500">
                        <p>{t('clientLoginHint') || 'Dica: use juliana.costa@example.com / 123 para testar.'}</p>
                    </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                    <p className="mb-4">
                        É um colaborador?{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="font-medium text-primary hover:text-primary-dark">
                            Acesse aqui a Área Restrita
                        </a>
                    </p>
                    <a href="#" onClick={(e) => { e.preventDefault(); goBack(); }} className="font-medium text-primary hover:text-primary-dark">&larr; {t('loginBack') || 'Voltar para a página inicial'}</a>
                </div>
            </div>
        </div>
    );
};

export default ClientLoginPage;
