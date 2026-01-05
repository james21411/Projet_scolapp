-- Script pour vérifier les données d'évaluation existantes
-- Exécutez ce script pour voir l'état actuel de vos tables

-- 1. Vérifier les types d'évaluation existants
SELECT '=== TYPES D\'ÉVALUATION ===' as info;
SELECT 
    id,
    name,
    description,
    weight,
    maxScore,
    isActive,
    createdAt
FROM evaluation_types
ORDER BY name;

-- 2. Vérifier les périodes d'évaluation existantes
SELECT '=== PÉRIODES D\'ÉVALUATION ===' as info;
SELECT 
    id,
    name,
    startDate,
    endDate,
    schoolYear,
    isActive,
    createdAt
FROM evaluation_periods
ORDER BY schoolYear, startDate;

-- 3. Vérifier les notes existantes (structure)
SELECT '=== STRUCTURE DES NOTES ===' as info;
SELECT 
    COUNT(*) as total_notes,
    COUNT(DISTINCT evaluationTypeId) as types_evaluation_utilises,
    COUNT(DISTINCT evaluationPeriodId) as periodes_evaluation_utilisees
FROM grades;

-- 4. Vérifier les types d'évaluation utilisés dans les notes
SELECT '=== TYPES D\'ÉVALUATION UTILISÉS DANS LES NOTES ===' as info;
SELECT 
    g.evaluationTypeId,
    et.name as type_name,
    COUNT(*) as nombre_notes
FROM grades g
LEFT JOIN evaluation_types et ON g.evaluationTypeId = et.id
GROUP BY g.evaluationTypeId, et.name
ORDER BY nombre_notes DESC;

-- 5. Vérifier les périodes d'évaluation utilisées dans les notes
SELECT '=== PÉRIODES D\'ÉVALUATION UTILISÉES DANS LES NOTES ===' as info;
SELECT 
    g.evaluationPeriodId,
    ep.name as periode_name,
    COUNT(*) as nombre_notes
FROM grades g
LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
GROUP BY g.evaluationPeriodId, ep.name
ORDER BY nombre_notes DESC;

-- 6. Vérifier les contraintes de clés étrangères
SELECT '=== VÉRIFICATION DES CONTRAINTES ===' as info;
SELECT 
    'Grades avec evaluationTypeId invalide' as probleme,
    COUNT(*) as nombre
FROM grades g
LEFT JOIN evaluation_types et ON g.evaluationTypeId = et.id
WHERE et.id IS NULL
UNION ALL
SELECT 
    'Grades avec evaluationPeriodId invalide' as probleme,
    COUNT(*) as nombre
FROM grades g
LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
WHERE g.evaluationPeriodId IS NOT NULL AND ep.id IS NULL;
