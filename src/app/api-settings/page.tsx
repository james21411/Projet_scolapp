"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Settings,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiSetting {
  id: number;
  api_name: string;
  api_key: string;
  api_endpoint: string;
  api_model: string;
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

export default function ApiSettingsPage() {
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Partial<ApiSetting>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-settings');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setSettings(data.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSetting({
      api_name: '',
      api_key: '',
      api_endpoint: '',
      api_model: 'gpt-3.5-turbo',
      is_active: true,
      is_default: false,
      rate_limit_requests_per_minute: 60,
      timeout_seconds: 30,
      retry_attempts: 3
    });
    setIsEditing(true);
  };

  const handleEdit = (setting: ApiSetting) => {
    setEditingSetting(setting);
    setIsEditing(true);
    setShowApiKey(false);
  };

  const handleSave = async () => {
    try {
      const method = editingSetting.id ? 'PUT' : 'POST';
      const url = editingSetting.id 
        ? `/api/api-settings/${editingSetting.id}`
        : '/api/api-settings';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSetting)
      });

      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');

      const result = await response.json();
      toast({
        title: "Succès",
        description: `Paramètre API ${editingSetting.id ? 'mis à jour' : 'créé'} avec succès`
      });

      setIsEditing(false);
      loadSettings();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paramètre API",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paramètre API ?')) return;

    try {
      const response = await fetch(`/api/api-settings/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast({
        title: "Succès",
        description: "Paramètre API supprimé avec succès"
      });

      loadSettings();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le paramètre API",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/api-settings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-default' })
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      toast({
        title: "Succès",
        description: "Paramètre API défini comme par défaut"
      });

      loadSettings();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de définir le paramètre par défaut",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async (setting: ApiSetting) => {
    try {
      const response = await fetch(`/api/api-settings/${setting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection' })
      });

      if (!response.ok) throw new Error('Erreur lors du test');

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [setting.id]: result.data
      }));

      toast({
        title: result.data.success ? "Test réussi" : "Test échoué",
        description: result.data.message
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de tester la connexion",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Paramètres API</h1>
                <p className="text-gray-600">Gérez les connexions aux services d'IA</p>
              </div>
            </div>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau paramètre
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Liste des paramètres */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {settings.map((setting) => (
            <Card key={setting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${setting.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <CardTitle className="text-lg">{setting.api_name}</CardTitle>
                    {setting.is_default && (
                      <Badge variant="default">Par défaut</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(setting)}
                      className="text-xs"
                    >
                      <TestTube className="mr-1 h-3 w-3" />
                      Tester
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      className="text-xs"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
                {testResults[setting.id] && (
                  <div className={`mt-2 flex items-center gap-2 text-xs ${
                    testResults[setting.id].success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults[setting.id].success ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{testResults[setting.id].message}</span>
                    {testResults[setting.id].responseTime && (
                      <span className="text-gray-500">({testResults[setting.id].responseTime}ms)</span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Modèle: {setting.api_model}</div>
                  <div>Timeout: {setting.timeout_seconds}s</div>
                  <div>Limite: {setting.rate_limit_requests_per_minute}/min</div>
                  <div>Retries: {setting.retry_attempts}</div>
                </div>
                <div className="text-xs text-gray-500">
                  Endpoint: {setting.api_endpoint.substring(0, 50)}...
                </div>
                {!setting.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(setting.id)}
                    className="w-full text-xs"
                  >
                    Définir comme par défaut
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Formulaire d'édition */}
        {isEditing && (
          <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>
                  {editingSetting.id ? 'Modifier' : 'Nouveau'} paramètre API
                </CardTitle>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api_name">Nom de l'API</Label>
                  <Input
                    id="api_name"
                    value={editingSetting.api_name || ''}
                    onChange={(e) => setEditingSetting({...editingSetting, api_name: e.target.value})}
                    placeholder="ex: OpenAI, Claude, Gemini"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_model">Modèle par défaut</Label>
                  <Input
                    id="api_model"
                    value={editingSetting.api_model || ''}
                    onChange={(e) => setEditingSetting({...editingSetting, api_model: e.target.value})}
                    placeholder="ex: gpt-3.5-turbo"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="api_endpoint">Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    value={editingSetting.api_endpoint || ''}
                    onChange={(e) => setEditingSetting({...editingSetting, api_endpoint: e.target.value})}
                    placeholder="ex: https://api.openai.com/v1/chat/completions"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="api_key">Clé API</Label>
                  <div className="relative">
                    <Input
                      id="api_key"
                      type={showApiKey ? "text" : "password"}
                      value={editingSetting.api_key || ''}
                      onChange={(e) => setEditingSetting({...editingSetting, api_key: e.target.value})}
                      placeholder="Entrez votre clé API"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout_seconds">Timeout (secondes)</Label>
                  <Input
                    id="timeout_seconds"
                    type="number"
                    value={editingSetting.timeout_seconds || 30}
                    onChange={(e) => setEditingSetting({...editingSetting, timeout_seconds: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_limit">Limite de requêtes/min</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    value={editingSetting.rate_limit_requests_per_minute || 60}
                    onChange={(e) => setEditingSetting({...editingSetting, rate_limit_requests_per_minute: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry_attempts">Tentatives de retry</Label>
                  <Input
                    id="retry_attempts"
                    type="number"
                    value={editingSetting.retry_attempts || 3}
                    onChange={(e) => setEditingSetting({...editingSetting, retry_attempts: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={editingSetting.is_active || false}
                    onCheckedChange={(checked) => setEditingSetting({...editingSetting, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Actif</Label>
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    id="is_default"
                    checked={editingSetting.is_default || false}
                    onCheckedChange={(checked) => setEditingSetting({...editingSetting, is_default: checked})}
                  />
                  <Label htmlFor="is_default">Par défaut</Label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}