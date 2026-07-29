-- ================================================================
-- Script d'initialisation FosilaMaster pour une nouvelle école
-- Usage: mysql -u USER -pPASS NOM_DE_LA_DB < init_school.sql
-- ================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------- STRUCTURE DES TABLES --------

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `api_key` text NOT NULL,
  `endpoint` text,
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `rate_limit_requests_per_minute` int DEFAULT '60',
  `timeout_seconds` int DEFAULT '30',
  `retry_attempts` int DEFAULT '3',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `api_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `api_name` varchar(255) NOT NULL,
  `api_key` text NOT NULL,
  `api_endpoint` text,
  `api_model` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `rate_limit_requests_per_minute` int DEFAULT '60',
  `timeout_seconds` int DEFAULT '30',
  `retry_attempts` int DEFAULT '3',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL,
  `action` varchar(50) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `details` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `evaluation_types` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `weight` decimal(4,2) NOT NULL DEFAULT '1.00',
  `maxScore` int NOT NULL DEFAULT '20',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `evaluation_periods` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('sequence','trimestre') NOT NULL DEFAULT 'sequence',
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `order` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `school_levels` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `order` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `school_classes` (
  `id` varchar(36) NOT NULL,
  `levelId` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `levelId` (`levelId`),
  CONSTRAINT `school_classes_ibfk_1` FOREIGN KEY (`levelId`) REFERENCES `school_levels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `school_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slogan` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `bp` varchar(50) DEFAULT NULL,
  `logoUrl` longtext,
  `currentSchoolYear` varchar(20) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'XAF',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `photoUrl` longtext,
  `passwordHash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `password_policies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `minLength` int NOT NULL DEFAULT '8',
  `requireUppercase` tinyint(1) NOT NULL DEFAULT '1',
  `requireLowercase` tinyint(1) NOT NULL DEFAULT '1',
  `requireNumbers` tinyint(1) NOT NULL DEFAULT '1',
  `requireSpecialChars` tinyint(1) NOT NULL DEFAULT '1',
  `maxAge` int NOT NULL DEFAULT '90',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `security_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionTimeout` int NOT NULL DEFAULT '30',
  `maxLoginAttempts` int NOT NULL DEFAULT '5',
  `lockoutDuration` int NOT NULL DEFAULT '15',
  `requireTwoFactor` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `grading_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `settingKey` varchar(100) NOT NULL,
  `settingValue` text NOT NULL,
  `description` text,
  `category` varchar(100) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settingKey` (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `permissions` json DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `students` (
  `id` varchar(20) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `sexe` varchar(10) DEFAULT NULL,
  `dateNaissance` date NOT NULL,
  `lieuNaissance` varchar(255) NOT NULL,
  `nationalite` varchar(100) DEFAULT NULL,
  `acteNaissance` varchar(100) DEFAULT NULL,
  `photoUrl` longtext,
  `infoParent` json NOT NULL,
  `infoParent2` json DEFAULT NULL,
  `niveau` varchar(100) NOT NULL,
  `classe` varchar(100) NOT NULL,
  `anneeScolaire` varchar(10) NOT NULL,
  `historiqueClasse` json NOT NULL,
  `statut` varchar(50) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `maxScore` int NOT NULL DEFAULT '20',
  `coefficient` decimal(3,1) DEFAULT '1.0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `classId` varchar(100) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subject_class_year` (`code`,`classId`,`schoolYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `class_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `className` varchar(100) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `subjectId` varchar(255) NOT NULL,
  `subjectName` varchar(255) NOT NULL,
  `coefficient` decimal(4,2) NOT NULL,
  `maxScore` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_subject` (`className`,`schoolYear`,`subjectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `grades` (
  `id` varchar(100) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `classId` varchar(100) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `subjectId` varchar(100) NOT NULL,
  `evaluationTypeId` varchar(100) NOT NULL,
  `evaluationPeriodId` varchar(100) DEFAULT NULL,
  `score` decimal(5,2) NOT NULL,
  `maxScore` decimal(5,2) NOT NULL DEFAULT '20.00',
  `coefficient` decimal(4,2) NOT NULL DEFAULT '1.00',
  `weightedScore` decimal(6,2) DEFAULT NULL,
  `assessment` text,
  `recordedBy` varchar(100) NOT NULL,
  `recordedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `period_averages` (
  `id` varchar(100) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `classId` varchar(100) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `evaluationPeriodId` varchar(100) NOT NULL,
  `averageScore` decimal(5,2) NOT NULL,
  `totalCoefficient` decimal(6,2) NOT NULL,
  `studentRank` int DEFAULT NULL,
  `totalStudents` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `general_averages` (
  `id` varchar(100) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `classId` varchar(100) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `averageScore` decimal(5,2) NOT NULL,
  `totalCoefficient` decimal(6,2) NOT NULL,
  `studentRank` int DEFAULT NULL,
  `totalStudents` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `report_cards` (
  `id` varchar(100) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `classId` varchar(100) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `evaluationPeriodId` varchar(100) DEFAULT NULL,
  `averageScore` decimal(5,2) NOT NULL,
  `totalCoefficient` decimal(5,2) DEFAULT '0.00',
  `studentRank` int DEFAULT NULL,
  `totalStudents` int DEFAULT NULL,
  `teacherComments` text,
  `principalComments` text,
  `mention` varchar(50) DEFAULT NULL,
  `parentSignature` varchar(100) DEFAULT NULL,
  `issuedBy` varchar(100) NOT NULL,
  `issuedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `personnel_types` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `color` varchar(7) DEFAULT '#3B82F6',
  `icon` varchar(50) DEFAULT 'User',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `personnel` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'Personnel',
  `type_personnel` varchar(100) DEFAULT NULL,
  `dateEmbauche` date DEFAULT NULL,
  `dateFinContrat` date DEFAULT NULL,
  `typeContrat` enum('CDI','CDD','Stage','Vacataire') DEFAULT NULL,
  `salaire` decimal(10,2) DEFAULT NULL,
  `statut` enum('Actif','Inactif','En congé','Démission') DEFAULT 'Actif',
  `specialite` varchar(255) DEFAULT NULL,
  `diplome` varchar(255) DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `photoUrl` longtext,
  `personnelTypeId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `teacher_assignments` (
  `id` varchar(255) NOT NULL,
  `teacherId` varchar(255) NOT NULL,
  `teacherName` varchar(255) NOT NULL,
  `classId` varchar(255) DEFAULT NULL,
  `className` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `schoolYear` varchar(20) NOT NULL,
  `hoursPerWeek` int NOT NULL DEFAULT '0',
  `isMainTeacher` tinyint(1) NOT NULL DEFAULT '0',
  `semester` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `presences` (
  `id` varchar(255) NOT NULL,
  `type` enum('eleve','personnel') NOT NULL,
  `personId` varchar(255) NOT NULL,
  `personName` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','retard','exclusion') NOT NULL DEFAULT 'present',
  `details` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` varchar(255) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `method` varchar(50) NOT NULL,
  `reason` text,
  `cashier` varchar(255) NOT NULL,
  `cashierUsername` varchar(255) NOT NULL,
  `installmentsPaid` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `receiptNumber` int NOT NULL AUTO_INCREMENT,
  `paymentId` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`receiptNumber`),
  UNIQUE KEY `paymentId` (`paymentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `fee_structures` (
  `className` varchar(100) NOT NULL,
  `registrationFee` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `installments` json NOT NULL,
  PRIMARY KEY (`className`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `financial_services` (
  `id` varchar(64) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(50) NOT NULL,
  `levelId` varchar(36) DEFAULT NULL,
  `classId` varchar(36) DEFAULT NULL,
  `schoolYear` varchar(10) DEFAULT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `financial_service_payments` (
  `id` varchar(64) NOT NULL,
  `studentId` varchar(32) NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `serviceId` varchar(64) NOT NULL,
  `serviceName` varchar(200) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `method` varchar(50) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cashier` varchar(100) DEFAULT NULL,
  `cashierUsername` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `financial_transactions` (
  `id` varchar(64) NOT NULL,
  `serviceId` varchar(64) DEFAULT NULL,
  `serviceName` varchar(200) DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `totalAmount` decimal(12,2) NOT NULL,
  `date` datetime NOT NULL,
  `schoolYear` varchar(10) NOT NULL,
  `cashier` varchar(100) DEFAULT NULL,
  `notes` text,
  `studentId` varchar(20) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_risk_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `settings` json NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` varchar(255) NOT NULL,
  `personnelId` varchar(255) NOT NULL,
  `personnelName` varchar(255) NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `baseSalary` decimal(10,2) NOT NULL,
  `bonuses` decimal(10,2) DEFAULT '0.00',
  `deductions` decimal(10,2) DEFAULT '0.00',
  `netSalary` decimal(10,2) NOT NULL,
  `status` enum('En attente','Payé','Annulé') DEFAULT 'En attente',
  `paymentDate` date DEFAULT NULL,
  `notes` text,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `schema_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schema_data` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- Initialiser les niveaux par défaut
INSERT IGNORE INTO school_levels (id, name, `order`, isActive) VALUES
('maternelle-id', 'Maternelle', 1, 1),
('primaire-id', 'Primaire', 2, 1),
('secondaire-fr-id', 'Secondaire', 3, 1),
('nursery-en-id', 'Nursery', 4, 1),
('primary-en-id', 'Primary', 5, 1),
('secondary-en-id', 'Secondary', 6, 1),
('technique-fr-id', 'Enseignement Technique', 7, 1),
('technique-en-id', 'Technical Education', 8, 1);

-- Initialiser les classes par défaut
INSERT IGNORE INTO school_classes (id, levelId, name, `order`) VALUES
(UUID(), 'maternelle-id', 'Petite Section', 1),
(UUID(), 'maternelle-id', 'Moyenne Section', 2),
(UUID(), 'maternelle-id', 'Grande Section', 3),

(UUID(), 'primaire-id', 'SIL', 1),
(UUID(), 'primaire-id', 'CP', 2),
(UUID(), 'primaire-id', 'CE1', 3),
(UUID(), 'primaire-id', 'CE2', 4),
(UUID(), 'primaire-id', 'CM1', 5),
(UUID(), 'primaire-id', 'CM2', 6),

(UUID(), 'secondaire-fr-id', '6ème', 1),
(UUID(), 'secondaire-fr-id', '5ème', 2),
(UUID(), 'secondaire-fr-id', '4ème', 3),
(UUID(), 'secondaire-fr-id', '3ème', 4),
(UUID(), 'secondaire-fr-id', '2nde', 5),
(UUID(), 'secondaire-fr-id', '1ère', 6),
(UUID(), 'secondaire-fr-id', 'Terminale', 7);

-- Initialiser les types de personnel par défaut
INSERT IGNORE INTO personnel_types (id, name, description, color, icon) VALUES
('pt-ens', 'Enseignant', 'Personnel enseignant de l''établissement', '#3B82F6', 'BookOpen'),
('pt-dir', 'Direction', 'Personnel dirigeant (Proviseur, Censeur, etc.)', '#8B5CF6', 'Briefcase'),
('pt-adm', 'Administration', 'Personnel administratif (Secrétariat, Scolarité, etc.)', '#10B981', 'Users'),
('pt-surv', 'Surveillance', 'Surveillants généraux et surveillants de secteur', '#F59E0B', 'Shield'),
('pt-comp', 'Comptabilité', 'Service financier et comptabilité', '#EF4444', 'Calculator'),
('pt-maint', 'Maintenance', 'Personnel d''entretien et gardiennage', '#6B7280', 'Tool');

