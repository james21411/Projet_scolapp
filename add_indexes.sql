-- ============================================================
-- Script d'ajout des INDEX pour optimiser les performances
-- Compatible MySQL 8.0 (sans IF NOT EXISTS sur ALTER TABLE ADD INDEX)
-- Utilise des procédures pour ignorer les doublons
-- ============================================================

-- ============================================================
-- TABLE : grades  (table la plus interrogée : 56 SELECT)
-- ============================================================
DROP PROCEDURE IF EXISTS add_index_safe;
DELIMITER //
CREATE PROCEDURE add_index_safe(
  IN tbl VARCHAR(100),
  IN idx VARCHAR(100),
  IN cols VARCHAR(500)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE table_schema = DATABASE()
    AND table_name = tbl
    AND index_name = idx
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD INDEX `', idx, '` (', cols, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- grades
CALL add_index_safe('grades', 'idx_grades_student_period_year', 'studentId, evaluationPeriodId, schoolYear');
CALL add_index_safe('grades', 'idx_grades_class_period', 'classId, evaluationPeriodId, schoolYear');
CALL add_index_safe('grades', 'idx_grades_subject_period', 'subjectId, evaluationPeriodId, schoolYear');
CALL add_index_safe('grades', 'idx_grades_year', 'schoolYear');

-- students
CALL add_index_safe('students', 'idx_students_classe_year', 'classe, anneeScolaire');
CALL add_index_safe('students', 'idx_students_niveau_year', 'niveau, anneeScolaire');
CALL add_index_safe('students', 'idx_students_statut', 'statut');
CALL add_index_safe('students', 'idx_students_year', 'anneeScolaire');

-- report_cards
CALL add_index_safe('report_cards', 'idx_rc_student_period_year', 'studentId, evaluationPeriodId, schoolYear');
CALL add_index_safe('report_cards', 'idx_rc_class_period', 'classId, evaluationPeriodId, schoolYear');

-- subjects
CALL add_index_safe('subjects', 'idx_subjects_class_year', 'classId, schoolYear');
CALL add_index_safe('subjects', 'idx_subjects_year_active', 'schoolYear, isActive');

-- class_subjects
CALL add_index_safe('class_subjects', 'idx_cs_classname_year', 'className, schoolYear');

-- evaluation_periods
CALL add_index_safe('evaluation_periods', 'idx_ep_year_active', 'schoolYear, isActive');
CALL add_index_safe('evaluation_periods', 'idx_ep_year_type', 'schoolYear, `type`');

-- school_classes
CALL add_index_safe('school_classes', 'idx_sc_name', 'name');

-- school_levels
CALL add_index_safe('school_levels', 'idx_sl_isactive', 'isActive');

-- period_averages
CALL add_index_safe('period_averages', 'idx_pa_student_period', 'studentId, evaluationPeriodId, schoolYear');
CALL add_index_safe('period_averages', 'idx_pa_class_period', 'classId, evaluationPeriodId, schoolYear');

-- personnel (si la table existe)
CALL add_index_safe('personnel', 'idx_personnel_type', 'personnelTypeId');
CALL add_index_safe('personnel', 'idx_personnel_statut', 'statut');

-- teacher_assignments (si la table existe)
CALL add_index_safe('teacher_assignments', 'idx_ta_teacher_year', 'teacherId, schoolYear');

DROP PROCEDURE IF EXISTS add_index_safe;

SELECT 'Index créés avec succès !' AS status;
