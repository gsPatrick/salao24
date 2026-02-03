
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { QRCodeSVG } from 'qrcode.react';

// --- Interfaces ---
interface SchedulingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Icons ---
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;


const SchedulingLinkModal: React.FC<SchedulingLinkModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { tenant, selectedUnitId, units } = useData();
  const [isCopied, setIsCopied] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const salonSlug = tenant?.name.toLowerCase().replace(/\s+/g, '-') || 'salao';
  const unitSuffix = selectedUnit ? `?unit=${selectedUnit.id}` : '';
  const schedulingLink = `https://salao24h.app/agendar/${salonSlug}${unitSuffix}`;

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      setIsCopied(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(schedulingLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Create blob to avoid btoa issues with special characters
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 1024; // High resolution
      canvas.height = 1024;
      ctx?.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${salonSlug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = url;
  };

  if (!isOpen && !isExiting) return null;

  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl transform transition-all max-w-lg w-full ${animationClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </div>
          <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
            {t('shareLinkTitle')}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {t('shareLinkSubtitle')}
            </p>
          </div>

          <div className="my-6">
            <label htmlFor="scheduling-link" className="sr-only">{t('schedulingLink')}</label>
            <div className="flex rounded-md shadow-sm">
              <input
                id="scheduling-link"
                type="text"
                readOnly
                value={schedulingLink}
                className="flex-1 block w-full rounded-none rounded-l-md p-3 border border-gray-300 bg-gray-50 text-gray-600 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleCopy}
                className={`inline-flex items-center px-4 py-2 border border-l-0 rounded-r-md transition-colors duration-200 ${isCopied
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-primary border-primary text-white hover:bg-primary-dark'
                  }`}
              >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                <span className="ml-2">{isCopied ? t('copied') : t('copy')}</span>
              </button>
            </div>
          </div>

          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3">{t('orUseQRCode')}</h4>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-white rounded-xl shadow-md border mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={schedulingLink}
                  size={128}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center text-primary hover:text-primary-dark font-medium transition-colors"
                title={t('downloadQRCode')}
              >
                <DownloadIcon />
                <span className="ml-2">{t('download')}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">{t('qrCodeIdealFor')}</p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse rounded-b-lg">
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

export default SchedulingLinkModal;
