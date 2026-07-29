"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface ApiKey {
  id: number;
  name: string;
  model: string;
  api_key: string;
  endpoint: string;
  is_active: boolean;
  is_default: boolean;
  rate_limit_requests_per_minute: number;
  timeout_seconds: number;
  retry_attempts: number;
  created_at: string;
  updated_at: string;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState<Partial<ApiKey>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-keys');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setApiKeys(data.data || []);
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

  const handleCreate = () => {
    setEditingKey({
      name: '',
      model: '',
      api_key: '',
      is_active: true,
      is_default: false,
      rate_limit_requests_per_minute: 60,
      timeout_seconds: 30,
      retry_attempts: 3
    });
    setIsEditing(true);
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey({ ...key });
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) return;

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast({
        title: "Succès",
        description: "Clé API supprimée avec succès",
      });

      loadApiKeys();
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la clé API",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    console.log('🔍 ApiKeyModal: handleSave called with editingKey:', editingKey);
    
    if (!editingKey.name || !editingKey.model || !editingKey.api_key) {
      console.log('🔍 ApiKeyModal: Validation failed - Missing required fields');
      console.log('🔍 ApiKeyModal: name:', !!editingKey.name, 'model:', !!editingKey.model, 'api_key:', !!editingKey.api_key);
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const method = editingKey.id ? 'PUT' : 'POST';
      const url = editingKey.id ? `/api/api-keys/${editingKey.id}` : '/api/api-keys';
      console.log('🔍 ApiKeyModal: Sending request to', method, url);
      console.log('🔍 ApiKeyModal: Request body:', editingKey);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingKey),
      });

      console.log('🔍 ApiKeyModal: Response status:', response.status);
      const responseText = await response.text();
      console.log('🔍 ApiKeyModal: Response text:', responseText);
      
      if (!response.ok) {
        console.log('🔍 ApiKeyModal: Request failed with status:', response.status);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('🔍 ApiKeyModal: Parsed response:', result);

      toast({
        title: "Succès",
        description: editingKey.id ? "Clé API mise à jour avec succès" : "Clé API créée avec succès",
      });

      setIsEditing(false);
      loadApiKeys();
      onSuccess();
    } catch (error) {
      console.error('🔍 ApiKeyModal: Error in handleSave:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer la clé API",
        variant: "destructive"
      });
    }
  };

  const toggleDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/api-keys/${id}/default`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      toast({
        title: "Succès",
        description: "Clé API par défaut mise à jour",
      });

      loadApiKeys();
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la clé API par défaut",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Gestion des Clés API" className="max-w-2xl">
        <ModalHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gestion des Clés API</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </ModalHeader>
        <ModalContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-800 dark:text-white">Clés API enregistrées</h3>
                <Button onClick={handleCreate} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle clé
                </Button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                  Aucune clé API enregistrée
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-800 dark:text-white">{key.name}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">({key.model})</span>
                          {key.is_default && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full font-medium">Par défaut</span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                          <span>Limite: {key.rate_limit_requests_per_minute}/min</span>
                          <span>Timeout: {key.timeout_seconds}s</span>
                          <span>Retours: {key.retry_attempts}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Switch
                          checked={key.is_active}
                          onCheckedChange={() => {
                            setApiKeys(prev => prev.map(k =>
                              k.id === key.id ? { ...k, is_active: !k.is_active } : k
                            ));
                            // Update in database
                            fetch(`/api/api-keys/${key.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...key, is_active: !key.is_active }),
                            });
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleEdit(key)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(key.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {!key.is_default && (
                          <Button variant="outline" size="sm" onClick={() => toggleDefault(key.id)}>
                            Défaut
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button onClick={onClose} variant="outline">Fermer</Button>
        </ModalFooter>
      </Modal>

      {/* Modal d'édition/création */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={editingKey.id ? 'Modifier une clé API' : 'Créer une clé API'} className="max-w-md">
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              {editingKey.id ? 'Modifier' : 'Créer'} une clé API
            </h2>
          </ModalHeader>
          <ModalContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la clé</Label>
                  <Input
                    id="name"
                    value={editingKey.name || ''}
                    onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
                    placeholder="Ex: OpenAI GPT-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    value={editingKey.model || ''}
                    onChange={(e) => setEditingKey({ ...editingKey, model: e.target.value })}
                    placeholder="Ex: gpt-4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">Clé API</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showApiKey ? "text" : "password"}
                    value={editingKey.api_key || ''}
                    onChange={(e) => setEditingKey({ ...editingKey, api_key: e.target.value })}
                    placeholder="Votre clé API secrète"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showApiKey ? 'Cacher' : 'Afficher'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate_limit">Limite/min</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    value={editingKey.rate_limit_requests_per_minute || 60}
                    onChange={(e) => setEditingKey({ ...editingKey, rate_limit_requests_per_minute: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (s)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={editingKey.timeout_seconds || 30}
                    onChange={(e) => setEditingKey({ ...editingKey, timeout_seconds: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries">Tentatives</Label>
                  <Input
                    id="retries"
                    type="number"
                    value={editingKey.retry_attempts || 3}
                    onChange={(e) => setEditingKey({ ...editingKey, retry_attempts: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingKey.is_active || false}
                    onCheckedChange={(checked) => setEditingKey({ ...editingKey, is_active: checked })}
                  />
                  <Label className="text-sm font-medium">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingKey.is_default || false}
                    onCheckedChange={(checked) => setEditingKey({ ...editingKey, is_default: checked })}
                  />
                  <Label className="text-sm font-medium">Par défaut</Label>
                </div>
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              {editingKey.id ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline">Annuler</Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}