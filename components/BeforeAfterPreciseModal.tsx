import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GenerationResult } from '../lib/nanoBanana';

interface BeforeAfterPreciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string;
  resultImage: string;
  generationResult: GenerationResult;
  styleOptions: any;
}

const BeforeAfterPreciseModal: React.FC<BeforeAfterPreciseModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  resultImage,
  generationResult,
  styleOptions
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider' | 'difference'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSliderChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleDownloadImage = () => {
    if (!generationResult?.imageUrl) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Build the content for PDF
    const careInstructions = `
      <h3>🌿 Cuidados com o Novo Visual</h3>
      
      <h4>🏠 Cuidados Diários:</h4>
      <ul>
        <li>• Use shampoo sem sulfatos para preservar a cor</li>
        <li>• Aplique leave-in para proteger e hidratar</li>
        <li>• Evite água muito quente nos lavagens</li>
        <li>• Penteie com cuidado para não quebrar os fios</li>
      </ul>
      
      <h4>⏰ Manutenção Semanal:</h4>
      <ul>
        <li>• Máscara de hidratação profunda 1x por semana</li>
        <li>• Retoque da cor a cada 4-6 semanas</li>
        <li>• Corte de manutenção a cada 2 meses</li>
        <li>• Proteção térmica antes de usar ferramentas quentes</li>
      </ul>
      
      <p><strong>💡 Dica Profissional:</strong> Agende consultas regulares com seu cabeleireiro para manter seu visual sempre perfeito!</p>
    `;
    
    const styleDetails = [];
    if (styleOptions.cut) styleDetails.push(`<p><strong>✂️ Corte:</strong> ${styleOptions.cut}</p>`);
    if (styleOptions.color) styleDetails.push(`<p><strong>🎨 Cor:</strong> ${styleOptions.color}</p>`);
    if (styleOptions.length) styleDetails.push(`<p><strong>📏 Comprimento:</strong> ${styleOptions.length}</p>`);
    if (styleOptions.style) styleDetails.push(`<p><strong>💇 Estilo:</strong> ${styleOptions.style}</p>`);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Novo Visual - Salão 24</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #8B5CF6; text-align: center; }
          h3 { color: #10B981; border-bottom: 2px solid #10B981; padding-bottom: 5px; }
          h4 { color: #3B82F6; margin-top: 20px; }
          ul { margin: 10px 0; }
          li { margin: 5px 0; }
          .image-container { text-align: center; margin: 20px 0; }
          .image-container img { max-width: 400px; height: auto; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .style-details { background: #F3E8FF; padding: 15px; border-radius: 10px; margin: 20px 0; }
          .care-section { background: #ECFDF5; padding: 15px; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <h1>✨ Seu Novo Visual</h1>
        
        <div class="image-container">
          <img src="${generationResult.imageUrl}" alt="Novo Visual Gerado" />
        </div>
        
        <div class="style-details">
          <h3>🎨 Detalhes do Estilo</h3>
          ${styleDetails.join('')}
        </div>
        
        <div class="care-section">
          ${careInstructions}
        </div>
        
        <div class="footer">
          <p>Gerado por IA Nano Banana - Salão 24</p>
          <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const renderSideBySide = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-800">ANTES</h4>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Original</span>
        </div>
        <div className="relative group">
          <img 
            src={originalImage} 
            alt="Antes" 
            className="w-full h-96 object-cover rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-4">
            <p className="text-white text-sm">Foto original da cliente</p>
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Estado Original:</strong> Cabelo natural sem alterações
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-800">DEPOIS</h4>
          <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">AI Gerado</span>
        </div>
        <div className="relative group">
          <img 
            src={resultImage} 
            alt="Depois" 
            className="w-full h-96 object-cover rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-4">
            <p className="text-white text-sm">Visual gerado pela IA Nano Banana</p>
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>Resultado:</strong> {generationResult.styleDescription}
          </p>
        </div>
      </div>
    </div>
  );

  const renderSlider = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Comparação Interativa</h4>
        <p className="text-sm text-gray-600">Arraste o slider para revelar o antes e depois</p>
      </div>
      
      <div 
        ref={sliderRef}
        className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden cursor-ew-resize"
        onMouseMove={handleSliderChange}
      >
        {/* Imagem DEPOIS (fundo) */}
        <img 
          src={resultImage} 
          alt="Depois" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Imagem ANTES (sobreposição) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={originalImage} 
            alt="Antes" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        
        {/* Linha do slider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 5a1 1 0 100 2h4a1 1 0 100-2H8zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ANTES
        </div>
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          DEPOIS
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Posição: {Math.round(sliderPosition)}%
      </div>
    </div>
  );

  const renderDifference = () => (
    <div className="space-y-6">
      {/* Style Details */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-purple-800 mb-4">✨ Detalhes do Novo Visual</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {styleOptions.cut && (
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">✂️ Corte Aplicado</h4>
              <p className="text-purple-700 font-medium">{styleOptions.cut}</p>
            </div>
          )}
          
          {styleOptions.color && (
            <div className="bg-white p-4 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-pink-800 mb-2">🎨 Cor Aplicada</h4>
              <p className="text-pink-700 font-medium">{styleOptions.color}</p>
            </div>
          )}
          
          {styleOptions.length && (
            <div className="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-2">📏 Comprimento</h4>
              <p className="text-indigo-700 font-medium">{styleOptions.length}</p>
            </div>
          )}
          
          {styleOptions.style && (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">💇 Estilo Final</h4>
              <p className="text-blue-700 font-medium">{styleOptions.style}</p>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-purple-700">
            Seu novo visual foi gerado com sucesso, mantendo 100% das suas características faciais!
          </p>
        </div>
      </div>

      {/* How to Achieve This Look */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">🔧 Como Chegar Neste Resultado</h3>
        
        <div className="space-y-3 text-blue-700">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">1️⃣</span>
            <div>
              <p className="font-medium">Preparação dos Fios</p>
              <p className="text-sm">Lave com shampoo suave e aplique condicionador nas pontas para preparar o cabelo</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">2️⃣</span>
            <div>
              <p className="font-medium">Corte Profissional</p>
              <p className="text-sm">Leve esta imagem a um profissional especializado no estilo desejado</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">3️⃣</span>
            <div>
              <p className="font-medium">Coloração</p>
              <p className="text-sm">Aplique a cor com produtos de qualidade seguindo as instruções do fabricante</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">4️⃣</span>
            <div>
              <p className="font-medium">Finalização</p>
              <p className="text-sm">Use produtos de styling para manter o formato e o brilho desejados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Care Instructions */}
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-green-800 mb-4">🌿 Cuidados com o Novo Visual</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-green-700">🏠 Cuidados Diários</h4>
            <ul className="space-y-2 text-sm text-green-600">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Use shampoo sem sulfatos para preservar a cor</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Aplique leave-in para proteger e hidratar</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Evite água muito quente nos lavagens</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Penteie com cuidado para não quebrar os fios</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-green-700">⏰ Manutenção Semanal</h4>
            <ul className="space-y-2 text-sm text-green-600">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Máscara de hidratação profunda 1x por semana</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Retoque da cor a cada 4-6 semanas</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Corte de manutenção a cada 2 meses</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Proteção térmica antes de usar ferramentas quentes</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800 text-center font-medium">
            💡 Dica Profissional: Agende consultas regulares com seu cabeleireiro para manter seu visual sempre perfeito!
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Antes e Depois Preciso</h2>
              <p className="text-blue-100">Análise detalhada com IA Nano Banana</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="border-b p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'side-by-side' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Lado a Lado
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'slider' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎚️ Slider Interativo
            </button>
            <button
              onClick={() => setViewMode('difference')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'difference' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔍 Análise
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {viewMode === 'side-by-side' && renderSideBySide()}
          {viewMode === 'slider' && renderSlider()}
          {viewMode === 'difference' && renderDifference()}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar PDF com Cuidados
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterPreciseModal;
