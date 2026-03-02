
import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureData: { photo: string; signature: string }) => void;
  contractText: string;
}

const Step: React.FC<{ number: number; label: string; isActive: boolean; isCompleted: boolean }> = ({ number, label, isActive, isCompleted }) => (
  <div className="flex items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${isCompleted ? 'bg-primary text-white' : isActive ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-gray-200 text-gray-500'}`}>
      {isCompleted ? '✓' : number}
    </div>
    <span className={`ml-3 text-sm font-semibold hidden sm:inline ${isActive || isCompleted ? 'text-primary' : 'text-gray-500'}`}>{label}</span>
  </div>
);


const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSign, contractText }) => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(1);
  const [isExiting, setIsExiting] = useState(false);

  // State for signing process
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const resetState = () => {
    setPhoto(null);
    setShowCamera(false);
    setHasSigned(false);
    setAgreed(false);
    setActiveStep(1);
    setIsSigned(false);
    setSignatureDataUrl(null);
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleStartCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera: ", err);
      setShowCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && photoCanvasRef.current) {
      const video = videoRef.current;
      const canvas = photoCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setPhoto(dataUrl);
      }
      stopCamera();
    }
  };

  useEffect(() => {
    if (!signatureCanvasRef.current || activeStep !== 2) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true } as any);
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const getPosition = (event: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (event instanceof MouseEvent) {
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      } else {
        return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
      }
    };

    const startDrawing = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      setIsDrawing(true);
      setHasSigned(true);
      const { x, y } = getPosition(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (event: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      event.preventDefault();
      const { x, y } = getPosition(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawing, activeStep]);

  const handleClearSignature = () => {
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d', { willReadFrequently: true } as any);
      ctx?.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
      setHasSigned(false);
    }
  };

  const handleConfirmSignature = () => {
    if (photo && (signatureCanvasRef.current || signatureDataUrl) && hasSigned && agreed && !isSigned) {
      setIsSigned(true);
      const signature = signatureDataUrl || (signatureCanvasRef.current ? signatureCanvasRef.current.toDataURL('image/png') : '');

      setTimeout(() => {
        onSign({ photo, signature });
        handleClose();
      }, 2000);
    }
  };

  const handleNext = () => {
    if (activeStep === 2 && signatureCanvasRef.current) {
      const dataUrl = signatureCanvasRef.current.toDataURL('image/png');
      setSignatureDataUrl(dataUrl);
    }
    if (activeStep < 3) setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (activeStep > 1) setActiveStep(prev => prev - 1);
  };

  const handleClose = () => {
    setIsExiting(true);
    stopCamera();
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  if (!isOpen && !isExiting) return null;

  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-secondary text-center">{t('signatureModalTitle')}</h3>

          {!isSigned && (
            <div className="flex justify-between items-center my-6 px-4">
              <Step number={1} label={t('signatureModalStep1')} isActive={activeStep === 1} isCompleted={!!photo} />
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${activeStep > 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <Step number={2} label={t('signatureModalStep2')} isActive={activeStep === 2} isCompleted={hasSigned} />
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${activeStep > 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <Step number={3} label={t('signatureModalStep3')} isActive={activeStep === 3} isCompleted={agreed && isSigned} />
            </div>
          )}

          <div className="mt-4 min-h-[300px] max-h-[60vh] overflow-y-auto pr-4 space-y-6">
            {isSigned ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center animate-fade-in">
                <svg className="w-24 h-24 text-primary" fill="none" viewBox="0 0 52 52">
                  <circle className="animate-scale-in stroke-current text-primary/20" cx="26" cy="26" r="25" strokeWidth="4" />
                  <path
                    className="animate-draw-check stroke-current"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ strokeDasharray: 34, strokeDashoffset: 34 }}
                    d="M14 27l8 8 16-16"
                  />
                </svg>
                <h4 className="font-semibold text-xl text-secondary mt-4">{t('signatureModalSuccessTitle')}</h4>
              </div>
            ) : (
              <>
                {activeStep === 1 && (
                  <div className="p-4 rounded-lg border-2 border-primary animate-fade-in">
                    <h4 className="font-semibold text-gray-800">{t('signatureModalStep1')}</h4>
                    {photo ? (
                      <div className="mt-2 text-center">
                        <img src={photo} alt={t('signatureModalClientPhotoAlt')} className="w-32 h-32 object-cover rounded-lg mx-auto shadow-md" />
                        <button onClick={() => setPhoto(null)} className="mt-2 text-sm font-semibold text-primary hover:underline">{t('remove')}</button>
                      </div>
                    ) : showCamera ? (
                      <div className="mt-2 space-y-2">
                        <h4 className="text-md font-semibold text-gray-800 text-center">{t('signatureModalCameraTitle')}</h4>
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md bg-gray-900 aspect-video object-cover"></video>
                        <canvas ref={photoCanvasRef} className="hidden"></canvas>
                        <div className="flex justify-center gap-4">
                          <button type="button" onClick={handleCapturePhoto} className="px-4 py-2 bg-primary text-white rounded-md">{t('capture')}</button>
                          <button type="button" onClick={stopCamera} className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md">{t('cancel')}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-center">
                        <button type="button" onClick={handleStartCamera} className="px-4 py-2 border border-gray-300 rounded-md text-gray-800 font-semibold">{t('signatureModalTakePhoto')}</button>
                      </div>
                    )}
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="p-4 rounded-lg border-2 border-primary animate-fade-in">
                    <h4 className="font-semibold text-gray-800">{t('signatureModalStep2')}</h4>
                    <canvas ref={signatureCanvasRef} width="400" height="150" className="mt-2 border rounded-lg bg-white mx-auto cursor-crosshair touch-none w-full max-w-md"></canvas>
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500">{t('signatureModalSignHere')}</p>
                      <button type="button" onClick={handleClearSignature} className="text-sm font-semibold text-primary hover:underline">{t('signatureModalClear')}</button>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="p-4 rounded-lg border-2 border-primary animate-fade-in">
                    <h4 className="font-semibold text-gray-800">{t('signatureModalStep3')}</h4>
                    <div className="mt-4 border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{contractText}</p>
                    </div>
                    <div className="flex items-center justify-center mt-4">
                      <input type="checkbox" id="agreement-modal" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                      <label htmlFor="agreement-modal" className="ml-2 block text-sm text-gray-900">{t('signatureModalAgreement')}</label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center rounded-b-lg">
          <div>
            {activeStep > 1 && !isSigned && (
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-white text-gray-700 border rounded-md">
                {t('back')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md">
              {activeStep === 3 && !isSigned ? t('cancel') : t('close')}
            </button>
            {activeStep === 1 && !isSigned && (
              <button type="button" onClick={handleNext} disabled={!photo} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">
                {t('next')}
              </button>
            )}
            {activeStep === 2 && !isSigned && (
              <button type="button" onClick={handleNext} disabled={!hasSigned} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400">
                {t('next')}
              </button>
            )}
            {activeStep === 3 && (
              <button
                type="button"
                onClick={handleConfirmSignature}
                disabled={!photo || !hasSigned || !agreed || isSigned}
                className={`inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white transition-all duration-300 ease-in-out active:scale-[0.98] ${isSigned
                    ? 'bg-green-500 hover:bg-green-600 cursor-default'
                    : 'bg-primary hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed'
                  }`}
              >
                {isSigned ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('signatureModalSigned')}
                  </>
                ) : (
                  t('signatureModalConfirm')
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
