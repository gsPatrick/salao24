/**
 * YouTube Data API v3 Service
 * Gerencia comentários, vídeos e estatísticas do canal
 */

export interface YouTubeComment {
  id: string;
  videoId: string;
  videoTitle: string;
  author: string;
  text: string;
  publishedAt: Date;
  updatedAt: Date;
  likeCount: number;
  replyCount: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  status: 'pending' | 'approved' | 'replied' | 'rejected';
  processed: boolean;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
}

export interface ReplyRule {
  id: string;
  keywords: string[];
  reply: string;
  active: boolean;
  sentiment: 'positive' | 'negative' | 'neutral' | 'all';
  delayMin: number;
  delayMax: number;
  priority: number;
}

export interface YouTubeChannelStats {
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  totalComments: number;
  engagementRate: number;
  topVideos: YouTubeVideo[];
}

export interface QueuedComment {
  id: string;
  comment: YouTubeComment;
  ruleId?: string;
  replyText?: string;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  error?: string;
}

class YouTubeService {
  private apiKey: string = '';
  private channelId: string = '';
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  /**
   * Configura as credenciais da API
   */
  configure(apiKey: string, channelId: string) {
    this.apiKey = apiKey;
    this.channelId = channelId;
  }

  /**
   * Busca informações básicas do canal
   */
  async getChannelInfo(): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet,contentDetails,statistics&id=${this.channelId}&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('Erro ao buscar informações do canal:', error);
      return null;
    }
  }

  /**
   * Busca vídeos recentes do canal
   */
  async getChannelVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      // Primeiro busca o upload playlist ID
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=contentDetails&id=${this.channelId}&key=${this.apiKey}`
      );
      
      const channelData = await channelResponse.json();
      const uploadPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadPlaylistId) {
        throw new Error('Playlist de uploads não encontrada');
      }

      // Busca vídeos da playlist
      const videosResponse = await fetch(
        `${this.baseUrl}/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      );
      
      const videosData = await videosResponse.json();
      
      // Busca estatísticas detalhadas dos vídeos
      const videoIds = videosData.items?.map((item: any) => item.snippet.resourceId.videoId).join(',');
      const statsResponse = await fetch(
        `${this.baseUrl}/videos?part=statistics&id=${videoIds}&key=${this.apiKey}`
      );
      
      const statsData = await statsResponse.json();
      
      // Combina os dados
      return videosData.items?.map((item: any, index: number) => {
        const stats = statsData.items?.find((s: any) => s.id === item.snippet.resourceId.videoId);
        return {
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: new Date(item.snippet.publishedAt),
          viewCount: parseInt(stats?.statistics?.viewCount || '0'),
          likeCount: parseInt(stats?.statistics?.likeCount || '0'),
          commentCount: parseInt(stats?.statistics?.commentCount || '0'),
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
        };
      }) || [];
    } catch (error) {
      console.error('Erro ao buscar vídeos do canal:', error);
      return [];
    }
  }

  /**
   * Busca comentários de um vídeo específico
   */
  async getVideoComments(videoId: string, maxResults: number = 20): Promise<YouTubeComment[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.items?.map((item: any) => {
        const comment = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          videoId: videoId,
          videoTitle: item.snippet.videoTitle,
          author: comment.authorDisplayName,
          text: comment.textDisplay,
          publishedAt: new Date(comment.publishedAt),
          updatedAt: new Date(comment.updatedAt),
          likeCount: comment.likeCount,
          replyCount: item.snippet.totalReplyCount,
          sentiment: this.analyzeSentiment(comment.textDisplay),
          status: 'pending',
          processed: false
        };
      }) || [];
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }
  }

  /**
   * Responde a um comentário
   */
  async replyToComment(parentId: string, text: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/comments?part=snippet&key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            parentId: parentId,
            textOriginal: text
          }
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erro ao responder comentário:', error);
      return false;
    }
  }

  /**
   * Análise simples de sentimento (baseada em palavras-chave)
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['ótimo', 'excelente', 'perfeito', 'amazing', 'gostei', 'bom', 'show', 'parabéns', 'legal', 'incrível'];
    const negativeWords = ['ruim', 'péssimo', 'horrível', 'terrível', 'odei', 'não gostei', 'chato', 'fraco', 'desapontou'];
    
    const lowerText = text.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Busca estatísticas completas do canal
   */
  async getChannelStats(): Promise<YouTubeChannelStats> {
    try {
      const channelInfo = await this.getChannelInfo();
      const videos = await this.getChannelVideos(50); // Últimos 50 vídeos
      
      if (!channelInfo) {
        throw new Error('Canal não encontrado');
      }
      
      const stats = channelInfo.statistics;
      const totalViews = parseInt(stats.viewCount || '0');
      const subscriberCount = parseInt(stats.subscriberCount || '0');
      const videoCount = parseInt(stats.videoCount || '0');
      
      // Calcula comentários totais e taxa de engajamento
      const totalComments = videos.reduce((sum, video) => sum + video.commentCount, 0);
      const totalLikes = videos.reduce((sum, video) => sum + video.likeCount, 0);
      const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
      
      // Top vídeos por visualizações
      const topVideos = videos
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5);
      
      return {
        subscriberCount,
        videoCount,
        totalViews,
        totalComments,
        engagementRate,
        topVideos
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do canal:', error);
      return {
        subscriberCount: 0,
        videoCount: 0,
        totalViews: 0,
        totalComments: 0,
        engagementRate: 0,
        topVideos: []
      };
    }
  }

  /**
   * Validação da API Key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/channels?part=id&id=${this.channelId}&key=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const youtubeService = new YouTubeService();
