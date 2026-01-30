import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057-5.064 7-9.542-7 .847 0 1.673.124 2.468.352M10.582 10.582a3 3 0 114.243 4.243M1 1l22 22" />
  </svg>
);

interface LoginPageProps {
  navigate: (page: string) => void;
  goBack: () => void;
  onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ navigate, goBack, onLoginSuccess }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [rememberedUser, setRememberedUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberMeRef = useRef<HTMLInputElement>(null);

  // Check localStorage on component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('rememberedUser');
      if (storedUser) {
        setRememberedUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse remembered user from localStorage", error);
      localStorage.removeItem('rememberedUser');
    }
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    const rememberMe = rememberMeRef.current?.checked || false;

    const result = await login(email, password, rememberMe);

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

  const handleRememberedLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rememberedUser) return;

    setIsLoading(true);
    setError(null);

    const password = (event.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    const result = await login(rememberedUser.email, password, true);

    if (result.success) {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        onLoginSuccess(JSON.parse(storedUser));
      }
    } else {
      setError(result.error || t('loginIncorrectPassword'));
      setIsLoading(false);
    }
  }

  const handleSwitchAccount = () => {
    try {
      localStorage.removeItem('rememberedUser');
      setRememberedUser(null);
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
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
          <span>{t('loginEntering') || 'Entrando...'}</span>
        </>
      ) : (
        t('loginEnter') || 'Entrar'
      )}
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full space-y-8">
        <div>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="text-center block text-4xl sm:text-5xl font-extrabold text-secondary no-underline">
            Salão24h
          </a>
        </div>

        {rememberedUser ? (
          // --- Remembered User View ---
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 text-center animate-bounce-in">
            <img src={rememberedUser.avatarUrl} alt={t('userPhotoAlt', { name: rememberedUser.name })} className="w-24 h-24 mx-auto rounded-full ring-4 ring-primary/20" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-secondary">{(t('loginWelcomeBack') || 'Bem-vindo de volta, {name}').replace('{name}', rememberedUser.name.split(' ')[0])}</h2>
              <p className="text-sm text-gray-500">{rememberedUser.email}</p>
            </div>
            <form className="space-y-4" onSubmit={handleRememberedLogin}>
              <div className="relative">
                <label htmlFor="password-remembered" className="sr-only">{t('loginPassword') || 'Senha'}</label>
                <input
                  id="password-remembered"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300 pr-10"
                  placeholder={t('loginPassword') || 'Senha'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="text-sm text-right">
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  {t('loginForgotPassword') || 'Esqueceu a senha?'}
                </a>
              </div>
              {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors duration-300 disabled:bg-primary/70 disabled:cursor-not-allowed"
              >
                <SubmitButtonContent />
              </button>
            </form>
            <button onClick={handleSwitchAccount} className="font-medium text-sm text-primary hover:text-primary-dark">
              {t('loginNotYou') || 'Não é você?'}
            </button>
          </div>
        ) : (
          // --- Default Login View ---
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
            <div>
              <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-secondary">
                {t('loginTitle') || 'Acesse sua Conta'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {t('loginNoAccount') || 'Não tem uma conta?'}{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('signup'); }} className="font-medium text-primary hover:text-primary-dark">
                  {t('loginCreateNow') || 'Crie agora'}
                </a>
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email-address" className="sr-only">{t('loginEmailAddress') || 'E-mail'}</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  ref={emailRef}
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all duration-300"
                  placeholder={t('loginYourEmail') || 'Seu e-mail'}
                  defaultValue="admin@salao24h.com"
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">{t('password') || 'Senha'}</label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  ref={passwordRef}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm pr-10 transition-all duration-300"
                  placeholder={t('loginPassword') || 'Senha'}
                  defaultValue="admin"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    ref={rememberMeRef}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    {t('loginRememberMe') || 'Lembrar-me'}
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary-dark">
                    {t('loginForgotPassword') || 'Esqueceu a senha?'}
                  </a>
                </div>
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
            <div className="pt-4 text-center text-xs text-gray-500 border-t border-gray-100">
              <p className="font-bold text-secondary mb-2 uppercase tracking-widest">{t('collaboratorArea') || 'Área do Colaborador'}</p>
              <p>{(t('loginHintAdmin') || 'Dica: use admin@salao24h.com / admin para o admin.').replace('{email}', 'admin@salao24h.com').replace('{password}', 'admin')}</p>
              <p>{(t('loginHintProfessional') || 'Use fernanda@salao24h.com / 123 para um profissional.').replace('{email}', 'fernanda@salao24h.com').replace('{password}', '123')}</p>
            </div>
            <div className="pt-4 mt-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-sm text-gray-700 mb-2">
                É um cliente?
              </p>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('clientLogin'); }} className="inline-block bg-white text-primary border border-primary font-bold py-2 px-6 rounded-lg hover:bg-primary hover:text-white transition-all duration-300">
                Acessar Área do Cliente
              </a>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          <a href="#" onClick={(e) => { e.preventDefault(); goBack(); }} className="font-medium text-primary hover:text-primary-dark">&larr; {t('loginBack') || 'Voltar para a página inicial'}</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
