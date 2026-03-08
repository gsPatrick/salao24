import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

// --- Interfaces ---
interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
  plan?: 'Individual' | 'Empresa';
}

interface PaymentPageProps {
  selectedPlan: { name: string; price: string; };
  onPaymentSuccess?: (user: User) => void;
  goBack: () => void;
  currentUser: User | null;
  onUpdateSuccess?: () => void;
}

// --- Icons ---
const VisaIcon = () => <svg viewBox="0 0 80 80" className="w-8 h-8"><text x="10" y="55" fontFamily="Arial, sans-serif" fontSize="50" fill="#1A1F71">VISA</text></svg>;
const MastercardIcon = () => <svg viewBox="0 0 80 80" className="w-8 h-8"><circle cx="30" cy="40" r="20" fill="#EB001B" /><circle cx="50" cy="40" r="20" fill="#F79E1B" /><path d="M40,40 a 20,20 0 0,1 0,-40 a 20,20 0 0,1 0,40 M40,40 a 20,20 0 0,0 0,-40 a 20,20 0 0,0 0,40" fill="#FF5F00" /></svg>;
const AmexIcon = () => <svg viewBox="0 0 80 80" className="w-8 h-8"><rect width="60" height="40" x="10" y="20" fill="#0077CC" rx="5" /><text x="22" y="48" fontFamily="Arial, sans-serif" fontSize="20" fill="white">AMEX</text></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const PixIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M117.4 345.5L160.7 394C164.1 397.7 169.9 397.7 173.2 394L216.5 345.5C219 342.8 219 338.7 216.5 336L173.2 287.5C169.9 283.8 164.1 283.8 160.7 287.5L117.4 336C114.9 338.7 114.9 342.8 117.4 345.5Z" fill="#32BCAD"/>
    <path d="M295.5 345.5L338.8 394C342.2 397.7 348 397.7 351.3 394L394.6 345.5C397.1 342.8 397.1 338.7 394.6 336L351.3 287.5C348 283.8 342.2 283.8 338.8 287.5L295.5 336C293 338.7 293 342.8 295.5 345.5Z" fill="#32BCAD"/>
    <path d="M206.5 245.5L249.8 294C253.2 297.7 259 297.7 262.3 294L305.6 245.5C308.1 242.8 308.1 238.7 305.6 236L262.3 187.5C259 183.8 253.2 183.8 249.8 187.5L206.5 236C204 238.7 204 242.8 206.5 245.5Z" fill="#32BCAD"/>
    <path d="M117.4 145.5L160.7 194C164.1 197.7 169.9 197.7 173.2 194L216.5 145.5C219 142.8 219 138.7 216.5 136L173.2 87.5C169.9 83.8 164.1 83.8 160.7 87.5L117.4 136C114.9 138.7 114.9 142.8 117.4 145.5Z" fill="#32BCAD"/>
    <path d="M295.5 145.5L338.8 194C342.2 197.7 348 197.7 351.3 194L394.6 145.5C397.1 142.8 397.1 138.7 394.6 136L351.3 87.5C348 83.8 342.2 83.8 338.8 87.5L295.5 136C293 138.7 293 142.8 295.5 145.5Z" fill="#32BCAD"/>
  </svg>
);
const QRIcon = () => <svg className="w-48 h-48 mx-auto" viewBox="0 0 256 256"><path fill="#000" d="M128 256a128 128 0 1 0 0-256a128 128 0 1 0 0 256ZM48 48v64h64V48H48Zm16 16h32v32H64V64Zm80-16v64h64V48h-64Zm16 16h32v32h-32V64ZM48 144v64h64v-64H48Zm16 16h32v32H64v-32Zm80-16h16v16h-16v-16Zm16 16h16v16h-16v-16Zm16-16h16v16h-16v-16Zm-16 32h16v16h-16v-16Zm16 16h16v16h-16v-16Zm-32-16h16v16h-16v-16Zm0 16h16v16h-16v-16Zm-16-16h16v16h-16v-16Zm-16 32h16v16H96v-16Zm32 0h16v16h-16v-16Zm-16-16h16v16h-16v-16Z" /></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const ApplePayIcon = () => <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.623 13.837c-.082 2.39-1.638 4.331-3.64 4.428c-1.365.046-2.585-.742-3.328-.742-.758 0-2.122.73-3.433.766-2.03.046-3.767-1.896-3.767-4.498 0-2.83 1.908-4.238 3.684-4.238 1.26 0 2.2.73 3.205.73.979 0 2.122-.812 3.535-.754 1.393.045 2.998 1.806 2.548 4.293zM15.424 7.189c.731-.88 1.26-2.067 1.134-3.235-1.31.063-2.616.85-3.433 1.758-.669.742-1.31 2.021-1.107 3.172.964.013 2.25-.758 3.406-1.695z" /></svg>;
const GooglePayIcon = () => <svg className="w-10 h-10" viewBox="0 0 48 48"><path fill="#4285F4" d="M38.1 20.3c0-1.2-.1-2.4-.4-3.5H24v6.6h7.9c-.3 2.2-1.4 4.1-3.1 5.4v4.3h5.5c3.2-3 5.2-7.3 5.2-12.8z" /><path fill="#34A853" d="M24 39c3.9 0 7.2-1.3 9.6-3.5l-5.5-4.3c-1.3.9-3 1.4-4.9 1.4-3.7 0-6.9-2.5-8-5.9H9.3v4.5c2.3 4.5 6.9 7.5 12.3 7.5z" /><path fill="#FBBC05" d="M13.6 26.5c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9V18.2H9.3C8.4 20 8 22 8 24.1s.4 4.1 1.3 5.9l4.3-4.5z" /><path fill="#EA4335" d="M24 15.1c2.1 0 3.9.7 5.4 2.1l4.9-4.9C31.2 9.8 27.9 8 24 8c-5.4 0-10 3-12.3 7.5l4.3 4.5c1.1-3.3 4.3-5.9 8-5.9z" /></svg>;
const PayPalIcon = () => <svg className="w-10 h-10" viewBox="0 0 24 24"><path fill="#003087" d="M20.65 8.35c-.19-1.26-.69-2.22-1.45-2.92-1-.91-2.46-1.4-4.31-1.4H6.38L5.22 15.6h3.49c.58 0 1.05-.44 1.12-1.02l.6-3.87c.07-.46.46-.8.93-.8h.21c2.1 0 3.66 1.33 3.47 3.28-.15 1.55-1.49 2.52-3.1 2.52H9.98l-.75 4.74c-.06.4.26.75.66.75h2.95c3.84 0 6.55-2.22 7.1-5.74.4-2.5-1-4.49-2.3-5.18z" /><path fill="#009CDE" d="M21.36 8.16c-.19-1.26-.69-2.22-1.45-2.92-.99-.9-2.45-1.39-4.3-1.39H7.09l-.5 3.16h4.08c2.1 0 3.66 1.33 3.47 3.28-.15 1.55-1.49 2.52-3.1 2.52H8.81l-.5 3.16H11c3.84 0 6.55-2.22 7.1-5.74.41-2.5-1-4.49-2.29-5.18l.55.33z" /></svg>;


const SuccessView: React.FC<{ title: string; message: string; }> = ({ title, message }) => (
  <div className="min-h-screen flex items-center justify-center bg-light py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
    <div className="max-w-md w-full space-y-8 text-center">
      <div className="mx-auto mb-6">
        <svg className="w-24 h-24 text-primary" fill="none" viewBox="0 0 52 52">
          <circle className="animate-scale-in stroke-current text-primary/20" cx="26" cy="26" r="25" strokeWidth="4" />
          <path
            className="animate-draw-check stroke-current"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 34, strokeDashoffset: 34 }}
            d="M14 27l8 8 16-16"
          />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-secondary mb-4">{title}</h2>
      <p className="text-gray-600 mb-8">{message}</p>
    </div>
  </div>
);


const AVAILABLE_PLANS = [
  { id: 1, name: 'Individual', price: 'R$ 79,87', description: 'Para autônomos.', frequency: 'mês' },
  { id: 2, name: 'Empresa Essencial', price: 'R$ 199,90', description: 'Para equipes pequenas.', frequency: 'mês' },
  { id: 3, name: 'Empresa Pro', price: 'R$ 349,90', description: 'Com assistente de IA.', frequency: 'mês' },
  { id: 4, name: 'Empresa Premium', price: 'R$ 599,90', description: 'Para grandes redes.', frequency: 'mês' }
];

export const PaymentPage: React.FC<PaymentPageProps> = ({ selectedPlan, onPaymentSuccess, goBack, currentUser, onUpdateSuccess }) => {
  const { t } = useLanguage();

  // Find the initial plan from the AVAILABLE_PLANS to ensure we have the full object (including id) if possible
  const initialPlan = useMemo(() => {
    return AVAILABLE_PLANS.find(p => p.name === selectedPlan.name) || { ...selectedPlan, id: 1, description: '', frequency: 'mês' };
  }, [selectedPlan]);

  const [localPlan, setLocalPlan] = useState(initialPlan);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [cardType, setCardType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    cardNumber: '', expiry: '', cvc: '', name: currentUser?.name || '',
    cep: '', street: '', number: '', neighborhood: '', city: '', state: ''
  });
  const [isCopied, setIsCopied] = useState(false);
  const [pixStatus, setPixStatus] = useState<'idle' | 'waiting'>('idle');
  const [pixData, setPixData] = useState<{ pixEncodedCode: string; payload: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: '', message: '' });

  const isUpdateMode = !!(currentUser && onUpdateSuccess);

  const validateField = useCallback((name: keyof typeof formData, value: string) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value) error = t('errorRequired');
        break;
      case 'cardNumber':
        if (!value || value.replace(/\D/g, '').length !== 16) error = t('errorInvalidCardNumber');
        break;
      case 'expiry':
        if (!/^\d{2}\s\/\s\d{2}$/.test(value)) {
          error = t('errorInvalidExpiry');
        } else {
          const [month, year] = value.split(' / ').map(Number);
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear() % 100;
          if (year < currentYear || (year === currentYear && month < currentMonth)) {
            error = t('errorInvalidExpiry');
          }
        }
        break;
      case 'cvc':
        if (!value || value.length < 3 || value.length > 4) error = t('errorInvalidCVC');
        break;
      case 'cep':
        if (!value || value.replace(/\D/g, '').length !== 8) error = 'CEP inválido';
        break;
      case 'street':
        if (!value) error = t('errorRequired');
        break;
      case 'number':
        if (!value) error = t('errorRequired');
        break;
      case 'neighborhood':
        if (!value) error = t('errorRequired');
        break;
      case 'city':
        if (!value) error = t('errorRequired');
        break;
      case 'state':
        if (!value || value.length !== 2) error = 'UF inválida';
        break;
    }
    return error;
  }, [t]);

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1 / $2').slice(0, 7);
  };

  const detectCardType = (number: string) => {
    const num = number.replace(/\s/g, '');
    if (num.startsWith('4')) setCardType('visa');
    else if (/^5[1-5]/.test(num)) setCardType('mastercard');
    else if (/^3[47]/.test(num)) setCardType('amex');
    else setCardType(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
    }

    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      detectCardType(formattedValue);
    } else if (name === 'expiry') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'cep') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
      if (formattedValue.length === 9) {
          fetchAddressByCep(formattedValue.replace('-', ''));
      }
    } else if (name === 'state') {
        formattedValue = value.toUpperCase().slice(0, 2);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const fetchAddressByCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    }
  };

  const isCardFormValid = useMemo(() => {
    const allFieldsFilled = Object.values(formData).every(Boolean);
    const noErrors = Object.values(errors).every(e => !e);
    // Also re-validate all fields to be sure
    const allFieldsValid = Object.entries(formData).every(([key, value]) => !validateField(key as keyof typeof formData, value));
    return allFieldsFilled && noErrors && allFieldsValid;
  }, [formData, errors, validateField]);

  const { subscribeToPlan, getPaymentStatus, refreshTenant } = useData();

  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const pollPaymentStatus = useCallback(async (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5s interval)
    
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }

      try {
        const result = await getPaymentStatus(paymentId);
        if (result && (result.status === 'CONFIRMED' || result.status === 'RECEIVED')) {
            clearInterval(interval);
            await refreshTenant();
            setIsSuccess(true);
            setSuccessInfo({
              title: 'Pagamento Confirmado',
              message: 'Sua assinatura foi ativada com sucesso! Você já pode aproveitar todos os recursos do plano.'
            });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [getPaymentStatus, refreshTenant]);

  const handleRealAsaasPayment = async (method: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED') => {
    setIsProcessing(true);
    setErrors({});
    try {
      const planMap: { [key: string]: number } = {
        'Individual': 1,
        'Empresa Essencial': 2,
        'Empresa Pro': 3,
        'Empresa Premium': 4
      };
      const planId = localPlan.id || planMap[localPlan.name] || 1;

      const billingInfo = method === 'CREDIT_CARD' ? {
        name: formData.name,
        email: currentUser?.email,
        cpfCnpj: '', // Should be collected if not in tenant
        postalCode: formData.cep.replace(/\D/g, ''),
        address: formData.street,
        addressNumber: formData.number,
        complement: '',
        province: formData.neighborhood,
        city: formData.city,
        state: formData.state
      } : null;

      const creditCardInfo = method === 'CREDIT_CARD' ? {
        holderName: formData.name,
        number: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: formData.expiry.split(' / ')[0],
        expiryYear: '20' + formData.expiry.split(' / ')[1],
        ccv: formData.cvc
      } : null;

      const response = await subscribeToPlan(planId, method, billingInfo, creditCardInfo);

      if (response && response.success) {
        const data = response.data;
        if (method === 'PIX' && data?.pixData) {
            setPixData(data.pixData);
            setPixStatus('waiting');
            if (data.paymentId) {
                setCurrentPaymentId(data.paymentId);
                pollPaymentStatus(data.paymentId);
            }
        } else if (method === 'CREDIT_CARD') {
            if (data?.paymentStatus === 'CONFIRMED' || data?.paymentStatus === 'RECEIVED') {
                setIsSuccess(true);
                setSuccessInfo({
                  title: 'Pagamento Processado',
                  message: 'Sua assinatura foi atualizada com sucesso!'
                });
            } else if (data?.paymentId) {
                setCurrentPaymentId(data.paymentId);
                pollPaymentStatus(data.paymentId);
                // Optionally show a "Processing" state for CC
            }
        } else if (data?.invoiceUrl) {
            window.location.href = data.invoiceUrl;
        } else if (method === 'PIX') {
            // If PIX but no data yet, show waiting/retry state
            setPixStatus('waiting');
            setErrors({ global: 'Chave Pix sendo gerada. Por favor, aguarde alguns segundos...' });
        } else {
            setErrors({ global: 'Pagamento em processamento. Você será notificado em instantes.' });
        }
      } else {
        throw new Error(response?.message || 'Erro ao processar assinatura');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      setErrors({ global: error.message || 'Erro ao processar pagamento. Tente novamente.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    handleRealAsaasPayment('CREDIT_CARD');
  };

  const handlePixSimulation = () => {
    handleRealAsaasPayment('PIX');
  }

  const handleCopyPix = () => {
    if (pixData?.payload) {
        navigator.clipboard.writeText(pixData.payload);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  }

  if (isSuccess) {
    return <SuccessView title={successInfo.title} message={successInfo.message} />;
  }

  const PaymentMethodButton: React.FC<{ method: 'card' | 'pix', label: string, icon: React.ReactNode }> = ({ method, label, icon }) => (
    <button
      type="button"
      onClick={() => setPaymentMethod(method)}
      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-t-lg border-b-2 font-semibold transition-colors ${paymentMethod === method ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:bg-gray-100'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden animate-fade-in bg-white">
        {/* Left Side: Summary */}
        <div className="bg-secondary text-white p-8 md:p-10 flex flex-col">
          <a href="#" onClick={(e) => { e.preventDefault(); goBack(); }} className="text-2xl font-extrabold no-underline mb-10">Salão24h</a>
          <div className="flex-grow">
            {isUpdateMode ? (
              <div className="animate-fade-in">
                <h2 className="text-xl font-semibold mb-6">Atualizar Pagamento</h2>
                <p className="text-gray-300">Atualize seu método de pagamento. Suas informações são salvas com segurança em nosso sistema.</p>
                <p className="text-gray-300 mt-4">Plano atual: <span className="font-bold">{localPlan.name}</span></p>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-fade-in">
                <h2 className="text-xl font-semibold mb-6">Escolha seu Plano</h2>
                <div className="space-y-3 flex-grow">
                  {AVAILABLE_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setLocalPlan(plan)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                        localPlan.id === plan.id || localPlan.name === plan.name
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-transparent border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-lg">{plan.name}</span>
                        <span className={`font-extrabold ${localPlan.id === plan.id || localPlan.name === plan.name ? 'text-primary' : ''}`}>
                          {plan.price}
                        </span>
                      </div>
                      <div className="text-sm opacity-80 flex justify-between">
                        <span>{plan.description}</span>
                        <span>/{plan.frequency}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-600">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-300">Valor Mensal:</span>
                    <span className="font-bold text-lg">{localPlan.price}</span>
                  </div>
                  <div className="flex justify-between items-center flex-wrap">
                    <span className="text-gray-200 text-lg">Total a pagar hoje:</span>
                    <span className="font-extrabold text-3xl text-primary">{localPlan.price}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-8">&copy; 2024 Salão24h. Todos os direitos reservados.</p>
        </div>

        {/* Right Side: Payment Form */}
        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-bold text-secondary mb-2">{isUpdateMode ? 'Informações de Pagamento' : 'Pagamento'}</h2>
          <p className="text-gray-600 text-sm mb-6">{isUpdateMode ? 'Edite os detalhes do seu cartão.' : 'Escolha sua forma de pagamento preferida.'}</p>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <PaymentMethodButton method="card" label="Cartão" icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v6a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>} />
              <PaymentMethodButton method="pix" label="Pix" icon={<PixIcon />} />
            </nav>
          </div>

          <div className="mt-6">
            {paymentMethod === 'card' && (
              <form className="space-y-4 animate-fade-in" onSubmit={handlePaymentSimulation} noValidate>
                {errors.global && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{errors.global}</div>}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome no Cartão</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 w-full p-3 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>
                  <div className="relative">
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Número do Cartão</label>
                    <input type="tel" id="cardNumber" name="cardNumber" value={formData.cardNumber} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 w-full p-3 border rounded-md pr-12 ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`} />
                    <div className="absolute top-9 right-3 flex items-center">
                      {cardType === 'visa' && <VisaIcon />}
                      {cardType === 'mastercard' && <MastercardIcon />}
                      {cardType === 'amex' && <AmexIcon />}
                    </div>
                    {errors.cardNumber && <p className="text-xs text-red-600 mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">Validade</label>
                      <input type="tel" id="expiry" name="expiry" value={formData.expiry} onChange={handleChange} onBlur={handleBlur} required placeholder="MM / AA" className={`mt-1 w-full p-3 border rounded-md ${errors.expiry ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.expiry && <p className="text-xs text-red-600 mt-1">{errors.expiry}</p>}
                    </div>
                    <div className="relative">
                      <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                      <input type="tel" id="cvc" name="cvc" value={formData.cvc} onChange={handleChange} onBlur={handleBlur} required placeholder="123" className={`mt-1 w-full p-3 border rounded-md ${errors.cvc ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.cvc && <p className="text-xs text-red-600 mt-1">{errors.cvc}</p>}
                    </div>
                  </div>

                  {/* Billing Address Details */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Endereço de Cobrança</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="col-span-1">
                        <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
                        <input type="tel" id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleBlur} placeholder="00000-000" className={`mt-1 w-full p-3 border rounded-md ${errors.cep ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700">Logradouro</label>
                        <input type="text" id="street" name="street" value={formData.street} onChange={handleChange} onBlur={handleBlur} className={`mt-1 w-full p-3 border rounded-md ${errors.street ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label htmlFor="number" className="block text-sm font-medium text-gray-700">Número</label>
                        <input type="text" id="number" name="number" value={formData.number} onChange={handleChange} onBlur={handleBlur} className={`mt-1 w-full p-3 border rounded-md ${errors.number ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
                        <input type="text" id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} onBlur={handleBlur} className={`mt-1 w-full p-3 border rounded-md ${errors.neighborhood ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                        <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} className={`mt-1 w-full p-3 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">UF</label>
                        <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} placeholder="SP" className={`mt-1 w-full p-3 border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                  <button type="button" onClick={goBack} className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    {t('back')}
                  </button>
                  <button type="submit" disabled={isProcessing || !isCardFormValid} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400">
                    {isProcessing ? 'Processando...' : (isUpdateMode ? 'Atualizar Cartão' : `Pagar ${localPlan.price}`)}
                  </button>
                </div>
              </form>
            )}

            {paymentMethod === 'pix' && (
              <div className="text-center animate-fade-in">
                {pixStatus === 'idle' ? (
                  <div className="py-8 flex flex-col items-center">
                    <PixIcon />
                    <h4 className="mt-6 text-xl font-bold text-secondary">Assinar via Pix</h4>
                    <p className="mt-2 text-gray-500 max-w-xs mx-auto">Gere o código Pix para assinar o plano <span className="font-bold">{localPlan.name}</span> instantaneamente.</p>
                    <button 
                      onClick={handlePixSimulation} 
                      disabled={isProcessing}
                      className="mt-8 px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? 'Gerando...' : 'Gerar Chave Pix'}
                    </button>
                    <button type="button" onClick={goBack} className="mt-4 text-gray-400 font-bold hover:text-gray-600 uppercase text-xs tracking-widest">
                      {t('back')}
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    {pixData ? (
                      <>
                        <div className="relative p-4 bg-white border-2 border-primary/20 rounded-3xl mb-6 shadow-inner mx-auto w-fit">
                            <img 
                                src={`data:image/png;base64,${pixData.pixEncodedCode}`} 
                                alt="Pix QR Code" 
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="mt-4 font-bold text-secondary">Escaneie o QR Code para pagar</p>
                        <div className="my-6">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Ou use o Pix Copia e Cola:</p>
                          <div className="flex items-center justify-center">
                            <button onClick={handleCopyPix} className="flex items-center gap-3 py-3 px-6 bg-primary/5 text-primary border border-primary/20 rounded-2xl font-bold transition-all hover:bg-primary/10 active:scale-95">
                              {isCopied ? <CheckIcon /> : <CopyIcon />}
                              {isCopied ? 'Copiado!' : 'Copiar Chave Pix'}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-6 border-t pt-6">
                          <p className="text-xs text-gray-400 italic mb-2">A confirmação é automática após o pagamento.</p>
                          <div className="flex gap-3">
                            <button type="button" onClick={() => setPixStatus('idle')} className="w-full flex justify-center py-3 px-4 border border-gray-200 text-sm font-bold rounded-xl text-gray-400 bg-white hover:bg-gray-50 uppercase tracking-widest">
                              Alterar
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="font-bold text-secondary">Aguardando confirmação do pagamento...</p>
                        <button type="button" onClick={() => setPixStatus('idle')} className="mt-6 py-2 px-4 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest underline underline-offset-4">
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
          <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center">
            <LockIcon />
            <span className="ml-1">Pagamento seguro processado pela Asaas.</span>
          </div>
        </div>
      </div>
    </div>
  );
};