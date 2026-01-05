-- Script pour supprimer TOUS les types et périodes d'évaluation
-- ATTENTION: Cette opération est IRREVERSIBLE !

USE scolapp;

-- 1. Supprimer d'abord toutes les notes liées aux périodes d'évaluation
DELETE FROM grades WHERE evaluationPeriodId IN (SELECT id FROM evaluation_periods);

-- 2. Supprimer toutes les notes liées aux types d'évaluation
DELETE FROM grades WHERE evaluationTypeId IN (SELECT id FROM evaluation_types);

-- 3. Supprimer toutes les périodes d'évaluation
DELETE FROM evaluation_periods;

-- 4. Supprimer tous les types d'évaluation
DELETE FROM evaluation_types;

-- 5. Vérifier que tout est supprimé
SELECT 
    'Types d\'évaluation restants' as type,
    COUNT(*) as count 
FROM evaluation_types
UNION ALL
SELECT 
    'Périodes d\'évaluation restantes' as type,
    COUNT(*) as count 
FROM evaluation_periods
UNION ALL
SELECT 
    'Notes restantes' as type,
    COUNT(*) as count 
FROM grades;

-- 6. Réinitialiser l'auto-increment si nécessaire
ALTER TABLE evaluation_types AUTO_INCREMENT = 1;
ALTER TABLE evaluation_periods AUTO_INCREMENT = 1;

-- 7. Message de confirmation
SELECT '✅ TOUS les types et périodes d\'évaluation ont été supprimés avec succès!' as result;
