-- Schéma MySQL pour ScolApp
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(255),
  photoUrl TEXT,
  passwordHash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(20) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  sexe VARCHAR(10),
  dateNaissance DATE NOT NULL,
  lieuNaissance VARCHAR(255) NOT NULL,
  nationalite VARCHAR(100),
  acteNaissance VARCHAR(100),
  photoUrl TEXT,
  infoParent JSON NOT NULL,
  infoParent2 JSON,
  niveau VARCHAR(100) NOT NULL,
  classe VARCHAR(100) NOT NULL,
  anneeScolaire VARCHAR(10) NOT NULL,
  historiqueClasse JSON NOT NULL,
  statut VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des matières
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

-- Table des coefficients par classe et matière
CREATE TABLE IF NOT EXISTS subject_coefficients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subjectId VARCHAR(255) NOT NULL,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  maxScore INT NOT NULL DEFAULT 20,
  passingScore DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subject_coefficient (subjectId),
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Table des types d'évaluation
CREATE TABLE IF NOT EXISTS evaluation_types (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  maxScore INT NOT NULL DEFAULT 20,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des périodes d'évaluation
CREATE TABLE IF NOT EXISTS evaluation_periods (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des notes améliorée
CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  subjectId VARCHAR(255) NOT NULL,
  evaluationTypeId VARCHAR(255) NOT NULL,
  evaluationPeriodId VARCHAR(255),
  score DECIMAL(5,2) NOT NULL,
  maxScore DECIMAL(5,2) NOT NULL DEFAULT 20,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  weightedScore DECIMAL(6,2),
  assessment TEXT,
  recordedBy VARCHAR(255) NOT NULL,
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_grade (studentId, schoolYear, subjectId, evaluationTypeId, evaluationPeriodId),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationTypeId) REFERENCES evaluation_types(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationPeriodId) REFERENCES evaluation_periods(id) ON DELETE SET NULL,
  FOREIGN KEY (recordedBy) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des moyennes par période
CREATE TABLE IF NOT EXISTS period_averages (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  evaluationPeriodId VARCHAR(255) NOT NULL,
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

-- Table des moyennes générales
CREATE TABLE IF NOT EXISTS general_averages (
  id VARCHAR(255) PRIMARY KEY,
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

-- Table des paramètres de notation
CREATE TABLE IF NOT EXISTS grading_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settingKey VARCHAR(255) NOT NULL UNIQUE,
  settingValue TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des bulletins
CREATE TABLE IF NOT EXISTS report_cards (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  classId VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  evaluationPeriodId VARCHAR(255),
  averageScore DECIMAL(5,2) NOT NULL,
  rank INT,
  totalStudents INT,
  teacherComments TEXT,
  principalComments TEXT,
  parentSignature VARCHAR(255),
  issuedBy VARCHAR(255) NOT NULL,
  issuedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationPeriodId) REFERENCES evaluation_periods(id) ON DELETE SET NULL,
  FOREIGN KEY (issuedBy) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fee_structures (
  className VARCHAR(100) PRIMARY KEY,
  registrationFee DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  installments JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(20) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  method VARCHAR(50) NOT NULL,
  reason TEXT,
  cashier VARCHAR(255) NOT NULL,
  cashierUsername VARCHAR(255) NOT NULL,
  installmentsPaid JSON,
  FOREIGN KEY (studentId) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  className VARCHAR(100) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  subjectId VARCHAR(255) NOT NULL,
  subjectName VARCHAR(255) NOT NULL,
  coefficient DECIMAL(4,2) NOT NULL,
  maxScore INT NOT NULL,
  UNIQUE KEY unique_class_subject (className, schoolYear, subjectId)
);

-- Table pour la structure de l'école
CREATE TABLE IF NOT EXISTS school_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slogan VARCHAR(255),
  address VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  bp VARCHAR(50),
  logoUrl TEXT,
  currentSchoolYear VARCHAR(20),
  currency VARCHAR(10)
);

-- Insérer une ligne par défaut si la table est vide
INSERT INTO school_info (name, slogan, address, phone, email, bp, logoUrl, currentSchoolYear, currency)
SELECT 'ScolApp Visuel Academy', 'L''excellence à votre portée', 'Yaoundé, Cameroun', '(+237) 699 99 99 99', 'contact@scolapp.com', '1234', NULL, CONCAT(YEAR(CURDATE()), '-', YEAR(CURDATE())+1), 'XAF'
WHERE NOT EXISTS (SELECT 1 FROM school_info);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  action VARCHAR(50) NOT NULL,
  userId VARCHAR(255),
  username VARCHAR(255),
  details TEXT
);

-- Création de la table des niveaux scolaires
CREATE TABLE IF NOT EXISTS school_levels (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    `order` INT NOT NULL DEFAULT 0,
    isActive BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Création de la table des classes
CREATE TABLE IF NOT EXISTS school_classes (
    id VARCHAR(36) PRIMARY KEY,
    levelId VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    `order` INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (levelId) REFERENCES school_levels(id) ON DELETE CASCADE
);

-- Insertion des niveaux par défaut
INSERT IGNORE INTO school_levels (id, name, `order`) VALUES
(UUID(), 'Maternelle', 1),
(UUID(), 'Nursery', 2),
(UUID(), 'Primaire', 3),
(UUID(), 'Primary', 4),
(UUID(), 'Secondaire', 5),
(UUID(), 'Secondary', 6),
(UUID(), 'Enseignement Technique', 7);

-- Récupération des IDs des niveaux pour les classes
SET @maternelle_id = (SELECT id FROM school_levels WHERE name = 'Maternelle');
SET @nursery_id = (SELECT id FROM school_levels WHERE name = 'Nursery');
SET @primaire_id = (SELECT id FROM school_levels WHERE name = 'Primaire');
SET @primary_id = (SELECT id FROM school_levels WHERE name = 'Primary');
SET @secondaire_id = (SELECT id FROM school_levels WHERE name = 'Secondaire');
SET @secondary_id = (SELECT id FROM school_levels WHERE name = 'Secondary');
SET @technique_id = (SELECT id FROM school_levels WHERE name = 'Enseignement Technique');

-- Insertion des classes par défaut
INSERT IGNORE INTO school_classes (id, levelId, name, `order`) VALUES
-- Maternelle
(UUID(), @maternelle_id, 'Petite Section', 1),
(UUID(), @maternelle_id, 'Moyenne Section', 2),
(UUID(), @maternelle_id, 'Grande Section', 3),

-- Nursery (Anglophone)
(UUID(), @nursery_id, 'Nursery 1', 1),
(UUID(), @nursery_id, 'Nursery 2', 2),
(UUID(), @nursery_id, 'Nursery 3', 3),

-- Primaire
(UUID(), @primaire_id, 'SIL', 1),
(UUID(), @primaire_id, 'CP', 2),
(UUID(), @primaire_id, 'CE1', 3),
(UUID(), @primaire_id, 'CE2', 4),
(UUID(), @primaire_id, 'CM1', 5),
(UUID(), @primaire_id, 'CM2', 6),

-- Primary (Anglophone)
(UUID(), @primary_id, 'Class 1', 1),
(UUID(), @primary_id, 'Class 2', 2),
(UUID(), @primary_id, 'Class 3', 3),
(UUID(), @primary_id, 'Class 4', 4),
(UUID(), @primary_id, 'Class 5', 5),

-- Secondaire
(UUID(), @secondaire_id, '6ème', 1),
(UUID(), @secondaire_id, '5ème', 2),
(UUID(), @secondaire_id, '4ème', 3),
(UUID(), @secondaire_id, '3ème', 4),
(UUID(), @secondaire_id, '2nde', 5),
(UUID(), @secondaire_id, '1ère', 6),
(UUID(), @secondaire_id, 'Terminale', 7),

-- Secondary (Anglophone)
(UUID(), @secondary_id, 'Form 1', 1),
(UUID(), @secondary_id, 'Form 2', 2),
(UUID(), @secondary_id, 'Form 3', 3),
(UUID(), @secondary_id, 'Form 4', 4),
(UUID(), @secondary_id, 'Form 5', 5),
(UUID(), @secondary_id, 'Lower 6', 6),
(UUID(), @secondary_id, 'Upper 6', 7),

-- Enseignement Technique
(UUID(), @technique_id, '1ère Année', 1),
(UUID(), @technique_id, '2ème Année', 2),
(UUID(), @technique_id, '3ème Année', 3),
(UUID(), @technique_id, '4ème Année', 4),
(UUID(), @technique_id, '5ème Année', 5); 

-- Table des présences (corrigée)
CREATE TABLE IF NOT EXISTS presences (
  id VARCHAR(255) PRIMARY KEY,
  type ENUM('eleve', 'personnel') NOT NULL,
  personId VARCHAR(255) NOT NULL,
  personName VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'retard', 'exclusion') NOT NULL DEFAULT 'present',
  details TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_person (personId),
  INDEX idx_status (status)
);

-- Tables de sécurité

-- Table des politiques de mots de passe
CREATE TABLE IF NOT EXISTS password_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  minLength INT NOT NULL DEFAULT 8,
  requireUppercase BOOLEAN NOT NULL DEFAULT true,
  requireLowercase BOOLEAN NOT NULL DEFAULT true,
  requireNumbers BOOLEAN NOT NULL DEFAULT true,
  requireSpecialChars BOOLEAN NOT NULL DEFAULT true,
  maxAge INT NOT NULL DEFAULT 90,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des paramètres de sécurité
CREATE TABLE IF NOT EXISTS security_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionTimeout INT NOT NULL DEFAULT 30,
  maxLoginAttempts INT NOT NULL DEFAULT 5,
  lockoutDuration INT NOT NULL DEFAULT 15,
  requireTwoFactor BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSON,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertion des données par défaut pour les tables de sécurité

-- Données par défaut pour password_policies
INSERT IGNORE INTO password_policies (minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, maxAge)
VALUES (8, true, true, true, true, 90);

-- Données par défaut pour security_settings
INSERT IGNORE INTO security_settings (sessionTimeout, maxLoginAttempts, lockoutDuration, requireTwoFactor)
VALUES (30, 5, 15, false);

-- Rôles par défaut
INSERT IGNORE INTO roles (id, name, description, permissions, isActive) VALUES
('role-admin', 'Administrateur', 'Accès complet au système', '["users.read","users.create","users.update","users.delete","roles.read","roles.create","roles.update","roles.delete","students.read","students.create","students.update","students.delete","finances.read","finances.create","finances.update","finances.delete","reports.read","reports.create","settings.read","settings.update","security.read","security.update","backup.create","backup.restore"]', true),
('role-direction', 'Direction', 'Gestion de l\'établissement', '["students.read","students.create","students.update","students.delete","finances.read","finances.create","finances.update","finances.delete","reports.read","reports.create","settings.read","settings.update"]', true),
('role-comptable', 'Comptable', 'Gestion financière', '["finances.read","finances.create","finances.update","finances.delete","reports.read","reports.create"]', true),
('role-enseignant', 'Enseignant', 'Gestion des élèves', '["students.read","students.create","students.update"]', true);

-- Insertion des matières par défaut
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

-- Insertion des types d'évaluation par défaut
INSERT IGNORE INTO evaluation_types (id, name, description, weight, maxScore) VALUES
('eval-controle', 'Contrôle', 'Évaluation écrite en classe', 1.00, 20),
('eval-devoir', 'Devoir', 'Devoir à la maison', 1.00, 20),
('eval-composition', 'Composition', 'Évaluation importante', 2.00, 20),
('eval-oral', 'Oral', 'Évaluation orale', 0.50, 20),
('eval-tp', 'Travaux pratiques', 'Travaux pratiques', 0.75, 20),
('eval-examen', 'Examen', 'Examen final', 3.00, 20);

-- Insertion des périodes d'évaluation par défaut
INSERT IGNORE INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('period-trim1', '1er Trimestre', '2024-09-01', '2024-12-31', '2024-2025'),
('period-trim2', '2ème Trimestre', '2025-01-01', '2025-03-31', '2024-2025'),
('period-trim3', '3ème Trimestre', '2025-04-01', '2025-06-30', '2024-2025');

-- Insertion des paramètres de notation par défaut
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

-- Table des affectations des enseignants
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id VARCHAR(255) PRIMARY KEY,
  teacherId VARCHAR(255) NOT NULL,
  classId VARCHAR(36) NOT NULL,
  subjectId VARCHAR(255) NOT NULL,
  schoolYear VARCHAR(10) NOT NULL,
  hoursPerWeek DECIMAL(4,1) NOT NULL DEFAULT 2.0,
  isMainTeacher BOOLEAN NOT NULL DEFAULT false,
  semester VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Contraintes
  UNIQUE KEY unique_teacher_class_subject_year (teacherId, classId, subjectId, schoolYear),
  FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (classId) REFERENCES school_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,

  -- Index pour les performances
  INDEX idx_teacher (teacherId),
  INDEX idx_class (classId),
  INDEX idx_subject (subjectId),
  INDEX idx_school_year (schoolYear)
);

-- Données d'exemple pour les présences (optionnel)
INSERT IGNORE INTO presences (id, type, personId, personName, date, status, details, createdAt, updatedAt) VALUES
('presence-1', 'eleve', 'student-1', 'Jean Dupont', '2025-01-28', 'present', 'Arrivé à l\'heure', NOW(), NOW()),
('presence-2', 'eleve', 'student-2', 'Marie Martin', '2025-01-28', 'retard', 'Arrivé 15 minutes en retard', NOW(), NOW()),
('presence-3', 'personnel', 'user-1', 'Prof. Smith', '2025-01-28', 'present', 'Présent toute la journée', NOW(), NOW()),
('presence-4', 'eleve', 'student-3', 'Pierre Durand', '2025-01-28', 'absent', 'Absence justifiée - maladie', NOW(), NOW()),
('presence-5', 'personnel', 'user-2', 'Mme. Johnson', '2025-01-28', 'present', 'Présente', NOW(), NOW());