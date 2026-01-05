-- Migration pour ajouter la table des affectations des enseignants
-- Date: 2025-09-02
-- Description: Ajout de la table teacher_assignments pour gérer les affectations des enseignants

-- Création de la table des affectations des enseignants
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

-- Note: Les données d'exemple seront insérées séparément après vérification des tables existantes
-- Pour éviter les erreurs de syntaxe avec les variables utilisateur