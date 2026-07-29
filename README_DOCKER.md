# 🐳 Guide de déploiement FosilaMaster avec Docker

## 📋 Prérequis

- Docker Desktop installé
- Docker Compose installé
- Au moins 4GB de RAM disponible

## 🚀 Déploiement rapide

### 1. Cloner le projet
```bash
git clone [url-du-projet]
cd fosilamaster
```

### 2. Déployer avec Docker
```bash
# Rendre le script exécutable
chmod +x scripts/deploy.sh

# Lancer le déploiement
./scripts/deploy.sh
```

### 3. Ou déployer manuellement
```bash
# Construire et démarrer les conteneurs
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

## 🌐 Accès à l'application

- **Application web** : http://localhost
- **Base de données MySQL** : localhost:3306
- **Utilisateur MySQL** : fosilamaster / fosilamaster123

## 👤 Utilisateurs par défaut

| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| admin | admin123 | Administrateur |
| prof-math | prof123 | Professeur |
| prof-francais | prof123 | Professeur |
| secretaire | sec123 | Secrétaire |

## 🛠️ Commandes utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs

# Service spécifique
docker-compose logs fosilamaster
docker-compose logs mysql
```

### Arrêter les services
```bash
docker-compose down
```

### Redémarrer un service
```bash
docker-compose restart fosilamaster
```

### Sauvegarder la base de données
```bash
docker exec fosilamaster-mysql mysqldump -u fosilamaster -pfosilamaster123 fosilamaster > backup.sql
```

### Restaurer la base de données
```bash
docker exec -i fosilamaster-mysql mysql -u fosilamaster -pfosilamaster123 fosilamaster < backup.sql
```

## 🔧 Configuration réseau local

### Pour accéder depuis d'autres ordinateurs

1. **Trouver l'IP du serveur**
```bash
ipconfig  # Windows
ifconfig  # Linux/Mac
```

2. **Accéder depuis les clients**
- Remplacer `localhost` par l'IP du serveur
- Exemple : http://192.168.1.100

### Configuration des clients

Les utilisateurs peuvent accéder à l'application via :
- **Navigateur web** : http://[IP-SERVEUR]
- **Pas d'installation requise** sur les postes clients

## 📊 Monitoring

### Vérifier l'utilisation des ressources
```bash
docker stats
```

### Voir les conteneurs en cours
```bash
docker ps
```

## 🔒 Sécurité

### Changer les mots de passe par défaut
1. Modifier `docker-compose.yml`
2. Changer les variables d'environnement
3. Redémarrer : `docker-compose down && docker-compose up -d`

### Sauvegarde automatique
```bash
# Créer un script de sauvegarde
echo "0 2 * * * docker exec fosilamaster-mysql mysqldump -u fosilamaster -pfosilamaster123 fosilamaster > /backup/fosilamaster_$(date +%Y%m%d).sql" | crontab -
```

## 🆘 Dépannage

### Problème de connexion à la base
```bash
# Vérifier que MySQL démarre
docker-compose logs mysql

# Se connecter à MySQL
docker exec -it fosilamaster-mysql mysql -u fosilamaster -pfosilamaster123
```

### Problème d'accès à l'application
```bash
# Vérifier les logs de l'app
docker-compose logs fosilamaster

# Redémarrer l'application
docker-compose restart fosilamaster
```

### Problème de réseau
```bash
# Vérifier les ports
netstat -an | grep :80
netstat -an | grep :3306
```

## 📈 Mise à l'échelle

### Ajouter plus de ressources
Modifier `docker-compose.yml` :
```yaml
services:
  fosilamaster:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

### Sauvegarde et restauration
```bash
# Sauvegarder
docker exec fosilamaster-mysql mysqldump -u fosilamaster -pfosilamaster123 fosilamaster > fosilamaster_backup.sql

# Restaurer
docker exec -i fosilamaster-mysql mysql -u fosilamaster -pfosilamaster123 fosilamaster < fosilamaster_backup.sql
``` 