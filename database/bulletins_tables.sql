-- Table pour les périodes d'évaluation
CREATE TABLE IF NOT EXISTS evaluation_periods (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('sequence', 'trimestre') NOT NULL DEFAULT 'sequence',
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  schoolYear VARCHAR(20) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table pour les bulletins
CREATE TABLE IF NOT EXISTS report_cards (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(255) NOT NULL,
  classId VARCHAR(255) NOT NULL,
  schoolYear VARCHAR(20) NOT NULL,
  evaluationPeriodId VARCHAR(255) NOT NULL,
  averageScore DECIMAL(5,2) DEFAULT 0,
  totalCoefficient DECIMAL(5,2) DEFAULT 0,
  rank INT DEFAULT 0,
  totalStudents INT DEFAULT 0,
  teacherComments TEXT,
  principalComments TEXT,
  mention VARCHAR(50),
  issuedBy VARCHAR(255),
  issuedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluationPeriodId) REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bulletin (studentId, evaluationPeriodId, schoolYear)
);

-- Index pour améliorer les performances
CREATE INDEX idx_evaluation_periods_school_year ON evaluation_periods(schoolYear);
CREATE INDEX idx_report_cards_student ON report_cards(studentId);
CREATE INDEX idx_report_cards_period ON report_cards(evaluationPeriodId);
CREATE INDEX idx_report_cards_class ON report_cards(classId);

-- Insérer quelques périodes d'évaluation par défaut
INSERT IGNORE INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, `order`) VALUES
('seq1-2025-2026', '1ère Séquence', 'sequence', '2025-09-01', '2025-10-31', '2025-2026', 1),
('seq2-2025-2026', '2ème Séquence', 'sequence', '2025-11-01', '2025-12-31', '2025-2026', 2),
('seq3-2025-2026', '3ème Séquence', 'sequence', '2026-01-01', '2026-02-28', '2025-2026', 3),
('seq4-2025-2026', '4ème Séquence', 'sequence', '2026-03-01', '2026-04-30', '2025-2026', 4),
('trim1-2025-2026', '1er Trimestre', 'trimestre', '2025-09-01', '2025-12-31', '2025-2026', 5),
('trim2-2025-2026', '2ème Trimestre', 'trimestre', '2026-01-01', '2026-04-30', '2025-2026', 6),
('trim3-2025-2026', '3ème Trimestre', 'trimestre', '2026-05-01', '2026-07-31', '2025-2026', 7);
