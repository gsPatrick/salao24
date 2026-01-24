import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

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

const LoginPage: React.FC<LoginPageProps> = ({ navigate, onLoginSuccess }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'salon' | 'client'>('salon');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberMeRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setError(result.error || 'Credenciais inválidas');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans selection:bg-primary/20">
      {/* Left side: Premium Image/Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-secondary overflow-hidden items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 w-full h-full flex flex-col justify-between p-16"
        >
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('home')}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/20">
              <span className="text-secondary font-black text-2xl">S</span>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Salão24h</span>
          </div>

          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl font-black text-white leading-[1.1] mb-8"
            >
              {t('loginImpactFrase') || 'A revolução na gestão do seu salão.'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl text-white/70 font-medium leading-relaxed mb-12"
            >
              Do agendamento ao financeiro, controle tudo em um só lugar com o poder da inteligência artificial.
            </motion.p>

            <div className="grid grid-cols-2 gap-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10">
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">99%</p>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Produtividade</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-white">24/7</p>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Assistênia IA</p>
              </div>
            </div>
          </div>

          <div className="text-white/40 text-sm font-medium">
            © 2024 Salão24h. Todos os direitos reservados.
          </div>
        </motion.div>

        {/* Decorative Image with Glass effect */}
        <div className="absolute right-[-10%] top-[20%] w-[450px] h-[600px] opacity-40 mix-blend-overlay">
          <img
            src="/assets/login-bg.png"
            alt="Decoration"
            className="w-full h-full object-cover rounded-[4rem]"
          />
        </div>
      </div>

      {/* Right side: Login Form with Premium Feel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white lg:bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[440px] w-full lg:bg-white lg:p-12 lg:rounded-[3rem] lg:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)] lg:border lg:border-gray-100"
        >
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-3xl font-black text-secondary mb-3 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-gray-400 font-medium italic">Acesse sua conta para gerenciar seu espaço.</p>
          </div>

          {/* Improved User Type Selector */}
          <div className="flex p-1.5 bg-gray-100/80 rounded-2xl mb-10">
            <button
              onClick={() => setUserType('salon')}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${userType === 'salon' ? 'bg-white text-secondary shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Salão
            </button>
            <button
              onClick={() => setUserType('client')}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${userType === 'client' ? 'bg-white text-secondary shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Cliente
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="group">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">E-mail</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
                  </span>
                  <input
                    ref={emailRef}
                    type="email"
                    required
                    placeholder="email@exemplo.com"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">Senha</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between ml-1">
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    ref={rememberMeRef}
                    type="checkbox"
                    className="peer hidden"
                  />
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-lg group-hover:border-primary/30 peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                  <svg className="absolute w-3 h-3 text-white m-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-gray-500 font-semibold select-none group-hover:text-gray-700 transition-colors">Manter conectado</span>
              </label>
              <button type="button" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-500 text-sm font-bold py-4 px-4 rounded-2xl text-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-secondary text-white font-black rounded-2xl hover:bg-secondary-dark shadow-xl hover:shadow-secondary/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center space-x-3 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Entrar na conta</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-gray-400 font-medium">
            <span>Não tem conta? </span>
            <button
              onClick={() => navigate('signup')}
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Comece agora gratuitamente
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
