import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { NanoBananaAPI, GenerationResult, HairStyleOptions, HAIR_CUTS, HAIR_COLORS, HAIR_LENGTHS, HAIR_STYLES } from '../lib/nanoBanana';
import BeforeAfterPreciseModal from './BeforeAfterPreciseModal';

interface HairStyleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComingSoon?: (featureName: string) => void;
}

const HairStyleTestModal: React.FC<HairStyleTestModalProps> = ({ isOpen, onClose, onComingSoon }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<HairStyleOptions>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  // Camera functions
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Não foi possível acessar a câmera. Por favor, verifique as permissões.');
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setShowCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && photoCanvasRef.current) {
      const video = videoRef.current;
      const canvas = photoCanvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setPhoto(imageData);
        handleStopCamera();
        setCurrentStep(2);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
        setCurrentStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReferencePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReferencePhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReferencePhoto = () => {
    setReferencePhoto(null);
    if (referenceFileInputRef.current) {
      referenceFileInputRef.current.value = '';
    }
  };

  // Navigation functions
  const handleClose = () => {
    handleStopCamera();
    setPhoto(null);
    setReferencePhoto(null);
    setSelectedOptions({});
    setGenerationResult(null);
    setShowBeforeAfter(false);
    setCurrentStep(1);
    onClose();
  };

  const handleReset = () => {
    setPhoto(null);
    setReferencePhoto(null);
    setSelectedOptions({});
    setGenerationResult(null);
    setShowBeforeAfter(false);
    setCurrentStep(1);
  };

  const handleGenerateVisual = async () => {
    if (!photo) return;

    if (onComingSoon) {
      onComingSoon('A IA de Análise Capilar (Nano Banana) é um recurso Premium que será ativado em breve.');
    } else {
      alert('A IA de Análise Capilar (Nano Banana) é um recurso Premium que será ativado em breve.');
    }
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-secondary">Testar Corte & Cor</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === currentStep
                  ? 'bg-primary text-white'
                  : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                  }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                <span className={`text-xs mt-1 ${step === currentStep ? 'text-primary font-semibold' : 'text-gray-600'
                  }`}>
                  {step === 1 && 'Foto'}
                  {step === 2 && 'Estilo'}
                  {step === 3 && 'Gerar'}
                  {step === 4 && 'Resultado'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Take Photo */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Tire sua foto</h3>
              <p className="text-gray-600">Capture uma foto clara do seu rosto para melhor visualização</p>

              {!showCamera ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">📷</div>
                    <p className="text-gray-600 mb-4">Escolha como adicionar sua foto:</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleStartCamera}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        📷 Usar Câmera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors"
                      >
                        📁 Enviar Arquivo
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleClose}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <canvas ref={photoCanvasRef} className="hidden" />
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleCapturePhoto}
                      className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      📸 Capturar Foto
                    </button>
                    <button
                      onClick={handleStopCamera}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose Style */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Escolha o novo visual</h3>
              <p className="text-gray-600">Selecione as opções desejadas para seu novo estilo</p>

              {/* Reference Photo Section */}
              <div className="border-2 border-dashed border-purple-300 bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">📸 Foto de Referência (Opcional)</h4>
                <p className="text-xs text-purple-600 mb-3">Use uma foto como inspiração para o estilo</p>

                {!referencePhoto ? (
                  <button
                    onClick={() => referenceFileInputRef.current?.click()}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    📷 Enviar foto de referência
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={referencePhoto}
                        alt="Referência"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={handleRemoveReferencePhoto}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-green-600 font-medium">✓ Foto de referência adicionada</p>
                  </div>
                )}
                <input
                  ref={referenceFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReferencePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Style Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Corte</label>
                  <select
                    value={selectedOptions.cut || ''}
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, cut: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {HAIR_CUTS.map(cut => (
                      <option key={cut} value={cut}>{cut}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                  <select
                    value={selectedOptions.color || ''}
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, color: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {HAIR_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comprimento</label>
                  <select
                    value={selectedOptions.length || ''}
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, length: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {HAIR_LENGTHS.map(length => (
                      <option key={length} value={length}>{length}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                  <select
                    value={selectedOptions.style || ''}
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, style: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {HAIR_STYLES.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Preview */}
              {photo && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sua foto:</h4>
                  <img src={photo} alt="Sua foto" className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleGenerateVisual}
                  disabled={!selectedOptions.cut && !selectedOptions.color && !selectedOptions.length && !selectedOptions.style || isGenerating}
                  className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Visual'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800">Gerando seu visual...</h3>
              <p className="text-gray-600">A IA Nano Banana está criando sua nova aparência</p>

              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              </div>

              <p className="text-sm text-gray-500">Isso pode levar alguns segundos...</p>

              <button
                onClick={() => setCurrentStep(2)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === 4 && generationResult && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Visual gerado!</h3>
              <p className="text-gray-600">Veja como ficaria seu novo estilo</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Antes</h4>
                  <img src={photo || ''} alt="Antes" className="w-full h-64 object-cover rounded-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Depois</h4>
                  <img src={generationResult.imageUrl || ''} alt="Depois" className="w-full h-64 object-cover rounded-lg" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-700">
                  ✅ Visual gerado com sucesso! Agora você pode ver como ficaria com o novo estilo.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBeforeAfter(true)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  📊 Ver Antes e Depois Preciso
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Before After Precise Modal */}
      {showBeforeAfter && generationResult && photo && (
        <BeforeAfterPreciseModal
          isOpen={showBeforeAfter}
          onClose={() => setShowBeforeAfter(false)}
          originalImage={photo}
          resultImage={generationResult.imageUrl || ''}
          generationResult={generationResult}
          styleOptions={selectedOptions}
        />
      )}
    </div>
  );
};

export default HairStyleTestModal;
