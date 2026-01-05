-- Script pour corriger les doublons dans les séquences d'évaluation
-- Standardiser les IDs et éliminer la confusion

-- 1. Supprimer les anciens types d'évaluation complexes
DELETE FROM evaluation_types WHERE id NOT LIKE 'seq%';

-- 2. Supprimer les périodes d'évaluation en double (garder seulement les 6 séquences standard)
DELETE FROM evaluation_periods WHERE id IN (
    'seq-1-2025-2026', 'seq-2-2025-2026', 'seq-3-2025-2026', 
    'seq-4-2025-2026', 'seq-5-2025-2026', 'seq-6-2025-2026'
);

-- 3. Mettre à jour les notes existantes pour utiliser les bons IDs
UPDATE grades SET evaluationTypeId = 'seq1' WHERE evaluationPeriodId = 'seq1-2025-2026';
UPDATE grades SET evaluationTypeId = 'seq2' WHERE evaluationPeriodId = 'seq2-2025-2026';
UPDATE grades SET evaluationTypeId = 'seq3' WHERE evaluationPeriodId = 'seq3-2025-2026';
UPDATE grades SET evaluationTypeId = 'seq4' WHERE evaluationPeriodId = 'seq4-2025-2026';
UPDATE grades SET evaluationTypeId = 'seq5' WHERE evaluationPeriodId = 'seq5-2025-2026';
UPDATE grades SET evaluationTypeId = 'seq6' WHERE evaluationPeriodId = 'seq6-2025-2026';

-- 4. Créer les types d'évaluation correspondants
INSERT IGNORE INTO evaluation_types (id, name, description, weight, maxScore, isActive) VALUES
('seq1', '1ère Séquence', 'Première séquence d\'évaluation', 1.00, 20, 1),
('seq2', '2ème Séquence', 'Deuxième séquence d\'évaluation', 1.00, 20, 1),
('seq3', '3ème Séquence', 'Troisième séquence d\'évaluation', 1.00, 20, 1),
('seq4', '4ème Séquence', 'Quatrième séquence d\'évaluation', 1.00, 20, 1),
('seq5', '5ème Séquence', 'Cinquième séquence d\'évaluation', 1.00, 20, 1),
('seq6', '6ème Séquence', 'Sixième séquence d\'évaluation', 1.00, 20, 1);

-- 5. Vérifier le résultat
SELECT '=== TYPES D\'ÉVALUATION APRÈS NETTOYAGE ===' as info;
SELECT id, name, weight, maxScore FROM evaluation_types ORDER BY name;

SELECT '=== PÉRIODES D\'ÉVALUATION APRÈS NETTOYAGE ===' as info;
SELECT id, name, schoolYear FROM evaluation_periods WHERE name LIKE '%Séquence%' ORDER BY name;
