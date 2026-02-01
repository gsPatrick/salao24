import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

interface PromoBanner {
    id: number;
    title: string;
    image_url: string;
    button_text: string;
    link: string;
}

interface Promotion {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    promotionUrl: string;
    actionButton: string;
    description: string;
    targetArea: 'cliente' | 'painel';
    isActive: boolean;
}

interface DashboardPromoCarouselProps {
    promotions?: Promotion[];
}

export const DashboardPromoCarousel: React.FC<DashboardPromoCarouselProps> = ({ promotions = [] }) => {
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get('/super-admin/banners');
                // API returns { success: true, data: [...] }
                const data = response.data?.data || response.data || [];
                setBanners(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching banners:', error);
                setBanners([]); // Ensure empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    // Combine banners and promotions targeted for 'painel'
    const displayItems = [
        ...banners.map(b => ({
            id: `banner-${b.id}`,
            title: b.title,
            image_url: b.image_url,
            button_text: b.button_text,
            link: b.link,
            subtitle: 'Destaque'
        })),
        ...promotions.filter(p => p.isActive && p.targetArea === 'painel').map(p => ({
            id: `promo-${p.id}`,
            title: p.title,
            image_url: p.image,
            button_text: p.actionButton || 'Compre Agora',
            link: p.promotionUrl,
            subtitle: p.subtitle || 'Promoção'
        }))
    ];

    // Rotação automática a cada 5 segundos
    useEffect(() => {
        if (displayItems.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev === displayItems.length - 1 ? 0 : prev + 1));
        }, 5000);

        return () => clearInterval(interval);
    }, [displayItems.length]);

    const navigateCarousel = (direction: 'prev' | 'next') => {
        setCurrentSlide(prev => {
            if (direction === 'prev') {
                return prev === 0 ? displayItems.length - 1 : prev - 1;
            } else {
                return prev === displayItems.length - 1 ? 0 : prev + 1;
            }
        });
    };

    if (loading && banners.length === 0) return <div className="p-6 bg-white rounded-2xl shadow-lg h-64 flex items-center justify-center font-bold text-secondary">Carregando promoções...</div>;

    // If no real items, show empty state with same layout
    const finalItems = displayItems.length > 0 ? displayItems : [
        {
            id: 'empty-state',
            title: 'Sem promoções em destaque',
            image_url: '', // Empty image
            button_text: 'Criar Promoção', // Optional or hidden
            link: '#',
            subtitle: '',
            isEmpty: true // Flag to handle empty state styling
        }
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg group">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Promoções em Destaque
                </h3>
            </div>

            <div className="relative">
                <div className="overflow-hidden rounded-lg">
                    <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {finalItems.map((item: any) => (
                            <div key={item.id} className="min-w-full">
                                <div className={`relative rounded-lg overflow-hidden h-48 sm:h-64 ${item.isEmpty ? 'bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center' : 'bg-gradient-to-r from-primary to-secondary'}`}>

                                    {!item.isEmpty ? (
                                        <>
                                            <div className="relative h-full">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
                                                <div className="text-xs font-medium text-white/80 mb-1 uppercase tracking-wider">{item.subtitle}</div>
                                                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                                <button
                                                    onClick={() => item.link !== '#' && window.open(item.link, '_blank')}
                                                    className="bg-white text-secondary font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors mt-2 text-sm shadow-lg active:scale-95"
                                                >
                                                    {item.button_text}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <h4 className="text-xl font-bold text-gray-400 mb-2">{item.title}</h4>
                                            <p className="text-gray-400 text-sm mb-4">Crie uma campanha para aparecer aqui.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {finalItems.length > 1 && (
                    <>
                        <button
                            onClick={() => navigateCarousel('prev')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigateCarousel('next')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {finalItems.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    {finalItems.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? 'bg-primary' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
