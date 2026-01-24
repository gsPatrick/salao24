import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { aiAPI } from '../lib/api';
// FIX: Alias the 'Blob' import to 'GenaiBlob' to avoid potential conflicts with the global DOM Blob type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob } from '@google/genai';

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


// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// FIX: Update the return type of createBlob to use the aliased 'GenaiBlob' type.
function createBlob(data: Float32Array): GenaiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

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
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // --- STATE FOR VOICE CHAT (Gemini Live) ---
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, transcript, isTyping]);

    // Playback for AI voice responses
    const playAudioResponse = (base64Audio: string) => {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play().catch(e => console.error("Playback error:", e));
    };

    // Microphone interaction logic
    const startRecording = async () => {
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
            setIsRecording(true);
        } catch (error) {
            console.error("Mic error:", error);
            alert("Não consegui acessar seu microfone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleToggleListen = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const sendAudioToAI = async (audioBlob: Blob) => {
        setIsTyping(true);
        const currentHistory = messages.map(m => ({ role: m.role, content: m.content }));

        try {
            const response = await aiAPI.testChat(audioBlob, currentHistory);
            if (response.success) {
                // Add transcribed user text to history
                if (response.userMessage) {
                    setMessages(prev => [...prev, { id: Date.now(), content: response.userMessage, role: 'user' }]);
                }

                // Add AI text response
                const aiMessage = { id: Date.now() + 1, content: response.message, role: 'assistant' };
                setMessages(prev => [...prev, aiMessage]);

                // Play AI voice if available
                if (response.audio) {
                    playAudioResponse(response.audio);
                }
            }
        } catch (error) {
            console.error('Audio processing error:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, content: "Tive um problema com seu áudio. Pode repetir?", role: 'assistant' }]);
        } finally {
            setIsTyping(false);
        }
    };

    // --- Gemini Live Logic (The "Voice Chat" button) ---
    const stopSession = () => {
        setIsListening(false);
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        streamRef.current?.getTracks().forEach(track => track.stop());
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
    };

    const startSession = async () => {
        if (isListening) {
            stopSession();
            return;
        }

        setIsListening(true);
        setTranscript([{ id: 1, sender: 'ai', text: `Olá! Sou a ${agentName}. Como posso ajudar?` }]);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

            inputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const inputCtx = inputAudioContextRef.current!;
                        const source = inputCtx.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        let inputUpdated = false;
                        let outputUpdated = false;

                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            inputUpdated = true;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                            outputUpdated = true;
                        }

                        if (inputUpdated || outputUpdated) {
                            setTranscript(prev => {
                                const newTranscript = prev.filter(p => p.id !== 'temp_user' && p.id !== 'temp_ai');
                                if (currentInputTranscriptionRef.current) {
                                    newTranscript.push({ id: 'temp_user', sender: 'user', text: currentInputTranscriptionRef.current } as any);
                                }
                                if (currentOutputTranscriptionRef.current) {
                                    newTranscript.push({ id: 'temp_ai', sender: 'ai', text: currentOutputTranscriptionRef.current } as any);
                                }
                                return newTranscript;
                            });
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current;
                            const fullOutput = currentOutputTranscriptionRef.current;

                            setTranscript(prev => {
                                const finalHistory = prev.filter(p => p.id !== 'temp_user' && p.id !== 'temp_ai');
                                if (fullInput) finalHistory.push({ id: Date.now(), text: fullInput, sender: 'user' } as any);
                                if (fullOutput) finalHistory.push({ id: Date.now() + 1, text: fullOutput, sender: 'ai' } as any);
                                return finalHistory;
                            });

                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);

                            const sources = audioSourcesRef.current;
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => { console.error('Session error:', e); stopSession(); },
                    onclose: () => { console.log('Session closed.'); stopSession(); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                }
            });
        } catch (error) {
            console.error("Failed to start Gemini session:", error);
            setIsListening(false);
        }
    };

    useEffect(() => {
        return () => {
            if (isListening) stopSession();
            if (isRecording) stopRecording();
        };
    }, [isListening, isRecording]);


    useEffect(() => {
        if (!isVoiceChat) {
            setMessages([{
                id: 1,
                content: `Olá! Sou ${agentName}. Como posso te ajudar hoje? (Simulação Real)`,
                role: 'assistant'
            }]);
        }
    }, [isVoiceChat, agentName]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userMsg = inputValue;
        const currentHistory = messages.map(m => ({ role: m.role, content: m.content }));

        const newUserMessage = { id: Date.now(), content: userMsg, role: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await aiAPI.testChat(userMsg, currentHistory);
            if (response.success) {
                const aiMessage = {
                    id: Date.now() + 1,
                    content: response.message,
                    role: 'assistant',
                    audio: response.audio
                };
                setMessages(prev => [...prev, aiMessage]);

                if (response.audio) {
                    playAudioResponse(response.audio);
                }
            }
        } catch (error: any) {
            console.error('Error sending test message:', error);
            const errorMessage = { id: Date.now() + 1, content: "Ops! Tive um problema ao processar. Tente novamente.", role: 'assistant' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const resetConversa = () => {
        setMessages([{
            id: Date.now(),
            content: `Olá! Reiniciei nossa conversa. Como posso te ajudar com as novas configurações?`,
            role: 'assistant'
        }]);
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
                    {transcript.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">IA</div>}
                            <div className={`p-3 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-secondary shadow-sm rounded-bl-none'}`}>{msg.text}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="bg-white border-t p-4 rounded-b-xl flex flex-col items-center justify-center">
                    <button onClick={startSession} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary-dark'}`}>
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path></svg>
                    </button>
                    <p className="text-sm text-gray-500 mt-2">{isListening ? 'Ouvindo... Toque para parar.' : `Toque para falar com ${agentName}`}</p>
                </footer>
            </div>
        );
    }

    // --- RENDER TEXT CHAT ---
    return (
        <div className="h-full max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col border-2 border-primary">
            <header className="bg-white rounded-t-xl sticky top-0 z-10 p-4 flex justify-between items-center border-b">
                <button
                    onClick={resetConversa}
                    className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Resetar
                </button>
                <div className="text-center flex-1">
                    <h1 className="text-lg font-bold text-secondary">{agentName}</h1>
                    <p className="text-sm text-gray-500">Teste de Configuração</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                        )}
                        <div className={`p-3 rounded-2xl max-w-lg text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white text-secondary rounded-bl-none'
                            }`}>
                            {msg.content}
                            {msg.audio && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <AudioPlayer duration="0:05" useCustomVoice={true} customVoiceFile={new File([Uint8Array.from(atob(msg.audio), c => c.charCodeAt(0))], "response.mp3", { type: "audio/mp3" })} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm animate-pulse">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <div className="p-3 rounded-2xl bg-white shadow-sm rounded-bl-none flex items-center space-x-1.5 transition-all">
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                            <span className="text-[10px] text-gray-400 font-medium ml-1">{isRecording ? 'Gravando...' : 'IA pensando...'}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="bg-white border-t p-4 rounded-b-xl shadow-inner">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isRecording ? "Pode falar, estou ouvindo..." : "Testar resposta da IA..."}
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                    />
                    <button
                        type="button"
                        onClick={handleToggleListen}
                        className={`p-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                        aria-label={isRecording ? "Parar" : "Voz"}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">{isRecording ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path>}</svg>
                    </button>
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md disabled:bg-gray-300 disabled:shadow-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
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
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([{
            id: 1,
            content: 'Olá! Sou seu Agente IA Avançado. Comece a conversa por texto para ver como eu respondo (e ouça se a voz estiver ativa! 🎙️)',
            role: 'assistant'
        }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userMsg = inputValue;
        const currentHistory = messages.map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, { id: Date.now(), content: userMsg, role: 'user' }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await aiAPI.testChat(userMsg, currentHistory);
            if (response.success) {
                const aiMessage = {
                    id: Date.now() + 1,
                    content: response.message,
                    role: 'assistant',
                    audio: response.audio
                };
                setMessages(prev => [...prev, aiMessage]);

                if (response.audio) {
                    const audio = new Audio(`data:audio/mp3;base64,${response.audio}`);
                    audio.play().catch(e => console.error("Auto-play error:", e));
                }
            }
        } catch (error) {
            console.error('Simulation error:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, content: "Erro na simulação. Tente novamente.", role: 'assistant' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-600 border-dashed">
            <h4 className="font-bold text-lg mb-4 text-center">Simulação Real de Atendimento</h4>
            <div className="space-y-3 text-sm bg-black/40 p-4 rounded-xl text-white h-80 overflow-y-auto flex flex-col shadow-inner border border-white/10">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 w-full animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 self-start text-[10px]">IA</div>}
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-sm ${msg.role === 'user' ? 'bg-gray-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                            {msg.content}
                            {msg.audio && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                    <AudioPlayer
                                        duration="0:05"
                                        useCustomVoice={true}
                                        customVoiceFile={new File([Uint8Array.from(atob(msg.audio), c => c.charCodeAt(0))], "response.mp3", { type: "audio/mp3" })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-end gap-2 justify-start animate-fade-in">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 self-start text-[10px]">IA</div>
                        <div className="p-2 gap-1 rounded-2xl bg-gray-800 flex items-center">
                            <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Diga algo para testar..."
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" disabled={!inputValue.trim() || isTyping} className="bg-primary hover:bg-primary-dark text-white p-2 rounded-full disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </form>
            <p className="mt-2 text-[10px] text-gray-500 text-center">📌 Essa simulação usa as configurações reais de personalidade e roteiro que você definiu acima.</p>
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

// --- AI Chat Monitoring Component ---
const AIChatMonitoring: React.FC = () => {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadChats = useCallback(async () => {
        try {
            // Don't set loading on poll refresh to avoid flicker
            const data = await aiAPI.getChats();
            setChats(data || []);

            // Update selected chat if it exists
            if (selectedChat) {
                const updated = data.find((c: any) => c.id === selectedChat.id);
                if (updated) setSelectedChat(updated);
            }
        } catch (error) {
            console.error('Error loading AI chats:', error);
        }
    }, [selectedChat]);

    useEffect(() => {
        loadChats();
        const interval = setInterval(loadChats, 5000); // Polling every 5s for real-time
        return () => clearInterval(interval);
    }, [loadChats]);

    const handleToggleStatus = async () => {
        if (!selectedChat) return;
        const newStatus = selectedChat.status === 'active' ? 'manual' : 'active';
        try {
            await aiAPI.toggleChatStatus(selectedChat.id, newStatus);
            // Optimistic update
            setSelectedChat({ ...selectedChat, status: newStatus });
            // Refresh list
            loadChats();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Erro ao alterar status da conversa');
        }
    };

    return (
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] overflow-hidden animate-fade-in">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-secondary">Conversas IA</h3>
                    <button onClick={loadChats} className="text-primary hover:text-primary-dark p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                {chats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhuma conversa encontrada.</div>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-secondary truncate max-w-[150px]">{chat.customer_name || chat.customer_phone}</span>
                                <span className="text-[10px] text-gray-400">{new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500 truncate max-w-[120px]">{chat.last_message || 'Iniciando conversa...'}</p>
                                {chat.status === 'manual' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">Manual</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Conversation Detail */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {selectedChat ? (
                    <>
                        <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-secondary">{selectedChat.customer_name || selectedChat.customer_phone}</h3>
                                <p className="text-xs text-gray-500">{selectedChat.customer_phone}</p>
                            </div>
                            <button
                                onClick={handleToggleStatus}
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${selectedChat.status === 'active'
                                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                                    }`}
                            >
                                {selectedChat.status === 'active' ? '🤖 Ativo via IA' : '👤 Assumir (Manual)'}
                            </button>
                        </header>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {(selectedChat.history || []).map((msg: any, idx: number) => {
                                if (msg.role === 'system' || msg.role === 'tool') return null;
                                return (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white text-secondary shadow-sm rounded-bl-none'}`}>
                                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <footer className="p-3 bg-white border-t border-gray-200 text-center">
                            {selectedChat.status === 'active' ? (
                                <p className="text-xs text-gray-400">👀 Modo Observação: A IA está respondendo a este cliente.</p>
                            ) : (
                                <div className="flex items-center justify-center gap-2 p-2 bg-yellow-50 rounded text-yellow-800 text-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span>Modo Manual Ativado. A IA está pausada.</span>
                                </div>
                            )}
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p>Selecione uma conversa ao lado para ver os detalhes do atendimento da IA.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export const AIAgentPage: React.FC<AIAgentPageProps> = ({ currentUser, onActivateAI, activeAIAgent, onBack, isIndividualPlan, navigate }) => {
    const [selectedPlan, setSelectedPlan] = useState<'Básico' | 'Avançada' | null>(activeAIAgent);
    const [isAIEnabled, setIsAIEnabled] = useState(activeAIAgent !== null);
    const [viewMode, setViewMode] = useState<'config' | 'monitoring'>('config'); // New view mode state




    {/* Existing Config Content */ }

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
    const [zapiInstanceId, setZapiInstanceId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch config on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                setIsLoading(true);
                const config = await aiAPI.getConfig();
                if (config) {
                    setAdvancedAgentName(config.personality || 'Sofia');
                    setAdvancedPersonality(config.personality || 'Amigável e informal');
                    setAdvancedScript(config.prompt_behavior || '');
                    setZapiInstanceId(config.zapi_instance_id || '');
                    setIsAIEnabled(config.is_voice_enabled || false);
                    setSpeed(config.speed || 1.0);
                    setPitch(config.pitch || 1.1);
                }
            } catch (error) {
                console.error('Error loading AI config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);
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
            setIsLoading(true);
            // Save to backend
            await aiAPI.updateConfig({
                personality: advancedAgentName,
                prompt_behavior: advancedScript,
                is_voice_enabled: isAIEnabled,
                zapi_instance_id: zapiInstanceId,
                speed,
                pitch
            });

            if (planToActivate) {
                onActivateAI(planToActivate);
                setChatKey(prev => prev + 1);
                setShowNotification(true);
                // setIsChatPanelOpen(true);
            }
            alert('Configuração salva com sucesso!');
        } catch (error) {
            console.error('Error saving AI config:', error);
            alert('Erro ao salvar configuração.');
        } finally {
            setIsLoading(false);
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
                        <input id="adv-agent-name" type="text" placeholder="👉 Ex: “Sofia”" className="w-full p-3 border border-gray-500 bg-gray-800 text-white rounded-md mb-4" value={advancedAgentName} onChange={(e) => setAdvancedAgentName(e.target.value)} />

                        <label htmlFor="zapi-instance" className="block text-sm font-medium text-gray-300 mb-1">ID da Instância Z-API</label>
                        <input id="zapi-instance" type="text" placeholder="Instance ID do seu WhatsApp" className="w-full p-3 border border-gray-500 bg-gray-800 text-white rounded-md mb-2" value={zapiInstanceId} onChange={(e) => setZapiInstanceId(e.target.value)} />
                        <p className="text-xs text-gray-500 mb-4">💡 Este ID vincula o WhatsApp do seu salão à nossa IA.</p>
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
            <div className="flex justify-between items-center mb-8">
                {onBack && (
                    <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold">
                        &larr; Voltar ao Dashboard
                    </button>
                )}

                {activeAIAgent && (
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('config')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'config' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Configuração
                        </button>
                        <button
                            onClick={() => setViewMode('monitoring')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'monitoring' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Monitoramento (Tempo Real)
                        </button>
                    </div>
                )}
            </div>

            {viewMode === 'monitoring' ? (
                <AIChatMonitoring />
            ) : (
                <>
                    {showNotification && (
                        <div className="fixed top-24 right-8 z-50 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce-in flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>Agente IA atualizado com sucesso!</span>
                        </div>
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

                </>
            )}
        </div>
    );
};