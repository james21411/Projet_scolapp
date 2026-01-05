-- Script corrigé pour ajouter les tables manquantes pour les matières et notes
-- À exécuter dans votre base de données MySQL

USE scolapp;

-- 1. Table des matières
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  category VARCHAR(100),
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Table des coefficients par classe et matière
CREATE TABLE IF NOT EXISTS subject_coefficients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId VARCHAR(100) NOT NULL,
  subjectId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  maxScore INT NOT NULL DEFAULT 20,
  passingScore DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_class_subject (classId, schoolYear, subjectId),
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 3. Table des types d'évaluation
CREATE TABLE IF NOT EXISTS evaluation_types (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  maxScore INT NOT NULL DEFAULT 20,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Table des périodes d'évaluation
CREATE TABLE IF NOT EXISTS evaluation_periods (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Table des notes améliorée (remplace l'ancienne si elle existe)
DROP TABLE IF EXISTS grades;
CREATE TABLE grades (
  id VARCHAR(100) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  subjectId VARCHAR(100) NOT NULL,
  evaluationTypeId VARCHAR(100) NOT NULL,
  evaluationPeriodId VARCHAR(100),
  score DECIMAL(5,2) NOT NULL,
  maxScore DECIMAL(5,2) NOT NULL DEFAULT 20,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  weightedScore DECIMAL(6,2),
  assessment TEXT,
  recordedBy VARCHAR(100) NOT NULL,
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_grade (studentId, schoolYear, subjectId, evaluationTypeId, evaluationPeriodId),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationTypeId) REFERENCES evaluation_types(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationPeriodId) REFERENCES evaluation_periods(id) ON DELETE SET NULL,
  FOREIGN KEY (recordedBy) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Table des moyennes par période
CREATE TABLE IF NOT EXISTS period_averages (
  id VARCHAR(100) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  evaluationPeriodId VARCHAR(100) NOT NULL,
  averageScore DECIMAL(5,2) NOT NULL,
  totalCoefficient DECIMAL(6,2) NOT NULL,
  rank INT,
  totalStudents INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_period_average (studentId, schoolYear, evaluationPeriodId),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationPeriodId) REFERENCES evaluation_periods(id) ON DELETE CASCADE
);

-- 7. Table des moyennes générales
CREATE TABLE IF NOT EXISTS general_averages (
  id VARCHAR(100) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  averageScore DECIMAL(5,2) NOT NULL,
  totalCoefficient DECIMAL(6,2) NOT NULL,
  rank INT,
  totalStudents INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_general_average (studentId, schoolYear),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- 8. Table des paramètres de notation
CREATE TABLE IF NOT EXISTS grading_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settingKey VARCHAR(100) NOT NULL UNIQUE,
  settingValue TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. Table des bulletins
CREATE TABLE IF NOT EXISTS report_cards (
  id VARCHAR(100) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  evaluationPeriodId VARCHAR(100),
  averageScore DECIMAL(5,2) NOT NULL,
  rank INT,
  totalStudents INT,
  teacherComments TEXT,
  principalComments TEXT,
  parentSignature VARCHAR(100),
  issuedBy VARCHAR(100) NOT NULL,
  issuedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationPeriodId) REFERENCES evaluation_periods(id) ON DELETE SET NULL,
  FOREIGN KEY (issuedBy) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertion des données par défaut

-- Matières par défaut
INSERT IGNORE INTO subjects (id, name, code, description, category) VALUES
('subject-math', 'Mathématiques', 'MATH', 'Mathématiques générales', 'Scientifique'),
('subject-fr', 'Français', 'FR', 'Langue française', 'Littéraire'),
('subject-en', 'Anglais', 'EN', 'Langue anglaise', 'Littéraire'),
('subject-hist', 'Histoire', 'HIST', 'Histoire et géographie', 'Littéraire'),
('subject-svt', 'SVT', 'SVT', 'Sciences de la vie et de la terre', 'Scientifique'),
('subject-phys', 'Physique', 'PHYS', 'Physique-chimie', 'Scientifique'),
('subject-eco', 'Économie', 'ECO', 'Économie et gestion', 'Social'),
('subject-philo', 'Philosophie', 'PHILO', 'Philosophie', 'Littéraire'),
('subject-art', 'Arts plastiques', 'ART', 'Arts plastiques', 'Artistique'),
('subject-sport', 'Éducation physique', 'SPORT', 'Éducation physique et sportive', 'Sport');

-- Types d'évaluation par défaut
INSERT IGNORE INTO evaluation_types (id, name, description, weight, maxScore) VALUES
('eval-controle', 'Contrôle', 'Évaluation écrite en classe', 1.00, 20),
('eval-devoir', 'Devoir', 'Devoir à la maison', 1.00, 20),
('eval-composition', 'Composition', 'Évaluation importante', 2.00, 20),
('eval-oral', 'Oral', 'Évaluation orale', 0.50, 20),
('eval-tp', 'Travaux pratiques', 'Travaux pratiques', 0.75, 20),
('eval-examen', 'Examen', 'Examen final', 3.00, 20);

-- Périodes d'évaluation par défaut
INSERT IGNORE INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('period-trim1', '1er Trimestre', '2024-09-01', '2024-12-31', '2024-2025'),
('period-trim2', '2ème Trimestre', '2025-01-01', '2025-03-31', '2024-2025'),
('period-trim3', '3ème Trimestre', '2025-04-01', '2025-06-30', '2024-2025');

-- Paramètres de notation par défaut
INSERT IGNORE INTO grading_settings (settingKey, settingValue, description, category) VALUES
('default_max_score', '20', 'Note maximale par défaut', 'notation'),
('default_passing_score', '10', 'Note de passage par défaut', 'notation'),
('enable_weighted_averages', 'true', 'Activer les moyennes pondérées', 'notation'),
('enable_ranking', 'true', 'Activer le classement des élèves', 'notation'),
('decimal_precision', '2', 'Précision décimale pour les notes', 'notation'),
('grade_scale', '{"A": 16, "B": 14, "C": 12, "D": 10, "E": 8, "F": 0}', 'Échelle de notation par lettres', 'notation'),
('evaluation_periods', '["trim1", "trim2", "trim3"]', 'Périodes d\'évaluation', 'notation'),
('coefficient_calculation', 'weighted', 'Méthode de calcul des coefficients', 'notation'),
('auto_calculate_averages', 'true', 'Calcul automatique des moyennes', 'notation'),
('grade_validation', 'strict', 'Validation stricte des notes', 'notation');

-- Vérification des tables créées
SELECT 'Tables créées avec succès!' as Status;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'scolapp' AND TABLE_NAME IN (
  'subjects', 'subject_coefficients', 'evaluation_types', 'evaluation_periods', 
  'grades', 'period_averages', 'general_averages', 'grading_settings', 'report_cards'
) ORDER BY TABLE_NAME; 