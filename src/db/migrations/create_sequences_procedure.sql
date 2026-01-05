-- Procédure pour créer automatiquement les 6 séquences d'une nouvelle année scolaire
-- Système simple : 6 séquences par année, sans dates fixes

DELIMITER //

CREATE PROCEDURE CreateSequencesForYear(IN schoolYear VARCHAR(10))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 1. Vérifier que l'année n'existe pas déjà
    IF EXISTS (SELECT 1 FROM evaluation_periods WHERE schoolYear = schoolYear AND id LIKE 'seq%-%') THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Les séquences pour cette année scolaire existent déjà';
    END IF;
    
    -- 2. Créer automatiquement les 6 séquences pour l'année donnée (sans dates fixes)
    INSERT INTO evaluation_periods (id, name, schoolYear, isActive) VALUES
    (CONCAT('seq1-', schoolYear), '1ère Séquence', schoolYear, 1),
    (CONCAT('seq2-', schoolYear), '2ème Séquence', schoolYear, 1),
    (CONCAT('seq3-', schoolYear), '3ème Séquence', schoolYear, 1),
    (CONCAT('seq4-', schoolYear), '4ème Séquence', schoolYear, 1),
    (CONCAT('seq5-', schoolYear), '5ème Séquence', schoolYear, 1),
    (CONCAT('seq6-', schoolYear), '6ème Séquence', schoolYear, 1);
     
    -- 3. Confirmer la création
    SELECT CONCAT('✅ ', COUNT(*), ' séquences créées pour l''année ', schoolYear) as result
    FROM evaluation_periods 
    WHERE schoolYear = schoolYear AND id LIKE 'seq%-%';
     
    COMMIT;
END //
DELIMITER ;

-- ========================================
-- UTILISATION DE LA PROCÉDURE
-- ========================================

-- Créer les séquences pour 2026-2027
-- CALL CreateSequencesForYear('2026-2027');

-- Créer les séquences pour 2027-2028  
-- CALL CreateSequencesForYear('2027-2028');

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Voir toutes les séquences par année
-- SELECT schoolYear, COUNT(*) as nb_sequences, GROUP_CONCAT(id ORDER BY id) as sequences
-- FROM evaluation_periods 
-- WHERE id LIKE 'seq%-%'
-- GROUP BY schoolYear
-- ORDER BY schoolYear;