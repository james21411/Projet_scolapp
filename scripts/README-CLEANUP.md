# Scripts de Nettoyage de Base de Données

Ce dossier contient les scripts nécessaires pour nettoyer la base de données et préparer l'application pour l'installation chez le client.

## 🔐 Mot de Passe de Sécurité

**IMPORTANT**: Tous les scripts de nettoyage nécessitent le mot de passe de sécurité : `Nuttertools2.0`

## 📋 Scripts Disponibles

### 1. `cleanup-database.js`
Supprime toutes les données de test de la base de données.

**Données supprimées :**
- Tous les élèves et leurs données
- Toutes les notes et évaluations
- Tous les paiements et finances
- Toutes les présences
- Tous les bulletins
- Tous les logs d'audit
- Toutes les structures tarifaires
- Tous les utilisateurs (sauf admin)

**Données préservées :**
- Compte administrateur
- Informations de l'école
- Structure des niveaux et classes
- Périodes d'évaluation
- Types d'évaluation

**Utilisation :**
```bash
npm run cleanup-database
```

### 2. `restore-base-data.js`
Restaure les données de base nécessaires au fonctionnement de l'application.

**Données restaurées :**
- Compte administrateur (si manquant)
- Informations de base de l'école
- Niveaux scolaires (CP, CE1, CE2, CM1, CM2)
- Classes par niveau
- Périodes d'évaluation
- Types d'évaluation

**Utilisation :**
```bash
npm run restore-base-data
```

### 3. `prepare-for-client.js`
Script principal qui combine le nettoyage et la restauration.

**Étapes :**
1. Nettoie toutes les données de test
2. Restaure les données de base
3. Prépare l'application pour l'installation client

**Utilisation :**
```bash
npm run prepare-for-client
```

### 4. `test-cleanup.js`
Script de test qui insère des données de test pour vérifier le fonctionnement du nettoyage.

**Utilisation :**
```bash
npm run test-cleanup
```

## 🌐 Interface Web

Une interface web est également disponible dans l'application :

**URL :** `/parametres/nettoyage`

**Fonctionnalités :**
- Interface graphique pour le nettoyage
- Vérification du mot de passe
- Confirmation avant exécution
- Affichage des résultats détaillés
- Protection contre les erreurs

## ⚠️ Avertissements Importants

1. **IRRÉVERSIBLE** : Le nettoyage supprime définitivement toutes les données de test
2. **SAUVEGARDE** : Faites une sauvegarde avant d'exécuter les scripts
3. **MOT DE PASSE** : Le mot de passe `Nuttertools2.0` est requis pour toutes les opérations
4. **PRODUCTION** : Ces scripts sont destinés à préparer l'installation chez le client

## 🔧 Configuration

Les scripts utilisent les variables d'environnement suivantes :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=scolapp
DB_PORT=3306
```

## 📊 Exemple d'Utilisation Complète

```bash
# 1. Tester le nettoyage (optionnel)
npm run test-cleanup

# 2. Préparer pour le client
npm run prepare-for-client

# 3. Vérifier que tout fonctionne
# L'application devrait être prête pour l'installation
```

## 🎯 Résultat Final

Après exécution des scripts, l'application contient :

- ✅ Compte administrateur fonctionnel
- ✅ Structure de base de l'école
- ✅ Niveaux et classes configurés
- ✅ Périodes d'évaluation définies
- ✅ Types d'évaluation disponibles
- ❌ Aucune donnée de test
- ❌ Aucun élève, note, ou paiement

## 🚀 Installation Client

Une fois les scripts exécutés, l'application est prête pour :

1. Déploiement chez le client
2. Configuration des données réelles
3. Ajout des utilisateurs
4. Saisie des élèves et classes
5. Configuration des matières et évaluations

## 📞 Support

En cas de problème, vérifiez :

1. La connexion à la base de données
2. Les permissions MySQL
3. Le mot de passe de sécurité
4. Les logs d'erreur dans la console
