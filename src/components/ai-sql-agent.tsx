"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Bot,
  User,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Save,
  ArrowLeft,
  MessageSquare,
  Clock,
  Trash2 as TrashIcon,
  MoreHorizontal,
  ChevronDown,
  Mic,
  Volume2,
  Eye as EyeIcon,
  Code,
  Copy,
  Download,
  Share2,
  Sparkles,
  Database,
  Cpu,
  Brain,
  Zap,
  Shield,
  Globe,
  Rocket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/modal";
import ApiKeyModal from "@/components/api-key-modal";

interface ApiSetting {
  id: number;
  name: string;
  api_name: string;
  api_key: string;
  api_endpoint: string;
  api_model: string;
  model: string;
  is_active: boolean;
  is_default: boolean;
  rate_limit_requests_per_minute: number;
  timeout_seconds: number;
  retry_attempts: number;
  created_at: string;
  updated_at: string;
}

interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  executionResult?: any;
  executionTime?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  isFavorite: boolean;
}

export default function AiSqlAgent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Partial<ApiSetting>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isPromptEngineering, setIsPromptEngineering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    loadSettings();
    // loadTheme();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Charger la première clé active comme modèle par défaut au démarrage
    const firstActiveKey = settings.find(s => s.is_active);
    if (firstActiveKey && !selectedModel) {
      setSelectedModel(firstActiveKey.model);
    }
  }, [settings, selectedModel]);

  // Internal theme management disabled to avoid conflict with global app theme

  // Internal theme application disabled

  const loadConversations = () => {
    try {
      const saved = localStorage.getItem('ai_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert string dates back to Date objects
        const convertedConversations = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(convertedConversations);
        if (convertedConversations.length > 0) {
          setCurrentConversation(convertedConversations[0]);
          setMessages(convertedConversations[0].messages);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  };

  const saveConversations = (newConversations: Conversation[]) => {
    localStorage.setItem('ai_conversations', JSON.stringify(newConversations));
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `Nouvelle conversation - ${new Date().toLocaleString('fr-FR')}`,
      messages: [],
      createdAt: new Date(),
      isFavorite: false
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    setCurrentConversation(newConversation);
    setMessages([]);
  };

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
  };

  const deleteConversation = (conversationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return;

    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    if (currentConversation?.id === conversationId) {
      if (updatedConversations.length > 0) {
        setCurrentConversation(updatedConversations[0]);
        setMessages(updatedConversations[0].messages);
      } else {
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  };

  const toggleFavorite = (conversationId: string) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, isFavorite: !c.isFavorite } : c
    );
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    if (currentConversation?.id === conversationId) {
      setCurrentConversation({ ...currentConversation, isFavorite: !currentConversation.isFavorite });
    }
  };

  const updateConversationTitle = (conversationId: string, newTitle: string) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, title: newTitle } : c
    );
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    if (currentConversation?.id === conversationId) {
      setCurrentConversation({ ...currentConversation, title: newTitle });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-keys');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setSettings(data.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les clés API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Mettre à jour la conversation actuelle
    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        messages: updatedMessages
      };
      const updatedConversations = conversations.map(c =>
        c.id === currentConversation.id ? updatedConversation : c
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
    }

    try {
      // Créer le contexte de conversation pour la mémoire de session
      const conversationContext = messages.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          model: selectedModel,
          conversation: conversationContext // Ajout de la mémoire de session
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la génération de la réponse');

      const result = await response.json();
      // Vérifier si c'est une réponse conversationnelle ou une réponse avec données
      if (result.data.execution_result && result.data.execution_result.success) {
        // C'est une requête SQL avec résultats
        const executionData = result.data.execution_result.data;
        let responseContent = result.data.response;

        if (executionData.rows && executionData.rows.length > 0) {
          // Créer un tableau stylisé avec animations
          let htmlTable = '<div class="overflow-x-auto mt-6">';
          htmlTable += '<div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg p-4 border border-gray-200 dark:border-gray-700">';
          htmlTable += '<h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Données récupérées</h4>';
          htmlTable += `<p class="text-xs text-gray-600 dark:text-gray-300 mt-1">Affichage de ${executionData.rows.length} résultat${executionData.rows.length > 1 ? 's' : ''}</p>`;
          htmlTable += '</div>';
          htmlTable += '<div class="bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg shadow-lg overflow-hidden">';
          htmlTable += '<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">';

          // En-tête du tableau
          if (executionData.columns && executionData.columns.length > 0) {
            htmlTable += '<thead class="bg-gradient-to-r from-blue-500 to-purple-600 text-white">';
            htmlTable += '<tr>';
            executionData.columns.forEach((col: string) => {
              htmlTable += `<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">${col}</th>`;
            });
            htmlTable += '</tr></thead>';
          }

          // Corps du tableau avec animations
          htmlTable += '<tbody class="bg-card dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">';
          executionData.rows.forEach((row: any, index: number) => {
            const rowClass = index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-card dark:bg-gray-800';
            htmlTable += `<tr class="${rowClass} hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors duration-200 animate-in slide-in-from-left-2 ease-out">`;
            executionData.columns.forEach((col: string) => {
              htmlTable += `<td class="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-gray-100 border-t border-gray-100 dark:border-gray-700">${row[col]}</td>`;
            });
            htmlTable += '</tr>';
          });
          htmlTable += '</tbody></table></div>';

          // Contenu enrichi avec explications
          responseContent = `<div class="space-y-4">
            <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 class="font-semibold text-green-800 dark:text-green-200">Requête exécutée avec succès</h4>
                  <p class="text-sm text-green-700 dark:text-green-300">Voici les données que vous avez demandées</p>
                </div>
              </div>
            </div>
            
            ${htmlTable}
            
            <div class="flex justify-between items-center mt-4 text-xs text-gray-600 dark:text-gray-400">
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                ${executionData.rows.length} résultat${executionData.rows.length > 1 ? 's' : ''}
              </span>
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                Temps d'exécution: ${result.data.execution_result.executionTime}ms
              </span>
            </div>
          </div>`;
        } else {
          responseContent = `<div class="space-y-4">
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 class="font-semibold text-yellow-800 dark:text-yellow-200">Aucun résultat trouvé</h4>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300">Votre requête n'a retourné aucune donnée correspondante</p>
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              <p>💡 Conseil: Essayez d'élargir votre recherche ou vérifiez les critères de votre requête.</p>
            </div>
          </div>`;
        }
      } else {
        // C'est une réponse conversationnelle (pas de SQL)
        let responseContent = result.data.response;

        // Améliorer la présentation des réponses conversationnelles
        responseContent = `<div class="space-y-3">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <h4 class="font-semibold text-blue-800 dark:text-blue-200">Réponse conversationnelle</h4>
                <p class="text-sm text-blue-700 dark:text-blue-300">Votre question ne nécessite pas d'accès à la base de données</p>
              </div>
            </div>
          </div>
          
          <div class="bg-card dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              ${responseContent}
            </div>
          </div>
        </div>`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: responseContent,
        timestamp: new Date(),
        executionResult: result.data.execution_result,
        executionTime: result.data.execution_result?.executionTime
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Mettre à jour la conversation avec le message bot
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          messages: finalMessages
        };
        const updatedConversations = conversations.map(c =>
          c.id === currentConversation.id ? updatedConversation : c
        );
        setConversations(updatedConversations);
        saveConversations(updatedConversations);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `<div class="space-y-3">
          <div class="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <h4 class="font-semibold text-red-800 dark:text-red-200">Erreur de connexion</h4>
                <p class="text-sm text-red-700 dark:text-red-300">Impossible de contacter l'agent IA</p>
              </div>
            </div>
          </div>
          
          <div class="bg-card dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-800 dark:text-gray-200">
              Désolé, je ne peux pas traiter votre demande pour le moment. Veuillez vérifier vos paramètres API.
            </div>
          </div>
        </div>`,
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);

      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          messages: finalMessages
        };
        const updatedConversations = conversations.map(c =>
          c.id === currentConversation.id ? updatedConversation : c
        );
        setConversations(updatedConversations);
        saveConversations(updatedConversations);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptEngineering = async () => {
    if (!input.trim() || isTyping) return;

    setIsPromptEngineering(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Reformule cette question en langage naturel plus clair et précis en utilisant les termes spécifiques de notre base de données financière et scolaire.
          
          Base de données disponible :
          - Tables financières : transactions, paiements, factures, comptes, budgets
          - Tables scolaires : élèves, classes, niveaux, inscriptions, notes
          - Tables générales : utilisateurs, sessions, logs
          
          Question à reformuler : "${input}"
          
          Objectif : rendre la question plus précise en utilisant les noms de tables et colonnes appropriés, tout en restant en langage humain compréhensible.
          
          IMPORTANT : Réponds uniquement avec la question reformulée, sans aucune explication ou commentaire supplémentaire.`,
          model: selectedModel || settings.find(s => s.is_active)?.model || 'gpt-4o-mini'
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la reformulation');

      const result = await response.json();

      // Extraire la reformulation de la réponse
      let reformulatedPrompt = result.data.response;

      // Nettoyer la réponse pour extraire la question reformulée
      if (reformulatedPrompt.includes('Voici votre question reformulée')) {
        const match = reformulatedPrompt.match(/Voici votre question reformulée[\s:]*([^.]+\.)/i);
        if (match) {
          reformulatedPrompt = match[1].trim();
        }
      } else if (reformulatedPrompt.includes('Voici la question reformulée')) {
        const match = reformulatedPrompt.match(/Voici la question reformulée[\s:]*([^.]+\.)/i);
        if (match) {
          reformulatedPrompt = match[1].trim();
        }
      } else if (reformulatedPrompt.includes('Question reformulée')) {
        const match = reformulatedPrompt.match(/Question reformulée[\s:]*([^.]+\.)/i);
        if (match) {
          reformulatedPrompt = match[1].trim();
        }
      }

      // Mettre à jour l'entrée avec la version reformulée
      setInput(reformulatedPrompt);

      toast({
        title: "Question reformulée",
        description: "Votre question a été clarifiée avec les termes spécifiques de votre base de données.",
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de reformuler le prompt. Veuillez vérifier vos paramètres API.",
        variant: "destructive"
      });
    } finally {
      setIsPromptEngineering(false);
      setIsTyping(false);
    }
  };

  const formatTime = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationDate = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Texte copié dans le presse-papiers",
    });
  };

  const downloadSql = (sql: string) => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar - Historique des conversations */}
      {!isSidebarCollapsed && (
        <div className="w-80 bg-card dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Conversations</h2>
                <p className="text-blue-100 text-sm mt-1">Historique et gestion</p>
              </div>
              <Button
                onClick={createNewConversation}
                className="bg-card text-blue-600 hover:bg-blue-50 border-2 border-white hover:border-blue-200 font-semibold"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle
              </Button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Favoris
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsSidebarCollapsed(false); // Faire revenir la sidebar
                  setIsSettingsOpen(false); // Fermer automatiquement les paramètres
                }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <EyeIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsSidebarCollapsed(true)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 p-6">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-white">Aucune conversation</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Commencez une nouvelle conversation pour voir l'historique ici</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${currentConversation?.id === conversation.id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 shadow-md'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                    }`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {conversation.isFavorite && (
                          <span className="text-yellow-500 animate-pulse">⭐</span>
                        )}
                        <h3 className="font-semibold text-foreground dark:text-white truncate text-sm">
                          {conversation.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatConversationDate(conversation.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{conversation.messages.length} messages</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(conversation.id);
                        }}
                        className={`text-gray-400 hover:text-yellow-500 transition-colors ${conversation.isFavorite ? 'text-yellow-500' : ''
                          }`}
                        title="Marquer comme favori"
                      >
                        {conversation.isFavorite ? '⭐' : '☆'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTitle = prompt('Nouveau titre:', conversation.title);
                          if (newTitle) updateConversationTitle(conversation.id, newTitle);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Renommer"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Agent SQL IA</h1>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                Posez votre question en langage naturel
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {/* Sélection de modèle */}
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="appearance-none bg-card dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un modèle</option>
                  {settings.filter(s => s.is_active).map(setting => (
                    <option key={setting.id} value={setting.model}>
                      {setting.name} - {setting.model}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessages([])}
                className="text-gray-600 dark:text-gray-300 text-xs"
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Nouvelle
              </Button>

              {/* Menu Paramètres à droite */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setIsSidebarCollapsed(true); // Fermer automatiquement la sidebar conversations
                }}
                className="text-gray-600 dark:text-gray-300 text-xs"
              >
                <Settings className="mr-1.5 h-3 w-3" />
                Clés API
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-8">
          <ScrollArea className="h-full">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-16">
                <div className="text-6xl mb-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl animate-pulse">
                    <Brain className="h-14 w-14 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-3 text-gray-800 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Prêt à interroger votre base de données
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                  Posez votre question en langage naturel et laissez l'IA générer la requête SQL pour vous.
                </p>
                <div className="mt-10 flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3 bg-card dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <Database className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Analyse de données</span>
                  </div>
                  <div className="flex items-center gap-3 bg-card dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <Cpu className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Intelligence artificielle</span>
                  </div>
                  <div className="flex items-center gap-3 bg-card dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Réponses instantanées</span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`mb-8 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-2 rounded-lg max-w-3xl ${message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {message.type === 'user' ? (
                        <div className="w-6 h-6 bg-card bg-opacity-20 rounded-full flex items-center justify-center shadow">
                          <User className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center shadow">
                          <Bot className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-gray-200 dark:text-gray-600">
                          {message.type === 'user' ? 'Vous' : 'Agent IA'}
                        </div>
                        <span className="text-xs text-gray-300 dark:text-gray-500">{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-xs leading-relaxed prose dark:prose-invert max-w-none">
                      {message.type === 'bot' ? (
                        message.content.includes('<') ? (
                          <div className="mt-2" dangerouslySetInnerHTML={{ __html: message.content }} />
                        ) : (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border-l-4 border-blue-300 dark:border-blue-700">
                            <p className="text-blue-900 dark:text-blue-100 mb-2 font-medium">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              Réponse de l'Agent IA
                            </p>
                            <div className="text-gray-800 dark:text-gray-200 text-sm">
                              {message.content}
                            </div>
                          </div>
                        )
                      ) : (
                        message.content
                      )}
                    </div>

                    {/* Results Section */}
                    {message.executionResult && (
                      <div className="mt-6 pt-6 border-t border-white/20 dark:border-gray-600">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5 h-5 bg-card bg-opacity-20 rounded flex items-center justify-center">
                            <Database className="h-2.5 w-2.5 text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white">Résultats de la requête</span>
                            <p className="text-xs text-gray-200 dark:text-gray-400">Données récupérées</p>
                          </div>
                        </div>
                        {message.executionTime && (
                          <div className="mt-1 text-xs text-gray-200 dark:text-gray-400 flex items-center gap-1">
                            <Rocket className="h-2 w-2" />
                            Temps d'exécution: {message.executionTime}ms
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="text-left mb-3">
                <div className="inline-block px-3 py-1.5 bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center shadow">
                      <Bot className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Agent IA</div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(new Date())}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question sur les données financières..."
                  className="pl-10 pr-24 py-4 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-0 rounded-lg bg-card dark:bg-gray-700 text-foreground dark:text-white shadow-sm transition-all duration-200 group-focus-within:shadow-md min-h-[80px] resize-none"
                  rows={2}
                />

                {/* Voice Input Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceInput(!showVoiceInput)}
                  className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Mic className="h-3 w-3" />
                </Button>

                {/* Magic Wand Button - Prompt Engineering */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePromptEngineering}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-purple-500 dark:text-purple-400 hover:text-purple-600 transition-colors"
                  title="Reformuler le prompt avec l'IA"
                >
                  <span className="text-purple-500 animate-pulse">✨</span>
                </Button>

                {input.trim() && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                    {input.length} caractères
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isTyping || !selectedModel}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-4 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Send className="mr-2 h-4 w-4" />
                {isTyping ? 'Génération...' : 'Envoyer'}
              </Button>
            </div>
            {!selectedModel && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Veuillez sélectionner un modèle dans le menu déroulant
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Menu Paramètres à droite */}
      {isSettingsOpen && (
        <div className="w-80 bg-card dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Paramètres</h2>
            <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Thème */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 dark:text-white">Thème</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => {
                    setTheme('light');
                    applyTheme('light');
                  }}
                  className="justify-start"
                >
                  🌞 Clair
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => {
                    setTheme('dark');
                    applyTheme('dark');
                  }}
                  className="justify-start"
                >
                  🌙 Sombre
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => {
                    setTheme('system');
                    applyTheme('system');
                  }}
                  className="justify-start"
                >
                  🖥️ Système
                </Button>
              </div>
            </div>

            {/* Paramètres API */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800 dark:text-white">Clés API</h3>
                <Button onClick={() => setIsApiModalOpen(true)} variant="outline" size="sm">
                  Gérer
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : settings.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  Aucune clé API configurée
                </div>
              ) : (
                <div className="space-y-2">
                  {settings.map((setting) => (
                    <div key={setting.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">{setting.api_name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Modèle: {setting.api_model}</div>
                        </div>
                        <div className="flex gap-1">
                          {setting.is_default && (
                            <Badge variant="default" className="text-xs">Par défaut</Badge>
                          )}
                          <div className={`w-2 h-2 rounded-full ${setting.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 dark:text-white">Informations</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Conversations: {conversations.length}</div>
                <div>Messages actuels: {messages.length}</div>
                <div>Thème: {theme}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 dark:text-white">Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Vider toutes les conversations ?')) {
                      setConversations([]);
                      saveConversations([]);
                      setCurrentConversation(null);
                      setMessages([]);
                    }
                  }}
                  className="w-full justify-start text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                >
                  🗑️ Vider les conversations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentConversation) {
                      const newTitle = prompt('Nouveau titre:', currentConversation.title);
                      if (newTitle) updateConversationTitle(currentConversation.id, newTitle);
                    }
                  }}
                  className="w-full justify-start"
                >
                  ✏️ Renommer la conversation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des clés API */}
      <ApiKeyModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSuccess={() => {
          loadSettings();
          // Recharger les conversations pour mettre à jour les modèles disponibles
          loadConversations();
        }}
      />
    </div>
  );
}