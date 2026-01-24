

import React, { useState, useEffect, useRef } from 'react';
import ScheduleSettingsModal, { Schedule } from './ScheduleSettingsModal';
import { DirectMailCampaignData } from '../types';
import { aiAPI } from '../lib/api';

interface NewDirectMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<DirectMailCampaignData, 'id' | 'status' | 'history' | 'roi'>) => void;
  isIndividualPlan: boolean;
  campaignToEdit?: DirectMailCampaignData | null;
}

const mockPhoneNumbers = ['(81) 91234-5678 (Principal)', '(81) 98765-4321 (Marketing)'];
const emojis = ['😀', '😍', '😊', '🥰', '😉', '😎', '🥳', '🤗', '👍', '💖', '💯', '🔥', '🎉', '✨', '🎁', '💅', '💄', '💇‍♀️', '💆‍♀️', '💈', '🧴', '💰', '💳', '💸', '📅', '⏰', '📍', '📢', '💬', '💌', '📲', '✅', '👋', '👉', '👇'];
const fontFamilies = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Lucida Console'];

const Toolbar: React.FC<{
  onEmojiClick: () => void;
  onAttachmentClick: () => void;
  showAttachment: boolean;
  onFormat: (command: string, value?: string) => void;
}> = ({ onEmojiClick, onAttachmentClick, showAttachment, onFormat }) => (
  <div className="flex items-center gap-1 border border-b-0 rounded-t-md p-2 bg-gray-50 text-secondary flex-wrap">
    <button type="button" onClick={() => onFormat('bold')} className="p-2 rounded hover:bg-gray-200 font-bold w-8 h-8 flex items-center justify-center" title="Negrito">B</button>
    <button type="button" onClick={() => onFormat('italic')} className="p-2 rounded hover:bg-gray-200 italic w-8 h-8 flex items-center justify-center" title="Itálico">I</button>
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
    <button type="button" onClick={() => onFormat('justifyLeft')} className="p-2 rounded hover:bg-gray-200" title="Alinhar à Esquerda"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg></button>
    <button type="button" onClick={() => onFormat('justifyCenter')} className="p-2 rounded hover:bg-gray-200" title="Centralizar"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg></button>
    <button type="button" onClick={() => onFormat('justifyRight')} className="p-2 rounded hover:bg-gray-200" title="Alinhar à Direita"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 10a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg></button>
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
    <input
      type="color"
      onChange={(e) => onFormat('foreColor', e.target.value)}
      className="w-8 h-8 p-1 border-none bg-transparent cursor-pointer"
      defaultValue="#000000"
      title="Cor do Texto"
    />
    <select onChange={(e) => onFormat('fontName', e.target.value)} className="p-1 border-gray-300 rounded bg-transparent text-sm text-secondary focus:outline-none focus:ring-1 focus:ring-primary">
      {fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
    </select>
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
    <button type="button" onClick={onEmojiClick} className="p-2 rounded hover:bg-gray-200" title="Inserir Emoji">😀</button>
    {showAttachment && (
      <>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button type="button" onClick={onAttachmentClick} className="p-2 rounded hover:bg-gray-200" title="Anexar Imagem">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
      </>
    )}
  </div>
);

export const NewDirectMailModal: React.FC<NewDirectMailModalProps> = ({ isOpen, onClose, onSave, isIndividualPlan, campaignToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sendType, setSendType] = useState<'Email' | 'SMS' | 'WhatsApp'>('Email');
  const [isExiting, setIsExiting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Specific fields
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [whatsappBody, setWhatsappBody] = useState('');
  const [whatsappMedia, setWhatsappMedia] = useState<File | null>(null);

  const emailMediaInputRef = useRef<HTMLInputElement>(null);
  const whatsappMediaInputRef = useRef<HTMLInputElement>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);

  // New state for schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleSettings, setScheduleSettings] = useState<Schedule[]>([]);
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (campaignToEdit) {
        setName(campaignToEdit.name);
        setDescription(campaignToEdit.description);
        setSendType(campaignToEdit.sendType);
        setEmailSubject(campaignToEdit.emailSubject || '');
        setEmailBody(campaignToEdit.emailBody || '');
        if (emailBodyRef.current) {
          emailBodyRef.current.innerHTML = campaignToEdit.emailBody || '';
        }
        setPhoneNumber(campaignToEdit.phoneNumber || '');
        setSmsBody(campaignToEdit.smsBody || '');
        setWhatsappBody(campaignToEdit.whatsappBody || '');
        setScheduleSettings(campaignToEdit.scheduleSettings || []);
        setScheduleDate(campaignToEdit.scheduleDate || '');
        // Reset file states, as we won't re-upload files on edit
        setWhatsappMedia(null);
      } else {
        // Reset form for new entry
        setName('');
        setDescription('');
        setSendType('Email');
        setEmailSubject('');
        setEmailBody('');
        if (emailBodyRef.current) {
          emailBodyRef.current.innerHTML = '';
        }
        setPhoneNumber('');
        setSmsBody('');
        setWhatsappBody('');
        setWhatsappMedia(null);
        setShowEmojiPicker(false);
        setScheduleSettings([]);
        setScheduleDate('');
      }
    }
  }, [isOpen, campaignToEdit]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'email' | 'whatsapp') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'email') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const imgHtml = `<p><img src="${dataUrl}" alt="${file.name}" style="max-width: 95%; height: auto; border-radius: 8px; margin: 8px auto; display: block;" /></p>`;
          if (emailBodyRef.current) {
            emailBodyRef.current.focus();
            document.execCommand('insertHTML', false, imgHtml);
            setEmailBody(emailBodyRef.current.innerHTML);
          }
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input to allow re-uploading the same file
      } else if (type === 'whatsapp') {
        setWhatsappMedia(e.target.files[0]);
      }
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (sendType === 'Email') {
      if (emailBodyRef.current) {
        emailBodyRef.current.focus();
        document.execCommand('insertText', false, emoji);
        setEmailBody(emailBodyRef.current.innerHTML);
      }
    } else if (sendType === 'WhatsApp') {
      setWhatsappBody(prev => prev + emoji);
    } else if (sendType === 'SMS') {
      setSmsBody(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFormat = (command: string, value?: string) => {
    if (emailBodyRef.current) {
      emailBodyRef.current.focus();
      document.execCommand(command, false, value);
      setEmailBody(emailBodyRef.current.innerHTML); // Explicitly update state
    }
  };

  const handleSaveSchedule = (schedule: Schedule[]) => {
    setScheduleSettings(schedule);
    setIsScheduleModalOpen(false);
  };

  const handleImproveText = async (type: 'email' | 'sms' | 'whatsapp') => {
    let textToImprove = '';
    let currentHtmlContent = '';

    if (type === 'email') {
      if (emailBodyRef.current) {
        currentHtmlContent = emailBodyRef.current.innerHTML;
        textToImprove = emailBodyRef.current.innerText; // Use innerText for a cleaner prompt for the AI
      }
    }
    if (type === 'sms') textToImprove = smsBody;
    if (type === 'whatsapp') textToImprove = whatsappBody;

    if (!textToImprove.trim()) {
      alert('Por favor, escreva um texto antes de pedir para a IA melhorar.');
      return;
    }

    setIsImprovingText(true);
    try {
      const result = await aiAPI.improveText(textToImprove);
      const improvedText = result && result.text ? result.text : '';

      if (!improvedText) throw new Error("IA não retornou texto");

      if (type === 'email' && emailBodyRef.current) {
        emailBodyRef.current.innerHTML = improvedText;
        setEmailBody(improvedText);
      }
      if (type === 'sms') {
        setSmsBody(improvedText.slice(0, 160));
      }
      if (type === 'whatsapp') {
        setWhatsappBody(improvedText);
      }

    } catch (error) {
      console.error("Erro ao melhorar o texto com IA:", error);
      alert("Ocorreu um erro ao tentar melhorar o texto. Tente novamente.");
    } finally {
      setIsImprovingText(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('O nome da campanha é obrigatório.');
      return;
    }
    onSave({
      name,
      description,
      sendType,
      emailSubject,
      emailBody: emailBodyRef.current?.innerHTML || '',
      phoneNumber,
      smsBody,
      whatsappBody,
      whatsappMediaName: whatsappMedia?.name,
      scheduleSettings,
      scheduleDate,
    });
    handleClose();
  };

  if (!isOpen && !isExiting) return null;
  const title = campaignToEdit ? 'Editar Mala Direta' : 'Criar Mala Direta';

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
        <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-xl font-bold text-secondary">{title}</h3>
              <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 relative">

                <div>
                  <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700">Nome da Campanha</label>
                  <input id="campaign-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Promoção de Verão" className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea id="campaign-description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label htmlFor="send-type" className="block text-sm font-medium text-gray-700">Tipo de Envio</label>
                  <select id="send-type" value={sendType} onChange={e => setSendType(e.target.value as any)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="Email">Email</option>
                    <option value="SMS" disabled={isIndividualPlan}>SMS {isIndividualPlan && '(Plano Empresa)'}</option>
                    <option value="WhatsApp" disabled>WhatsApp (Serviço Adicional)</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                <div className="mt-4 pt-4 border-t animate-fade-in space-y-4">
                  {sendType === 'Email' && (
                    <>
                      <div>
                        <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700">Título do email</label>
                        <input id="email-subject" type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                      </div>
                      <div>
                        <label htmlFor="email-body" className="block text-sm font-medium text-gray-700">Texto</label>
                        <div className="relative">
                          <Toolbar
                            onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            onAttachmentClick={() => emailMediaInputRef.current?.click()}
                            showAttachment={true}
                            onFormat={handleFormat}
                          />
                          <div
                            id="email-body"
                            ref={emailBodyRef}
                            onInput={e => setEmailBody(e.currentTarget.innerHTML)}
                            contentEditable="true"
                            role="textbox"
                            aria-multiline="true"
                            className="w-full p-2 border border-t-0 rounded-b-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[140px] text-secondary"
                          />
                          <input ref={emailMediaInputRef} type="file" onChange={(e) => handleMediaChange(e, 'email')} accept="image/*" className="hidden" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImproveText('email')}
                          disabled={isImprovingText}
                          className="mt-2 flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-gray-700 disabled:bg-gray-400"
                        >
                          {isImprovingText ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Melhorando...</span></>) : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg><span>Melhorar com IA</span></>)}
                        </button>
                      </div>
                    </>
                  )}
                  {sendType === 'SMS' && (
                    <>
                      <div>
                        <label htmlFor="sms-phone" className="block text-sm font-medium text-gray-700">Selecionar qual telefone vai enviar</label>
                        <select id="sms-phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                          <option value="">Selecione...</option>
                          {mockPhoneNumbers.map(phone => <option key={phone} value={phone}>{phone}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="sms-body" className="block text-sm font-medium text-gray-700">Texto</label>
                        <textarea id="sms-body" value={smsBody} onChange={e => setSmsBody(e.target.value)} rows={4} maxLength={160} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        <button
                          type="button"
                          onClick={() => handleImproveText('sms')}
                          disabled={isImprovingText}
                          className="mt-2 flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-gray-700 disabled:bg-gray-400"
                        >
                          {isImprovingText ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Melhorando...</span></>) : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg><span>Melhorar com IA</span></>)}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {showEmojiPicker && (
                  <div className="absolute z-10 bottom-20 right-4 bg-white shadow-lg rounded-md border p-2 grid grid-cols-8 gap-1 max-w-xs">
                    {emojis.map(emoji => <button type="button" key={emoji} onClick={() => handleInsertEmoji(emoji)} className="p-1 rounded-md hover:bg-gray-200 text-xl">{emoji}</button>)}
                  </div>
                )}

                <div className="pt-4 border-t space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Configurar horários permitidos para disparo
                    </button>
                  </div>
                  <div>
                    <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700">Data de Agendamento</label>
                    <input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Salvar</button>
              <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
      <ScheduleSettingsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        initialSchedule={scheduleSettings}
      />
    </>
  );
};
