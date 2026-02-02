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
                // Task 3: Filter banners by painel_de_controle
                const response = await api.get('/admin/banners?area=painel_de_controle');
                // API returns array directly according to updated controller
                const data = response.data || [];
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
            description: (b as any).description,
            image_url: b.image_url,
            button_text: b.button_text,
            link: b.link,
            subtitle: 'Destaque'
        })),
        ...promotions.filter(p => p.isActive && p.targetArea === 'painel').map(p => ({
            id: `promo-${p.id}`,
            title: p.title,
            description: p.description,
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
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 group">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    Promoções em Destaque
                </h3>
            </div>

            <div className="relative">
                <div className="overflow-hidden rounded-2xl">
                    <div
                        className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {finalItems.map((item: any) => (
                            <div key={item.id} className="min-w-full">
                                <div className={`flex flex-col ${item.isEmpty ? 'bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 items-center justify-center text-center' : ''}`}>
                                    {!item.isEmpty ? (
                                        <>
                                            {/* Image Section */}
                                            <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-inner">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                />

                                                {/* Badge - Top Left */}
                                                <div className="absolute top-4 left-4 inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-bold shadow-lg">
                                                    {item.subtitle}
                                                </div>

                                                {/* Title Overlay - Bottom */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                                                    <h4 className="text-lg sm:text-xl font-extrabold text-white leading-tight mb-1">
                                                        {item.title}
                                                    </h4>
                                                    {item.description && (
                                                        <p className="text-[10px] sm:text-xs text-white/80 font-medium line-clamp-1">
                                                            Resultados que encantam e fidelizam clientes
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content Section below image */}
                                            <div className="pt-5 pb-2">
                                                {item.description && (
                                                    <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
                                                        {item.description}
                                                    </p>
                                                )}

                                                <button
                                                    onClick={() => item.link !== '#' && window.open(item.link, '_blank')}
                                                    className="w-full bg-[#10b981] hover:bg-[#0da06f] text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 text-sm uppercase tracking-wider"
                                                >
                                                    {item.button_text}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-400 mb-2">{item.title}</h4>
                                            <p className="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto">Crie campanhas personalizadas para atrair mais clientes.</p>
                                            <button className="px-6 py-2 bg-gray-200 text-gray-500 rounded-xl font-bold text-sm">Novo Banner</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            {finalItems.length > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <div className="flex gap-2.5">
                        <button
                            onClick={() => navigateCarousel('prev')}
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigateCarousel('next')}
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex gap-1.5">
                        {finalItems.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`transition-all duration-300 rounded-full ${currentSlide === index ? 'w-6 h-2 bg-[#10b981]' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
