#!/bin/bash

# Script de déploiement FosilaMaster avec Docker

echo "🚀 Déploiement de FosilaMaster avec Docker..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire et démarrer les conteneurs
echo "🔨 Construction et démarrage des conteneurs..."
docker-compose up -d --build

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier le statut des conteneurs
echo "📊 Statut des conteneurs:"
docker-compose ps

# Afficher les logs
echo "📋 Logs des conteneurs:"
docker-compose logs --tail=20

echo "✅ Déploiement terminé !"
echo "🌐 Application accessible sur: http://localhost"
echo "🗄️ Base de données MySQL accessible sur: localhost:3306"
echo "👤 Utilisateurs par défaut:"
echo "   - Admin: admin / admin123"
echo "   - Prof Math: prof-math / prof123"
echo "   - Prof Français: prof-francais / prof123"
echo "   - Secrétaire: secretaire / sec123" 