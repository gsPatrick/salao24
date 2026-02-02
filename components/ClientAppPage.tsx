import React, { useState, useEffect, useRef } from 'react';
import { Client, Professional } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import api, { professionalsAPI } from '../lib/api';

// --- Interfaces ---
interface Appointment {
  id: number;
  clientId: number;
  date: string;
  time: string;
  service: string;
  status: 'Agendado' | 'Em Espera' | 'Atendido';
}

interface ClientAppPageProps {
  currentClient: Client;
  onLogout: () => void;
  navigate: (page: string) => void;
  appointments: Appointment[];
  promotions: any[];
}

// --- Icons ---
const HomeIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>;
const HistoryIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const PackageIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H3"></path></svg>;
const QRCodeIcon = () => <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M5 5h3v3H5V5zm0 7h3v3H5v-3zM12 5h3v3h-3V5zm0 7h3v3h-3v-3z" /><path fillRule="evenodd" d="M2 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 2v1h2V5H4zM2 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4zm2 2v1h2v-1H4zm10-12a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V3a1 1 0 00-1-1h-4zm-1 2v1h2V5h-2zm-1 8a1 1 0 011-1h4a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;


// --- Client Promo Carousel ---
const ClientPromoCarousel: React.FC<{ promotions: any[] }> = ({ promotions }) => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.get('/admin/banners?area=area_do_cliente');
        setBanners(response.data || []);
      } catch (error) {
        console.error('Error fetching client banners:', error);
      }
    };
    fetchBanners();
  }, []);

  // Re-added debug logging for troubleshooting
  console.log('ClientPromoCarousel - Incoming promotions:', promotions);
  const activePromotions = (promotions || []).filter(p => {
    const isActive = p.isActive;
    const isTargetMatch = p.targetArea === 'client' || p.targetArea === 'cliente' || p.targetArea === 'area_do_cliente';
    const isStandard = p.type !== 'exclusive';
    console.log(`Promo ID ${p.id}: isActive=${isActive}, targetArea=${p.targetArea}, type=${p.type}, isTargetMatch=${isTargetMatch}, isStandard=${isStandard}`);
    return isActive && isTargetMatch && isStandard;
  });

  const combinedItems = [
    ...banners.map(b => ({
      id: `banner-${b.id}`,
      tag: 'Destaque',
      title: b.title,
      highlight: '',
      description: b.description,
      cta: b.button_text || 'Saiba Mais',
      imageUrl: b.image_url,
      link: b.link
    })),
    ...activePromotions.map(p => ({
      id: `promo-${p.id}`,
      tag: p.callToAction || 'Oferta Especial',
      title: p.title,
      highlight: p.subtitle,
      description: p.description,
      cta: p.actionButton || 'Aproveitar',
      imageUrl: p.image,
      link: p.promotionUrl
    }))
  ];

  const cards = combinedItems.length > 0 ? combinedItems.map((item, idx) => ({
    ...item,
    accentColor: idx % 3 === 0 ? 'from-emerald-500 to-teal-400' : idx % 3 === 1 ? 'from-indigo-500 to-sky-500' : 'from-amber-500 to-rose-500',
    isEmpty: false,
    id: idx // Use index for indicator logic if needed, or keep original string IDs
  })) : [
    {
      id: 0,
      tag: 'Novidades',
      title: 'Sem promoções no momento',
      highlight: '',
      description: 'Fique atento! Logo teremos novidades e ofertas especiais para você.',
      cta: 'Aguarde',
      imageUrl: '',
      accentColor: 'from-gray-400 to-gray-300',
      link: '#',
      isEmpty: true
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (cards.length <= 1) return; // Don't rotate if only 1 card (or empty state)
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [cards.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  const activeCard = cards[activeIndex];

  return (
    <div className="mt-4 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      <div className="relative h-44 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${activeCard.accentColor}`}
        ></div>
        {!activeCard.isEmpty && (
          <img
            src={activeCard.imageUrl}
            alt={activeCard.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative h-full flex flex-col justify-between p-4">
          <div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-sm">
              {activeCard.tag}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white leading-tight shadow-black/20">
              {activeCard.title}
            </h2>
            <p className="mt-1 text-xs text-white/80 font-medium">
              {activeCard.highlight || 'Oportunidade única'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between p-5 gap-5">
        <p className="text-sm text-gray-500 leading-relaxed font-medium">
          {activeCard.description}
        </p>

        {!activeCard.isEmpty && (
          <button
            onClick={() => activeCard.link !== '#' && window.open(activeCard.link, '_blank')}
            className="w-full bg-[#10b981] hover:bg-[#0da06f] text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            {activeCard.cta}
          </button>
        )}
      </div>

      {cards.length > 1 && (
        <div className="px-5 pb-5 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 hover:text-primary transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 hover:text-primary transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1.5">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`transition-all duration-300 rounded-full ${activeIndex === index ? 'w-5 h-2 bg-[#10b981]' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// --- New Review Component ---
const StarRatingInput: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
  const { t } = useLanguage();
  const [hover, setHover] = useState(0);
  return (
    <div className="flex justify-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button"
            key={starValue}
            className={`transition-colors duration-200 ${starValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            aria-label={t('rateWithStars', { starValue })}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};


const ServiceReviewModal: React.FC<{ serviceToReview: any; onReviewSubmit: (feedback: any) => void; currentClient: Client; professionals: Professional[]; onClose: () => void }> = ({ serviceToReview, onReviewSubmit, currentClient, professionals, onClose }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!serviceToReview) return null;

  const professionalDetails = professionals.find(p => p.name === serviceToReview.professional);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalDetails) return;

    setIsSubmitting(true);
    try {
      const response = await professionalsAPI.submitReview({
        professionalId: professionalDetails.id,
        clientId: currentClient.id,
        rating: rating,
        comment: comment
      });

      if (response.success) {
        onReviewSubmit(response.data);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in" onClick={onClose}>
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-bounce-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-secondary mb-2 text-center">{t('rateYourService')}</h2>
        <p className="text-center text-sm text-gray-600 mb-4">{t('yourFeedbackIsImportant')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-light rounded-lg">
            <img src={professionalDetails?.photo} alt={serviceToReview.professional} className="w-14 h-14 rounded-full" />
            <div>
              <p className="font-semibold text-gray-500 text-sm">{t('professional')}</p>
              <p className="font-bold text-secondary">{serviceToReview.professional}</p>
              <p className="text-sm text-primary">{serviceToReview.name}</p>
            </div>
          </div>
          <div>
            <StarRatingInput rating={rating} setRating={setRating} />
          </div>
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('leaveCommentOptional')}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:bg-gray-400"
          >
            {isSubmitting ? t('submitting') : t('submitReview')}
          </button>
        </form>
      </div>
    </div>
  );
};


// --- Component ---
const ClientAppPage: React.FC<ClientAppPageProps> = ({ currentClient, onLogout, navigate, appointments, promotions }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('inicio');
  const [activeSubTab, setActiveSubTab] = useState('servicos');
  const [clientData, setClientData] = useState(currentClient);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [serviceToReview, setServiceToReview] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const response = await professionalsAPI.getAll();
        if (response.success) {
          setProfessionals(response.data);
        }
      } catch (error) {
        console.error('Error fetching professionals:', error);
      }
    };
    fetchProfessionals();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleCheckIn = () => {
    setIsScanning(true);
  };

  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanResult(null);
  };

  useEffect(() => {
    if (isScanning) {
      const startScan = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Fake scan after a delay for demo purposes
            setTimeout(() => {
              setScanResult("Check-in realizado com sucesso! Bem-vindo(a).");
              setTimeout(() => stopScan(), 2500); // Close after showing success message
            }, 3000);
          }
        } catch (err) {
          console.error("Camera error:", err);
          alert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
          stopScan();
        }
      };
      startScan();
    }

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);


  const today = new Date();

  const upcomingAppointments = (appointments || [])
    .filter(a => a.clientId === clientData.id && new Date(a.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = (clientData?.history || [])
    .filter(h => new Date(h.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allAppointments = (appointments || [])
    .filter(a => a.clientId === clientData.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleReviewSubmit = (feedback: any) => {
    // Update the client data to mark the service as reviewed
    setClientData(prevData => ({
      ...prevData,
      history: prevData.history.map(h =>
        h.id === serviceToReview.id ? { ...h, reviewed: true } : h
      )
    }));
    setServiceToReview(null);
    showNotification(t('reviewSubmittedSuccess'));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('clientScheduling')}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Novo Agendamento
              </button>
              <button
                onClick={handleCheckIn}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <QRCodeIcon />
                {t('checkinButton')}
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary mb-3">Próximos Agendamentos</h2>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {upcomingAppointments.map(appt => (
                      <div
                        key={appt.id}
                        className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-primary"
                      >
                        <p className="font-bold text-secondary">{appt.service}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                          })}
                        </p>
                        <p className="text-lg font-semibold text-primary">{appt.time}</p>
                      </div>
                    ))}
                  </div>
                  <ClientPromoCarousel promotions={promotions} />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 text-center py-4 bg-gray-100 rounded-lg">
                    Você não tem agendamentos futuros.
                  </p>
                  <ClientPromoCarousel promotions={promotions} />
                </div>
              )}
            </div>
            {(clientData?.packages || []).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-secondary mb-3">Meus Pacotes Ativos</h2>
                <div className="space-y-4">
                  {clientData.packages.map((pkg, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium text-gray-800">{pkg.name}</span>
                        <span className="font-semibold text-gray-500">{pkg.completedSessions} / {pkg.totalSessions} sessões</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full"
                          style={{ width: `${(pkg.completedSessions / pkg.totalSessions) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'historico':
        return (
          <div>
            {/* Sub-tabs */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveSubTab('servicos')}
                className={`px-4 py-2 font-medium text-sm ${activeSubTab === 'servicos' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
              >
                Histórico de Serviços
              </button>
              <button
                onClick={() => setActiveSubTab('agendamentos')}
                className={`px-4 py-2 font-medium text-sm ${activeSubTab === 'agendamentos' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
              >
                Histórico de Agendamentos
              </button>
            </div>

            {/* Content based on sub-tab */}
            {activeSubTab === 'servicos' && (
              <>
                <h2 className="text-xl font-bold text-secondary mb-4">Histórico de Serviços</h2>
                {pastAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {pastAppointments.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-secondary">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} com {item.professional}
                            </p>
                          </div>
                          {item.reviewed ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">{t('rated')}</span>
                          ) : (
                            <button onClick={() => setServiceToReview(item)} className="text-xs font-semibold px-3 py-1 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors">
                              {t('rate')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8 bg-gray-100 rounded-lg">Seu histórico de serviços está vazio.</p>
                )}
              </>
            )}

            {activeSubTab === 'agendamentos' && (
              <>
                <h2 className="text-xl font-bold text-secondary mb-4">Histórico de Agendamentos</h2>
                {allAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {allAppointments.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-secondary">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {item.time}
                            </p>
                            <p className="text-sm text-gray-500">Profissional: {item.professional}</p>
                            <p className="text-sm text-gray-500">Status: {item.status}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === 'concluído' ? 'bg-green-100 text-green-800' :
                            item.status === 'Atendido' ? 'bg-green-100 text-green-800' :
                              item.status === 'Agendado' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'Reagendado' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'Faltante' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8 bg-gray-100 rounded-lg">Seu histórico de agendamentos está vazio.</p>
                )}
              </>
            )}
          </div>
        );
      case 'pacotes':
        return (
          <div>
            <h2 className="text-xl font-bold text-secondary mb-4">Meus Pacotes</h2>
            {(clientData?.packages || []).length > 0 ? (
              <div className="space-y-4">
                {clientData.packages.map((pkg, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-bold text-lg text-secondary">{pkg.name}</span>
                      <span className="font-semibold text-gray-600">{pkg.completedSessions} / {pkg.totalSessions} sessões utilizadas</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                      <div
                        className="bg-primary h-4 rounded-full"
                        style={{ width: `${(pkg.completedSessions / pkg.totalSessions) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-100 rounded-lg">Você não possui pacotes ativos.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tabId: string; icon: React.ReactNode; label: string }> = ({ tabId, icon, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${activeTab === tabId ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  if (isScanning) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-lg shadow-lg aspect-square object-cover"></video>
        {scanResult ? (
          <div className="mt-4 p-4 bg-green-500 text-white rounded-lg text-center font-bold animate-bounce-in">
            {scanResult}
          </div>
        ) : (
          <div className="text-center">
            <p className="mt-4 text-white">Aponte a câmera para o QR Code na recepção...</p>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white/50 rounded-lg"></div>
          </div>
        )}
        <button onClick={stopScan} className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-lg">Cancelar</button>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in flex items-center">
          {notification}
        </div>
      )}
      <div className="min-h-screen bg-light flex justify-center items-center py-8 px-4">
        <div className="w-full max-w-sm h-[700px] bg-gray-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-gray-200">
          {/* Header */}
          <header className="flex-shrink-0 bg-white p-4 flex justify-between items-center border-b">
            <div className="flex items-center gap-3">
              <img src={clientData.photo} alt={clientData.name} className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-bold text-secondary text-sm">Olá, {clientData.name.split(' ')[0]}!</p>
                <p className="text-xs text-gray-500">Bem-vindo(a) ao seu portal</p>
              </div>
            </div>
            <button onClick={onLogout} title="Sair" className="text-gray-500 hover:text-red-500"><LogoutIcon /></button>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4">
            {renderContent()}
          </main>

          {/* Bottom Navigation */}
          <footer className="flex-shrink-0 bg-white border-t p-2 flex justify-around">
            <TabButton tabId="inicio" icon={<HomeIcon />} label="Início" />
            <TabButton tabId="historico" icon={<HistoryIcon />} label="Histórico" />
            <TabButton tabId="pacotes" icon={<PackageIcon />} label="Pacotes" />
          </footer>
        </div>
      </div>
      {serviceToReview && (
        <ServiceReviewModal
          serviceToReview={serviceToReview}
          onReviewSubmit={handleReviewSubmit}
          currentClient={clientData}
          professionals={professionals}
          onClose={() => setServiceToReview(null)}
        />
      )}
    </>
  );
};

export default ClientAppPage;