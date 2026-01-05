-- Script pour vérifier et créer la table subjects

-- Vérifier si la table existe
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'scolapp' AND table_name = 'subjects';

-- Si la table n'existe pas, la créer
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  maxScore INT NOT NULL DEFAULT 20,
  isActive BOOLEAN NOT NULL DEFAULT true,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subject_class_year (code, classId, schoolYear)
);

-- Vérifier la structure de la table
DESCRIBE subjects;

-- Insérer quelques matières de test pour 2025-2026
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-001', 'Français', 'FR', 'Langues', 20, true, '0aa45c9b-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa45c9b-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa45c9b-6be1-11f0-a457-a08cfda86800', '2025-2026')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Vérifier les données insérées
SELECT * FROM subjects WHERE schoolYear = '2025-2026'; 