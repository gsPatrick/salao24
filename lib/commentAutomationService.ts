/**
 * Serviço de Automação de Comentários do YouTube
 * Gerencia regras, processamento e respostas automáticas
 */

import { YouTubeComment, ReplyRule, youtubeService, QueuedComment } from './youtubeService';


export interface AutomationSettings {
  enabled: boolean;
  maxRepliesPerHour: number;
  maxRepliesPerDay: number;
  minDelayBetweenReplies: number; // minutos
  requireApproval: boolean;
  allowedHours: { start: number; end: number }; // 24h format
  blacklistKeywords: string[];
  minCommentAge: number; // minutos antes de responder
}

class CommentAutomationService {
  private replyRules: ReplyRule[] = [];
  private commentQueue: QueuedComment[] = [];
  private settings: AutomationSettings = {
    enabled: true,
    maxRepliesPerHour: 10,
    maxRepliesPerDay: 100,
    minDelayBetweenReplies: 5,
    requireApproval: false,
    allowedHours: { start: 8, end: 22 }, // 8h às 22h
    blacklistKeywords: ['spam', 'promoção', 'advertisement'],
    minCommentAge: 2
  };

  private processingInterval: NodeJS.Timeout | null = null;
  private hourlyReplyCount = 0;
  private dailyReplyCount = 0;
  private lastReplyTime = new Date();

  /**
   * Inicia o serviço de automação
   */
  start() {
    if (this.processingInterval) {
      this.stop();
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
      this.resetCounters();
    }, 30000); // Verifica a cada 30 segundos

    console.log('✅ Serviço de automação de comentários iniciado');
  }

  /**
   * Para o serviço de automação
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Serviço de automação de comentários parado');
    }
  }

  /**
   * Adiciona uma nova regra de resposta
   */
  addReplyRule(rule: Omit<ReplyRule, 'id'>): ReplyRule {
    const newRule: ReplyRule = {
      ...rule,
      id: this.generateId(),
      priority: rule.priority || 1
    };

    this.replyRules.push(newRule);
    this.sortRulesByPriority();
    return newRule;
  }

  /**
   * Remove uma regra de resposta
   */
  removeReplyRule(ruleId: string): boolean {
    const index = this.replyRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.replyRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Atualiza uma regra de resposta
   */
  updateReplyRule(ruleId: string, updates: Partial<ReplyRule>): ReplyRule | null {
    const rule = this.replyRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.sortRulesByPriority();
      return rule;
    }
    return null;
  }

  /**
   * Retorna todas as regras de resposta
   */
  getReplyRules(): ReplyRule[] {
    return [...this.replyRules];
  }

  /**
   * Configura as definições de automação
   */
  updateSettings(newSettings: Partial<AutomationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Retorna as configurações atuais
   */
  getSettings(): AutomationSettings {
    return { ...this.settings };
  }

  /**
   * Processa novos comentários e adiciona à fila
   */
  async processNewComments(comments: YouTubeComment[]): Promise<void> {
    if (!this.settings.enabled) return;

    for (const comment of comments) {
      // Verifica se já foi processado
      if (comment.processed || this.isInQueue(comment.id)) {
        continue;
      }

      // Verifica blacklist
      if (this.containsBlacklistedWords(comment.text)) {
        comment.status = 'rejected';
        comment.processed = true;
        continue;
      }

      // Verifica idade mínima do comentário
      const commentAge = (Date.now() - comment.publishedAt.getTime()) / (1000 * 60);
      if (commentAge < this.settings.minCommentAge) {
        continue; // Comentário muito recente, aguardar
      }

      // Encontra regra aplicável
      const matchingRule = this.findMatchingRule(comment);
      
      if (matchingRule) {
        const delay = this.calculateDelay(matchingRule);
        const scheduledTime = new Date(Date.now() + delay * 60 * 1000);

        const queuedComment: QueuedComment = {
          id: this.generateId(),
          comment: { ...comment, processed: true },
          ruleId: matchingRule.id,
          replyText: this.generateReply(comment, matchingRule),
          scheduledAt: scheduledTime,
          status: 'pending',
          attempts: 0
        };

        this.commentQueue.push(queuedComment);
        console.log(`📝 Comentário agendado: ${comment.author} - ${comment.text.substring(0, 50)}...`);
      }
    }

    this.sortQueueByScheduledTime();
  }

  /**
   * Processa a fila de comentários agendados
   */
  private async processQueue(): Promise<void> {
    const now = new Date();
    
    // Verifica se está dentro do horário permitido
    if (!this.isWithinAllowedHours(now)) {
      return;
    }

    // Verifica limites diários/horários
    if (this.hourlyReplyCount >= this.settings.maxRepliesPerHour || 
        this.dailyReplyCount >= this.settings.maxRepliesPerDay) {
      return;
    }

    // Verifica tempo mínimo desde última resposta
    const timeSinceLastReply = (now.getTime() - this.lastReplyTime.getTime()) / (1000 * 60);
    if (timeSinceLastReply < this.settings.minDelayBetweenReplies) {
      return;
    }

    // Processa comentários prontos
    const readyComments = this.commentQueue.filter(
      qc => qc.status === 'pending' && qc.scheduledAt <= now
    );

    for (const queuedComment of readyComments) {
      if (this.settings.requireApproval) {
        queuedComment.status = 'processing';
        // Aqui poderia adicionar lógica para aprovação manual
        continue;
      }

      await this.sendReply(queuedComment);
    }
  }

  /**
   * Envia uma resposta ao comentário
   */
  private async sendReply(queuedComment: QueuedComment): Promise<void> {
    queuedComment.status = 'processing';
    queuedComment.attempts++;

    try {
      const success = await youtubeService.replyToComment(
        queuedComment.comment.id,
        queuedComment.replyText || ''
      );

      if (success) {
        queuedComment.status = 'sent';
        queuedComment.comment.status = 'replied';
        this.hourlyReplyCount++;
        this.dailyReplyCount++;
        this.lastReplyTime = new Date();
        
        console.log(`✅ Resposta enviada: ${queuedComment.comment.author}`);
      } else {
        throw new Error('Falha ao enviar resposta');
      }
    } catch (error) {
      queuedComment.status = 'failed';
      queuedComment.error = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Tenta novamente se não excedeu o limite de tentativas
      if (queuedComment.attempts < 3) {
        queuedComment.status = 'pending';
        queuedComment.scheduledAt = new Date(Date.now() + 10 * 60 * 1000); // Tenta em 10 minutos
      }
      
      console.error(`❌ Falha ao responder: ${queuedComment.comment.author}`, error);
    }
  }

  /**
   * Encontra a regra correspondente para um comentário
   */
  private findMatchingRule(comment: YouTubeComment): ReplyRule | null {
    const commentText = comment.text.toLowerCase();
    
    return this.replyRules.find(rule => {
      if (!rule.active) return false;
      
      // Verifica sentimento se especificado
      if (rule.sentiment !== 'all' && rule.sentiment !== comment.sentiment) {
        return false;
      }
      
      // Verifica palavras-chave
      return rule.keywords.some(keyword => commentText.includes(keyword.toLowerCase()));
    }) || null;
  }

  /**
   * Gera uma resposta personalizada
   */
  private generateReply(comment: YouTubeComment, rule: ReplyRule): string {
    let reply = rule.reply;
    
    // Substitui variáveis
    reply = reply.replace('{author}', comment.author);
    reply = reply.replace('{video}', comment.videoTitle);
    
    // Adiciona assinatura se não tiver
    if (!reply.includes('Equipe') && !reply.includes('Team')) {
      reply += '\n\n- Equipe do Canal';
    }
    
    return reply;
  }

  /**
   * Calcula o delay baseado na regra
   */
  private calculateDelay(rule: ReplyRule): number {
    if (rule.delayMin === rule.delayMax) {
      return rule.delayMin;
    }
    
    const range = rule.delayMax - rule.delayMin;
    const randomDelay = Math.random() * range;
    return rule.delayMin + randomDelay;
  }

  /**
   * Verifica se contém palavras da blacklist
   */
  private containsBlacklistedWords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.settings.blacklistKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Verifica se está dentro do horário permitido
   */
  private isWithinAllowedHours(date: Date): boolean {
    const hour = date.getHours();
    return hour >= this.settings.allowedHours.start && hour <= this.settings.allowedHours.end;
  }

  /**
   * Verifica se comentário já está na fila
   */
  private isInQueue(commentId: string): boolean {
    return this.commentQueue.some(qc => qc.comment.id === commentId);
  }

  /**
   * Ordena regras por prioridade
   */
  private sortRulesByPriority(): void {
    this.replyRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Ordena fila por tempo agendado
   */
  private sortQueueByScheduledTime(): void {
    this.commentQueue.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  /**
   * Reseta contadores diários/horários
   */
  private resetCounters(): void {
    const now = new Date();
    
    // Reseta contador horário
    if (now.getHours() !== this.lastReplyTime.getHours()) {
      this.hourlyReplyCount = 0;
    }
    
    // Reseta contador diário
    if (now.getDate() !== this.lastReplyTime.getDate()) {
      this.dailyReplyCount = 0;
    }
  }

  /**
   * Retorna status da fila
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  } {
    return {
      total: this.commentQueue.length,
      pending: this.commentQueue.filter(qc => qc.status === 'pending').length,
      processing: this.commentQueue.filter(qc => qc.status === 'processing').length,
      sent: this.commentQueue.filter(qc => qc.status === 'sent').length,
      failed: this.commentQueue.filter(qc => qc.status === 'failed').length
    };
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Limpa itens antigos da fila
   */
  cleanupQueue(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.commentQueue = this.commentQueue.filter(qc => 
      qc.status === 'pending' || qc.status === 'processing' || qc.scheduledAt > oneDayAgo
    );
  }
}

export const commentAutomationService = new CommentAutomationService();
