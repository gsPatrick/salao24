import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { aiAPI } from '../lib/api';



// --- Reusable Collapsible Section Component ---
const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; isFeatured?: boolean; }> = ({ title, children, defaultOpen = false, isFeatured = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const textColor = isFeatured ? 'text-gray-200' : 'text-secondary';
    const borderColor = isFeatured ? 'border-gray-600' : 'border-gray-200';
    const buttonHover = isFeatured ? 'hover:bg-white/5' : 'hover:bg-gray-100';

    return (
        <div className={`border-t ${borderColor}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex justify-between items-center py-4 text-left font-bold ${textColor} ${buttonHover} rounded-sm px-2`}
            >
                <span>{title}</span>
                <svg
                    className={`w-5 h-5 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-2">
                    {children}
                </div>
            </div>
        </div>
    );
};




// --- ChatPanel Component ---
interface ChatMessage {
    id: number | string;
    text: string | React.ReactNode;
    sender: 'user' | 'ai';
}

interface ChatPanelProps {
    config: {
        name: string;
        type: 'Básico' | 'Avançada';
        script?: string;
    };
    onClose: () => void;
    isVoiceChat: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ config, onClose, isVoiceChat }) => {
    const { name: agentName } = config;

    // --- STATE FOR TEXT CHAT ---
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTextListening, setIsTextListening] = useState(false);
    const textRecognitionRef = useRef<any | null>(null);

    // --- STATE FOR VOICE CHAT ---
    const [isListening, setIsListening] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && isListening) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isListening]);

    const handleToggleListen = () => {
        if (!textRecognitionRef.current) return;
        if (isTextListening) {
            textRecognitionRef.current.stop();
        } else {
            setInputValue('');
            textRecognitionRef.current.start();
        }
    };





    const playAudioResponse = (base64Audio: string) => {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play().catch(e => console.error("Playback error:", e));
    };

    const stopSession = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    const startSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendAudioToAI(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (error) {
            console.error("Mic error:", error);
            alert("Não consegui acessar seu microfone.");
        }
    };

    const sendAudioToAI = async (audioBlob: Blob) => {
        setIsTyping(true);
        const currentHistory = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

        try {
            const response = await aiAPI.testChat(audioBlob, currentHistory);
            if (response.success) {
                // Add transcribed user text to history
                if (response.userMessage) {
                    setMessages(prev => [...prev, { id: Date.now(), text: response.userMessage, sender: 'user' }]);
                }

                // Add AI text response
                const aiMessage: ChatMessage = { id: Date.now() + 1, text: response.message, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);

                // Play AI voice if available
                if (response.audio) {
                    playAudioResponse(response.audio);
                }
            }
        } catch (error) {
            console.error('Audio processing error:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Tive um problema com seu áudio. Pode repetir?", sender: 'ai' }]);
        } finally {
            setIsTyping(false);
            setIsListening(false); // Ensure listening state is reset
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isListening) {
                stopSession();
            }
        };
    }, [isListening]);

    // Text Chat logic
    const getAIResponse = (userInput: string, config: ChatPanelProps['config']): string | React.ReactNode => {
        const { type: agentType, script } = config;
        const lowerInput = userInput.toLowerCase();
        const mockClientName = "Juliana"; // Mock name for the demo

        if (agentType === 'Básico') {
            if (lowerInput.includes('horário') || lowerInput.includes('agenda')) {
                return `Olá, ${mockClientName}! Claro. Verifiquei a agenda e temos um horário livre amanhã às 16:00. Fica bom para você?`;
            }
            if (lowerInput.includes('sim') || lowerInput.includes('pode ser') || lowerInput.includes('confirma')) {
                return 'Agendamento confirmado para amanhã às 16:00! Você receberá nossos lembretes automáticos. 😉';
            }
            if (lowerInput.includes('endereço')) {
                return "Claro! Estamos na Rua das Flores, nº 123, Boa Viagem. Aqui está um link para o mapa: [link do mapa]";
            }
            if (lowerInput.includes('obrigado')) {
                return "De nada! Se precisar de mais alguma coisa, é só chamar. ✨";
            }
            return `Olá! Sou a ${config.name}. Como posso te ajudar a agendar seu horário?`;
        } else { // Avançada
            if (script && (lowerInput.includes('roteiro') || lowerInput.includes('atendimento'))) {
                return (
                    <>
                        Com base no roteiro que você definiu, eu diria:
                        <blockquote className="mt-2 pl-2 border-l-4 border-gray-300 text-sm italic">
                            "{script}"
                        </blockquote>
                    </>
                );
            }
            return `Olá! Sou a ${config.name}. Atualmente estou configurada para interação por voz.`;
        }
    };

    useEffect(() => {
        if (!isVoiceChat) {
            setMessages([{
                id: 1,
                text: `Olá! Sou ${agentName}. Comece a conversa para testar minhas respostas.`,
                sender: 'ai'
            }]);
        }
    }, [config, isVoiceChat, agentName]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = { id: Date.now(), text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            const aiResponseText = getAIResponse(inputValue, config);
            const aiMessage: ChatMessage = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
            setIsTyping(false);
            setMessages(prev => [...prev, aiMessage]);
        }, 1000 + Math.random() * 500);
    };

    if (isVoiceChat) {
        return (
            <div className="h-full max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col border-2 border-primary">
                <header className="bg-white rounded-t-xl sticky top-0 z-10 p-4 flex justify-between items-center border-b">
                    <div className="text-center flex-1">
                        <h1 className="text-lg font-bold text-secondary">{agentName}</h1>
                        <p className="text-sm text-gray-500">Conversa por Voz</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">IA</div>}
                            <div className={`p-3 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-secondary shadow-sm rounded-bl-none'}`}>{msg.text}</div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">IA</div>
                            <div className="p-3 rounded-xl bg-gray-100 shadow-sm rounded-bl-none flex items-center space-x-1.5">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="bg-white border-t p-4 rounded-b-xl flex flex-col items-center justify-center">
                    <button
                        onMouseDown={startSession}
                        onMouseUp={stopSession}
                        onTouchStart={startSession}
                        onTouchEnd={stopSession}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${isListening ? 'bg-red-500 scale-110 shadow-red-500/50' : 'bg-primary hover:bg-primary-dark shadow-primary/30'}`}
                    >
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path></svg>
                    </button>
                    <p className="text-sm text-gray-500 mt-4 font-medium">{isListening ? 'Ouvindo... Solte para enviar.' : `Segure para falar`}</p>
                </footer>
            </div>
        );
    }

    // --- RENDER TEXT CHAT ---
    return (
        <div className="h-full max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col border-2 border-primary">
            <header className="bg-white rounded-t-xl sticky top-0 z-10 p-4 flex justify-between items-center border-b">
                <div className="text-center flex-1">
                    <h1 className="text-lg font-bold text-secondary">{agentName}</h1>
                    <p className="text-sm text-gray-500">Simulação de Conversa</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">IA</div>}
                        <div className={`p-3 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-secondary shadow-sm rounded-bl-none'}`}>{msg.text}</div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">IA</div>
                        <div className="p-3 rounded-xl bg-gray-100 shadow-sm rounded-bl-none flex items-center space-x-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="bg-white border-t p-4 rounded-b-xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={isTextListening ? "Ouvindo..." : "Digite sua mensagem..."} className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <button
                        type="button"
                        onClick={handleToggleListen}
                        className={`p-3 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isTextListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        aria-label={isTextListening ? "Parar gravação" : "Gravar áudio"}
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path></svg>
                    </button>
                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};


// --- Main AIAgentPage Component ---

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-primary mr-3 flex-shrink-0" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400 mb-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const PlayIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1zm5 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;


interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin';
    plan?: 'Individual' | 'Empresa';
}

interface AIAgentPageProps {
    currentUser: User | null;
    onActivateAI: (plan: 'Básico' | 'Avançada' | null) => void;
    activeAIAgent: 'Básico' | 'Avançada' | null;
    onBack?: () => void;
    isIndividualPlan: boolean;
    navigate: (page: string) => void;
}

const AudioPlayer: React.FC<{
    duration: string;
    useCustomVoice?: boolean;
    customVoiceFile?: File | null;
}> = ({ duration, useCustomVoice, customVoiceFile }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef<number | null>(null);

    const canPlayCustom = useCustomVoice && customVoiceFile;
    const audioSrc = useMemo(() => {
        if (canPlayCustom && customVoiceFile) {
            return URL.createObjectURL(customVoiceFile);
        }
        return null;
    }, [canPlayCustom, customVoiceFile]);

    useEffect(() => {
        // Cleanup interval on unmount or when playback stops
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (audioSrc) {
                URL.revokeObjectURL(audioSrc);
            }
        };
    }, [audioSrc]);

    const stopSimulation = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setIsPlaying(false);
        setProgress(0);
    }

    const togglePlay = () => {
        if (isPlaying) {
            if (canPlayCustom && audioRef.current) {
                audioRef.current.pause();
            } else {
                stopSimulation();
            }
        } else {
            if (canPlayCustom && audioRef.current) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            } else {
                // Simulate playing for non-custom voice
                setIsPlaying(true);
                let currentProgress = 0;
                progressIntervalRef.current = window.setInterval(() => {
                    currentProgress += 10;
                    setProgress(currentProgress);
                    if (currentProgress >= 100) {
                        stopSimulation();
                    }
                }, 200);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && audioRef.current.duration) {
            const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(newProgress);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const PlayIcon = () => <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>;
    const PauseIcon = () => <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1zm5 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd"></path>;

    return (
        <div className="flex items-center space-x-2 p-2 bg-primary/20 rounded-lg w-full max-w-xs my-1">
            <button type="button" onClick={togglePlay} className="flex-shrink-0 focus:outline-none disabled:opacity-50" disabled={!canPlayCustom && isPlaying}>
                <svg className="w-8 h-8 text-white bg-primary rounded-full p-1" fill="currentColor" viewBox="0 0 20 20">
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </svg>
            </button>
            <div className="flex-1">
                <div className="w-full bg-primary/30 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <span className="text-xs text-gray-300 font-mono">{duration}</span>
            {canPlayCustom && audioSrc && (
                <audio
                    ref={audioRef}
                    src={audioSrc}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleEnded}
                    onTimeUpdate={handleTimeUpdate}
                />
            )}
        </div>
    );
};

const AdvancedSimulation: React.FC<{ useCustomVoice?: boolean; customVoiceFile?: File | null }> = ({ useCustomVoice, customVoiceFile }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [step, setStep] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const simulationFlow = [
        { sender: 'user', type: 'text', content: 'Oi, queria marcar um horário para amanhã à tarde.' },
        { sender: 'ai', type: 'text', content: 'Olá, é um prazer falar com você 🌸! Verifiquei nossa agenda e temos horários disponíveis.' },
        { sender: 'ai', type: 'audio', duration: '0:08', transcription: '“Temos horários livres amanhã, às duas da tarde e às quatro da tarde. Qual seria o melhor para você?”' },
        { sender: 'user', type: 'text', content: 'Pode ser às 16h.' },
        { sender: 'ai', type: 'audio', duration: '0:10', transcription: '“Perfeito! Agendamento confirmado para amanhã, às dezesseis horas. Você receberá um lembrete inteligente antes do horário.”' },
        { sender: 'ai', type: 'text', content: 'Algo mais em que posso ajudar?' }
    ];

    useEffect(() => {
        if (step > 0 && step <= simulationFlow.length) {
            const timer = setTimeout(() => {
                setMessages(prev => [...prev, simulationFlow[step - 1]]);
                if (step < simulationFlow.length) {
                    setStep(s => s + 1);
                } else {
                    setStep(step + 1); // End of simulation
                }
            }, step === 1 ? 500 : 1800);
            return () => clearTimeout(timer);
        }
    }, [step, simulationFlow]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startSimulation = () => {
        setMessages([]);
        setStep(1);
    };

    const isSimulating = step > 0 && step <= simulationFlow.length;

    return (
        <div className="mt-8 pt-6 border-t border-gray-600 border-dashed">
            <h4 className="font-bold text-lg mb-4 text-center">Simulação de Atendimento Híbrido</h4>
            <div className="space-y-3 text-sm bg-black/20 p-4 rounded-lg text-white h-80 overflow-y-auto flex flex-col">
                {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <p>Clique em "Iniciar Simulação" para começar.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 w-full animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 self-start">IA</div>}
                        <div className={`p-3 rounded-xl max-w-[85%] ${msg.sender === 'user' ? 'bg-gray-500 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'}`}>
                            {msg.type === 'text' && msg.content}
                            {msg.type === 'audio' && (
                                <>
                                    <AudioPlayer
                                        duration={msg.duration}
                                        useCustomVoice={useCustomVoice}
                                        customVoiceFile={customVoiceFile}
                                    />
                                    <p className="text-xs italic text-gray-400 mt-1">{msg.transcription}</p>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="text-center mt-4">
                <button
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className="py-2 px-6 bg-primary/20 text-primary font-semibold rounded-full hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {step === 0 ? '▶ Iniciar Simulação' : isSimulating ? 'Simulando...' : 'Reiniciar Simulação'}
                </button>
                <p className="mt-2 text-xs text-gray-400 px-2">📌 <strong>Perceba:</strong> a IA responde por texto e áudio, agendando e confirmando de forma autônoma.</p>
            </div>
        </div>
    );
};

const PlanCard: React.FC<{
    title: string;
    description: string;
    features: React.ReactNode[];
    example: React.ReactNode;
    adminConfig?: React.ReactNode;
    isSelected: boolean;
    isFeatured?: boolean;
    onSelect: () => void;
    isAIEnabled: boolean;
    onUpdateAgent: () => void;
    planType: 'Básico' | 'Avançada';
    isDisabled?: boolean;
    navigate?: (page: string) => void;
    isEssentialPlan?: boolean;
}> = ({ title, description, features, example, adminConfig, isSelected, isFeatured = false, onSelect, isAIEnabled, onUpdateAgent, planType, isDisabled = false, navigate, isEssentialPlan = false }) => {

    return (
        <div
            onClick={isDisabled || !isAIEnabled ? undefined : onSelect}
            className={`relative border-2 rounded-2xl p-6 md:p-8 flex flex-col h-full transition-all duration-300 transform ${isDisabled || !isAIEnabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-102'
                } ${isSelected ? 'border-primary shadow-2xl scale-105' : 'border-gray-200'
                } ${isFeatured ? 'bg-secondary text-white' : 'bg-white shadow-lg'
                }`}>
            {isDisabled && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-2xl z-10 flex flex-col items-center justify-center p-4 text-center">
                    <LockIcon />
                    <h4 className="text-lg font-bold text-white mt-2">Exclusivo do Plano Empresa</h4>
                    <p className="text-sm text-gray-300 mt-1 mb-4">
                        {isEssentialPlan
                            ? "A agente Avançada está disponível apenas nos planos Empresa Pro e Premium."
                            : "Faça o upgrade para ter uma recepcionista virtual completa por voz e texto."
                        }
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate?.('upgrade_to_empresa')}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-full transition duration-300"
                    >
                        Fazer Upgrade
                    </button>
                </div>
            )}
            <h3 className={`text-3xl font-bold mb-4 ${isFeatured ? 'text-primary' : 'text-secondary'}`}>{title}</h3>
            <p className={`mb-6 ${isFeatured ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
            <ul className="space-y-4 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <CheckIcon className={`w-6 h-6 ${isFeatured ? 'text-primary' : 'text-primary'} mr-3 flex-shrink-0 mt-1`} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            {example}
            {adminConfig}
            <div className={`mt-auto pt-6 text-center space-y-4`}>
                <button
                    onClick={onUpdateAgent}
                    disabled={!isSelected || !isAIEnabled || isDisabled}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Salvar e Ativar Agente
                </button>
            </div>
        </div>
    );
};

// Helper component for sliders
const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    displayValue: string;
}> = ({ label, value, min, max, step, onChange, displayValue }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-sm">
            <label className="font-medium text-gray-300">{label}</label>
            <span className="font-mono text-gray-400">{displayValue}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
        />
    </div>
);


export const AIAgentPage: React.FC<AIAgentPageProps> = ({ currentUser, onActivateAI, activeAIAgent, onBack, isIndividualPlan, navigate }) => {
    const [selectedPlan, setSelectedPlan] = useState<'Básico' | 'Avançada' | null>(activeAIAgent);
    const [isAIEnabled, setIsAIEnabled] = useState(activeAIAgent !== null);

    // Verificar se o usuário está no plano Essencial
    const isEssentialPlan = currentUser?.plan === 'Empresa Essencial';

    const [basicAgentName, setBasicAgentName] = useState('Júlia');
    const [basicReminderMsg, setBasicReminderMsg] = useState('Olá, [NOME_CLIENTE]! Passando para lembrar do seu horário amanhã às [HORARIO]...');
    const [advancedAgentName, setAdvancedAgentName] = useState('Sofia');
    const [advancedPrebuiltVoice, setAdvancedPrebuiltVoice] = useState('Sofia (Amigável)');
    const [useCustomVoice, setUseCustomVoice] = useState(false);
    const [customVoiceFile, setCustomVoiceFile] = useState<File | null>(null);
    const [advancedScript, setAdvancedScript] = useState('');
    const [advancedPersonality, setAdvancedPersonality] = useState('Amigável e informal');
    const [customPersonality, setCustomPersonality] = useState('');
    const [chatKey, setChatKey] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState<SpeechSynthesisVoice[]>([]);

    // State for voice cloning
    const [cloningStatus, setCloningStatus] = useState<'idle' | 'processing' | 'ready' | 'error'>('idle');
    const [cloningStep, setCloningStep] = useState('');
    const [cloningProgress, setCloningProgress] = useState(0);
    const customVoiceInputRef = useRef<HTMLInputElement>(null);


    // Voice Tuning States
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(1.1);
    const [variation, setVariation] = useState(0.5);
    const [pauses, setPauses] = useState(0.5);
    const [expressiveness, setExpressiveness] = useState(0.5);
    const [breaths, setBreaths] = useState(0.5);
    const [tempoVariation, setTempoVariation] = useState(0.5);
    const [showAdvancedVoiceSettings, setShowAdvancedVoiceSettings] = useState(false);

    // Voice Tuning Label Logic
    const getPitchLabel = useCallback((value: number) => {
        if (value < 0.8) return 'Baixo';
        if (value > 1.2) return 'Alto';
        return 'Médio';
    }, []);

    const getVariationLabel = useCallback((value: number) => {
        if (value < 0.3) return 'Baixa';
        if (value > 0.7) return 'Alta';
        return 'Média';
    }, []);

    const getPausesLabel = useCallback((value: number) => {
        if (value < 0.3) return 'Curta';
        if (value > 0.7) return 'Longa';
        return 'Média';
    }, []);

    const getExpressivenessLabel = useCallback((value: number) => {
        if (value < 0.3) return 'Baixa';
        if (value > 0.7) return 'Alta';
        return 'Moderada';
    }, []);

    const getBreathsLabel = useCallback((value: number) => {
        if (value < 0.3) return 'Poucos';
        if (value > 0.7) return 'Muitos';
        return 'Moderados';
    }, []);

    // Voice Tuning Presets
    const applyNaturalPreset = () => {
        setSpeed(1.0); setPitch(1.0); setVariation(0.6); setPauses(0.5);
        setExpressiveness(0.7); setBreaths(0.6); setTempoVariation(0.5);
    };
    const applyProfessionalPreset = () => {
        setSpeed(1.1); setPitch(1.1); setVariation(0.3); setPauses(0.4);
        setExpressiveness(0.4); setBreaths(0.3); setTempoVariation(0.3);
    };
    const applyFriendlyPreset = () => {
        setSpeed(0.9); setPitch(1.2); setVariation(0.8); setPauses(0.6);
        setExpressiveness(0.8); setBreaths(0.7); setTempoVariation(0.7);
    };

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setSpeechSynthesisVoices(availableVoices.filter(v => v.lang.startsWith('pt')));
            }
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();

        // Fetch AI Config from Backend
        const fetchConfig = async () => {
            try {
                const config = await aiAPI.getConfig();
                if (config) {
                    setBasicAgentName(config.basic_agent_name || 'Júlia');
                    setBasicReminderMsg(config.basic_reminder_msg || 'Olá, [NOME_CLIENTE]! Passando para lembrar do seu horário amanhã às [HORARIO]...');
                    setAdvancedAgentName(config.agent_name || 'Sofia');
                    setAdvancedPersonality(config.personality || 'Amigável e informal');
                    setAdvancedScript(config.prompt_behavior || '');
                    setCustomPersonality(config.custom_personality || '');
                    setAdvancedPrebuiltVoice(config.voice_id || 'Sofia (Amigável)');
                    setIsAIEnabled(config.is_voice_enabled);

                    if (config.voice_settings) {
                        setSpeed(config.voice_settings.speed || 1.0);
                        setPitch(config.voice_settings.pitch || 1.1);
                        setVariation(config.voice_settings.variation || 0.5);
                        setPauses(config.voice_settings.pauses || 0.5);
                        setExpressiveness(config.voice_settings.expressiveness || 0.5);
                        setBreaths(config.voice_settings.breaths || 0.5);
                        setTempoVariation(config.voice_settings.tempoVariation || 0.5);
                    }

                    if (config.active_plan && (config.active_plan === 'Básico' || config.active_plan === 'Avançada')) {
                        setSelectedPlan(config.active_plan);
                        onActivateAI(config.active_plan);
                    }
                }
            } catch (error) {
                console.error("Error loading AI config:", error);
            }
        };
        fetchConfig();

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
        };
    }, []);

    const handlePlayVoice = (voiceName: string) => {
        if (playingVoice === voiceName) {
            window.speechSynthesis.cancel();
            setPlayingVoice(null);
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const sampleTexts: { [key: string]: string } = {
            'Sofia (Amigável)': "Olá! Sou a Sofia,... sua assistente virtual. Como posso ajudar você hoje?",
            'Julia (Profissional)': "Bom dia. Meu nome é Julia,... sua assistente virtual. Em que posso ser útil?",
            'Clara (Calma)': "Olá,... com tranquilidade, vamos encontrar o que você precisa. Sou a Clara.",
        };

        const text = sampleTexts[voiceName];
        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);

        const ptVoices = speechSynthesisVoices.filter(v => v.lang === 'pt-BR');

        if (ptVoices.length > 0) {
            let selectedVoice: SpeechSynthesisVoice | undefined;
            const remoteVoices = ptVoices.filter(v => !v.localService);
            const localVoices = ptVoices.filter(v => v.localService);
            const findVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
                const femaleKeywords = ['female', 'feminino', 'mulher', 'zira', 'maria', 'luciana', 'camila'];
                const maleKeywords = ['male', 'masculino', 'homem', 'daniel', 'felipe', 'ricardo'];
                const premiumMatch = voices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('premium') || v.name.toLowerCase().includes('enhanced'));
                if (premiumMatch) return premiumMatch;
                for (const keyword of femaleKeywords) {
                    const voice = voices.find(v => v.name.toLowerCase().includes(keyword));
                    if (voice) return voice;
                }
                const fallbackVoice = voices.find(v => !maleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
                return fallbackVoice;
            };
            selectedVoice = findVoice(remoteVoices) || findVoice(localVoices) || ptVoices[0];
            utterance.voice = selectedVoice;
        }

        // Apply voice tuning settings
        utterance.rate = speed;
        utterance.pitch = pitch;

        utterance.onstart = () => setPlayingVoice(voiceName);
        utterance.onend = () => setPlayingVoice(null);
        utterance.onerror = (e) => {
            console.error("Erro na síntese de voz:", e);
            setPlayingVoice(null);
        };

        window.speechSynthesis.speak(utterance);
    };


    useEffect(() => {
        if (!isIndividualPlan && !isEssentialPlan) {
            setSelectedPlan('Avançada');
            if (isAIEnabled) {
                onActivateAI('Avançada');
            }
        } else if ((isIndividualPlan || isEssentialPlan) && isAIEnabled && !selectedPlan) {
            setSelectedPlan('Básico');
            onActivateAI('Básico');
        }
    }, [isIndividualPlan, isEssentialPlan, isAIEnabled, onActivateAI, selectedPlan]);

    const handleCloneVoice = () => {
        if (!customVoiceFile) return;

        setCloningStatus('processing');
        setCloningProgress(0);
        setCloningStep('Analisando características da voz...');

        // Simulate analysis (3 seconds)
        let progress = 0;
        const interval1 = setInterval(() => {
            progress += 10;
            setCloningProgress(progress);
            if (progress >= 100) {
                clearInterval(interval1);

                // Simulate training (4 seconds)
                setCloningProgress(0);
                setCloningStep('Treinando modelo de IA...');
                progress = 0;
                const interval2 = setInterval(() => {
                    progress += 7;
                    setCloningProgress(progress);
                    if (progress >= 100) {
                        clearInterval(interval2);
                        setCloningProgress(100);
                        setCloningStatus('ready');
                        setCloningStep('Sua voz foi clonada com sucesso!');
                        setUseCustomVoice(true); // Automatically enable custom voice
                    }
                }, 300);
            }
        }, 300);
    };

    const resetCloning = () => {
        setCustomVoiceFile(null);
        setCloningStatus('idle');
        setCloningProgress(0);
        setCloningStep('');
        setUseCustomVoice(false);
    };


    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => setShowNotification(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showNotification]);

    const handleToggleAI = (enabled: boolean) => {
        setIsAIEnabled(enabled);
        if (!enabled) {
            onActivateAI(null);
            setSelectedPlan(null);
            setIsChatPanelOpen(false); // Close chat panel when disabling
        } else if (isIndividualPlan || isEssentialPlan) {
            // For Individual and Essential plans, default to 'Básico'
            setSelectedPlan('Básico');
            onActivateAI('Básico');
        } else if (!isIndividualPlan && !isEssentialPlan) { // For Empresa plans, always activate Avançada
            onActivateAI('Avançada');
            setSelectedPlan('Avançada');
        } else if (enabled && !selectedPlan) {
            // If activating for the first time without a plan, default to 'Básico'
            setSelectedPlan('Básico');
            onActivateAI('Básico');
        }
    };

    const handleUpdateAgent = async () => {
        const planToActivate = (isIndividualPlan || isEssentialPlan) ? selectedPlan : 'Avançada';

        try {
            await aiAPI.updateConfig({
                active_plan: planToActivate,
                is_voice_enabled: isAIEnabled,
                agent_name: advancedAgentName,
                basic_agent_name: basicAgentName,
                basic_reminder_msg: basicReminderMsg,
                personality: advancedPersonality,
                custom_personality: customPersonality,
                prompt_behavior: advancedScript,
                voice_id: advancedPrebuiltVoice,
                voice_settings: {
                    speed, pitch, variation, pauses, expressiveness, breaths, tempoVariation
                }
            });

            if (planToActivate) {
                onActivateAI(planToActivate);
                setChatKey(prev => prev + 1);
                setShowNotification(true);
                setIsChatPanelOpen(true);
            }
        } catch (error) {
            console.error("Failed to save AI config:", error);
            alert("Erro ao salvar configuração. Tente novamente.");
        }
    };

    const handleSelectPlan = (plan: 'Básico' | 'Avançada') => {
        if (!isAIEnabled) return; // Allow selection if AI is enabled
        if (plan === 'Avançada' && (isIndividualPlan || isEssentialPlan)) return; // Block advanced plan for individual and essential plans
        setSelectedPlan(plan);
    };


    const showChat = activeAIAgent === 'Básico' && isAIEnabled;
    let currentChatConfig: ChatPanelProps['config'] | null = null;
    if (activeAIAgent === 'Básico') {
        currentChatConfig = { name: basicAgentName || 'Agente Básico', type: 'Básico' };
    } else if (activeAIAgent === 'Avançada') {
        currentChatConfig = { name: advancedAgentName || 'Agente Avançado', type: 'Avançada', script: advancedScript };
    }

    const individualFeatures = [
        <span className="text-primary">Personaliza o atendimento com o nome do cliente.</span>,
        <span className="text-primary">Verifica a agenda do profissional e sugere o próximo horário livre.</span>,
        <span className="text-primary">Envia lembretes automáticos em 3 etapas (72h, 24h e 3h antes).</span>,
        <span className="text-primary">Confirma o agendamento diretamente na conversa.</span>,
        <span className="text-primary">Responde dúvidas sobre o endereço e envia a localização.</span>,
    ];

    const empresaFeatures = [
        <span><strong>Responde e agenda horários</strong> por voz e texto</span>,
        "Suporte multilíngue (Português, Inglês, Espanhol)",
        "Configuração totalmente personalizada",
        "Agendar horários automaticamente com base na agenda e disponibilidade",
        "Enviar lembretes inteligentes e personalizados",
        "Enviar mensagens de aniversário personalizadas",
        "Informar preços e serviços cadastrados no sistema",
        "Desmarcar compromissos e liberar horários",
        "Enviar mensagens automáticas para clientes ausentes há mais de 60 dias",
        "Responder dúvidas sobre serviços de forma clara, objetiva e encantadora",
    ];

    const basicExample = (
        <div className="mt-8 pt-6 border-t border-gray-200 border-dashed">
            <h4 className="font-bold text-lg mb-4 text-center text-primary">Exemplo de atendimento</h4>
            <div className="space-y-3 text-sm bg-light p-4 rounded-lg">
                <div className="p-3 bg-white shadow-sm rounded-lg rounded-bl-none max-w-[85%]">
                    <p className="font-semibold text-gray-500 text-xs">Cliente:</p>
                    <p className="text-gray-800">Oi, queria marcar um horário para amanhã à tarde.</p>
                </div>
                <div className="p-3 bg-primary/10 shadow-sm rounded-lg rounded-br-none ml-auto max-w-[85%]">
                    <p className="font-semibold text-primary text-xs text-right">Agente Júlia:</p>
                    <p className="text-secondary text-right">Olá, Juliana! Claro. Verifiquei a agenda da Fernanda e temos um horário livre amanhã às 16:00. Fica bom para você?</p>
                </div>
                <div className="p-3 bg-white shadow-sm rounded-lg rounded-bl-none max-w-[85%]">
                    <p className="font-semibold text-gray-500 text-xs">Cliente:</p>
                    <p className="text-gray-800">Pode ser!</p>
                </div>
                <div className="p-3 bg-primary/10 shadow-sm rounded-lg rounded-br-none ml-auto max-w-[85%]">
                    <p className="font-semibold text-primary text-xs text-right">Agente Júlia:</p>
                    <p className="text-secondary text-right">Agendamento confirmado! Você receberá nossos lembretes automáticos. 😉</p>
                </div>
            </div>
            <p className="mt-4 text-sm text-center text-gray-500 px-2">📌 <strong>Perceba:</strong> a IA consulta a agenda, sugere um horário e confirma o agendamento na conversa.</p>
        </div>
    );

    const isAdmin = currentUser?.role === 'admin';

    const basicAdminConfig = (
        <div className="mt-8">
            <CollapsibleSection title="Personalização Básica">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="basic-agent-name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Agente IA</label>
                        <input id="basic-agent-name" type="text" placeholder="👉 Ex: “Clara”, “Zoe”, “Lu”" className="w-full p-3 border border-gray-300 rounded-md shadow-sm" value={basicAgentName} onChange={(e) => setBasicAgentName(e.target.value)} />
                        <p className="mt-1 text-xs text-gray-500">💡 Escolha nomes curtos para sua IA.</p>
                    </div>
                </div>
            </CollapsibleSection>
            <CollapsibleSection title="Mensagens Automáticas">
                <div>
                    <label htmlFor="basic-reminder" className="block text-sm font-medium text-gray-700 mb-1">Lembrete de Agendamento</label>
                    <textarea id="basic-reminder" rows={4} placeholder="Ex: Olá, [NOME_CLIENTE]! Passando para lembrar do seu horário amanhã às [HORARIO]..." className="w-full p-3 border border-gray-300 rounded-md shadow-sm" value={basicReminderMsg} onChange={(e) => setBasicReminderMsg(e.target.value)} />
                    <p className="mt-1 text-xs text-gray-500">💡 Use as tags [NOME_CLIENTE] e [HORARIO] para personalizar.</p>
                </div>
            </CollapsibleSection>
        </div>
    );

    const predefinedPersonalities = ['Amigável e informal', 'Profissional e formal', 'Divertida e engraçada', 'Empática e acolhedora', 'Direta e objetiva'];
    const prebuiltVoices = [
        { group: 'Vozes Femininas', voices: ['Sofia (Amigável)', 'Julia (Profissional)', 'Clara (Calma)'] },
    ];

    const advancedAdminConfig = (
        <div className="mt-8">
            <CollapsibleSection title="Identidade do Agente" isFeatured={true} defaultOpen={true}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="adv-agent-name" className="block text-sm font-medium text-gray-300 mb-1">Nome da Agente</label>
                        <input id="adv-agent-name" type="text" placeholder="👉 Ex: “Sofia”" className="w-full p-3 border border-gray-500 bg-gray-800 text-white rounded-md" value={advancedAgentName} onChange={(e) => setAdvancedAgentName(e.target.value)} />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${useCustomVoice ? 'text-gray-500' : 'text-gray-300'}`}>Voz Padrão</label>
                        <div className="space-y-2">
                            {prebuiltVoices.map(group => (
                                <div key={group.group}>
                                    <p className="text-xs font-semibold text-gray-400 mb-1 pl-1">{group.group}</p>
                                    {group.voices.map(voiceName => (
                                        <div key={voiceName} className={`flex items-center justify-between p-2 rounded-md transition-colors ${useCustomVoice ? 'bg-gray-800' : 'bg-gray-700/50'}`}>
                                            <label className={`flex items-center ${useCustomVoice ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input
                                                    type="radio"
                                                    name="prebuilt-voice"
                                                    value={voiceName}
                                                    checked={advancedPrebuiltVoice === voiceName}
                                                    onChange={(e) => setAdvancedPrebuiltVoice(e.target.value)}
                                                    disabled={useCustomVoice}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-gray-800 disabled:cursor-not-allowed"
                                                />
                                                <span className={`ml-3 text-sm ${useCustomVoice ? 'text-gray-500' : 'text-white'}`}>{voiceName}</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => handlePlayVoice(voiceName)}
                                                disabled={useCustomVoice}
                                                className="p-1 rounded-full text-white hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent"
                                                aria-label={`Ouvir voz ${voiceName}`}
                                            >
                                                {playingVoice === voiceName ? <PauseIcon /> : <PlayIcon />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <CollapsibleSection title="Ajuste Fino da Voz" isFeatured={true}>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <button type="button" onClick={applyNaturalPreset} className="flex-1 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md">Voz Natural</button>
                                <button type="button" onClick={applyProfessionalPreset} className="flex-1 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md">Voz Profissional</button>
                                <button type="button" onClick={applyFriendlyPreset} className="flex-1 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-md">Voz Amigável</button>
                            </div>
                            <SliderControl label="Velocidade da Fala" min={0.5} max={2} step={0.1} value={speed} onChange={setSpeed} displayValue={`${speed.toFixed(1)}x`} />
                            <SliderControl label="Tom de Voz" min={0.5} max={2} step={0.1} value={pitch} onChange={setPitch} displayValue={getPitchLabel(pitch)} />
                            <SliderControl label="Variação de Tom" min={0} max={1} step={0.1} value={variation} onChange={setVariation} displayValue={getVariationLabel(variation)} />
                            <SliderControl label="Pausas Naturais" min={0} max={1} step={0.1} value={pauses} onChange={setPauses} displayValue={getPausesLabel(pauses)} />
                            <SliderControl label="Expressividade" min={0} max={1} step={0.1} value={expressiveness} onChange={setExpressiveness} displayValue={getExpressivenessLabel(expressiveness)} />
                            <button type="button" onClick={() => setShowAdvancedVoiceSettings(!showAdvancedVoiceSettings)} className="text-sm text-primary hover:underline">
                                {showAdvancedVoiceSettings ? 'Ocultar Configurações Avançadas' : 'Configurações Avançadas'}
                            </button>
                            {showAdvancedVoiceSettings && (
                                <div className="space-y-4 pt-2 border-t border-gray-700 animate-fade-in">
                                    <SliderControl label="Respiros Naturais" min={0} max={1} step={0.1} value={breaths} onChange={setBreaths} displayValue={getBreathsLabel(breaths)} />
                                    <SliderControl label="Variação de Velocidade" min={0} max={1} step={0.1} value={tempoVariation} onChange={setTempoVariation} displayValue={getVariationLabel(tempoVariation)} />
                                </div>
                            )}
                            <p className="text-xs text-gray-500">Nota: Nem todos os ajustes (ex: expressividade) podem ser totalmente aplicados em navegadores com suporte básico de voz.</p>
                        </div>
                    </CollapsibleSection>
                    <div>
                        <label htmlFor="ai-personality" className="block text-sm font-medium text-gray-300 mb-1">Personalidade</label>
                        <select id="ai-personality" value={advancedPersonality} onChange={(e) => setAdvancedPersonality(e.target.value)} className="w-full p-3 border border-gray-500 bg-gray-800 text-white rounded-md">
                            {predefinedPersonalities.map(p => <option key={p} value={p}>{p}</option>)}
                            <option value="custom">Personalizada (descrever)</option>
                        </select>
                    </div>
                    {advancedPersonality === 'custom' && (
                        <textarea rows={2} placeholder="Descreva a personalidade..." className="w-full p-3 border border-gray-500 bg-gray-800 text-white rounded-md animate-fade-in" value={customPersonality} onChange={(e) => setCustomPersonality(e.target.value)} />
                    )}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Inteligência e Comportamento" isFeatured={true}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="adv-script" className="block text-sm font-medium text-gray-300 mb-1">Roteiro de Atendimento</label>
                        <textarea id="adv-script" rows={5} placeholder="📄 Descreva como a IA deve saudar, quais informações pedir, como confirmar, etc." className="w-full p-3 border border-gray-500 bg-gray-800 text-white rounded-md" value={advancedScript} onChange={(e) => setAdvancedScript(e.target.value)}></textarea>
                    </div>
                    <button type="button" className="w-full text-center font-semibold py-3 px-4 rounded-md border-2 border-dashed border-gray-500 text-gray-300 hover:border-primary hover:text-primary transition-colors">
                        📂 Enviar arquivo para treinar (PDF, TXT)
                    </button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Clonagem de Voz (Beta)" isFeatured={true}>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                    Grave e envie uma amostra de áudio de alta qualidade (mínimo 30s, sem ruído de fundo) para criar um clone digital da sua voz. A voz clonada será usada pela Agente IA Avançada.
                </p>

                <div className="bg-black/20 p-4 rounded-lg">
                    {cloningStatus === 'idle' && (
                        <div>
                            <input type="file" id="custom-voice-upload" accept="audio/mp3,audio/wav,audio/m4a" onChange={(e) => setCustomVoiceFile(e.target.files ? e.target.files[0] : null)} ref={customVoiceInputRef} className="hidden" />
                            {customVoiceFile ? (
                                <div className="space-y-3 text-center">
                                    <p className="text-sm text-gray-300">Arquivo selecionado:</p>
                                    <p className="font-semibold text-white bg-gray-700 p-2 rounded-md">{customVoiceFile.name}</p>
                                    <button onClick={handleCloneVoice} className="w-full py-2 px-4 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors">
                                        Clonar Voz
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => customVoiceInputRef.current?.click()} className="w-full flex items-center justify-center py-4 px-4 rounded-md border-2 border-dashed border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Fazer Upload da Amostra de Voz
                                </button>
                            )}
                        </div>
                    )}

                    {cloningStatus === 'processing' && (
                        <div className="space-y-3">
                            <p className="text-center font-semibold text-gray-300">{cloningStep}</p>
                            <div className="w-full bg-gray-600 rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${cloningProgress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {cloningStatus === 'ready' && (
                        <div className="text-center space-y-4 animate-fade-in">
                            <div className="mx-auto w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h4 className="font-bold text-lg text-white">{cloningStep}</h4>
                            <p className="text-sm text-gray-400">Teste a voz abaixo ou use a simulação de atendimento.</p>
                            <AudioPlayer duration="0:08" useCustomVoice={true} customVoiceFile={customVoiceFile} />
                            <button onClick={resetCloning} className="text-sm text-red-400 hover:underline">
                                Enviar outra amostra
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <h4 className="font-bold text-lg mb-4 text-center">Como funciona a clonagem</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="mx-auto mb-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-lg text-white">1</div>
                            <h5 className="font-semibold text-white">Upload da Amostra</h5>
                            <p className="text-xs text-gray-400 mt-1">Envie um áudio claro de no mínimo 30 segundos.</p>
                        </div>
                        <div>
                            <div className="mx-auto mb-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-lg text-white">2</div>
                            <h5 className="font-semibold text-white">Análise da Voz</h5>
                            <p className="text-xs text-gray-400 mt-1">Nossa IA analisa tom, timbre e padrões de fala.</p>
                        </div>
                        <div>
                            <div className="mx-auto mb-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-lg text-white">3</div>
                            <h5 className="font-semibold text-white">Treinamento</h5>
                            <p className="text-xs text-gray-400 mt-1">O modelo é treinado para replicar sua voz com naturalidade.</p>
                        </div>
                        <div>
                            <div className="mx-auto mb-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-lg text-white">4</div>
                            <h5 className="font-semibold text-white">Voz Ativada</h5>
                            <p className="text-xs text-gray-400 mt-1">Sua Agente IA passa a usar a voz clonada para atender seus clientes.</p>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );

    const advancedExample = <AdvancedSimulation useCustomVoice={useCustomVoice} customVoiceFile={customVoiceFile} />;

    return (
        <div className="container mx-auto px-6 py-8">
            {showNotification && (
                <div className="fixed top-24 right-8 z-50 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce-in flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Agente IA atualizado com sucesso!</span>
                </div>
            )}
            {onBack && (
                <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">
                    &larr; Voltar ao Dashboard
                </button>
            )}

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-secondary">Agente IA</h1>
                <p className="text-gray-600 mt-2">Configure sua assistente virtual para automatizar o atendimento.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-secondary">Ativar Agente IA</h2>
                        <p className="text-gray-500 text-sm">Permita que a IA responda seus clientes no WhatsApp 24h por dia.</p>
                    </div>
                    <label htmlFor="ai-toggle-main" className="relative inline-flex items-center cursor-pointer mt-4 sm:mt-0">
                        <input type="checkbox" id="ai-toggle-main" className="sr-only peer" checked={isAIEnabled} onChange={(e) => handleToggleAI(e.target.checked)} />
                        <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>

            <div className={`flex flex-wrap justify-center gap-8 max-w-6xl mx-auto transition-opacity duration-500 ${!isAIEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {(isIndividualPlan || isEssentialPlan) && (
                    <div className="w-full lg:max-w-lg">
                        <PlanCard
                            title="Agente Básico"
                            description="Uma assistente virtual que personaliza o atendimento, verifica a agenda para sugerir horários e envia uma sequência inteligente de lembretes."
                            features={individualFeatures}
                            example={basicExample}
                            adminConfig={isAdmin ? basicAdminConfig : undefined}
                            isSelected={selectedPlan === 'Básico'}
                            onSelect={() => handleSelectPlan('Básico')}
                            isAIEnabled={isAIEnabled}
                            onUpdateAgent={handleUpdateAgent}
                            planType="Básico"
                        />
                    </div>
                )}
                <div className="w-full lg:max-w-lg">
                    <PlanCard
                        title="Agente Avançada"
                        description="Uma recepcionista virtual completa que conversa por voz e texto."
                        features={empresaFeatures}
                        example={advancedExample}
                        adminConfig={isAdmin ? advancedAdminConfig : undefined}
                        isSelected={selectedPlan === 'Avançada'}
                        onSelect={() => handleSelectPlan('Avançada')}
                        isAIEnabled={isAIEnabled}
                        isFeatured
                        onUpdateAgent={handleUpdateAgent}
                        planType="Avançada"
                        isDisabled={isIndividualPlan || isEssentialPlan}
                        navigate={navigate}
                        isEssentialPlan={isEssentialPlan}
                    />
                </div>
            </div>

            {isAIEnabled && currentChatConfig && isChatPanelOpen && (
                <div className="fixed bottom-8 right-8 z-40">
                    <ChatPanel key={chatKey} config={currentChatConfig} onClose={() => setIsChatPanelOpen(false)} isVoiceChat={activeAIAgent === 'Avançada'} />
                </div>
            )}

        </div>
    );
};