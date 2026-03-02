import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Re-use the interface to ensure type safety
interface DirectMailCampaignData {
    id: number;
    name: string;
    description: string;
    sendType: 'Email' | 'SMS' | 'WhatsApp';
    emailSubject?: string;
    emailBody?: string;
    emailAttachmentName?: string;
    phoneNumber?: string;
    smsBody?: string;
    whatsappBody?: string;
    whatsappMediaName?: string;
    status: 'Not Sent' | 'Sent';
    history: { date: string; recipients: number }[];
    roi: {
        totalSent: number;
        openRate: string;
        clicks: number;
        conversions: number;
        revenue: number;
    };
}


interface DirectMailDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: DirectMailCampaignData | null;
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-100 p-3 rounded-lg text-center">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl font-bold text-secondary">{value}</p>
    </div>
);


const DirectMailDetailsModal: React.FC<DirectMailDetailsModalProps> = ({ isOpen, onClose, campaign }) => {
  const { t } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  if (!isOpen && !isExiting) return null;
  if (!campaign) return null;

  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  const renderContent = () => {
    switch(campaign.sendType) {
        case 'Email':
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-700">Assunto do Email</h4>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">{campaign.emailSubject || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">Corpo do Email</h4>
                        <div
                            className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md border max-h-48 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: campaign.emailBody || '' }}
                        />
                    </div>
                </div>
            );
        case 'SMS':
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-700">Telefone de Envio</h4>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">{campaign.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">Texto do SMS</h4>
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md border">{campaign.smsBody}</p>
                    </div>
                </div>
            );
        case 'WhatsApp':
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-700">Telefone de Envio</h4>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">{campaign.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">Texto do WhatsApp</h4>
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md border">{campaign.whatsappBody}</p>
                    </div>
                    {campaign.whatsappMediaName && (
                        <div>
                            <h4 className="font-semibold text-gray-700">Mídia Anexada</h4>
                            <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">{campaign.whatsappMediaName}</p>
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl transform transition-all max-w-2xl w-full flex flex-col max-h-[90vh] ${animationClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
            Detalhes da Campanha: {campaign.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
        </div>

        <div className="p-6 flex-grow overflow-y-auto space-y-6">
            <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Conteúdo</h4>
                {renderContent()}
            </section>
            
            <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Resultados (ROI)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard title="Total de Envios" value={String(campaign.roi.totalSent)} />
                    <StatCard title="Taxa de Abertura" value={campaign.roi.openRate} />
                    <StatCard title="Cliques" value={String(campaign.roi.clicks)} />
                    <StatCard title="Conversões" value={String(campaign.roi.conversions)} />
                    <StatCard title="Receita Gerada" value={`R$ ${campaign.roi.revenue.toFixed(2).replace('.', ',')}`} />
                </div>
            </section>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse rounded-b-lg border-t">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
// FIX: Changed to a default export to resolve module resolution errors in the importing component.
export default DirectMailDetailsModal;