import React, { useState, useEffect, useRef } from 'react';
// FIX: Alias the 'Blob' import to 'GenaiBlob' to avoid potential conflicts with the global DOM Blob type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob, FunctionDeclaration, Type } from '@google/genai';
import { useLanguage } from '../contexts/LanguageContext';

// Message interface
interface Message {
  id: number | string;
  text: string | React.ReactNode;
  sender: 'user' | 'ai';
}

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


const AIAssistant: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Verificar se o usuário está no plano Essencial (simulado para demonstração)
  const isEssentialPlan = true; // TODO: Obter do contexto do usuário atual

  // --- Function Declaration for Scheduling ---
  const scheduleAppointmentFunctionDeclaration: FunctionDeclaration = {
    name: 'scheduleAppointment',
    description: 'Agenda um novo serviço para um cliente com um profissional específico em uma data e hora.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        professionalName: {
          type: Type.STRING,
          description: 'O nome do profissional que realizará o serviço.',
        },
        serviceName: {
          type: Type.STRING,
          description: 'O nome do serviço a ser agendado (ex: "Corte de Cabelo", "Manicure").',
        },
        date: {
          type: Type.STRING,
          description: 'A data do agendamento (ex: "amanhã", "25 de dezembro", "25/12/2024").',
        },
        time: {
          type: Type.STRING,
          description: 'A hora do agendamento (ex: "3 da tarde", "15:00").',
        },
      },
      required: ['professionalName', 'serviceName', 'date', 'time'],
    },
  };


  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const [activeAgent, setActiveAgent] = useState<'Básico' | 'Avançada'>('Básico');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- State for Básico (Text) Agent ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTextListening, setIsTextListening] = useState(false);
  const textRecognitionRef = useRef<any | null>(null);

  // --- State & Refs for Avançada (Voice) Agent ---
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState<{ sender: 'user' | 'ai'; text: string; id: number | string }[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
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


  // Básico agent AI response logic
  const getAIResponse = (userInput: string): string | React.ReactNode => {
    const lowerInput = userInput.toLowerCase();

    // Mock data for a more complex flow
    const mockClient = { name: 'Ana', preferences: ['Corte em camadas', 'Hidratação profunda', 'Esmalte claro'] };
    const mockProducts = [
      { name: 'Shampoo Hidratante', price: 'R$ 75,00', description: 'Ideal para cabelos secos e danificados.' },
      { name: 'Condicionador Nutritivo', price: 'R$ 80,00', description: 'Recupera a maciez e o brilho dos fios.' },
    ];
    const mockPromotions = [
      { name: 'Hidratação + Escova', price: 'R$ 120,00', originalPrice: 'R$ 150,00' },
      { name: 'Pé e Mão (terças e quartas)', price: 'R$ 50,00', originalPrice: 'R$ 65,00' },
    ];

    if (lowerInput.includes('sugestão') || lowerInput.includes('sugerir') || lowerInput.includes('fazer')) {
      return (
        <>
          {t('aiJuliaResponse1', { name: mockClient.name, preference: mockClient.preferences[1] })}
        </>
      );
    }

    if (lowerInput.includes('produto') || lowerInput.includes('shampoo') || lowerInput.includes('condicionador')) {
      return (
        <>
          {t('aiJuliaResponse2')}
          <ul className="list-disc list-inside mt-2 text-sm">
            {mockProducts.map(p => <li key={p.name}><strong>{p.name}:</strong> {p.description} - {p.price}</li>)}
          </ul>
        </>
      );
    }

    if (lowerInput.includes('promoção') || lowerInput.includes('promoções')) {
      return (
        <>
          {t('aiJuliaResponse3')}
          <ul className="list-disc list-inside mt-2 text-sm">
            {mockPromotions.map(p => <li key={p.name}><strong>{p.name}:</strong> {t('from')} <span className="line-through">{p.originalPrice}</span> {t('forOnly')} {p.price}!</li>)}
          </ul>
          {t('aiJuliaResponse4')}
        </>
      );
    }

    if (lowerInput.includes('hora') || lowerInput.includes('agendar')) {
      return t('aiJuliaResponse5', { name: mockClient.name });
    }
    if (lowerInput.includes('sim') || lowerInput.includes('confirma') || lowerInput.includes('pode ser')) {
      return t('aiJuliaConfirm');
    }
    if (lowerInput.includes('preço') || lowerInput.includes('valor')) return t('aiJuliaResponse6');
    if (lowerInput.includes('endereço')) {
      return t('aiJuliaResponse7');
    }
    if (lowerInput.includes('obrigado')) {
      return t('aiJuliaResponse8');
    }
    return t('aiJuliaResponseDefault');
  };

  // Effect to initialize messages when agent changes
  useEffect(() => {
    if (activeAgent === 'Básico') {
      setMessages([
        { id: Date.now(), text: t('aiJuliaGreeting'), sender: 'ai' }
      ]);
    } else {
      setTranscript([
        { id: Date.now(), text: t('aiSofiaGreeting'), sender: 'ai' }
      ]);
      setAppointments([]);
    }
  }, [activeAgent, t]);

  // Effect to scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, transcript]);

  // Voice-to-text setup for Básico agent
  useEffect(() => {
    if (activeAgent !== 'Básico') {
      if (textRecognitionRef.current) {
        textRecognitionRef.current.stop();
      }
      setIsTextListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInputValue(finalTranscript + interimTranscript);
    };

    recognition.onstart = () => setIsTextListening(true);
    recognition.onend = () => setIsTextListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsTextListening(false);
    };

    textRecognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [activeAgent]);

  const handleToggleTextListen = () => {
    if (!textRecognitionRef.current) return;
    if (isTextListening) {
      textRecognitionRef.current.stop();
    } else {
      setInputValue('');
      textRecognitionRef.current.start();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    const currentInput = inputValue; // Capture before clearing
    setInputValue('');

    setTimeout(() => {
      const aiResponseText = getAIResponse(currentInput);
      const aiMessage: Message = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200 + Math.random() * 500);
  };

  // --- Avançada (Voice) Agent Logic ---

  const stopSession = () => {
    setIsSessionActive(false);

    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();

    inputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current?.close().catch(console.error);

    streamRef.current?.getTracks().forEach(track => track.stop());

    sessionPromiseRef.current?.then(session => session.close()).catch(console.error);

    // Reset refs
    sessionPromiseRef.current = null;
    streamRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
  };

  const startSession = async () => {
    setIsSessionActive(true);
    setTranscript([{ id: 1, sender: 'ai', text: t('aiSofiaGreeting') }]);
    setAppointments([]);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

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
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'scheduleAppointment') {
                  const { professionalName, serviceName, date, time } = fc.args;
                  const newAppointment = { id: Date.now(), professionalName, serviceName, date, time };
                  setAppointments(prev => [...prev, newAppointment]);

                  sessionPromiseRef.current?.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Agendamento para ${serviceName} com ${professionalName} em ${date} às ${time} foi confirmado com sucesso.` },
                      }
                    });
                  });
                }
              }
            }

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
                  newTranscript.push({ id: 'temp_user', sender: 'user', text: currentInputTranscriptionRef.current });
                }
                if (currentOutputTranscriptionRef.current) {
                  newTranscript.push({ id: 'temp_ai', sender: 'ai', text: currentOutputTranscriptionRef.current });
                }
                return newTranscript;
              });
            }

            if (message.serverContent?.turnComplete) {
              const fullInput = currentInputTranscriptionRef.current;
              const fullOutput = currentOutputTranscriptionRef.current;

              setTranscript(prev => {
                const finalHistory = prev.filter(p => p.id !== 'temp_user' && p.id !== 'temp_ai');
                if (fullInput) finalHistory.push({ id: Date.now(), text: fullInput, sender: 'user' });
                if (fullOutput) finalHistory.push({ id: Date.now() + 1, text: fullOutput, sender: 'ai' });
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
          onclose: () => { stopSession(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `${t('aiSofiaSystemInstruction')} Hoje é ${new Date().toLocaleDateString('pt-BR')}`,
          tools: [{ functionDeclarations: [scheduleAppointmentFunctionDeclaration] }],
        }
      });
    } catch (error) {
      console.error("Failed to start session:", error);
      alert(t('aiVoiceSessionError'));
      setIsSessionActive(false);
    }
  };

  const handleToggleSession = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        stopSession();
      }
    };
  }, [isSessionActive]);


  const TabButton: React.FC<{ agent: 'Básico' | 'Avançada', children: React.ReactNode }> = ({ agent, children }) => (
    <button
      onClick={() => setActiveAgent(agent)}
      disabled={agent === 'Avançada' && isEssentialPlan}
      className={`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all active:scale-95 ${activeAgent === agent ? 'bg-primary text-white shadow-md' :
          agent === 'Avançada' && isEssentialPlan ? 'text-gray-400 cursor-not-allowed bg-gray-100' :
            'text-gray-600 hover:bg-primary/10'
        }`}
      title={agent === 'Avançada' && isEssentialPlan ? 'Agente Avançada não disponível no plano Essencial' : ''}
    >
      {children}
      {agent === 'Avançada' && isEssentialPlan && (
        <svg className="w-4 h-4 ml-1 inline" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  return (
    <section id="ai-assistant" className="py-16 sm:py-20 bg-light">
      <div className="container mx-auto px-6">
        <div ref={sectionRef} className={`flex flex-col items-center gap-12 transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="flex justify-center items-center w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-md transform transition-transform duration-300">
              {/* Agent Selector */}
              <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mb-3">
                <TabButton agent="Básico">🤖 {t('aiBasicTab')}</TabButton>
                <TabButton agent="Avançada">✨ {t('aiAdvancedTab')}</TabButton>
              </div>

              {/* Mensagem de bloqueio para plano Essencial */}
              {isEssentialPlan && activeAgent === 'Avançada' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-center">
                  <div className="flex items-center justify-center text-yellow-800">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">
                      A agente Avançada está disponível apenas nos planos Empresa Pro e Premium.
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Você pode usar a agente Básica no seu plano atual.
                  </p>
                  <button className="text-xs text-yellow-600 hover:text-yellow-800 underline mt-1">
                    Fazer upgrade de plano
                  </button>
                </div>
              )}

              {(activeAgent === 'Avançada' && !isEssentialPlan) ? (
                <div className="border rounded-xl overflow-hidden flex flex-col h-[500px] sm:h-[550px] animate-fade-in">
                  <div className="flex items-center border-b p-3 bg-light flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.25 6.75h-1.551a3 3 0 00-2.836 2.054l-1.428 4.284a3 3 0 01-2.836 2.054H7.5M9 12h6m-6 0a3 3 0 01-3-3V7.5a3 3 0 013-3h6a3 3 0 013 3v1.5a3 3 0 01-3 3m-6 0h.008v.008H9V12zm6 0h.008v.008H15V12z" /></svg>
                    </div>
                    <div>
                      <p className="font-bold text-secondary">{t('aiAgentSofia')}</p>
                      <p className="text-xs text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>{t('aiOnline')}</p>
                    </div>
                  </div>
                  <div className="border-b p-3 bg-light flex-shrink-0">
                    <h3 className="font-bold text-sm text-secondary">Agendamentos Feitos na Conversa</h3>
                    {appointments.length > 0 ? (
                      <ul className="text-xs text-gray-600 list-disc list-inside mt-1 space-y-1">
                        {appointments.map(app => (
                          <li key={app.id}><strong>{app.serviceName}</strong> com {app.professionalName} em {app.date} às {app.time}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic mt-1">Nenhum agendamento feito ainda.</p>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
                    {transcript.map((msg) => (
                      <div key={msg.id} className={`flex items-end gap-2 animate-bounce-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">IA</div>}
                        <div className={`p-3 rounded-xl max-w-[85%] ${msg.sender === 'user' ? 'bg-gray-700 text-white rounded-br-none' : 'bg-gray-100 text-secondary rounded-bl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <footer className="border-t p-4 bg-light flex-shrink-0 flex flex-col items-center justify-center">
                    <button onClick={handleToggleSession} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isSessionActive ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary-dark'}`}>
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path></svg>
                    </button>
                    <p className="text-sm text-gray-500 mt-2">{isSessionActive ? t('aiStopSpeaking') : t('aiStartSpeaking')}</p>
                  </footer>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden flex flex-col h-[500px] sm:h-[550px]">
                  {/* Header */}
                  <div className="flex items-center border-b p-3 bg-light flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.25 6.75h-1.551a3 3 0 00-2.836 2.054l-1.428 4.284a3 3 0 01-2.836 2.054H7.5M9 12h6m-6 0a3 3 0 01-3-3V7.5a3 3 0 013-3h6a3 3 0 013 3v1.5a3 3 0 01-3 3m-6 0h.008v.008H9V12zm6 0h.008v.008H15V12z" /></svg>
                    </div>
                    <div>
                      <p className="font-bold text-secondary">{t('aiAgentJulia')}</p>
                      <p className="text-xs text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>{t('aiOnline')}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-end gap-2 animate-bounce-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">IA</div>}
                        <div className={`p-3 rounded-xl max-w-[85%] ${msg.sender === 'user' ? 'bg-gray-700 text-white rounded-br-none' : 'bg-gray-100 text-secondary rounded-bl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-end gap-2 justify-start animate-bounce-in">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">IA</div>
                        <div className="p-3 bg-gray-100 text-secondary rounded-xl rounded-bl-none flex items-center space-x-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t p-2 bg-light flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isTextListening ? t('aiListening') : t('aiTypeYourMessage')}
                        className="flex-1 p-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        aria-label={t('yourMessage')}
                      />
                      <button
                        type="button"
                        onClick={handleToggleTextListen}
                        className={`p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary active:scale-95 ${isTextListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        aria-label={isTextListening ? t('stopRecording') : t('recordAudio')}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path></svg>
                      </button>
                      <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-2 rounded-full transition-all active:scale-95" aria-label={t('sendMessage')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('aiAssistantTitle')}</h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              {t('aiAssistantSubtitle')}
            </p>
            <ul className="mt-6 text-left space-y-3 inline-block">
              <li className="flex items-start text-gray-700">
                <svg className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                <span dangerouslySetInnerHTML={{ __html: t('aiAssistantFeature1') }} />
              </li>
              <li className="flex items-start text-gray-700">
                <svg className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <span dangerouslySetInnerHTML={{ __html: t('aiAssistantFeature2') }} />
              </li>
              <li className="flex items-start text-gray-700">
                <svg className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span dangerouslySetInnerHTML={{ __html: t('aiAssistantFeature3') }} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistant;