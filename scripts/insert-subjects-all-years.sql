-- Script pour insérer des matières pour toutes les années scolaires

-- Année 2023-2024
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-2023-6EME-001', 'Français', 'FR', 'Langues', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2023-2024'),
('SUBJ-2023-6EME-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2023-2024'),
('SUBJ-2023-6EME-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2023-2024'),
('SUBJ-2023-6EME-004', 'Histoire-Géographie', 'HIST-GEO', 'Sciences Humaines', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2023-2024'),
('SUBJ-2023-6EME-005', 'Sciences de la Vie et de la Terre', 'SVT', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2023-2024')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Année 2024-2025
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-2024-6EME-001', 'Français', 'FR', 'Langues', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2024-2025'),
('SUBJ-2024-6EME-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2024-2025'),
('SUBJ-2024-6EME-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2024-2025'),
('SUBJ-2024-6EME-004', 'Histoire-Géographie', 'HIST-GEO', 'Sciences Humaines', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2024-2025'),
('SUBJ-2024-6EME-005', 'Sciences de la Vie et de la Terre', 'SVT', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2024-2025')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Vérifier les matières par année
SELECT schoolYear, COUNT(*) as subjects_count FROM subjects GROUP BY schoolYear ORDER BY schoolYear; 