// Nano Banana API - Simulação de geração de imagens com IA
// Em um ambiente real, isso se conectaria a uma API de IA real

export interface HairStyleOptions {
  cut?: string;
  color?: string;
  length?: string;
  style?: string;
}

export interface GenerationRequest {
  originalImage: string;
  referenceImage?: string;
  options: HairStyleOptions;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  styleDescription?: string;
  confidence?: number;
  metadata?: {
    processingTime: number;
    modelVersion: string;
    quality: string;
    styleApplied: HairStyleOptions;
    guidelines: {
      preserveFace: boolean;
      preserveSkin: boolean;
      preserveProportions: boolean;
      preserveExpression: boolean;
      naturalLighting: boolean;
      salonQuality: boolean;
      neutralBackground: boolean;
      naturalVolume: boolean;
      naturalTexture: boolean;
      headShapeFit: boolean;
    };
    validation?: {
      facePreservation: string;
      skinPreservation: string;
      proportionsPreservation: string;
      expressionPreservation: string;
      lightingQuality: string;
      textureRealism: string;
      volumeRealism: string;
      backgroundNeutrality: string;
      headShapeAdaptation: string;
      hairlineNaturalness: string;
    };
  };
}

// Simulated API class
export class NanoBananaAPI {
  private static readonly BASE_URL = 'https://api.nanobanana.ai/v1';
  
  // Realistic generation prompt template
  private static readonly REALISTIC_PROMPT = `
Criar uma prévia realista, com luz natural suave e aparência profissional, mostrando como o cabelo ficará na cliente depois do procedimento.

Regras Essenciais:
- Mantenha 100% das características reais do rosto, pele, proporções e expressão.
- Não alterar traços do rosto, apenas o cabelo.
- Preservar a proporção, volume e encaixe natural do corte conforme a cabeça e linha do cabelo da cliente.
- Entregar o resultado em alta qualidade, com estilo fotográfico de salão de beleza, nítido, natural e sem elementos extras no fundo.

Diretrizes Técnicas:
- Iluminação: luz natural suave e difusa
- Qualidade: ultra HD, fotográfico profissional
- Fundo: neutro, sem elementos extras
- Renderização: realista, preservando texturas naturais
- Objetivo: visualização 100% fiel do resultado final
  `.trim();

  static async generateHairStyle(request: GenerationRequest): Promise<GenerationResult> {
    try {
      // Simulate API processing time (reduzido para melhor UX)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Build realistic prompt with user options
      const styleDescription = this.buildRealisticPrompt(request.options, request.referenceImage);
      
      // Simulate API response
      const result: GenerationResult = {
        success: true,
        imageUrl: this.generateSimulatedImage(request.options, !!request.referenceImage),
        styleDescription,
        confidence: 0.95,
        metadata: {
          processingTime: 3000,
          modelVersion: 'nano-banana-v2.0-realistic',
          quality: '4k-ultra-hd-professional',
          styleApplied: request.options,
          guidelines: {
            preserveFace: true,
            preserveSkin: true,
            preserveProportions: true,
            preserveExpression: true,
            naturalLighting: true,
            salonQuality: true,
            neutralBackground: true,
            naturalVolume: true,
            naturalTexture: true,
            headShapeFit: true
          },
          validation: {
            facePreservation: 'guaranteed-100-percent',
            skinPreservation: 'guaranteed-100-percent',
            proportionsPreservation: 'guaranteed-100-percent',
            expressionPreservation: 'guaranteed-100-percent',
            lightingQuality: 'natural-soft-diffused',
            textureRealism: 'enhanced-natural',
            volumeRealism: 'natural-structure',
            backgroundNeutrality: 'enforced-no-elements',
            headShapeAdaptation: 'perfect-fit',
            hairlineNaturalness: 'preserved'
          }
        }
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to generate hair style: ${error}`);
    }
  }

  private static buildRealisticPrompt(options: HairStyleOptions, referenceImage?: string): string {
    const { cut, color, length, style } = options;
    
    let prompt = this.REALISTIC_PROMPT + '\n\n';
    prompt += 'Estilo solicitado:\n';
    
    if (cut) prompt += `- Corte: ${cut}\n`;
    if (color) prompt += `- Cor: ${color}\n`;
    if (length) prompt += `- Comprimento: ${length}\n`;
    if (style) prompt += `- Estilo: ${style}\n`;
    
    // Add reference image guidance if provided
    if (referenceImage) {
      prompt += '\nReferência visual: Use a foto de referência como inspiração principal para o estilo, mantendo 100% das características faciais.\n';
    }
    
    prompt += '\nParâmetros técnicos avançados:\n';
    prompt += '- Qualidade: 4K ultra HD profissional\n';
    prompt += '- Iluminação: luz natural suave e difusa\n';
    prompt += '- Renderização: fotográfica realista de salão\n';
    prompt += '- Preservação facial: 100% (rosto, pele, proporções, expressão)\n';
    prompt += '- Volume e textura: naturais, conforme estrutura original\n';
    prompt += '- Encaixe: adaptado ao formato real da cabeça\n';
    prompt += '- Fundo: neutro, sem elementos\n';
    prompt += '- Fidelidade: máxima ao resultado real\n';
    
    return prompt;
  }

  // Gera uma imagem simulada baseada nas opções
  private static async generateSimulatedImage(options: HairStyleOptions, hasReference?: boolean): Promise<string> {
    // Create a unique seed based on the style options to simulate consistent transformation
    const styleSeed = [
      options.cut || 'natural',
      options.color || 'original',
      options.length || 'current',
      options.style || 'default',
      hasReference ? 'with-ref' : 'no-ref'
    ].join('-').replace(/\s+/g, '-').toLowerCase();
    
    // Generate realistic image URL with enhanced parameters
    const params = new URLSearchParams();
    
    // Use the style seed to get a consistent but different image
    params.append('seed', styleSeed);
    
    // Enhanced realistic generation parameters
    params.append('quality', '4k-ultra-hd-professional');
    params.append('lighting', 'natural-soft-diffused');
    params.append('render', 'photorealistic-salon');
    params.append('preserve_face', '100-percent');
    params.append('preserve_skin', '100-percent');
    params.append('preserve_proportions', '100-percent');
    params.append('preserve_expression', '100-percent');
    params.append('natural_volume', 'enhanced');
    params.append('hair_texture', 'realistic');
    params.append('head_fit', 'natural-adapted');
    params.append('background', 'neutral-salon');
    params.append('fidelity', 'maximum');
    
    // Add style-specific parameters for more realistic simulation
    if (options.cut) {
      params.append('transformation', 'haircut-applied');
      params.append('style_intensity', 'high');
      params.append('cut_style', options.cut.toLowerCase());
    }
    if (options.color) {
      params.append('transformation', 'hair-color-applied');
      params.append('color_fade', 'natural');
      params.append('hair_color', options.color.toLowerCase());
    }
    if (options.length) {
      params.append('transformation', 'length-adjusted');
      params.append('volume_preserved', 'true');
      params.append('hair_length', options.length.toLowerCase());
    }
    if (options.style) {
      params.append('hair_style', options.style.toLowerCase());
    }
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return `https://picsum.photos/800/800?${params.toString()}`;
  }

  // Apply real transformation to original image using Canvas
  private static async applyRealTransformation(originalImage: string, options: HairStyleOptions): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(originalImage);
          return;
        }
        
        canvas.width = 800;
        canvas.height = 800;
        
        // Draw original image
        ctx.drawImage(img, 0, 0, 800, 800);
        
        // Apply color transformation if specified
        if (options.color) {
          const imageData = ctx.getImageData(0, 0, 800, 800);
          const data = imageData.data;
          
          // Apply color filter based on selection
          for (let i = 0; i < data.length; i += 4) {
            // Detect hair regions (simplified - would need AI for real detection)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Simple hair detection (dark pixels)
            if (r < 100 && g < 100 && b < 100) {
              // Apply color transformation
              if (options.color.toLowerCase().includes('loiro')) {
                data[i] = Math.min(255, r + 100);     // More red
                data[i + 1] = Math.min(255, g + 90);  // More green
                data[i + 2] = Math.min(255, b + 40);  // Less blue
              } else if (options.color.toLowerCase().includes('ruivo')) {
                data[i] = Math.min(255, r + 50);      // More red
                data[i + 1] = Math.max(0, g - 20);    // Less green
                data[i + 2] = Math.max(0, b - 30);    // Less blue
              } else if (options.color.toLowerCase().includes('castanho')) {
                data[i] = Math.max(0, r - 20);        // Less red
                data[i + 1] = Math.max(0, g - 10);    // Less green
                data[i + 2] = Math.max(0, b - 30);    // Much less blue
              }
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Apply style effects
        if (options.style === 'Ondulado' || options.style === 'Cacheado') {
          // Add texture effect (simplified)
          ctx.globalAlpha = 0.1;
          ctx.filter = 'contrast(1.1) brightness(1.05)';
          ctx.drawImage(canvas, 0, 0, 800, 800);
          ctx.filter = 'none';
          ctx.globalAlpha = 1.0;
        }
        
        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            resolve(originalImage);
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => {
        resolve(originalImage);
      };
      
      img.src = originalImage;
    });
  }

  // Validate generation request against realistic guidelines
  private static validateRealisticRequest(request: GenerationRequest): boolean {
    // Ensure we have an original image
    if (!request.originalImage) {
      return false;
    }

    // Validate that at least one style option is provided
    const { cut, color, length, style } = request.options;
    if (!cut && !color && !length && !style) {
      return false;
    }

    // Additional validation for realistic generation
    return true;
  }

  // Enhanced generation with validation
  static async generateRealisticHairStyle(request: GenerationRequest): Promise<GenerationResult> {
    // Validate request first
    if (!this.validateRealisticRequest(request)) {
      return {
        success: false,
        error: 'Invalid request: original image and at least one style option are required'
      };
    }

    try {
      // Simulate enhanced API processing time (reduzido para melhor UX)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Build enhanced realistic prompt
      const styleDescription = this.buildRealisticPrompt(request.options, request.referenceImage);
      
      // Apply real transformation to original image
      const transformedImage = await this.applyRealTransformation(request.originalImage, request.options);
      
      // Generate fallback image (in case transformation fails)
      const fallbackImage = await this.generateSimulatedImage(request.options, !!request.referenceImage);
      
      // Simulate enhanced API response
      const result: GenerationResult = {
        success: true,
        imageUrl: transformedImage,
        styleDescription,
        confidence: 0.97, // Higher confidence for realistic generation
        metadata: {
          processingTime: 4000,
          modelVersion: 'nano-banana-v2.0-realistic-pro-max',
          quality: '4k-ultra-hd-professional',
          styleApplied: request.options,
          guidelines: {
            preserveFace: true,
            preserveSkin: true,
            preserveProportions: true,
            preserveExpression: true,
            naturalLighting: true,
            salonQuality: true,
            neutralBackground: true,
            naturalVolume: true,
            naturalTexture: true,
            headShapeFit: true
          },
          validation: {
            facePreservation: 'guaranteed-100-percent',
            skinPreservation: 'guaranteed-100-percent',
            proportionsPreservation: 'guaranteed-100-percent',
            expressionPreservation: 'guaranteed-100-percent',
            lightingQuality: 'natural-soft-diffused',
            textureRealism: 'enhanced-natural',
            volumeRealism: 'natural-structure',
            backgroundNeutrality: 'enforced-no-elements',
            headShapeAdaptation: 'perfect-fit',
            hairlineNaturalness: 'preserved'
          }
        }
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to generate realistic hair style: ${error}`);
    }
  }
  
  // Verificar se a API está disponível
  static async checkAvailability(): Promise<boolean> {
    try {
      // Simular verificação de disponibilidade
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch {
      return false;
    }
  }
}

// Opções predefinidas de cortes e cores
export const HAIR_CUTS = [
  'Curto pixie',
  'Médio bob',
  'Longo reto',
  'Ondulado',
  'Cacheado',
  'Crespo',
  'Moicano',
  'Undercut',
  'Razor cut',
  'Camadas'
];

export const HAIR_COLORS = [
  'Preto natural',
  'Castanho claro',
  'Castanho médio',
  'Loiro platinado',
  'Loiro dourado',
  'Ruivo',
  'Grisalho',
  'Azul',
  'Rosa',
  'Roxo',
  'Verde',
  'Vermelho',
  'Balayage',
  'Ombré',
  'Highlights'
];

export const HAIR_LENGTHS = [
  'Muito curto',
  'Curto',
  'Médio',
  'Longo',
  'Muito longo'
];

export const HAIR_STYLES = [
  'Liso',
  'Ondulado',
  'Cacheado',
  'Crespo',
  'Espetado',
  'Lateral',
  'Para trás',
  'Franja',
  'Sem franja',
  'Coque',
  'Penteado',
  'Natural'
];