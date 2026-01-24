import React from 'react';
import { motion } from 'framer-motion';

interface SubscriptionBlockerProps {
    message?: string;
    onPayNow?: () => void;
}

/**
 * Full-screen overlay that blocks the dashboard when subscription is overdue or expired.
 * Uses the existing design system (primary/secondary colors, Framer Motion).
 */
const SubscriptionBlocker: React.FC<SubscriptionBlockerProps> = ({
    message = 'Ops! Sua assinatura do Salão24h está pendente.',
    onPayNow
}) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-secondary/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
            >
                {/* Icon */}
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {message}
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-8">
                    Para continuar usando todas as funcionalidades do sistema, regularize sua assinatura.
                </p>

                {/* Primary Action Button */}
                <button
                    onClick={onPayNow}
                    className="w-full bg-primary hover:bg-primary/90 text-secondary font-bold py-4 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    Ir para Pagamento
                </button>

                {/* Secondary Link */}
                <div className="mt-4 text-sm text-gray-500">
                    Precisa de ajuda? <a href="mailto:suporte@salao24h.com" className="text-primary hover:underline">Fale com o suporte</a>
                </div>
            </motion.div>
        </div>
    );
};

export default SubscriptionBlocker;
