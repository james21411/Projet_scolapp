# ScolApp Visuel - Système de Gestion Scolaire

## 📋 Description

ScolApp Visuel est une application web moderne de gestion scolaire développée avec Next.js 15, TypeScript et MySQL. Elle offre une solution complète pour la gestion des élèves, des paiements, des notes, des présences et de l'administration scolaire.

## ✨ Fonctionnalités Principales

### 🎓 Gestion des Élèves
- Inscription et gestion des dossiers élèves
- Suivi des informations personnelles et parentales
- Historique scolaire complet
- Gestion des photos d'identité

### 💰 Gestion Financière
- Structure tarifaire par classe
- Suivi des paiements et échéances
- Génération de reçus de paiement
- Rapports financiers détaillés
- Extension des dates d'échéance

### 📊 Gestion Académique
- Saisie et suivi des notes
- Configuration des matières par classe
- Génération de bulletins
- Calcul automatique des moyennes

### 📝 Gestion des Présences
- Suivi quotidien des présences élèves
- Gestion des présences du personnel
- Rapports de présence détaillés

### 👥 Administration
- Gestion des utilisateurs et rôles
- Structure scolaire (niveaux et classes)
- Informations de l'établissement
- Journal d'audit complet

## 🛠️ Technologies Utilisées

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI/UX**: Tailwind CSS, Radix UI, Lucide React
- **Base de données**: MySQL 8.0+
- **Authentification**: Iron Session
- **Validation**: Zod, React Hook Form
- **Charts**: Recharts
- **PDF**: jsPDF, jsPDF-AutoTable
- **QR Code**: qrcode
- **Images**: html2canvas

## 📦 Prérequis

- Node.js 18+ 
- MySQL 8.0+
- npm ou yarn

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone <url-du-repository>
cd pr
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Configuration de l'Environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# Configuration Base de Données MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_DATABASE=scolapp

# Configuration Firebase (optionnel)
FIREBASE_API_KEY=votre_api_key
FIREBASE_AUTH_DOMAIN=votre_auth_domain
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_STORAGE_BUCKET=votre_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
FIREBASE_APP_ID=votre_app_id

# Configuration Session
SECRET_COOKIE_PASSWORD=votre_secret_password_32_caracteres
```

### 4. Configuration de la Base de Données

#### Créer la Base de Données

```sql
CREATE DATABASE scolapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Exécuter les Scripts d'Initialisation

```bash
# Se connecter à MySQL
mysql -u root -p scolapp

# Exécuter le schéma principal
source src/db/migrations/schema.sql

# Exécuter les scripts d'initialisation (optionnel)
source init_school_structure.sql
source init_presences.sql
```

### 5. Lancer l'Application

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'application sera accessible sur `http://localhost:9002`

## 🗄️ Structure de la Base de Données

### Tables Principales

- **users** : Gestion des utilisateurs et rôles
- **students** : Informations des élèves
- **fee_structures** : Structure tarifaire par classe
- **payments** : Historique des paiements
- **grades** : Notes des élèves
- **class_subjects** : Configuration des matières
- **presences** : Suivi des présences
- **school_info** : Informations de l'établissement
- **audit_logs** : Journal d'audit
- **school_levels** : Niveaux scolaires
- **school_classes** : Classes par niveau

## 📁 Structure du Projet

```
pr/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── api/               # API Routes
│   │   │   ├── finance/       # Endpoints financiers
│   │   │   ├── presences/     # Gestion des présences
│   │   │   ├── school/        # Administration scolaire
│   │   │   ├── students/      # Gestion des élèves
│   │   │   └── users/         # Gestion des utilisateurs
│   │   ├── dashboard/         # Tableau de bord
│   │   ├── login/             # Page de connexion
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Composants React
│   │   ├── ui/               # Composants UI réutilisables
│   │   └── *.tsx             # Composants spécifiques
│   ├── db/                   # Configuration base de données
│   │   ├── mysql.ts          # Connexion MySQL
│   │   ├── services/         # Services de base de données
│   │   └── migrations/       # Scripts de migration
│   ├── services/             # Services métier
│   ├── hooks/                # Hooks React personnalisés
│   ├── lib/                  # Utilitaires et configurations
│   ├── types/                # Types TypeScript
│   └── schemas/              # Schémas de validation
├── docs/                     # Documentation
├── init_*.sql               # Scripts d'initialisation
└── package.json
```

## 🔧 Configuration Avancée

### Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `MYSQL_HOST` | Hôte MySQL | localhost |
| `MYSQL_PORT` | Port MySQL | 3306 |
| `MYSQL_USER` | Utilisateur MySQL | root |
| `MYSQL_PASSWORD` | Mot de passe MySQL | - |
| `MYSQL_DATABASE` | Nom de la base | scolapp |
| `SECRET_COOKIE_PASSWORD` | Secret pour les sessions | - |

### Scripts Disponibles

```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run start        # Démarrage en mode production
npm run lint         # Vérification du code
npm run typecheck    # Vérification TypeScript
```

## 👤 Utilisateurs par Défaut

Après l'installation, vous pouvez créer un utilisateur administrateur via l'API ou directement en base :

```sql
INSERT INTO users (id, username, fullName, passwordHash, role) 
VALUES (
  'admin-001', 
  'ADMIN', 
  'Administrateur Principal', 
  '$2a$10$...', -- Hash bcrypt du mot de passe
  'Admin'
);
```

## 🔒 Sécurité

- Authentification par session sécurisée
- Hachage des mots de passe avec bcrypt
- Validation des données avec Zod
- Journal d'audit complet
- Protection CSRF intégrée

## 📊 Fonctionnalités Avancées

### Génération de Documents
- Bulletins de notes
- Reçus de paiement
- Attestations
- Rapports d'audit

### Intégrations
- Firebase (optionnel)
- QR Code pour les documents
- Export PDF automatique

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur de connexion MySQL**
   - Vérifiez les paramètres de connexion dans `.env.local`
   - Assurez-vous que MySQL est démarré
   - Vérifiez que l'utilisateur a les droits sur la base de données

2. **Erreur de build**
   - Vérifiez que Node.js est en version 18+
   - Supprimez `node_modules` et `package-lock.json`, puis `npm install`
   - Vérifiez les erreurs TypeScript avec `npm run typecheck`

3. **Problèmes de session**
   - Vérifiez que `SECRET_COOKIE_PASSWORD` est défini
   - Assurez-vous que le secret fait au moins 32 caractères

## 🚀 Déploiement

### Déploiement en Production

1. **Build de l'application**
   ```bash
   npm run build
   ```

2. **Configuration du serveur**
   - Installez Node.js 18+ sur le serveur
   - Configurez MySQL en production
   - Définissez les variables d'environnement

3. **Démarrage**
   ```bash
   npm start
   ```

### Variables d'Environnement de Production

```env
NODE_ENV=production
MYSQL_HOST=votre_host_production
MYSQL_PORT=3306
MYSQL_USER=votre_user_production
MYSQL_PASSWORD=votre_password_production
MYSQL_DATABASE=scolapp_prod
SECRET_COOKIE_PASSWORD=votre_secret_tres_long_et_complexe
```

## 📈 Performance

- Optimisation des requêtes MySQL avec des index
- Mise en cache des données fréquemment utilisées
- Compression des assets statiques
- Lazy loading des composants

## 🔄 Maintenance

### Sauvegarde de la Base de Données

```bash
# Sauvegarde complète
mysqldump -u root -p scolapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
mysql -u root -p scolapp < backup_file.sql
```

### Mises à Jour

1. Sauvegardez la base de données
2. Mettez à jour le code source
3. Exécutez `npm install` pour les nouvelles dépendances
4. Relancez l'application

## 🤝 Contribution

### Guide de Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

### Standards de Code

- Utilisez TypeScript strict
- Suivez les conventions ESLint
- Documentez les nouvelles API
- Testez vos modifications

## 📝 Changelog

### Version 0.1.0
- ✅ Gestion complète des élèves
- ✅ Système de paiements
- ✅ Gestion des notes et bulletins
- ✅ Suivi des présences
- ✅ Administration des utilisateurs
- ✅ Interface moderne avec Tailwind CSS

## 📞 Support

Pour toute question ou problème :

- 📧 Email : nsounjou1@gmail.com
- 📱 Téléphone : (+237) 698 38 51 86
- 🐛 Issues : Utilisez les issues GitHub

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- Next.js pour le framework
- Tailwind CSS pour le styling
- Radix UI pour les composants
- MySQL pour la base de données
- Tous les contributeurs du projet

---

**ScolApp Visuel** - L'excellence à votre portée 🎓 # Projet-Scolapp

# Projet_scolapp
