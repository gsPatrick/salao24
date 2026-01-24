/**
 * Painel de Moderação de Comentários do YouTube
 * Permite aprovar/reprovar comentários e gerenciar respostas automáticas
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { YouTubeComment, ReplyRule, QueuedComment } from '../lib/youtubeService';
import { commentAutomationService } from '../lib/commentAutomationService';

interface YouTubeCommentModerationProps {
  channelId: string;
  apiKey: string;
  isEnabled: boolean;
}

const YouTubeCommentModeration: React.FC<YouTubeCommentModerationProps> = ({
  channelId,
  apiKey,
  isEnabled
}) => {
  const { t } = useLanguage();
  
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [replyRules, setReplyRules] = useState<ReplyRule[]>([]);
  const [queueStatus, setQueueStatus] = useState<any>({});
  const [selectedComment, setSelectedComment] = useState<YouTubeComment | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ReplyRule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'rules' | 'queue'>('comments');

  // Form state for new rule
  const [ruleForm, setRuleForm] = useState({
    keywords: '',
    reply: '',
    sentiment: 'all' as const,
    delayMin: 5,
    delayMax: 15,
    priority: 1,
    active: true
  });

  // Carrega comentários e regras
  useEffect(() => {
    if (isEnabled && channelId && apiKey) {
      loadComments();
      loadRules();
      loadQueueStatus();
      
      // Atualiza status da fila a cada 30 segundos
      const interval = setInterval(loadQueueStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, channelId, apiKey]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      // Simulação - na implementação real, buscaria da API
      const mockComments: YouTubeComment[] = [
        {
          id: '1',
          videoId: 'abc123',
          videoTitle: 'Tutorial de Cabelo Moderno',
          author: 'Maria Silva',
          text: 'Ótimo vídeo! Me ajudou muito. Qual o produto que você usou?',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          likeCount: 15,
          replyCount: 0,
          sentiment: 'positive',
          status: 'pending',
          processed: false
        },
        {
          id: '2',
          videoId: 'abc123',
          videoTitle: 'Tutorial de Cabelo Moderno',
          author: 'João Santos',
          text: 'Não gostei muito do resultado, ficou estranho',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          likeCount: 2,
          replyCount: 1,
          sentiment: 'negative',
          status: 'pending',
          processed: false
        }
      ];
      setComments(mockComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRules = () => {
    const rules = commentAutomationService.getReplyRules();
    setReplyRules(rules);
  };

  const loadQueueStatus = () => {
    const status = commentAutomationService.getQueueStatus();
    setQueueStatus(status);
  };

  const handleApproveComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, status: 'approved' as const } : c
    ));
  };

  const handleRejectComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, status: 'rejected' as const } : c
    ));
  };

  const handleReplyToComment = async (commentId: string, replyText: string) => {
    // Simulação - na implementação real, usaria a API
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, status: 'replied' as const } : c
    ));
  };

  const handleSaveRule = () => {
    if (!ruleForm.keywords || !ruleForm.reply) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const keywords = ruleForm.keywords.split(',').map(k => k.trim()).filter(k => k);
    
    if (editingRule) {
      commentAutomationService.updateReplyRule(editingRule.id, {
        keywords,
        reply: ruleForm.reply,
        sentiment: ruleForm.sentiment,
        delayMin: ruleForm.delayMin,
        delayMax: ruleForm.delayMax,
        priority: ruleForm.priority,
        active: ruleForm.active
      });
    } else {
      commentAutomationService.addReplyRule({
        keywords,
        reply: ruleForm.reply,
        sentiment: ruleForm.sentiment,
        delayMin: ruleForm.delayMin,
        delayMax: ruleForm.delayMax,
        priority: ruleForm.priority,
        active: ruleForm.active
      });
    }

    loadRules();
    setShowRuleModal(false);
    setEditingRule(null);
    resetRuleForm();
  };

  const handleEditRule = (rule: ReplyRule) => {
    setEditingRule(rule);
    setRuleForm({
      keywords: rule.keywords.join(', '),
      reply: rule.reply,
      sentiment: rule.sentiment,
      delayMin: rule.delayMin,
      delayMax: rule.delayMax,
      priority: rule.priority,
      active: rule.active
    });
    setShowRuleModal(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      commentAutomationService.removeReplyRule(ruleId);
      loadRules();
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      keywords: '',
      reply: '',
      sentiment: 'all',
      delayMin: 5,
      delayMax: 15,
      priority: 1,
      active: true
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'replied': return 'text-green-600 bg-green-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Moderação de Comentários</h2>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'comments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Comentários ({comments.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rules'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Regras ({replyRules.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'queue'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Fila ({queueStatus.pending || 0})
        </button>
      </div>

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando comentários...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum comentário encontrado</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-800">{comment.author}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(comment.sentiment)}`}>
                        {comment.sentiment === 'positive' ? 'Positivo' : comment.sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(comment.status)}`}>
                        {comment.status === 'pending' ? 'Pendente' : 
                         comment.status === 'approved' ? 'Aprovado' :
                         comment.status === 'rejected' ? 'Rejeitado' : 'Respondido'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{comment.text}</p>
                    <p className="text-sm text-gray-500">
                      Vídeo: {comment.videoTitle} • {comment.likeCount} curtidas • 
                      {new Date(comment.publishedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                {comment.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveComment(comment.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleRejectComment(comment.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Rejeitar
                    </button>
                    <button
                      onClick={() => setSelectedComment(comment)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Responder
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Regras de Resposta Automática</h3>
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Nova Regra
            </button>
          </div>
          
          {replyRules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhuma regra configurada</p>
            </div>
          ) : (
            replyRules.map(rule => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">Prioridade: {rule.priority}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Palavras-chave:</strong> {rule.keywords.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Resposta:</strong> {rule.reply}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Delay:</strong> {rule.delayMin}-{rule.delayMax} min • 
                      <strong> Sentimento:</strong> {rule.sentiment}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Status da Fila de Processamento</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.total || 0}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStatus.pending || 0}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{queueStatus.processing || 0}</div>
              <div className="text-sm text-gray-600">Processando</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{queueStatus.sent || 0}</div>
              <div className="text-sm text-gray-600">Enviados</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{queueStatus.failed || 0}</div>
              <div className="text-sm text-gray-600">Falhas</div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              O sistema processa automaticamente os comentários pendentes a cada 30 segundos. 
              Comentários são agendados com base nas regras configuradas e enviados dentro dos horários permitidos.
            </p>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule ? 'Editar Regra' : 'Nova Regra'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={ruleForm.keywords}
                  onChange={(e) => setRuleForm({...ruleForm, keywords: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="preço, valor, quanto custa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resposta automática
                </label>
                <textarea
                  value={ruleForm.reply}
                  onChange={(e) => setRuleForm({...ruleForm, reply: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Olá! Te enviamos uma DM com nossa tabela de preços. 😊"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay (minutos)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={ruleForm.delayMin}
                      onChange={(e) => setRuleForm({...ruleForm, delayMin: parseInt(e.target.value) || 0})}
                      className="w-20 p-2 border border-gray-300 rounded"
                      placeholder="Min"
                    />
                    <span className="self-center">-</span>
                    <input
                      type="number"
                      value={ruleForm.delayMax}
                      onChange={(e) => setRuleForm({...ruleForm, delayMax: parseInt(e.target.value) || 0})}
                      className="w-20 p-2 border border-gray-300 rounded"
                      placeholder="Max"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sentimento
                  </label>
                  <select
                    value={ruleForm.sentiment}
                    onChange={(e) => setRuleForm({...ruleForm, sentiment: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="all">Todos</option>
                    <option value="positive">Positivo</option>
                    <option value="negative">Negativo</option>
                    <option value="neutral">Neutro</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <input
                    type="number"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({...ruleForm, priority: parseInt(e.target.value) || 1})}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={ruleForm.active}
                    onChange={(e) => setRuleForm({...ruleForm, active: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Regra ativa
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setEditingRule(null);
                  resetRuleForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Responder Comentário</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{selectedComment.author}</strong> em {selectedComment.videoTitle}
              </p>
              <p className="text-gray-700 italic">"{selectedComment.text}"</p>
            </div>
            
            <textarea
              className="w-full p-2 border border-gray-300 rounded"
              rows={4}
              placeholder="Digite sua resposta..."
              autoFocus
            />
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setSelectedComment(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Simulação - na implementação real, enviaria a resposta
                  handleReplyToComment(selectedComment.id, 'Resposta simulada');
                  setSelectedComment(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enviar Resposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeCommentModeration;
