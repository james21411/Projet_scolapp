-- ===========================================
-- OPTIMISATION DE LA BASE DE DONNÉES SCOLAPP
-- Script pour créer les index et optimiser les performances
-- ===========================================

-- Désactiver les vérifications des clés étrangères temporairement pour accélérer les opérations
SET FOREIGN_KEY_CHECKS = 0;

-- ===========================================
-- TABLE: students
-- Colonnes fréquemment utilisées dans les WHERE clauses
-- ===========================================

-- Index sur l'ID (clé primaire déjà indexée automatiquement)
-- Index composite pour les recherches par classe et année scolaire
CREATE INDEX idx_students_classe_annee ON students(classe, anneeScolaire);

-- Index sur le statut pour filtrer les élèves actifs
CREATE INDEX idx_students_statut ON students(statut);

-- Index sur le niveau pour les regroupements
CREATE INDEX idx_students_niveau ON students(niveau);

-- ===========================================
-- TABLE: grades
-- Table très sollicitée avec de nombreuses jointures
-- ===========================================

-- Index composite principal pour les recherches les plus fréquentes
CREATE INDEX idx_grades_student_period_year ON grades(studentId, evaluationPeriodId, schoolYear);

-- Index pour les recherches par matière
CREATE INDEX idx_grades_subject ON grades(subjectId);

-- Index pour les recherches par classe
CREATE INDEX idx_grades_class ON grades(classId);

-- Index composite pour les calculs de moyennes
CREATE INDEX idx_grades_student_subject ON grades(studentId, subjectId);

-- Index pour les périodes d'évaluation
CREATE INDEX idx_grades_evaluation_period ON grades(evaluationPeriodId);

-- ===========================================
-- TABLE: report_cards
-- Table des bulletins très consultée
-- ===========================================

-- Index composite pour les recherches principales
CREATE INDEX idx_report_cards_student_period_year ON report_cards(studentId, evaluationPeriodId, schoolYear);

-- Index pour les recherches par classe
CREATE INDEX idx_report_cards_class ON report_cards(classId);

-- Index pour les recherches par élève uniquement
CREATE INDEX idx_report_cards_student ON report_cards(studentId);

-- ===========================================
-- TABLE: subjects
-- Table des matières
-- ===========================================

-- Index composite pour les recherches par classe et année
CREATE INDEX idx_subjects_class_year ON subjects(classId, schoolYear);

-- Index sur le nom de la matière
CREATE INDEX idx_subjects_name ON subjects(name);

-- ===========================================
-- TABLE: school_classes
-- Table des classes
-- ===========================================

-- Index sur le nom de la classe (fréquemment utilisé dans les sous-requêtes)
CREATE INDEX idx_school_classes_name ON school_classes(name);

-- Index sur le niveau
CREATE INDEX idx_school_classes_level ON school_classes(levelId);

-- ===========================================
-- TABLE: evaluation_periods
-- Table des périodes d'évaluation
-- ===========================================

-- Index composite pour les recherches par année et type
CREATE INDEX idx_evaluation_periods_year_type ON evaluation_periods(schoolYear, type);

-- Index sur l'ordre pour le tri
CREATE INDEX idx_evaluation_periods_order ON evaluation_periods(`order`);

-- Index sur le statut actif
CREATE INDEX idx_evaluation_periods_active ON evaluation_periods(isActive);

-- ===========================================
-- TABLE: class_subjects
-- Table de liaison classes-matières
-- ===========================================

-- Index composite principal
CREATE INDEX idx_class_subjects_class_year ON class_subjects(className, schoolYear);

-- Index sur la matière
CREATE INDEX idx_class_subjects_subject ON class_subjects(subjectId);

-- ===========================================
-- TABLE: payments
-- Table des paiements
-- ===========================================

-- Index composite pour les recherches par élève et année
CREATE INDEX idx_payments_student_year ON payments(studentId, schoolYear);

-- Index sur la date pour les tris chronologiques
CREATE INDEX idx_payments_date ON payments(date);

-- ===========================================
-- TABLE: fee_structures
-- Table des structures tarifaires
-- ===========================================

-- Index sur le nom de la classe
CREATE INDEX idx_fee_structures_class ON fee_structures(className);

-- ===========================================
-- OPTIMISATIONS SUPPLÉMENTAIRES
-- ===========================================

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE TABLE students;
ANALYZE TABLE grades;
ANALYZE TABLE report_cards;
ANALYZE TABLE subjects;
ANALYZE TABLE school_classes;
ANALYZE TABLE evaluation_periods;
ANALYZE TABLE class_subjects;
ANALYZE TABLE payments;
ANALYZE TABLE fee_structures;

-- Réactiver les vérifications des clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- MONITORING DES PERFORMANCES
-- ===========================================

-- Afficher les index créés
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, SEQ_IN_INDEX;

-- Afficher les statistiques des tables
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    (DATA_LENGTH + INDEX_LENGTH) as TOTAL_SIZE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- ===========================================
-- SCRIPT DE MAINTENANCE (À EXÉCUTER PÉRIODIQUEMENT)
-- ===========================================

-- Optimiser les tables (défragmentation)
-- OPTIMIZE TABLE students, grades, report_cards, subjects, school_classes, evaluation_periods;

-- ===========================================
-- EXPLICATION DES INDEX CRÉÉS
-- ===========================================
/*
INDEX CRÉÉS POUR OPTIMISER LES PERFORMANCES :

1. idx_students_classe_annee : Accélère les recherches d'élèves par classe et année scolaire
2. idx_grades_student_period_year : Index composite principal pour les notes (requêtes les plus fréquentes)
3. idx_report_cards_student_period_year : Index pour les bulletins (très sollicité)
4. idx_subjects_class_year : Pour les matières par classe et année
5. idx_school_classes_name : Pour les sous-requêtes sur les noms de classes
6. idx_evaluation_periods_year_type : Pour filtrer les périodes par année et type
7. idx_class_subjects_class_year : Pour la liaison classes-matières
8. idx_payments_student_year : Pour les paiements par élève et année

AVANTAGES :
- Réduction drastique du temps de réponse des requêtes
- Amélioration des performances des jointures (JOIN)
- Accélération des tris et regroupements (ORDER BY, GROUP BY)
- Optimisation des recherches filtrées (WHERE)

RECOMMANDATIONS :
- Exécuter ce script une fois sur la base de données
- Ré-exécuter ANALYZE TABLE après les insertions massives de données
- Monitorer les performances avec EXPLAIN sur les requêtes lentes
*/