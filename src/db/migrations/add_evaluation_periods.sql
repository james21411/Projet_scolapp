-- Script pour ajouter les périodes d'évaluation
-- Séquences et trimestres pour l'année scolaire

-- Insérer les séquences pour l'année 2025-2026
INSERT INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('seq-1-2025-2026', '1ère Séquence', '2025-09-01', '2025-10-15', '2025-2026'),
('seq-2-2025-2026', '2ème Séquence', '2025-10-16', '2025-12-15', '2025-2026'),
('seq-3-2025-2026', '3ème Séquence', '2025-12-16', '2026-02-15', '2025-2026'),
('seq-4-2025-2026', '4ème Séquence', '2026-02-16', '2026-04-15', '2025-2026'),
('seq-5-2025-2026', '5ème Séquence', '2026-04-16', '2026-06-15', '2025-2026'),
('seq-6-2025-2026', '6ème Séquence', '2026-06-16', '2026-07-31', '2025-2026');

-- Insérer les trimestres pour l'année 2025-2026
INSERT INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('trim-1-2025-2026', '1er Trimestre', '2025-09-01', '2025-12-15', '2025-2026'),
('trim-2-2025-2026', '2ème Trimestre', '2025-12-16', '2026-04-15', '2025-2026'),
('trim-3-2025-2026', '3ème Trimestre', '2026-04-16', '2026-07-31', '2025-2026');

-- Insérer les séquences pour l'année 2024-2025 (si nécessaire)
INSERT INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('seq-1-2024-2025', '1ère Séquence', '2024-09-01', '2024-10-15', '2024-2025'),
('seq-2-2024-2025', '2ème Séquence', '2024-10-16', '2024-12-15', '2024-2025'),
('seq-3-2024-2025', '3ème Séquence', '2024-12-16', '2025-02-15', '2024-2025'),
('seq-4-2024-2025', '4ème Séquence', '2025-02-16', '2025-04-15', '2024-2025'),
('seq-5-2024-2025', '5ème Séquence', '2025-04-16', '2025-06-15', '2024-2025'),
('seq-6-2024-2025', '6ème Séquence', '2025-06-16', '2025-07-31', '2024-2025');

-- Insérer les trimestres pour l'année 2024-2025
INSERT INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('trim-1-2024-2025', '1er Trimestre', '2024-09-01', '2024-12-15', '2024-2025'),
('trim-2-2024-2025', '2ème Trimestre', '2024-12-16', '2025-04-15', '2024-2025'),
('trim-3-2024-2025', '3ème Trimestre', '2025-04-16', '2025-07-31', '2024-2025'); 