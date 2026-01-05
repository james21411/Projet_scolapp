-- Script pour insérer des matières de test pour toutes les classes

-- D'abord, récupérer toutes les classes disponibles
SELECT id, name, level FROM classes WHERE isActive = 1;

-- Insérer des matières de test pour chaque classe
-- Classe 6ème
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-6EME-001', 'Français', 'FR', 'Langues', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-004', 'Histoire-Géographie', 'HIST-GEO', 'Sciences Humaines', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-005', 'Sciences de la Vie et de la Terre', 'SVT', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-006', 'Technologie', 'TECH', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-007', 'Arts Plastiques', 'ARTS', 'Arts', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-008', 'Éducation Musicale', 'MUSIC', 'Arts', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-009', 'Éducation Physique et Sportive', 'EPS', 'Sport', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-6EME-010', 'Informatique', 'INFO', 'Sciences', 20, true, '0aa49b3e-6be1-11f0-a457-a08cfda86800', '2025-2026')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Classe 5ème
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-5EME-001', 'Français', 'FR', 'Langues', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-004', 'Histoire-Géographie', 'HIST-GEO', 'Sciences Humaines', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-005', 'Sciences de la Vie et de la Terre', 'SVT', 'Sciences', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-006', 'Physique-Chimie', 'PHY-CHI', 'Sciences', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-007', 'Technologie', 'TECH', 'Sciences', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-008', 'Arts Plastiques', 'ARTS', 'Arts', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-009', 'Éducation Musicale', 'MUSIC', 'Arts', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-5EME-010', 'Éducation Physique et Sportive', 'EPS', 'Sport', 20, true, '0aa49b3f-6be1-11f0-a457-a08cfda86800', '2025-2026')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Classe 4ème
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-4EME-001', 'Français', 'FR', 'Langues', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-004', 'Histoire-Géographie', 'HIST-GEO', 'Sciences Humaines', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-005', 'Sciences de la Vie et de la Terre', 'SVT', 'Sciences', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-006', 'Physique-Chimie', 'PHY-CHI', 'Sciences', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-007', 'Technologie', 'TECH', 'Sciences', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-008', 'Arts Plastiques', 'ARTS', 'Arts', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-009', 'Éducation Musicale', 'MUSIC', 'Arts', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-4EME-010', 'Éducation Physique et Sportive', 'EPS', 'Sport', 20, true, '0aa49b40-6be1-11f0-a457-a08cfda86800', '2025-2026')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Classe 3ème
INSERT INTO subjects (id, name, code, category, maxScore, isActive, classId, schoolYear) VALUES
('SUBJ-3EME-001', 'Français', 'FR', 'Langues', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-002', 'Mathématiques', 'MATH', 'Sciences', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-003', 'Anglais', 'ANG', 'Langues', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-004', 'Histoire-Géographie', 'HIST-GEO', 'Sciences Humaines', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-005', 'Sciences de la Vie et de la Terre', 'SVT', 'Sciences', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-006', 'Physique-Chimie', 'PHY-CHI', 'Sciences', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-007', 'Technologie', 'TECH', 'Sciences', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-008', 'Arts Plastiques', 'ARTS', 'Arts', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-009', 'Éducation Musicale', 'MUSIC', 'Arts', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026'),
('SUBJ-3EME-010', 'Éducation Physique et Sportive', 'EPS', 'Sport', 20, true, '0aa49b41-6be1-11f0-a457-a08cfda86800', '2025-2026')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), maxScore = VALUES(maxScore);

-- Vérifier les matières insérées
SELECT COUNT(*) as total_subjects FROM subjects WHERE schoolYear = '2025-2026';
SELECT classId, COUNT(*) as subjects_count FROM subjects WHERE schoolYear = '2025-2026' GROUP BY classId; 