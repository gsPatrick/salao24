import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePersistentState } from '../hooks/usePersistentState';
import api from '../lib/api'; // Fix: default import for api
import YouTubeCommentModeration from './YouTubeCommentModeration';
import { youtubeService } from '../lib/youtubeService';
import { commentAutomationService } from '../lib/commentAutomationService';

// Icons
const YouTubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M16.75 13.96c.25.41.4 1 .25 1.61l-.01.01c-.13 1.14-.65 2.2-1.48 2.9l-.1.1c-.93.78-2.02 1.25-3.23 1.34l-.06.01h-3.21c-4.87 0-8.83-3.95-8.83-8.83s3.95-8.83 8.83-8.83 8.83 3.95 8.83 8.83c0 .34-.02.67-.06.99l-.01 0c-.31 1.8-.13 3.61.51 5.32l.11.29zM12 21.92c4.34 0 7.88-3.54 7.88-7.88s-3.54-7.88-7.88-7.88-7.88 3.54-7.88-7.88c0 2.05.79 3.93 2.11 5.35l.12.12c.1.09.2.18.29.27l-1.38 3.97 4.09-1.37c.37.07.74.12 1.13.15h3.04c.01-.01 0 0 0 0z" /><path d="M15.26 13.01c-.08-.12-.3-.2-.52-.32-.22-.12-.52-.27-.8-.37-.28-.1-.52-.16-.72-.16-.29 0-.57.1-.77.37-.2.27-.76.95-.92 1.15s-.33.22-.61.07c-.28-.15-1.18-.53-2.13-1.42s-1.58-1.95-1.63-2.05c-.05-.1-.01-.2.08-.31.09-.11.2-.27.3-.37.1-.1.15-.22.22-.37.07-.15.04-.28-.02-.42s-.72-1.72-.98-2.32c-.27-.6-.52-.52-.72-.52-.18 0-.4 0-.61 0s-.57.08-.85.37c-.28.3-.95.95-.95 2.32 0 1.38 1.03 2.7 1.18 2.87s1.8 2.92 4.49 4.18c2.69 1.26 3.3.93 3.73.85.43-.08 1.18-.52 1.38-.98.2-.47.2-.85.15-.98-.05-.12-.17-.2-.25-.32z" /></svg>
);
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;


interface ChannelsPageProps {
  onBack?: () => void;
  isIndividualPlan: boolean;
  navigate: (page: string) => void;
}

const ChannelsPage: React.FC<ChannelsPageProps> = ({ onBack, isIndividualPlan, navigate }) => {
  const { t } = useLanguage();
  const [isSupportConnected, setIsSupportConnected] = useState(false);
  const [isMarketingConnected, setIsMarketingConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/tenants/current');
        const settings = response.data.data.settings || {};
        setIsSupportConnected(settings.support_active || false);
        setIsMarketingConnected(settings.marketing_active || false);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Instagram state
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);

  // YouTube state
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [youtubeCommentsEnabled, setYoutubeCommentsEnabled] = useState(true);
  const [youtubeAnalyticsEnabled, setYoutubeAnalyticsEnabled] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [savedAutomations, setSavedAutomations] = useState<any[]>([
    { id: 1, keywords: 'preço, valor, quanto custa', reply: 'Olá! Te enviamos uma DM com nossa tabela de preços. 😊', active: true, archived: false },
  ]);
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null);
  const [keywords, setKeywords] = useState('');
  const [reply, setReply] = useState('Olá [NOME_USUARIO]! Vi seu comentário. Para agendar ou ver nossos serviços, acesse:');
  const [isActive, setIsActive] = useState(true);
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleConnection = async (channel: 'support' | 'marketing') => {
    setIsLoading(true);
    try {
      const update = {};
      if (channel === 'support') {
        update['support_active'] = !isSupportConnected;
      } else if (channel === 'marketing') {
        update['marketing_active'] = !isMarketingConnected;
      }

      await api.put('/tenants/settings', { settings: update });

      if (channel === 'support') {
        const newState = !isSupportConnected;
        setIsSupportConnected(newState);
        showNotification(newState ? 'Canal de Atendimento conectado!' : 'Canal de Atendimento desconectado.');
      } else if (channel === 'marketing') {
        const newState = !isMarketingConnected;
        setIsMarketingConnected(newState);
        showNotification(newState ? 'Canal de Marketing conectado com sucesso!' : 'Canal de Marketing desconectado.');
      }

    } catch (error) {
      console.error('Error updating settings:', error);
      showNotification('Erro ao conectar canal. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleInstagramConnection = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newState = !isInstagramConnected;
      setIsInstagramConnected(newState);
      showNotification(newState ? t('channelsInstagramConnected') : t('channelsInstagramDisconnected'));
      setIsLoading(false);
    }, 1500);
  };

  const handleToggleYouTubeConnection = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newState = !isYouTubeConnected;
      setIsYouTubeConnected(newState);
      showNotification(newState ? t('channelsYouTubeConnected') : t('channelsYouTubeDisconnected'));
      setIsLoading(false);
    }, 1500);
  };

  const handleSaveYouTubeSettings = (e: React.FormEvent) => {
    e.preventDefault();

    // Configura o serviço do YouTube
    if (youtubeApiKey && youtubeChannelId) {
      youtubeService.configure(youtubeApiKey, youtubeChannelId);

      // Configura o serviço de automação
      commentAutomationService.updateSettings({
        enabled: youtubeCommentsEnabled,
        maxRepliesPerHour: 10,
        maxRepliesPerDay: 100,
        minDelayBetweenReplies: 5,
        requireApproval: false,
        allowedHours: { start: 8, end: 22 },
        blacklistKeywords: ['spam', 'promoção'],
        minCommentAge: 2
      });

      // Inicia o serviço se estiver habilitado
      if (youtubeCommentsEnabled) {
        commentAutomationService.start();
      } else {
        commentAutomationService.stop();
      }
    }

    showNotification(t('channelsYouTubeConnected'));
  };

  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAutomation) {
      setSavedAutomations(prev => prev.map(auto => auto.id === editingAutomation.id ? { ...auto, keywords, reply, active: isActive } : auto));
      showNotification(t('automationUpdated'));
    } else {
      const newAutomation = { id: Date.now(), keywords, reply, active: isActive, archived: false };
      setSavedAutomations(prev => [newAutomation, ...prev]);
      showNotification(t('channelsAutomationSavedSuccess'));
    }
    setEditingAutomation(null);
    setKeywords('');
    setReply('Olá [NOME_USUARIO]! Vi seu comentário. Para agendar ou ver nossos serviços, acesse:');
    setIsActive(true);
  };

  const handleEditAutomation = (automation: any) => {
    setEditingAutomation(automation);
    setKeywords(automation.keywords);
    setReply(automation.reply);
    setIsActive(automation.active);
    // Scroll to the form
    document.getElementById('automation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingAutomation(null);
    setKeywords('');
    setReply('Olá [NOME_USUARIO]! Vi seu comentário. Para agendar ou ver nossos serviços, acesse:');
    setIsActive(true);
  };

  const handleArchiveAutomation = (id: number) => {
    setSavedAutomations(prev => prev.map(auto =>
      auto.id === id ? { ...auto, archived: true } : auto
    ));
    showNotification(t('archive'));
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {onBack && (
        <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t('back')}
        </button>
      )}

      {notification && (
        <div className="fixed top-24 right-8 z-50 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce-in flex items-center">
          <span>{notification}</span>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-secondary">{t('channelsTitle')}</h1>
        <p className="text-gray-600 mt-2">{t('channelsSubtitle')}</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* WhatsApp Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <WhatsAppIcon />
            </div>
            <h2 className="text-2xl font-bold text-secondary">WhatsApp</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Marketing e Atendimento a Clientes Card */}
            <div className="relative border p-6 rounded-xl flex flex-col items-center text-center">
              {isIndividualPlan && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-xl z-10 flex flex-col items-center justify-center p-4">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mb-3">
                    <LockIcon />
                  </div>
                  <h4 className="text-md font-bold text-white">{t('planEnterprise')}</h4>
                  <p className="text-xs text-gray-300 mt-1 mb-3">Faça o upgrade para usar este canal de comunicação.</p>
                  <button
                    type="button"
                    onClick={() => navigate('upgrade_to_empresa')}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full text-sm transition-transform transform hover:scale-105"
                  >
                    Fazer Upgrade
                  </button>
                </div>
              )}
              <h3 className="text-lg font-bold text-secondary">Marketing e Atendimento a Clientes</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Número principal para suporte, campanhas de marketing, agendamentos e comunicação geral com clientes já existentes.</p>
              <div className="my-4 p-4 border-2 border-dashed rounded-lg">
                <svg className="w-20 h-20 text-gray-300 mx-auto" viewBox="0 0 256 256"><path fill="currentColor" d="M128 256a128 128 0 1 0 0-256a128 128 0 1 0 0 256ZM48 48v64h64V48H48Zm16 16h32v32H64V64Zm80-16v64h64V48h-64Zm16 16h32v32h-32V64ZM48 144v64h64v-64H48Zm16 16h32v32H64v-32Zm80-16h16v16h-16v-16Zm16 16h16v16h-16v-16Zm16-16h16v16h-16v-16Zm-16 32h16v16h-16v-16Zm16 16h16v16h-16v-16Zm-32-16h16v16h-16v-16Zm0 16h16v16h-16v-16Zm-16-16h16v16h-16v-16Zm-16 32h16v16H96v-16Zm32 0h16v16h-16v-16Zm-16-16h16v16h-16v-16Z" /></svg>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full mb-4 ${isSupportConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {isSupportConnected ? t('channelsConnected') : t('channelsDisconnected')}
              </span>
              <button
                onClick={() => handleToggleConnection('support')}
                disabled={isLoading || isIndividualPlan}
                className={`w-full flex justify-center py-2 px-4 border text-sm font-medium rounded-md disabled:opacity-50 transition-colors ${isSupportConnected ? 'border-red-500 text-red-500 bg-white hover:bg-red-50' : 'border-transparent text-white bg-primary hover:bg-primary-dark'}`}
              >
                {isLoading ? '...' : (isSupportConnected ? t('channelsDisconnect') : t('channelsConnect'))}
              </button>
            </div>

            {/* Leads Card */}
            <div className="relative border p-6 rounded-xl flex flex-col items-center text-center">
              {isIndividualPlan && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-xl z-10 flex flex-col items-center justify-center p-4">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mb-3">
                    <LockIcon />
                  </div>
                  <h4 className="text-md font-bold text-white">{t('planEnterprise')}</h4>
                  <p className="text-xs text-gray-300 mt-1 mb-3">Faça o upgrade para usar um número exclusivo para leads.</p>
                  <button
                    type="button"
                    onClick={() => navigate('upgrade_to_empresa')}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full text-sm transition-transform transform hover:scale-105"
                  >
                    Fazer Upgrade
                  </button>
                </div>
              )}
              <h3 className="text-lg font-bold text-secondary">Leads</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Número exclusivo para captação de novos clientes e primeiro contato.</p>
              <div className="my-4 p-4 border-2 border-dashed rounded-lg">
                <svg className="w-20 h-20 text-gray-300 mx-auto" viewBox="0 0 256 256"><path fill="currentColor" d="M128 256a128 128 0 1 0 0-256a128 128 0 1 0 0 256ZM48 48v64h64V48H48Zm16 16h32v32H64V64Zm80-16v64h64V48h-64Zm16 16h32v32h-32V64ZM48 144v64h64v-64H48Zm16 16h32v32H64v-32Zm80-16h16v16h-16v-16Zm16 16h16v16h-16v-16Zm16-16h16v16h-16v-16Zm-16 32h16v16h-16v-16Zm16 16h16v16h-16v-16Zm-32-16h16v16h-16v-16Zm0 16h16v16h-16v-16Zm-16-16h16v16h-16v-16Zm-16 32h16v16H96v-16Zm32 0h16v16h-16v-16Zm-16-16h16v16h-16v-16Z" /></svg>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full mb-4 ${isMarketingConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {isMarketingConnected ? t('channelsConnected') : t('channelsDisconnected')}
              </span>
              <button
                onClick={() => handleToggleConnection('marketing')}
                disabled={isLoading || isIndividualPlan}
                className={`w-full flex justify-center py-2 px-4 border text-sm font-medium rounded-md disabled:opacity-50 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${isMarketingConnected ? 'border-red-500 text-red-500 bg-white hover:bg-red-50' : 'border-transparent text-white bg-primary hover:bg-primary-dark'}`}
              >
                {isLoading ? '...' : (isMarketingConnected ? t('channelsDisconnect') : t('channelsConnect'))}
              </button>
            </div>
          </div>
        </div>

        {/* Instagram Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent space-y-6 relative">
          {isIndividualPlan && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-2xl z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mb-3">
                <LockIcon />
              </div>
              <h4 className="text-md font-bold text-white">{t('planEnterprise')}</h4>
              <p className="text-xs text-gray-300 mt-1">Faça o upgrade para conectar o Instagram e automatizar DMs e comentários.</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white rounded-xl">
              <InstagramIcon />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-secondary">Instagram</h2>
              <p className="text-gray-600 text-sm mt-1">{t('channelsInstagramDesc')}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isInstagramConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {isInstagramConnected ? t('channelsConnected') : t('channelsDisconnected')}
              </span>
              <button
                onClick={handleToggleInstagramConnection}
                disabled={isIndividualPlan || isLoading}
                className={`w-32 flex justify-center py-2 px-4 border text-sm font-medium rounded-md disabled:opacity-50 transition-colors ${isInstagramConnected ? 'border-red-500 text-red-500 bg-white hover:bg-red-50' : 'border-transparent text-white bg-primary hover:bg-primary-dark'}`}
              >
                {isLoading ? '...' : (isInstagramConnected ? t('channelsDisconnect') : t('channelsConnect'))}
              </button>
            </div>
          </div>

          {isInstagramConnected && (
            <div className="mt-6 pt-6 border-t animate-fade-in space-y-6">
              <div id="automation-form" className="bg-light p-6 rounded-lg">
                <h3 className="text-lg font-bold text-secondary">{editingAutomation ? t('editingAutomationTitle') : t('channelsAutomationTitle')}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{t('channelsAutomationDesc')}</p>
                <form onSubmit={handleSaveAutomation} className="space-y-4">
                  <div>
                    <label htmlFor="ig-keywords" className="block text-sm font-medium text-gray-700">{t('channelsAutomationKeywordsLabel')}</label>
                    <input type="text" id="ig-keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder={t('channelsAutomationKeywordsPlaceholder')} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                    <p className="text-xs text-gray-500 mt-1">{t('channelsAutomationKeywordsDesc')}</p>
                  </div>
                  <div>
                    <label htmlFor="ig-reply" className="block text-sm font-medium text-gray-700">{t('channelsAutomationReplyLabel')}</label>
                    <textarea id="ig-reply" value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder={t('channelsAutomationReplyPlaceholder')} className="mt-1 w-full p-2 border border-gray-300 rounded-md"></textarea>
                    <p className="text-xs text-gray-500 mt-1">{t('channelsAutomationReplyDesc')}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="flex items-center">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                      <span className="ml-2 text-sm font-medium text-gray-700">{t('channelsAutomationActiveLabel')}</span>
                    </label>
                    <div className="flex gap-3">
                      {editingAutomation && (
                        <button type="button" onClick={handleCancelEdit} className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">{t('cancelEditButton')}</button>
                      )}
                      <button type="submit" className="py-2 px-6 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">{editingAutomation ? t('updateAutomationButton') : t('channelsAutomationSaveButton')}</button>
                    </div>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-bold text-secondary">{t('channelsSavedAutomationsTitle')}</h3>
                <p className="text-xs text-gray-500 mb-4">{t('channelsSavedAutomationsInstagramDMStats')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col">
                    <span className="text-xs text-gray-500">Total de DMs</span>
                    <span className="text-lg font-bold text-secondary mt-1">1.248</span>
                    <span className="text-[11px] text-gray-400 mt-1">Últimos 15 dias</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col">
                    <span className="text-xs text-gray-500">Taxa de resposta</span>
                    <span className="text-lg font-bold text-secondary mt-1">92%</span>
                    <span className="text-[11px] text-gray-400 mt-1">Respostas enviadas pela automação</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col">
                    <span className="text-xs text-gray-500">Tempo médio de resposta</span>
                    <span className="text-lg font-bold text-secondary mt-1">3 min</span>
                    <span className="text-[11px] text-gray-400 mt-1">Entre comentário e DM</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {savedAutomations.filter(auto => !auto.archived).length === 0 && (
                    <p className="text-xs text-gray-500 italic">
                      Nenhuma automação ativa no momento. Arquivos ficam ocultos desta lista.
                    </p>
                  )}
                  {savedAutomations.filter(auto => !auto.archived).map(auto => (
                    <div
                      key={auto.id}
                      className="bg-light p-4 rounded-lg flex justify-between items-start gap-4"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500">{t('channelsKeywordsLabel')}</p>
                        <p className="text-sm text-gray-800 font-medium bg-white p-2 rounded-md">{auto.keywords}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-2">{t('channelsReplyMessageLabel')}</p>
                        <p className="text-sm text-gray-800 bg-white p-2 rounded-md">"{auto.reply}"</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${auto.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{auto.active ? t('statusActive') : t('statusInactive')}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditAutomation(auto)} className="text-xs font-semibold text-blue-600 hover:underline">{t('edit')}</button>
                          <button onClick={() => handleArchiveAutomation(auto.id)} className="text-xs font-semibold text-gray-700 hover:underline">{t('archive')}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção de Automações Arquivadas */}
              <div className="mt-6 pt-4 border-t border-dashed border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-secondary">{t('channelsArchivedAutomationsTitle')}</h4>
                  <span className="text-[11px] text-gray-400">
                    {t('channelsArchivedAutomationsRestoreHint')}
                  </span>
                </div>
                {savedAutomations.filter(auto => auto.archived).length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    {t('channelsArchivedAutomationsEmpty')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedAutomations.filter(auto => auto.archived).map(auto => (
                      <div key={auto.id} className="bg-gray-50 border border-dashed border-gray-300 p-3 rounded-lg flex justify-between items-start gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500">{t('channelsKeywordsLabel')}</p>
                          <p className="text-xs text-gray-800 font-medium bg-white p-2 rounded-md inline-block">{auto.keywords}</p>
                          <p className="text-[11px] font-semibold text-gray-500 mt-1">{t('channelsReplyMessageLabel')}</p>
                          <p className="text-xs text-gray-800 bg-white p-2 rounded-md inline-block">"{auto.reply}"</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{t('archive')}</span>
                          <button
                            type="button"
                            onClick={() => setSavedAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, archived: false } : a))}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            {t('unarchive')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* YouTube Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent space-y-6 relative">
          {isIndividualPlan && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-75 rounded-2xl z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mb-3">
                <LockIcon />
              </div>
              <h4 className="text-md font-bold text-white">{t('planEnterprise')}</h4>
              <p className="text-xs text-gray-300 mt-1">Faça o upgrade para conectar o YouTube e gerenciar comentários e análises.</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-4 bg-red-600 text-white rounded-xl">
              <YouTubeIcon />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-secondary">YouTube</h2>
              <p className="text-gray-600 text-sm mt-1">{t('channelsYouTubeDesc')}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isYouTubeConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {isYouTubeConnected ? t('channelsConnected') : t('channelsDisconnected')}
              </span>
              <button
                onClick={handleToggleYouTubeConnection}
                disabled={isIndividualPlan || isLoading}
                className={`w-32 flex justify-center py-2 px-4 border text-sm font-medium rounded-md disabled:opacity-50 transition-colors ${isYouTubeConnected ? 'border-red-500 text-red-500 bg-white hover:bg-red-50' : 'border-transparent text-white bg-primary hover:bg-primary-dark'}`}
              >
                {isLoading ? '...' : (isYouTubeConnected ? t('channelsDisconnect') : t('channelsConnect'))}
              </button>
            </div>
          </div>

          {isYouTubeConnected && (
            <div className="mt-6 pt-6 border-t animate-fade-in space-y-6">
              <div className="bg-light p-6 rounded-lg">
                <h3 className="text-lg font-bold text-secondary">{t('channelsYouTubeConfigTitle')}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{t('channelsYouTubeConfigDesc')}</p>
                <form onSubmit={handleSaveYouTubeSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="youtube-channel-id" className="block text-sm font-medium text-gray-700">{t('channelsYouTubeChannelId')}</label>
                      <input
                        type="text"
                        id="youtube-channel-id"
                        value={youtubeChannelId}
                        onChange={e => setYoutubeChannelId(e.target.value)}
                        placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">Encontre o ID do seu canal nas configurações do YouTube Studio</p>
                    </div>
                    <div>
                      <label htmlFor="youtube-api-key" className="block text-sm font-medium text-gray-700">{t('channelsYouTubeApiKey')}</label>
                      <input
                        type="password"
                        id="youtube-api-key"
                        value={youtubeApiKey}
                        onChange={e => setYoutubeApiKey(e.target.value)}
                        placeholder="Sua chave da API do YouTube"
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">Obtenha sua chave no Google Cloud Console</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">Recursos Habilitados</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={youtubeCommentsEnabled}
                          onChange={e => setYoutubeCommentsEnabled(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">{t('channelsYouTubeManageComments')}</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">{t('channelsYouTubeManageCommentsDesc')}</p>

                      <label className="flex items-center mt-3">
                        <input
                          type="checkbox"
                          checked={youtubeAnalyticsEnabled}
                          onChange={e => setYoutubeAnalyticsEnabled(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">{t('channelsYouTubeAnalytics')}</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">{t('channelsYouTubeAnalyticsDesc')}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="py-2 px-6 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark mr-2"
                    >
                      Salvar Configurações
                    </button>
                    {isYouTubeConnected && youtubeCommentsEnabled && (
                      <button
                        type="button"
                        onClick={() => setShowModerationPanel(true)}
                        className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                      >
                        Gerenciar Comentários
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-bold text-secondary mb-4">{t('channelsYouTubeStatsTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-light p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">12.5K</div>
                    <div className="text-sm text-gray-600">{t('channelsYouTubeSubscribers')}</div>
                  </div>
                  <div className="bg-light p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">847</div>
                    <div className="text-sm text-gray-600">{t('channelsYouTubeCommentsMonth')}</div>
                  </div>
                  <div className="bg-light p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">89%</div>
                    <div className="text-sm text-gray-600">{t('channelsYouTubeEngagementRate')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Comment Moderation Modal */}
      {showModerationPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('youtubeModerationTitle')}</h2>
              <button
                onClick={() => setShowModerationPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <YouTubeCommentModeration
                channelId={youtubeChannelId}
                apiKey={youtubeApiKey}
                isEnabled={youtubeCommentsEnabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsPage;
