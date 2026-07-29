-- Script de nettoyage COMPLET - Supprime TOUT
-- ATTENTION: Cette opération est IRREVERSIBLE !

USE fosilamaster;

-- 1. Désactiver les vérifications de clés étrangères temporairement
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Supprimer TOUTES les notes
TRUNCATE TABLE grades;

-- 3. Supprimer TOUTES les matières
TRUNCATE TABLE subjects;

-- 4. Supprimer TOUS les types d'évaluation
TRUNCATE TABLE evaluation_types;

-- 5. Supprimer TOUTES les périodes d'évaluation
TRUNCATE TABLE evaluation_periods;

-- 6. Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- 7. Vérifier que tout est vide
SELECT 
    'Matières' as table_name,
    COUNT(*) as count 
FROM subjects
UNION ALL
SELECT 
    'Types d\'évaluation' as table_name,
    COUNT(*) as count 
FROM evaluation_types
UNION ALL
SELECT 
    'Périodes d\'évaluation' as table_name,
    COUNT(*) as count 
FROM evaluation_periods
UNION ALL
SELECT 
    'Notes' as table_name,
    COUNT(*) as count 
FROM grades;

-- 8. Message de confirmation
SELECT '🎯 BASE DE DONNÉES COMPLÈTEMENT VIDÉE !' as result;
SELECT 'Toutes les matières, évaluations et notes ont été supprimées.' as info;
SELECT 'Vous pouvez maintenant recommencer à zéro.' as next_step;
