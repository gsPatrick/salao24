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
const PixIcon = () => <svg className="w-5 h-5" viewBox="0 0 205 205" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M102.5 205C159.109 205 205 159.109 205 102.5C205 45.891 159.109 0 102.5 0C45.891 0 0 45.891 0 102.5C0 159.109 45.891 205 102.5 205Z" fill="#32BCAD" /><path d="M110.191 64.9189L143.514 115.137C146.405 119.554 143.435 125.311 138.401 125.311H70.1873C65.6562 125.311 62.7744 120.373 64.881 116.142L81.0401 85.3417C82.1764 83.0933 82.686 80.592 82.5222 78.113L81.0401 54.4533C80.666 48.0699 88.0069 44.9788 91.597 50.4851L110.191 64.9189Z" fill="white" /><path d="M123.013 87.7346L143.514 121.725C146.405 126.142 143.435 131.899 138.401 131.899H70.1873C65.6562 131.899 62.7744 126.961 64.881 122.73L81.0401 91.9292C82.1764 89.6808 82.686 87.1795 82.5222 84.7005L81.0401 61.0408C80.666 54.6574 88.0069 51.5663 91.597 57.0726L110.191 71.5064C113.116 73.7441 114.773 77.1685 114.773 80.7251V111.895C114.773 116.329 119.349 118.905 123.013 116.102L135.596 92.5694C137.994 88.3075 133.561 83.1856 129.15 85.4542L123.013 87.7346Z" fill="#f0f0f0" /></svg>;
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


export const PaymentPage: React.FC<PaymentPageProps> = ({ selectedPlan, onPaymentSuccess, goBack, currentUser, onUpdateSuccess }) => {
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'other'>('card');
  const [cardType, setCardType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    cardNumber: '', expiry: '', cvc: '', name: currentUser?.name || ''
  });
  const [isCopied, setIsCopied] = useState(false);
  const [pixStatus, setPixStatus] = useState<'idle' | 'waiting'>('idle');
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
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const isCardFormValid = useMemo(() => {
    const allFieldsFilled = Object.values(formData).every(Boolean);
    const noErrors = Object.values(errors).every(e => !e);
    // Also re-validate all fields to be sure
    const allFieldsValid = Object.entries(formData).every(([key, value]) => !validateField(key as keyof typeof formData, value));
    return allFieldsFilled && noErrors && allFieldsValid;
  }, [formData, errors, validateField]);

  const { subscribeToPlan } = useData();

  const handleRealAsaasPayment = async (paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED') => {
    setIsProcessing(true);
    setErrors({});
    try {
      // Map plan names to IDs (Ideally these should come from the API/Context)
      const planMap: { [key: string]: number } = {
        'Individual': 1,
        'Empresa Essencial': 2,
        'Empresa Pro': 3,
        'Empresa Premium': 4
      };
      const planId = planMap[selectedPlan.name] || 1;

      const response = await subscribeToPlan(planId, paymentMethod);

      if (response && response.invoiceUrl) {
        // Redirect to Asaas payment page
        window.location.href = response.invoiceUrl;
      } else if (response && response.invoiceCustomizationUrl) {
        window.location.href = response.invoiceCustomizationUrl;
      } else {
        throw new Error('Link de pagamento não gerado');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      setErrors({ global: 'Erro ao processar pagamento. Tente novamente.' });
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
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913NOME_DA_EMPRESA6009SAO_PAULO62070503***6304E2A4');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  if (isSuccess) {
    return <SuccessView title={successInfo.title} message={successInfo.message} />;
  }

  const PaymentMethodButton: React.FC<{ method: 'card' | 'pix' | 'other', label: string, icon: React.ReactNode }> = ({ method, label, icon }) => (
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
                <p className="text-gray-300 mt-4">Plano atual: <span className="font-bold">{selectedPlan.name}</span></p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Resumo do Pedido</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                    <span className="text-gray-300">Plano Selecionado:</span>
                    <span className="font-bold text-lg">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-600">
                    <span className="text-gray-300">Valor Mensal:</span>
                    <span className="font-bold text-lg">{selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-gray-200 text-lg">Total a pagar:</span>
                    <span className="font-extrabold text-2xl">{selectedPlan.price}</span>
                  </div>
                </div>
              </>
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
              <PaymentMethodButton method="other" label="Outros" icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>} />
            </nav>
          </div>

          <div className="mt-6">
            {paymentMethod === 'card' && (
              <form className="space-y-4 animate-fade-in" onSubmit={handlePaymentSimulation} noValidate>
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
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                  <button type="button" onClick={goBack} className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    {t('back')}
                  </button>
                  <button type="submit" disabled={isProcessing || !isCardFormValid} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400">
                    {isProcessing ? 'Processando...' : (isUpdateMode ? 'Atualizar Cartão' : `Pagar ${selectedPlan.price}`)}
                  </button>
                </div>
              </form>
            )}

            {paymentMethod === 'pix' && (
              <div className="text-center animate-fade-in">
                {pixStatus === 'idle' ? (
                  <>
                    <QRIcon />
                    <p className="mt-4 font-semibold">Escaneie o QR Code para pagar</p>
                    <div className="my-4">
                      <p className="text-sm text-gray-500 mb-2">Ou use o Pix Copia e Cola:</p>
                      <div className="flex items-center justify-center">
                        <button onClick={handleCopyPix} className="flex items-center gap-2 py-2 px-4 bg-light rounded-md border text-sm font-medium hover:bg-gray-200">
                          {isCopied ? <CheckIcon /> : <CopyIcon />}
                          {isCopied ? 'Copiado!' : 'Copiar Chave'}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                      <button type="button" onClick={goBack} className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        {t('back')}
                      </button>
                      <button onClick={handlePixSimulation} className="w-full py-3 px-4 bg-primary text-white font-bold rounded-md">Já paguei, confirmar</button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 font-semibold text-secondary">Aguardando confirmação do pagamento...</p>
                    <button type="button" onClick={goBack} className="mt-6 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      {t('back')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'other' && (
              <div className="space-y-4 animate-fade-in">
                <button className="w-full flex items-center justify-center gap-4 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-800 bg-white hover:bg-gray-50"><ApplePayIcon /> Apple Pay</button>
                <button className="w-full flex items-center justify-center gap-4 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-800 bg-white hover:bg-gray-50"><GooglePayIcon /> Google Pay</button>
                <button className="w-full flex items-center justify-center gap-4 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-800 bg-white hover:bg-gray-50"><PayPalIcon /> PayPal</button>
                <div className="mt-6 pt-6 border-t">
                  <button type="button" onClick={goBack} className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    {t('back')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center">
            <LockIcon />
            <span className="ml-1">Pagamento seguro processado pela Stripe.</span>
          </div>
        </div>
      </div>
    </div>
  );
};