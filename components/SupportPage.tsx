import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supportAPI, trainingAPI } from '../lib/api';

// --- Interfaces ---
interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'gerente' | 'recepcao' | 'profissional';
}

interface SupportPageProps {
  onBack?: () => void;
  currentUser: User;
}

interface Video {
  id: number;
  category: string;
  title: string;
  duration: string;
  description: string;
  youtubeId: string;
}

interface Ticket {
  id: number;
  subject: string;
  department: string;
  priority: string;
  message: string;
  timestamp: Date;
  status: 'Em Aberto' | 'Resolvido';
}


// --- Icons ---
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg>;
const ThumbsUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5.5 10H5a2 2 0 00-2 2v5a2 2 0 002 2h2.5" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;


const getYoutubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
};

// --- Video Edit/Add Modal Component ---
const VideoModal: React.FC<{
  video?: Video | null;
  onSave: (video: Video) => void;
  onClose: () => void;
}> = ({ video, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [category, setCategory] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDuration(video.duration);
      setDescription(video.description);
      setYoutubeId(video.youtubeId);
      setCategory(video.category);
    } else {
      // Reset for new video
      setTitle('');
      setDuration('');
      setDescription('');
      setYoutubeId('');
      setCategory('Geral'); // Default category
    }
  }, [video]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = getYoutubeId(youtubeId.trim());
    const newVideoData: Video = {
      id: video ? video.id : Date.now(), // Keep existing id or generate new one
      title,
      duration,
      description,
      youtubeId: cleanId,
      category
    };
    onSave(newVideoData);
    handleClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${!isExiting ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all w-full max-w-lg ${!isExiting ? 'scale-100' : 'scale-95'}`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{video ? 'Editar Aula' : 'Adicionar Nova Aula'}</h3>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da Aula" required className="w-full p-2 border rounded" />
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duração (ex: 8:15 min)" required className="w-full p-2 border rounded" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" required rows={3} className="w-full p-2 border rounded" />
              <div>
                <input value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="ID do Vídeo do YouTube" required className="w-full p-2 border rounded" />
                <p className="text-xs text-gray-500 mt-1">Ex: Se a URL é youtube.com/watch?v=Sc-tj_0s_3E, o ID é <span className="font-mono">Sc-tj_0s_3E</span>.</p>
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
  );
};


// --- Tab Content Components ---

const VideoCard: React.FC<{ video: Video, onPlay: () => void, isPlaying: boolean, isAdmin: boolean, onEdit: () => void }> = ({ video, onPlay, isPlaying, isAdmin, onEdit }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col relative">
      {isAdmin && (
        <button
          onClick={onEdit}
          className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-blue-700 transition-colors z-10"
          aria-label="Editar/Substituir aula"
        >
          <EditIcon />
        </button>
      )}
      <div className="relative mb-4 aspect-video bg-black rounded-md overflow-hidden">
        {isPlaying ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <>
            <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <button onClick={onPlay} className="text-white bg-primary/70 hover:bg-primary rounded-full p-4 transition-colors" aria-label={`Play video: ${video.title}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
      <h3 className="text-lg font-bold text-secondary">{video.title}</h3>
      <p className="text-sm font-semibold text-primary mb-2">{video.duration}</p>
      <p className="text-gray-600 text-sm flex-grow">{video.description}</p>
    </div>
  );
};

const TrainingContent: React.FC<{ isSuperAdmin: boolean }> = ({ isSuperAdmin }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await trainingAPI.getAll();
      if (response.success) {
        // Map backend video_url/thumbnail_url to frontend youtubeId if needed,
        // but for now, assuming training_videos table might have different fields.
        // Let's assume the API returns the format we expect or we map it.
        const mappedVideos = response.data.map((v: any) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          youtubeId: v.video_url, // Backend uses video_url for the id
          duration: v.duration ? `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')} min` : '5:00 min',
          category: v.category || 'Geral'
        }));
        setVideos(mappedVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (youtubeId: string) => {
    setPlayingVideoId(youtubeId);
  };

  const handleOpenModal = (video: Video | null = null) => {
    setVideoToEdit(video);
    setIsModalOpen(true);
  };

  const handleSaveVideo = async (videoData: Video) => {
    try {
      const apiData = {
        title: videoData.title,
        description: videoData.description,
        video_url: videoData.youtubeId,
        category: videoData.category,
        // duration: extract from string if needed
      };

      if (videoToEdit) {
        await trainingAPI.update(videoToEdit.id, apiData);
      } else {
        await trainingAPI.create(apiData);
      }
      await fetchVideos();
      setIsModalOpen(false);
    } catch (error) {
      alert('Erro ao salvar vídeo');
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (window.confirm('Excluir esta aula?')) {
      try {
        await trainingAPI.delete(id);
        await fetchVideos();
      } catch (error) {
        alert('Erro ao excluir vídeo');
      }
    }
  };
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizedVideos = filteredVideos.reduce((acc, video) => {
    (acc[video.category] = acc[video.category] || []).push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  const categoryOrder = ["Visão Geral e Dashboard", "Agenda", "Clientes e CRM", "Serviços", "Financeiro e Estoque", "Configurações e Equipe", "Ferramentas Avançadas", "Geral"];

  return (
    <div>
      {isModalOpen && <VideoModal video={videoToEdit} onSave={handleSaveVideo} onClose={() => setIsModalOpen(false)} />}
      <div className="flex justify-center items-center mb-6 relative">
        <h2 className="text-2xl font-bold text-secondary text-center">Treinamento e Aulas</h2>
        {isSuperAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="absolute right-0 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors shadow-lg transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Adicionar Aula
          </button>
        )}
      </div>

      <div className="mb-8 max-w-lg mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palavra-chave..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : Object.keys(categorizedVideos).length > 0 ? (
        <div className="space-y-12">
          {categoryOrder.map(category => {
            if (!categorizedVideos[category]) return null;
            return (
              <section key={category}>
                <h3 className="text-2xl font-bold text-secondary border-b-2 border-primary/20 pb-2 mb-6">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categorizedVideos[category].map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isPlaying={playingVideoId === video.youtubeId}
                      onPlay={() => handlePlayVideo(video.youtubeId)}
                      isAdmin={isSuperAdmin}
                      onEdit={() => handleOpenModal(video)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-light rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">Nenhum resultado encontrado</h3>
          <p className="text-gray-500 mt-2">Tente buscar por outras palavras-chave.</p>
        </div>
      )}
    </div>
  );
};


const TicketContent: React.FC<{ tickets: Ticket[], setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>, hasOpenTicket: boolean }> = ({ tickets, setTickets, hasOpenTicket }) => {
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOpenTicket) {
      alert(t('openTicketWarning'));
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const ticketData = {
      subject: formData.get('subject') as string,
      department: formData.get('department') as string,
      priority: formData.get('priority') as string,
      message: formData.get('message') as string,
    };

    try {
      const response = await supportAPI.createTicket(ticketData);
      if (response.success) {
        alert(t('ticketSentSuccess'));
        form.reset();
        // Optionally refresh history
        const updatedResponse = await supportAPI.getHistory();
        if (updatedResponse.success) {
          setTickets(updatedResponse.data.map((t: any) => ({
            ...t,
            timestamp: new Date(t.created_at)
          })));
        }
      }
    } catch (error) {
      alert('Erro ao enviar chamado');
    }
  };

  const handleResolveTicket = (id: number) => {
    // This would now need a backend endpoint PATCH /support/tickets/:id/resolve
    setTickets(prev => prev.map(ticket => ticket.id === id ? { ...ticket, status: 'Resolvido' } : ticket));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="max-w-2xl mx-auto lg:mx-0">
        <h2 className="text-2xl font-bold text-secondary mb-6 text-center lg:text-left">Abrir Novo Chamado</h2>
        {hasOpenTicket && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500 rounded-md">
            <p className="font-bold">{t('openTicketWarning')}</p>
          </div>
        )}
        <div className={`bg-white p-8 rounded-lg shadow-lg ${hasOpenTicket ? 'opacity-50 pointer-events-none' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento</label>
                <select id="department" name="department" required disabled={hasOpenTicket} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100">
                  <option>Técnico</option>
                  <option>Financeiro</option>
                  <option>Dúvidas Gerais</option>
                  <option>Sugestões</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Prioridade</label>
                <select id="priority" name="priority" required disabled={hasOpenTicket} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100">
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Assunto</label>
              <input type="text" id="subject" name="subject" required disabled={hasOpenTicket} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea id="message" name="message" rows={5} required disabled={hasOpenTicket} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100" />
            </div>
            <div>
              <button type="submit" disabled={hasOpenTicket} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                Enviar Chamado
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">{t('supportEmailInfo')}</p>
            </div>
          </form>
        </div>
      </div>
      <div className="max-w-2xl mx-auto lg:mx-0">
        <h2 className="text-2xl font-bold text-secondary mb-6 text-center lg:text-left">{t('ticketHistoryTitle')}</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 max-h-[600px] overflow-y-auto">
          {tickets.length > 0 ? tickets.map(ticket => {
            const statusColor = ticket.status === 'Resolvido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            return (
              <div key={ticket.id} className="border p-4 rounded-md bg-light">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-secondary">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{ticket.timestamp.toLocaleString('pt-BR')}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor}`}>{ticket.status}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border">{ticket.message}</p>
                {ticket.status === 'Em Aberto' && (
                  <div className="text-right mt-3">
                    <button onClick={() => handleResolveTicket(ticket.id)} className="text-sm font-semibold text-primary hover:underline">{t('markAsResolved')}</button>
                  </div>
                )}
              </div>
            );
          }) : (
            <p className="text-center text-gray-500 py-8">{t('noTicketsYet')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ContributionsContent = () => {
  const [suggestions, setSuggestions] = useState([
    { id: 1, title: 'Integração com Instagram DMs para agendamentos', description: 'Permitir que a IA responda e agende diretamente pelas DMs do Instagram.', votes: 128, voted: false },
    { id: 2, title: 'Relatório de Aniversariantes do Mês', description: 'Uma lista fácil de visualizar com todos os clientes que fazem aniversário no mês atual para ações de marketing.', votes: 97, voted: false },
    { id: 3, title: 'App para o cliente final agendar e ver histórico', description: 'Um aplicativo dedicado para o cliente poder marcar horários, ver seus pacotes e histórico de serviços.', votes: 75, voted: false },
  ]);

  const handleVote = (id: number) => {
    setSuggestions(suggestions.map(s => s.id === id && !s.voted ? { ...s, votes: s.votes + 1, voted: true } : s));
  };

  const handleIdeaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('ideaTitle') as HTMLInputElement).value;
    const description = (form.elements.namedItem('ideaDescription') as HTMLTextAreaElement).value;

    if (title && description) {
      setSuggestions(prev => [{ id: Date.now(), title, description, votes: 1, voted: true }, ...prev]);
      form.reset();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-secondary mb-6 text-center">Contribua com Ideias</h2>
      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <form onSubmit={handleIdeaSubmit} className="space-y-4">
          <div>
            <label htmlFor="ideaTitle" className="block text-sm font-medium text-gray-700">Título da sua ideia</label>
            <input type="text" id="ideaTitle" name="ideaTitle" required placeholder="Ex: Relatório de produtos mais vendidos" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="ideaDescription" className="block text-sm font-medium text-gray-700">Descreva sua sugestão</label>
            <textarea id="ideaDescription" name="ideaDescription" rows={4} required placeholder="Detalhe como essa funcionalidade ajudaria no seu dia a dia..." className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg">Enviar Sugestão</button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-secondary text-center">Ideias da Comunidade</h3>
        {suggestions.sort((a, b) => b.votes - a.votes).map(suggestion => (
          <div key={suggestion.id} className="bg-white p-4 rounded-lg shadow-md flex items-start gap-4">
            <div className="flex-shrink-0 text-center">
              <button
                onClick={() => handleVote(suggestion.id)}
                disabled={suggestion.voted}
                className={`flex flex-col items-center p-2 border rounded-md transition-colors ${suggestion.voted ? 'bg-primary/20 border-primary cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
              >
                <span className="font-bold text-lg text-primary">{suggestion.votes}</span>
                <span className="text-xs text-gray-500">votos</span>
              </button>
            </div>
            <div>
              <h4 className="font-semibold text-secondary">{suggestion.title}</h4>
              <p className="text-sm text-gray-600">{suggestion.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const SupportPage: React.FC<SupportPageProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('ticket');
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (activeTab === 'ticket') {
      fetchTicketHistory();
    }
  }, [activeTab]);

  const fetchTicketHistory = async () => {
    try {
      const response = await supportAPI.getHistory();
      if (response.success) {
        setTickets(response.data.map((t: any) => ({
          ...t,
          timestamp: new Date(t.created_at)
        })));
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const hasOpenTicket = useMemo(() => tickets.some(ticket => ticket.status === 'Em Aberto'), [tickets]);

  const TabButton: React.FC<{ tabId: string; label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-lg font-semibold border-b-4 transition-colors duration-300 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      {onBack && (
        <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">
          &larr; {t('back')}
        </button>
      )}

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-secondary">Central de Suporte e Ajuda</h1>
        <p className="text-gray-600 mt-2">Encontre respostas, abra chamados ou contribua com ideias para a plataforma.</p>
      </div>

      <div className="border-b border-gray-200 mb-8 flex justify-center">
        <nav className="flex space-x-4">
          <TabButton tabId="ticket" label="Abrir Chamado" />
          <TabButton tabId="training" label="Treinamento" />
          <TabButton tabId="contributions" label="Contribuições" />
        </nav>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'ticket' && <TicketContent tickets={tickets} setTickets={setTickets} hasOpenTicket={hasOpenTicket} />}
        {activeTab === 'training' && <TrainingContent isSuperAdmin={isSuperAdmin} />}
        {activeTab === 'contributions' && <ContributionsContent />}
      </div>
    </div>
  );
};

export default SupportPage;
