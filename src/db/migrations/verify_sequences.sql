-- Script de vérification et création automatique des séquences
-- À exécuter au démarrage de l'application ou manuellement

-- 1. Vérifier quelles années ont des séquences
SELECT 
    schoolYear,
    COUNT(*) as nb_sequences,
    CASE 
        WHEN COUNT(*) = 6 THEN '✅ COMPLET'
        WHEN COUNT(*) > 0 THEN '⚠️ INCOMPLET'
        ELSE '❌ MANQUANT'
    END as statut,
    GROUP_CONCAT(id ORDER BY id) as sequences
FROM evaluation_periods 
WHERE id LIKE 'seq%-%'
GROUP BY schoolYear
ORDER BY schoolYear;

-- 2. Créer les séquences manquantes pour 2024-2025 (si pas 6)
INSERT IGNORE INTO evaluation_periods (id, name, schoolYear, isActive) 
SELECT 
    CONCAT('seq5-', '2024-2025'), '5ème Séquence', '2024-2025', 1
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE id = 'seq5-2024-2025'
);

INSERT IGNORE INTO evaluation_periods (id, name, schoolYear, isActive) 
SELECT 
    CONCAT('seq6-', '2024-2025'), '6ème Séquence', '2024-2025', 1
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_periods WHERE id = 'seq6-2024-2025'
);

-- 3. Vérifier le résultat final
SELECT 
    schoolYear,
    COUNT(*) as nb_sequences,
    CASE 
        WHEN COUNT(*) = 6 THEN '✅ COMPLET'
        WHEN COUNT(*) > 0 THEN '⚠️ INCOMPLET'
        ELSE '❌ MANQUANT'
    END as statut
FROM evaluation_periods 
WHERE id LIKE 'seq%-%'
GROUP BY schoolYear
ORDER BY schoolYear;
