-- ===========================================
-- CRÉATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- ===========================================

-- TABLE: students
CREATE INDEX IF NOT EXISTS idx_students_classe_annee ON students(classe, anneeScolaire);
CREATE INDEX IF NOT EXISTS idx_students_statut ON students(statut);
CREATE INDEX IF NOT EXISTS idx_students_niveau ON students(niveau);

-- TABLE: grades
CREATE INDEX IF NOT EXISTS idx_grades_student_period_year ON grades(studentId, evaluationPeriodId, schoolYear);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subjectId);
CREATE INDEX IF NOT EXISTS idx_grades_class ON grades(classId);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON grades(studentId, subjectId);
CREATE INDEX IF NOT EXISTS idx_grades_evaluation_period ON grades(evaluationPeriodId);

-- TABLE: report_cards
CREATE INDEX IF NOT EXISTS idx_report_cards_student_period_year ON report_cards(studentId, evaluationPeriodId, schoolYear);
CREATE INDEX IF NOT EXISTS idx_report_cards_class ON report_cards(classId);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(studentId);

-- TABLE: subjects
CREATE INDEX IF NOT EXISTS idx_subjects_class_year ON subjects(classId, schoolYear);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

-- TABLE: school_classes
CREATE INDEX IF NOT EXISTS idx_school_classes_name ON school_classes(name);
CREATE INDEX IF NOT EXISTS idx_school_classes_level ON school_classes(levelId);

-- TABLE: evaluation_periods
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_year_type ON evaluation_periods(schoolYear, type);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_order ON evaluation_periods(`order`);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_active ON evaluation_periods(isActive);

-- TABLE: class_subjects
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_year ON class_subjects(className, schoolYear);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON class_subjects(subjectId);

-- TABLE: payments
CREATE INDEX IF NOT EXISTS idx_payments_student_year ON payments(studentId, schoolYear);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- TABLE: fee_structures
CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(className);

-- ===========================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ===========================================

SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND INDEX_NAME NOT LIKE 'PRIMARY'
ORDER BY TABLE_NAME, SEQ_IN_INDEX;