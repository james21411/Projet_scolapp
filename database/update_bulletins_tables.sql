-- Mettre à jour la table evaluation_periods existante
ALTER TABLE evaluation_periods 
ADD COLUMN IF NOT EXISTS type ENUM('sequence', 'trimestre') NOT NULL DEFAULT 'sequence' AFTER name,
ADD COLUMN IF NOT EXISTS `order` INT NOT NULL DEFAULT 0 AFTER schoolYear;

-- Mettre à jour la table report_cards existante
ALTER TABLE report_cards 
ADD COLUMN IF NOT EXISTS totalCoefficient DECIMAL(5,2) DEFAULT 0 AFTER averageScore,
ADD COLUMN IF NOT EXISTS mention VARCHAR(50) AFTER principalComments;

-- Insérer les périodes d'évaluation par défaut pour 2025-2026
INSERT IGNORE INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, `order`) VALUES
('seq1-2025-2026', '1ère Séquence', 'sequence', '2025-09-01', '2025-10-31', '2025-2026', 1),
('seq2-2025-2026', '2ème Séquence', 'sequence', '2025-11-01', '2025-12-31', '2025-2026', 2),
('seq3-2025-2026', '3ème Séquence', 'sequence', '2026-01-01', '2026-02-28', '2025-2026', 3),
('seq4-2025-2026', '4ème Séquence', 'sequence', '2026-03-01', '2026-04-30', '2025-2026', 4),
('trim1-2025-2026', '1er Trimestre', 'trimestre', '2025-09-01', '2025-12-31', '2025-2026', 5),
('trim2-2025-2026', '2ème Trimestre', 'trimestre', '2026-01-01', '2026-04-30', '2025-2026', 6),
('trim3-2025-2026', '3ème Trimestre', 'trimestre', '2026-05-01', '2026-07-31', '2025-2026', 7);

-- Insérer les périodes d'évaluation par défaut pour 2024-2025
INSERT IGNORE INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, `order`) VALUES
('seq1-2024-2025', '1ère Séquence', 'sequence', '2024-09-01', '2024-10-31', '2024-2025', 1),
('seq2-2024-2025', '2ème Séquence', 'sequence', '2024-11-01', '2024-12-31', '2024-2025', 2),
('seq3-2024-2025', '3ème Séquence', 'sequence', '2025-01-01', '2025-02-28', '2024-2025', 3),
('seq4-2024-2025', '4ème Séquence', 'sequence', '2025-03-01', '2025-04-30', '2024-2025', 4),
('trim1-2024-2025', '1er Trimestre', 'trimestre', '2024-09-01', '2024-12-31', '2024-2025', 5),
('trim2-2024-2025', '2ème Trimestre', 'trimestre', '2025-01-01', '2025-04-30', '2024-2025', 6),
('trim3-2024-2025', '3ème Trimestre', 'trimestre', '2025-05-01', '2025-07-31', '2024-2025', 7);
