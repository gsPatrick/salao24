import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
    plan?: 'Individual' | 'Empresa' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium';
    businessSegmentKey?: string;
    businessSegmentLabel?: string;
}

interface Contract {
    planName: string;
    price: string;
    discountedPrice: string;
    priceAfterYear: string;

    date: string;
    contractText: string;
    signatureImg: string;
    userPhoto: string;
    userName: string;
    userCpf: string;
}

interface Plan {
    name: string;
    price: string;
    description?: string;
}

interface Client {
    id: number;
    name: string;
    cpf?: string;
}


interface TrialPageProps {
    navigate: (page: string) => void;
    goBack: () => void;
    onTrialSuccess: (user: User, contract: Contract) => void;
    selectedPlan: Plan | null;
    allClients: Client[];
    onStartSignatureFlow: (data: { contractText: string; user: User; cpf: string }) => void;
}

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


const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l6.19 5.238C44.484 36.336 48 30.732 48 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

const AppleIcon: React.FC = () => (
    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.623,13.837c-0.082,2.39-1.638,4.331-3.64,4.428c-1.365,0.046-2.585-0.742-3.328-0.742 c-0.758,0-2.122,0.73-3.433,0.766c-2.03,0.046-3.767-1.896-3.767-4.498c0-2.83,1.908-4.238,3.684-4.238 c1.26,0,2.2,0.73,3.205,0.73c0.979,0,2.122-0.812,3.535-0.754C18.473,9.596,20.07,11.357,19.623,13.837z M15.424,7.189 c0.731-0.88,1.26-2.067,1.134-3.235c-1.31,0.063-2.616,0.85-3.433,1.758c-0.669,0.742-1.31,2.021-1.107,3.172 C13.337,8.895,14.62,8.125,15.424,7.189z" />
    </svg>
);

const plans: Plan[] = [
    { name: 'Individual', price: 'R$ 79,87', description: 'Para 1 usuário' },
    { name: 'Empresa Essencial', price: 'R$ 199,90', description: 'Até 5 usuários' },
    { name: 'Empresa Pro', price: 'R$ 349,90', description: 'Até 10 usuários' },
    { name: 'Empresa Premium', price: 'R$ 599,90', description: 'Usuários ilimitados' }
];

const BeautyIcon: React.FC = () => (
    <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l6 6" />
        <path d="M4 10l2 2" />
        <path d="M10 4L8 6" />
        <path d="M13 4h3.2a1.8 1.8 0 011.8 1.8V9" />
        <path d="M15 4v12" />
        <path d="M14 16h2" />
    </svg>
);

const WellnessIcon: React.FC = () => (
    <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4c-1.5 1.1-3 3.2-3 5.2A3 3 0 0012 12a3 3 0 003-2.8C15 7.2 13.5 5.1 12 4z" />
        <path d="M6 20c1.4-2.4 3.7-4 6-4s4.6 1.6 6 4" />
        <path d="M5 11c.4 1.3 1.3 2.5 2.5 3.4" />
        <path d="M19 11c-.4 1.3-1.3 2.5-2.5 3.4" />
    </svg>
);

const StudioIcon: React.FC = () => (
    <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12s3-4 9-4 9 4 9 4-3 4-9 4-9-4-9-4z" />
        <circle cx="12" cy="12" r="2.4" />
        <path d="M8 5l1.5 2" />
        <path d="M16 5L14.5 7" />
    </svg>
);

const FootIcon: React.FC = () => (
    <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16.5" cy="4.5" r="1.3" />
        <circle cx="14" cy="3.8" r="1.1" />
        <circle cx="11.8" cy="4" r="1" />
        <circle cx="10" cy="5" r="0.9" />
        <path d="M8 8.5c.4-1.3 1.6-2.2 3-2.1 1.4.1 2.5 1.2 2.6 2.6.1 2-1.1 4.6-3 6.4L8 19.5" />
        <path d="M7 18.8L5.6 17" />
    </svg>
);

const BarberIcon: React.FC = () => (
    <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5l5 5" />
        <path d="M5 10l3 3" />
        <path d="M19 5l-5 5" />
        <path d="M19 10l-3 3" />
        <path d="M7.5 15.5C8.3 17.4 10 19 12 19s3.7-1.6 4.5-3.5" />
        <path d="M7.5 15.5H16.5" />
    </svg>
);

const NailIcon: React.FC = () => (
    <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="5" rx="1" />
        <path d="M9 8h6v7a3 3 0 01-3 3h0a3 3 0 01-3-3V8z" />
        <path d="M10 13h4" />
    </svg>
);

type SegmentKey = 'salao' | 'bemEstar' | 'estudio' | 'podologia' | 'barbearia' | 'esmalteria' | 'outros';

const segments: { key: SegmentKey; title: string; description: string; Icon: React.FC }[] = [
    {
        key: 'salao',
        title: 'Salão de beleza',
        description: 'Cabeleireiro unissex, manicure e pedicure, depilação, sobrancelhas e maquiagem',
        Icon: BeautyIcon,
    },
    {
        key: 'bemEstar',
        title: 'Bem-estar e estética',
        description: 'Massagens, tratamentos corporais e faciais, como drenagens, peelings, preenchimentos e outros',
        Icon: WellnessIcon,
    },
    {
        key: 'estudio',
        title: 'Estúdio de beleza',
        description: 'Estúdios especializados em depilação a laser, sobrancelhas, cílios, maquiagem e penteados',
        Icon: StudioIcon,
    },
    {
        key: 'podologia',
        title: 'Podologia',
        description: 'Cuidados e tratamentos de unhas e pés',
        Icon: FootIcon,
    },
    {
        key: 'barbearia',
        title: 'Barbearia',
        description: 'Cabeleireiro e barbearia masculina',
        Icon: BarberIcon,
    },
    {
        key: 'esmalteria',
        title: 'Esmalteria',
        description: 'Manicure e pedicure de técnicas convencionais e específicas, como esmaltação em gel e outros',
        Icon: NailIcon,
    },
    {
        key: 'outros',
        title: 'Outros segmentos',
        description: 'Clínicas, spas, estúdios híbridos e outros modelos de negócio de beleza ou bem-estar',
        Icon: WellnessIcon,
    },
];

const TrialPage: React.FC<TrialPageProps> = ({ navigate, goBack, onTrialSuccess, selectedPlan: initialPlan, allClients, onStartSignatureFlow }) => {
    const { t } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // FIX: Broaden the type of the 'errors' state to 'any' for its values to resolve a misleading TypeScript error about symbol index types. This prevents the compiler from failing on a complex type assignment.
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
    const [chosenPlan, setChosenPlan] = useState<Plan | null>(initialPlan);
    const [selectedSegment, setSelectedSegment] = useState<SegmentKey | null>(null);
    const [otherSegmentText, setOtherSegmentText] = useState('');
    const accountSectionRef = useRef<HTMLDivElement | null>(null);

    const [formData, setFormData] = useState({
        salonName: 'Espaço Beleza Fictício',
        fullName: 'Maria da Silva',
        cpf: '123.456.789-00',
        email: 'maria.silva@example.com',
        password: '',
        confirmPassword: '',
    });

    const validate = (name: keyof typeof formData, value: string, allData: typeof formData): string => {
        let error = '';
        switch (name) {
            case 'salonName':
            case 'fullName':
                if (!value.trim()) error = t('errorRequired');
                break;
            case 'cpf':
                if (!value.trim()) error = t('errorRequired');
                else if (value.replace(/\D/g, '').length !== 11) error = t('errorInvalidCPF');
                break;
            case 'email':
                if (!value.trim()) error = t('errorRequired');
                else if (!/\S+@\S+\.\S+/.test(value)) error = t('errorInvalidEmail');
                break;
            case 'password':
                if (!value) error = t('errorRequired');
                else if (value.length < 8) error = t('errorPasswordMinLength');
                break;
            case 'confirmPassword':
                if (!value) error = t('errorRequired');
                else if (value !== allData.password) error = t('errorPasswordMismatch');
                break;
        }
        return error;
    };

    useEffect(() => {
        if (initialPlan) {
            const matchingPlan = plans.find(p => p.name === initialPlan.name);
            setChosenPlan(matchingPlan || initialPlan);
        }
    }, [initialPlan]);

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

    const formatCPF = (value: string) => {
        return value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof typeof formData;
        const { value } = e.target;

        const processedValue = name === 'cpf' ? formatCPF(value) : value;

        setFormData(prevData => {
            const newData = { ...prevData, [name]: processedValue };

            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                newErrors[name] = validate(name, processedValue, newData);

                if (name === 'password') {
                    newErrors.confirmPassword = validate('confirmPassword', newData.confirmPassword, newData);
                }
                if (name === 'confirmPassword') {
                    newErrors.confirmPassword = validate('confirmPassword', processedValue, newData);
                }
                return newErrors;
            });

            return newData;
        });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setErrors(prev => ({ ...prev, [name]: validate(name as keyof typeof formData, value, formData) }));
    };

    const handleSocialLogin = async (provider: string) => {
        // This is a simplified flow for social login
        if (!chosenPlan) {
            setErrors({ general: 'Por favor, selecione um plano para o seu teste.' });
            return;
        }
        const user = {
            name: `${provider} User`,
            email: `${provider.toLowerCase()}@example.com`,
            avatarUrl: `https://i.pravatar.cc/150?u=${provider.toLowerCase()}`,
            role: 'admin' as const,
            plan: chosenPlan.name as 'Individual' | 'Empresa' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium',
        };
        const contract = {} as Contract; // For simplicity, we skip contract on social login for now
        onTrialSuccess(user, contract);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // FIX: Changed type to be more specific to avoid a misleading TypeScript error about symbol index types, while still allowing for a 'general' error property.
        const validationErrors: Partial<Record<keyof typeof formData | 'general', string>> = {};
        const fieldsToValidate: (keyof typeof formData)[] = ['salonName', 'fullName', 'cpf', 'email', 'password', 'confirmPassword'];
        fieldsToValidate.forEach(key => {
            const error = validate(key, formData[key], formData);
            if (error) {
                validationErrors[key] = error;
            }
        });

        if (!chosenPlan) {
            validationErrors.general = 'Por favor, selecione um plano para o seu teste.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const newUser: User = {
            name: formData.fullName,
            email: formData.email,
            avatarUrl: `https://i.pravatar.cc/150?u=${formData.email}`,
            role: 'admin' as const,
            plan: chosenPlan!.name as 'Individual' | 'Empresa' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium',
            businessSegmentKey: selectedSegment || undefined,
            businessSegmentLabel: selectedSegment
                ? (selectedSegment === 'outros'
                    ? (otherSegmentText.trim() || 'Outros segmentos')
                    : (segments.find(s => s.key === selectedSegment)?.title || ''))
                : undefined,
        };

        // Generate Contract
        const prices = {
            'Individual': { discounted: 'R$ 79,87', afterYear: 'R$ 129,87' },
            'Empresa Essencial': { discounted: 'R$ 199,90', afterYear: 'R$ 249,90' },
            'Empresa Pro': { discounted: 'R$ 349,90', afterYear: 'R$ 449,90' },
            'Empresa Premium': { discounted: 'R$ 599,90', afterYear: 'R$ 749,90' },
        };
        const planPrices = prices[chosenPlan!.name as keyof typeof prices];

        const contractText = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS - SALÃO24H
 
 CONTRATANTE: ${formData.fullName}, CPF: ${formData.cpf}.
 SALÃO: ${formData.salonName}
 CONTRATADA: Salão24h, CNPJ: XX.XXX.XXX/0001-XX.
 
 Data de Início: ${new Date().toLocaleDateString('pt-BR')}

OBJETO: O presente contrato tem por objeto a concessão de licença de uso do software Salão24h, conforme o plano selecionado.

PLANO: ${chosenPlan!.name}

VALORES:
- Valor Promocional (primeiros 12 meses): ${planPrices.discounted} por mês.
- Valor após 12 meses: ${planPrices.afterYear} por mês.
- Período de Teste: 15 dias gratuitos a partir da data de início.

Ao assinar este documento, o CONTRATANTE declara estar ciente e de acordo com todos os termos de serviço e política de privacidade da Salão24h.
    `.trim();

        onStartSignatureFlow({
            user: newUser,
            contractText: contractText,
            cpf: formData.cpf,
        });
        navigate('contractSignature');
    };

    const isFormValid = useMemo(() => {
        return !Object.values(errors).some(Boolean) &&
            !!chosenPlan &&
            !!selectedSegment &&
            (selectedSegment !== 'outros' || !!otherSegmentText.trim()) &&
            !!formData.salonName &&
            !!formData.fullName &&
            !!formData.cpf &&
            !!formData.email &&
            !!formData.password &&
            !!formData.confirmPassword;
    }, [errors, chosenPlan, selectedSegment, otherSegmentText, formData]);

    const SubmitButtonContent = () => (
        <>
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Criando sua conta...</span>
                </>
            ) : (
                'Começar a experiência por 15 dias'
            )}
        </>
    );

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl w-full bg-white p-8 md:p-10 rounded-2xl shadow-xl space-y-8">
                    <div>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="text-center block text-5xl font-extrabold text-secondary no-underline">
                            Salão24h
                        </a>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary">
                            Comece seu teste grátis de 15 dias
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="font-medium text-primary hover:text-primary-dark transition-opacity duration-300 active:opacity-75">
                                Acesse aqui
                            </a>
                        </p>
                    </div>

                    {/* Step 1: Plan Selection */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-secondary">1. Escolha o plano que deseja testar</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {plans.map(plan => (
                                <button
                                    key={plan.name}
                                    type="button"
                                    onClick={() => setChosenPlan(plan)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 active:scale-[0.97] ${chosenPlan?.name === plan.name ? 'border-primary bg-primary/5 shadow-lg' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-secondary">{plan.name}</h4>
                                        {chosenPlan?.name === plan.name && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                                    <p className="font-semibold text-primary mt-2">{plan.price}/mês</p>
                                </button>
                            ))}
                        </div>
                        {errors.general && <p className="text-sm text-red-600 text-center">{errors.general}</p>}

                        <div className="mt-6 space-y-3">
                            <h3 className="font-bold text-lg text-secondary">Qual o segmento do negócio?</h3>
                            <p className="text-sm text-gray-600">Selecione a principal categoria de atendimento. Escolha apenas uma.</p>
                        </div>

                        <div className="mt-3 space-y-3">
                            {segments.map(({ key, title, description }) => {
                                const isActive = selectedSegment === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedSegment(key)}
                                        className={`w-full flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 active:scale-[0.98] ${isActive
                                            ? 'border-primary bg-primary/5 shadow-md'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-secondary text-sm">{title}</p>
                                            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{description}</p>
                                        </div>
                                        <div className="mt-1 flex-shrink-0">
                                            <span
                                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${isActive
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-gray-300 bg-white text-gray-400'
                                                    }`}
                                            >
                                                {isActive ? '✓' : ''}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedSegment === 'outros' && (
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="other-segment">
                                    Descreva o segmento do seu negócio
                                </label>
                                <input
                                    id="other-segment"
                                    type="text"
                                    value={otherSegmentText}
                                    onChange={(e) => setOtherSegmentText(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                                    placeholder="Ex.: Clínica de estética avançada, spa urbano, etc."
                                />
                                {selectedSegment === 'outros' && !otherSegmentText.trim() && (
                                    <p className="mt-1 text-xs text-red-600">Informe o tipo de segmento para continuar.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Account Creation */}
                    <div ref={accountSectionRef} className="space-y-6">
                        <h3 className="font-bold text-lg text-secondary">2. Crie sua conta</h3>
                        {/* Manual Form */}
                        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="salonName" className="sr-only">Nome do Espaço</label>
                                    <input id="salonName" name="salonName" type="text" required value={formData.salonName} onChange={handleChange} onBlur={handleBlur} className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${errors.salonName ? 'border-red-500' : 'border-gray-600 focus:ring-primary focus:border-primary'}`} placeholder="Nome do Espaço" />
                                    {errors.salonName && <p className="text-xs text-red-600 mt-1">{errors.salonName}</p>}
                                </div>
                                <div>
                                    <label htmlFor="fullName" className="sr-only">Seu Nome Completo</label>
                                    <input id="fullName" name="fullName" type="text" autoComplete="name" required value={formData.fullName} onChange={handleChange} onBlur={handleBlur} className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${errors.fullName ? 'border-red-500' : 'border-gray-600 focus:ring-primary focus:border-primary'}`} placeholder="Seu Nome Completo" />
                                    {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                                </div>
                                <div>
                                    <label htmlFor="cpf" className="sr-only">{t('trialCPFLabel')}</label>
                                    <input id="cpf" name="cpf" type="text" autoComplete="off" required value={formData.cpf} onChange={handleChange} onBlur={handleBlur} className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${errors.cpf ? 'border-red-500' : 'border-gray-600 focus:ring-primary focus:border-primary'}`} placeholder={t('trialCPFLabel')} />
                                    {errors.cpf && <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>}
                                </div>
                                <div>
                                    <label htmlFor="email" className="sr-only">Endereço de e-mail</label>
                                    <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-600 focus:ring-primary focus:border-primary'}`} placeholder="Seu E-mail" />
                                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">Senha</label>
                                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.password} onChange={handleChange} onBlur={handleBlur} className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm pr-10 ${errors.password ? 'border-red-500' : 'border-gray-600 focus:ring-primary focus:border-primary'}`} placeholder="Crie uma senha" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 transition-transform active:scale-90"><span className="sr-only">Mostrar/Ocultar senha</span>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                            </div>
                            <div className="relative">
                                <label htmlFor="confirmPassword" className="sr-only">Confirme a Senha</label>
                                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm pr-10 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600 focus:ring-primary focus:border-primary'}`} placeholder="Confirme sua senha" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 transition-transform active:scale-90"><span className="sr-only">Mostrar/Ocultar senha</span>{showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                            </div>
                            <button type="submit" disabled={isLoading || !isFormValid} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-[0.98]">
                                <SubmitButtonContent />
                            </button>
                        </form>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <a href="#" onClick={(e) => { e.preventDefault(); goBack(); }} className="font-medium text-primary hover:text-primary-dark transition-opacity duration-300 active:opacity-75">&larr; Voltar</a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TrialPage;