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
    const [mode, setMode] = useState<'login' | 'signup' | 'cpf-check' | 'create-credentials'>('login');
    const [cpfData, setCpfData] = useState<{ cpf: string; clientName?: string; tenantName?: string } | null>(null);

    const cpfRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const formatCpf = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    };

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

    const handleCheckCpf = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const cpf = cpfRef.current?.value || '';

        try {
            const response = await authAPI.checkCpf(cpf.replace(/\D/g, ''));

            if (response.data.exists) {
                if (response.data.hasLoginCredentials) {
                    setError('Este CPF já possui uma conta. Por favor, faça login.');
                    setMode('login');
                } else {
                    setCpfData({
                        cpf: cpf.replace(/\D/g, ''),
                        clientName: response.data.clientName,
                        tenantName: response.data.tenantName
                    });
                    setMode('create-credentials');
                }
            } else {
                setError('CPF não encontrado. Você precisa estar cadastrado em um de nossos salões primeiro.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao verificar CPF');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCredentials = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const email = emailRef.current?.value.trim() || '';
        const password = passwordRef.current?.value || '';

        try {
            const response = await authAPI.clientRegisterByCpf({
                cpf: cpfData!.cpf,
                loginEmail: email,
                password
            });

            if (response.success) {
                // Auto login after registration
                const loginResult = await login(email, password, false);
                if (loginResult.success) {
                    const storedUser = localStorage.getItem('authUser');
                    if (storedUser) {
                        onLoginSuccess(JSON.parse(storedUser));
                    }
                }
            } else {
                setError(response.message || 'Erro ao criar conta');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao criar conta');
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
                            {mode === 'login' && (t('clientLoginTitle') || 'Bem-vindo, Cliente!')}
                            {mode === 'cpf-check' && 'Criar sua Conta'}
                            {mode === 'create-credentials' && `Olá, ${cpfData?.clientName?.split(' ')[0]}!`}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {mode === 'login' && (t('clientLoginSubtitle') || 'Acesse seus agendamentos e histórico')}
                            {mode === 'cpf-check' && 'Digite seu CPF para verificar seu cadastro'}
                            {mode === 'create-credentials' && `Encontramos seu cadastro em ${cpfData?.tenantName}! Crie seu acesso.`}
                        </p>
                    </div>

                    {/* Login Form */}
                    {mode === 'login' && (
                        <form className="space-y-4" onSubmit={handleLogin}>
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
                                    placeholder={t('loginYourEmail') || 'Seu e-mail de login'}
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
                                {isLoading ? 'Entrando...' : (t('clientLoginEnter') || 'Entrar na Área do Cliente')}
                            </button>
                        </form>
                    )}

                    {/* CPF Check Form */}
                    {mode === 'cpf-check' && (
                        <form className="space-y-4" onSubmit={handleCheckCpf}>
                            <div>
                                <label htmlFor="cpf" className="sr-only font-bold">CPF</label>
                                <input
                                    id="cpf"
                                    name="cpf"
                                    type="text"
                                    ref={cpfRef}
                                    required
                                    onChange={(e) => {
                                        e.target.value = formatCpf(e.target.value);
                                    }}
                                    className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300"
                                    placeholder="Digite seu CPF (ex: 123.456.789-00)"
                                />
                            </div>
                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors duration-300 disabled:bg-primary/70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Verificando...' : 'Verificar CPF'}
                            </button>
                        </form>
                    )}

                    {/* Create Credentials Form (after CPF verified) */}
                    {mode === 'create-credentials' && (
                        <form className="space-y-4" onSubmit={handleCreateCredentials}>
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                                <p className="text-sm text-green-700">
                                    ✓ CPF verificado! Agora crie seu email e senha de acesso.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="login-email" className="sr-only font-bold">E-mail de Login</label>
                                <input
                                    id="login-email"
                                    name="loginEmail"
                                    type="email"
                                    ref={emailRef}
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300"
                                    placeholder="Seu e-mail para login"
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="new-password" className="sr-only font-bold">Senha</label>
                                <input
                                    id="new-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    ref={passwordRef}
                                    required
                                    minLength={4}
                                    className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm pr-10 transition-all duration-300"
                                    placeholder="Crie uma senha (mínimo 4 caracteres)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                                {isLoading ? 'Criando conta...' : 'Criar minha Conta'}
                            </button>
                        </form>
                    )}

                    {/* Navigation links */}
                    {mode === 'login' && (
                        <div className="text-center text-sm">
                            <span className="text-gray-600">Ainda não tem conta? </span>
                            <button
                                onClick={() => { setMode('cpf-check'); setError(null); }}
                                className="font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                Cadastre-se aqui
                            </button>
                        </div>
                    )}

                    {(mode === 'cpf-check' || mode === 'create-credentials') && (
                        <div className="text-center text-sm">
                            <span className="text-gray-600">Já possui uma conta? </span>
                            <button
                                onClick={() => { setMode('login'); setError(null); setCpfData(null); }}
                                className="font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                Faça login
                            </button>
                        </div>
                    )}

                    <div className="pt-4 text-center text-xs text-gray-500">
                        <p>Para criar sua conta, você precisa ter um CPF cadastrado em um de nossos salões parceiros.</p>
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
