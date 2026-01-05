import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Test de connexion à la base de données...');
    const connection = ;
    
    // Test 1: Vérifier la connexion
    console.log('✅ Connexion réussie');
    
    // Test 2: Vérifier les tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Tables disponibles:', tables.map(t => Object.values(t)[0]));
    
    // Test 3: Vérifier la table subjects
    let subjectsCount = 0;
    let subjectsWithClassId = 0;
    let subjectsWithoutClassId = 0;
    
    try {
      const [subjects] = await connection.query('SELECT COUNT(*) as total FROM subjects');
      subjectsCount = subjects[0].total;
      
      const [subjectsWithClass] = await connection.query('SELECT COUNT(*) as total FROM subjects WHERE classId IS NOT NULL');
      subjectsWithClassId = subjectsWithClass[0].total;
      
      const [subjectsWithoutClass] = await connection.query('SELECT COUNT(*) as total FROM subjects WHERE classId IS NULL');
      subjectsWithoutClassId = subjectsWithoutClass[0].total;
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification des matières:', error.message);
    }
    
    // Test 4: Vérifier la table grades
    let gradesCount = 0;
    let gradesWithClassId = 0;
    let gradesWithoutClassId = 0;
    
    try {
      const [grades] = await connection.query('SELECT COUNT(*) as total FROM grades');
      gradesCount = grades[0].total;
      
      const [gradesWithClass] = await connection.query('SELECT COUNT(*) as total FROM grades WHERE classId IS NOT NULL');
      gradesWithClassId = gradesWithClass[0].total;
      
      const [gradesWithoutClass] = await connection.query('SELECT COUNT(*) as total FROM grades WHERE classId IS NULL');
      gradesWithoutClassId = gradesWithoutClass[0].total;
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification des notes:', error.message);
    }
    
    // Test 5: Vérifier la table school_classes
    let classesCount = 0;
    try {
      const [classes] = await connection.query('SELECT COUNT(*) as total FROM school_classes');
      classesCount = classes[0].total;
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification des classes:', error.message);
    }
    
    // Test 6: Vérifier quelques exemples de données
    let sampleSubjects = [];
    let sampleGrades = [];
    let sampleClasses = [];
    
    try {
      const [subjects] = await connection.query('SELECT id, name, classId, coefficient FROM subjects LIMIT 5');
      sampleSubjects = subjects;
    } catch (error) {
      console.log('⚠️ Erreur lors de la récupération des exemples de matières:', error.message);
    }
    
    try {
      const [grades] = await connection.query('SELECT id, studentId, subjectId, classId, score, maxScore FROM grades LIMIT 5');
      sampleGrades = grades;
    } catch (error) {
      console.log('⚠️ Erreur lors de la récupération des exemples de notes:', error.message);
    }
    
    try {
      const [classes] = await connection.query('SELECT id, name, level FROM school_classes LIMIT 5');
      sampleClasses = classes;
    } catch (error) {
      console.log('⚠️ Erreur lors de la récupération des exemples de classes:', error.message);
    }    const diagnosticData = {
      connection: 'success',
      tables: tables.map(t => Object.values(t)[0]),
      subjects: {
        total: subjectsCount,
        withClassId: subjectsWithClassId,
        withoutClassId: subjectsWithoutClassId,
        samples: sampleSubjects
      },
      grades: {
        total: gradesCount,
        withClassId: gradesWithClassId,
        withoutClassId: gradesWithoutClassId,
        samples: sampleGrades
      },
      classes: {
        total: classesCount,
        samples: sampleClasses
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Données de diagnostic:', diagnosticData);
    
    return res.status(200).json({
      success: true,
      message: 'Diagnostic terminé avec succès',
      data: diagnosticData
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du diagnostic',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
