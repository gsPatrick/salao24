import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

interface PromoBanner {
    id: number;
    title: string;
    image_url: string;
    button_text: string;
    link: string;
}

export const DashboardPromoCarousel: React.FC = () => {
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get('/admin/banners');
                setBanners(response.data);
            } catch (error) {
                console.error('Error fetching banners:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    // Rotação automática a cada 5 segundos
    useEffect(() => {
        if (banners.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev === banners.length - 1 ? 0 : prev + 1));
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const navigateCarousel = (direction: 'prev' | 'next') => {
        setCurrentSlide(prev => {
            if (direction === 'prev') {
                return prev === 0 ? banners.length - 1 : prev - 1;
            } else {
                return prev === banners.length - 1 ? 0 : prev + 1;
            }
        });
    };

    if (loading) return <div className="p-6 bg-white rounded-2xl shadow-lg h-64 flex items-center justify-center">Carregando promoções...</div>;
    if (banners.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
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
                        {banners.map((banner) => (
                            <div key={banner.id} className="min-w-full">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg overflow-hidden relative">
                                    <div className="relative h-48 sm:h-64">
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
                                        <h4 className="text-xl font-bold mb-2">{banner.title}</h4>
                                        <button
                                            onClick={() => window.open(banner.link, '_blank')}
                                            className="bg-white text-gray-900 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors mt-2"
                                        >
                                            {banner.button_text}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {banners.length > 1 && (
                    <>
                        <button
                            onClick={() => navigateCarousel('prev')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigateCarousel('next')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {banners.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    {banners.map((_, index) => (
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
