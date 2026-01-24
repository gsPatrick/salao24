import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SignUpPageProps {
  navigate: (page: string) => void;
  goBack: () => void;
}

// --- Icons ---
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

const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserTypeCard = ({
  title,
  description,
  icon,
  selected,
  onSelect
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={`p-8 rounded-[2.5rem] border-2 text-left transition-all duration-500 relative group flex flex-col h-full ${selected
      ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.03]'
      : 'border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-gray-200/50'
      }`}
  >
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform duration-500 group-hover:scale-110 ${selected ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-gray-50'}`}>
      {icon}
    </div>
    <h3 className={`text-xl font-black mb-3 leading-tight ${selected ? 'text-secondary' : 'text-gray-800'}`}>{title}</h3>
    <p className="text-[13px] text-gray-400 font-medium leading-relaxed mb-6 flex-grow">{description}</p>

    <div className={`mt-auto flex items-center font-bold text-xs uppercase tracking-[0.2em] transition-all ${selected ? 'text-primary' : 'text-gray-300 group-hover:text-primary/70'}`}>
      <span>{selected ? 'Selecionado' : 'Selecionar'}</span>
      <svg className={`ml-2 w-4 h-4 transform transition-transform ${selected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>

    {selected && (
      <div className="absolute top-4 right-4 text-primary">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    )}
  </button>
);

const ValidationChecklistItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <li className={`flex items-center text-sm transition-colors ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {isValid ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      )}
    </svg>
    {text}
  </li>
);

const SuccessView: React.FC<{ onFinish: () => void; t: (key: string) => string; }> = ({ onFinish, t }) => (
  <div className="text-center animate-fade-in py-12">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="w-32 h-32 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-green-500/10"
    >
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </motion.div>
    <h2 className="text-4xl font-black text-secondary mb-4 tracking-tight">{t('signUpSuccessTitle') || 'Seja bem-vindo!'}</h2>
    <p className="text-gray-400 font-medium mb-12 max-w-sm mx-auto leading-relaxed">{t('signUpSuccessMessage') || 'Sua conta foi criada com sucesso. Estamos prontos para transformar sua gestão.'}</p>
    <button onClick={onFinish} className="mt-4 py-5 px-12 bg-secondary text-white font-black rounded-2xl hover:bg-secondary-dark shadow-xl shadow-secondary/20 transition-all duration-300 active:scale-[0.98]">
      {t('goToLogin') || 'Acessar minha conta'}
    </button>
  </div>
);

const PlanCard: React.FC<{ name: string, description: string, price: string, features: React.ReactNode[], isSelected: boolean, onSelect: () => void, isFeatured?: boolean }> = ({ name, description, price, features, isSelected, onSelect, isFeatured }) => {
  const { t } = useLanguage();
  return (
    <div
      onClick={onSelect}
      className={`relative p-8 rounded-[2.5rem] flex flex-col h-full cursor-pointer transition-all duration-500 border-2 group ${isSelected
        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.03]'
        : 'border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-gray-200/50'
        }`}
    >
      {isFeatured && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Recomendado
        </span>
      )}
      <div className="mb-8">
        <h3 className={`text-2xl font-black mb-2 ${isFeatured ? 'text-secondary' : 'text-gray-800'}`}>{name}</h3>
        <p className="text-sm text-gray-400 font-medium leading-relaxed">{description}</p>
      </div>

      <div className="mb-10">
        <div className="flex items-baseline">
          <span className="text-3xl font-black text-secondary">{price}</span>
          <span className="ml-1 text-sm text-gray-400 font-bold">{t('perMonthSuffix') || '/mês'}</span>
        </div>
      </div>

      <ul className="space-y-4 flex-grow mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start text-sm font-semibold text-secondary/70">
            <span className="mr-3 mt-0.5 text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={`mt-auto py-3 rounded-xl font-black text-center text-xs uppercase tracking-widest transition-all ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
        }`}>
        {isSelected ? 'Plano Selecionado' : 'Selecionar plano'}
      </div>
    </div>
  );
};

const SignUpPage: React.FC<SignUpPageProps> = ({ navigate, goBack }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0); // 0: Type Selection
  const [userType, setUserType] = useState<'salon' | 'client' | null>(null);

  // Form States
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [validation, setValidation] = useState({ length: false, uppercase: false, lowercase: false, number: false, special: false });
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<'Individual' | 'Empresa' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  useEffect(() => {
    if (confirmPassword) setPasswordsMatch(password === confirmPassword);
    else setPasswordsMatch(true);
  }, [password, confirmPassword]);

  const isStep1Valid = Object.values(validation).every(Boolean) && passwordsMatch && confirmPassword !== '';

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4); // Move to success step
    }, 1500);
  }

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-black text-secondary mb-4 tracking-tight">Qual o seu perfil de uso?</h2>
              <p className="text-gray-400 font-medium">Selecione a opção que melhor define sua necessidade no Salão24h.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UserTypeCard
                title="Gestão de Negócio"
                description="Controle sua agenda, equipe, financeiro e atraia novos clientes com IA."
                icon="🏢"
                selected={userType === 'salon'}
                onSelect={() => setUserType('salon')}
              />
              <UserTypeCard
                title="Acesso como Cliente"
                description="Agende serviços, descubra salões e gerencie seus compromissos."
                icon="📱"
                selected={userType === 'client'}
                onSelect={() => setUserType('client')}
              />
            </div>
            <button
              onClick={handleNext}
              disabled={!userType}
              className="w-full py-5 bg-secondary text-white font-black rounded-2xl hover:bg-secondary-dark shadow-xl hover:shadow-secondary/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-30 disabled:hover:shadow-none mt-8"
            >
              Continuar para o cadastro
            </button>
          </div>
        );
      case 1:
        return (
          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">{userType === 'salon' ? 'Nome do Estabelecimento' : 'Seu Nome'}</label>
                <input required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder={userType === 'salon' ? 'Ex: Studio Concept' : 'Nome completo'} />
              </div>
              {userType === 'salon' && (
                <div className="md:col-span-1">
                  <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">Seu Nome</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder="Como te chamamos?" />
                </div>
              )}
              <div className={userType === 'client' ? 'md:col-span-2' : 'md:col-span-2'}>
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">E-mail Profissional</label>
                <input type="email" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder="contato@exemplo.com" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">WhatsApp com DDD</label>
                <input type="tel" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">Crie sua Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium pr-14"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {isPasswordFocused && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner"
                >
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ValidationChecklistItem isValid={validation.length} text="8+ caracteres" />
                    <ValidationChecklistItem isValid={validation.uppercase} text="Letra maiúscula" />
                    <ValidationChecklistItem isValid={validation.lowercase} text="Letra minúscula" />
                    <ValidationChecklistItem isValid={validation.number} text="Um número" />
                    <ValidationChecklistItem isValid={validation.special} text="Caractere especial" />
                  </ul>
                </motion.div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">Confirme a Senha</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all font-medium ${!passwordsMatch && confirmPassword ? 'border-red-200 bg-red-50/30' : 'bg-gray-50 border-transparent focus:bg-white focus:border-primary/20'}`}
                  placeholder="Repita sua senha"
                />
                {!passwordsMatch && confirmPassword && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-red-500 mt-2 ml-2 font-bold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    As senhas não coincidem
                  </motion.p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button type="button" onClick={handlePrev} className="order-2 sm:order-1 flex-1 py-4 font-bold text-gray-400 hover:text-secondary transition-colors uppercase tracking-widest text-xs">Voltar</button>
              <button type="submit" disabled={!isStep1Valid} className="order-1 sm:order-2 flex-[2] py-5 bg-secondary text-white font-black rounded-2xl hover:bg-secondary-dark shadow-xl hover:shadow-secondary/30 disabled:opacity-30 transition-all active:scale-[0.98]">Finalizar e Criar Conta</button>
            </div>
          </form>
        );
      case 2:
        if (userType === 'client') {
          handleNext();
          return null;
        }
        return (
          <div className="space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-black text-secondary mb-4 tracking-tight">O plano ideal para seu crescimento</h2>
              <p className="text-gray-400 font-medium">Você terá 7 dias grátis para testar todas as funcionalidades.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
              <PlanCard
                name="Individual"
                description="Essencial para o profissional independente."
                price="R$ 79,87"
                features={['Sua Agenda Online', 'Fichas de Clientes', 'WhatsApp Automatizado']}
                isSelected={selectedPlan === 'Individual'}
                onSelect={() => setSelectedPlan('Individual')}
              />
              <PlanCard
                name="Empresa Pro"
                description="O cérebro digital para sua empresa."
                price="R$ 349,90"
                features={['Equipe Ilimitada', 'Multunidades', 'Estoque & Comissões', 'Agente IA Avançado']}
                isSelected={selectedPlan === 'Empresa'}
                onSelect={() => setSelectedPlan('Empresa')}
                isFeatured
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={handlePrev} className="order-2 sm:order-1 flex-1 py-4 font-bold text-gray-400 hover:text-secondary transition-colors uppercase tracking-widest text-xs">Ajustar dados</button>
              <button onClick={handleNext} disabled={!selectedPlan} className="order-1 sm:order-2 flex-[2] py-5 bg-secondary text-white font-black rounded-2xl hover:bg-secondary-dark shadow-xl hover:shadow-secondary/30 disabled:opacity-30 transition-all active:scale-[0.98]">Escolher este plano</button>
            </div>
          </div>
        );
      case 3:
        return (
          <form className="space-y-10" onSubmit={handleFinalSubmit}>
            <div className="text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-6 text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-3xl font-black text-secondary mb-4">Concluir ativação</h2>
              <p className="text-gray-400 font-medium italic">Seus 7 dias grátis começam agora. Nada será cobrado hoje.</p>
            </div>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">Nome Impresso no Cartão</label>
                <input type="text" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium uppercase" placeholder="JOÃO A SILVA" />
              </div>
              <div className="group">
                <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">Número do Cartão</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </span>
                  <input type="text" required className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder="0000 0000 0000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">Expiração</label>
                  <input type="text" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder="MM/AA" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary/60 ml-2 mb-2 uppercase tracking-wider">CVC/CVV</label>
                  <input type="text" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none font-medium" placeholder="000" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button type="button" onClick={handlePrev} className="order-2 sm:order-1 flex-1 py-4 font-bold text-gray-400 hover:text-secondary transition-colors uppercase tracking-widest text-xs">Revisar plano</button>
              <button type="submit" disabled={isLoading} className="order-1 sm:order-2 flex-[2] py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3">
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Ativar conta grátis</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        );
      case 4:
        return <SuccessView onFinish={() => navigate('login')} t={t} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="max-w-[800px] w-full bg-white p-8 md:p-16 rounded-[3.5rem] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.12)] border border-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10"
          >
            {step < 4 && (
              <div className="mb-12 text-center">
                <div onClick={() => navigate('home')} className="inline-flex items-center space-x-2 cursor-pointer mb-6 group">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <span className="text-white font-black">S</span>
                  </div>
                  <span className="text-2xl font-black text-secondary tracking-tight">Salão24h</span>
                </div>

                {step > 0 && (
                  <div className="flex justify-center gap-3 mt-6">
                    {[0, 1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-10 bg-primary' : s < step ? 'w-4 bg-primary/40' : 'w-4 bg-gray-100'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {step === 0 && (
          <div className="mt-12 text-center text-gray-400 font-medium">
            <span>Já faz parte da nossa comunidade? </span>
            <button
              onClick={() => navigate('login')}
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Fazer Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
