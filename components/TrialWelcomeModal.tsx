import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrialWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    trialDays?: number;
    trialEndsAt?: string;
}

/**
 * Modal shown after successful registration to inform user about their trial period.
 */
const TrialWelcomeModal: React.FC<TrialWelcomeModalProps> = ({
    isOpen,
    onClose,
    trialDays = 14,
    trialEndsAt
}) => {
    const formattedDate = trialEndsAt
        ? new Date(trialEndsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
                    >
                        {/* Celebration Icon */}
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-4xl">🎉</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Bem-vindo ao Salão24h!
                        </h2>

                        {/* Subtitle */}
                        <p className="text-primary font-semibold text-lg mb-4">
                            Seu período de teste começou!
                        </p>

                        {/* Description */}
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                            <p className="text-gray-700">
                                Você tem <span className="font-bold text-primary">{trialDays} dias grátis</span> para explorar todas as funcionalidades do sistema.
                            </p>
                            {formattedDate && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Seu teste expira em: <span className="font-medium">{formattedDate}</span>
                                </p>
                            )}
                        </div>

                        {/* Features List */}
                        <div className="text-left space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500">✓</span>
                                <span>Agenda completa com notificações</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500">✓</span>
                                <span>Gestão de clientes e profissionais</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500">✓</span>
                                <span>Relatórios financeiros</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500">✓</span>
                                <span>Assistente de IA integrado</span>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={onClose}
                            className="w-full bg-primary hover:bg-primary/90 text-secondary font-bold py-4 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Começar a Usar
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TrialWelcomeModal;
