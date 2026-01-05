-- Script de migration pour la table subjects
-- Crée une nouvelle table avec auto-increment et migre les données

USE scolapp;

-- 1. Désactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Créer une nouvelle table subjects avec la bonne structure
CREATE TABLE subjects_new (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  maxScore INT NOT NULL DEFAULT 20,
  coefficient DECIMAL(3,1) DEFAULT 1.0,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subject_class_year (code, classId, schoolYear)
);

-- 3. Vérifier que la nouvelle table a été créée
DESCRIBE subjects_new;

-- 4. Message de confirmation
SELECT '✅ Nouvelle table subjects_new créée avec succès!' as result;
SELECT 'Vous pouvez maintenant migrer les données existantes.' as next_step;
