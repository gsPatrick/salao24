
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// --- Interfaces ---
interface SchedulingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Icons ---
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const QRCodeIcon = () => (
    <svg className="w-full h-full text-secondary" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 48h64v64H48zM64 64v32h32V64z" />
        <path d="M144 48h64v64h-64zM160 64v32h32V64z" />
        <path d="M48 144h64v64H48zM64 160v32h32v-32z" />
        <path d="M144 144h16v16h-16zM176 144h16v16h-16zM208 144h16v16h-16zM144 176h16v16h-16zM176 176h16v16h-16zM208 176h16v16h-16zM144 208h16v16h-16zM176 208h16v16h-16zM208 208h16v16h-16z" opacity="0.8" />
    </svg>
);


const SchedulingLinkModal: React.FC<SchedulingLinkModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [isCopied, setIsCopied] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const schedulingLink = 'https://salao24h.app/agendar/seu-salao';

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
                className={`inline-flex items-center px-4 py-2 border border-l-0 rounded-r-md transition-colors duration-200 ${
                    isCopied
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
            <div className="w-32 h-32 mx-auto bg-white p-2 rounded-md shadow-inner">
                <QRCodeIcon />
            </div>
            <p className="text-xs text-gray-500 mt-3">{t('qrCodeIdealFor')}</p>
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
