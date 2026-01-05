import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Récupérer tous les sujets ou filtrer par classe
        const { classId, schoolYear } = req.query;
        
        console.log('🔍 API subject-coefficients - Paramètres reçus:', { classId, schoolYear });
        
        let query = `
          SELECT 
            s.id, 
            s.code, 
            s.name, 
            s.category, 
            s.coefficient, 
            s.maxScore, 
            s.isActive, 
            s.classId, 
            s.schoolYear,
            NULL as coefficientId
          FROM subjects s
          WHERE 1=1
        `;
        const params = [];
        
        if (classId && classId !== 'all') {
          console.log('🔍 Filtrage strict par classId:', classId);
          query += ' AND s.classId = ?';
          params.push(classId);
        }
        
        if (schoolYear) {
          console.log('🔍 Filtrage strict par schoolYear:', schoolYear);
          query += ' AND s.schoolYear = ?';
          params.push(schoolYear);
        }
        
        query += ' ORDER BY s.name';
        
        console.log('🔍 Requête SQL:', query);
        console.log('🔍 Paramètres:', params);
        
        const [subjects] = await pool.execute(query, params);
        console.log('📦 Matières trouvées:', subjects.length);
        
        return res.status(200).json(subjects);

      case 'POST':
        // Créer ou mettre à jour un sujet
        const { classId: newClassId, code, name, category, coefficient, maxScore, isActive, schoolYear: newSchoolYear } = req.body;
        
        // Vérifier si le sujet existe déjà
        const [existing] = await pool.execute(
          'SELECT * FROM subjects WHERE classId = ? AND code = ? AND schoolYear = ?',
          [newClassId, code, newSchoolYear]
        );

        if (existing.length > 0) {
          // Mettre à jour le sujet existant
          await pool.execute(
            'UPDATE subjects SET name = ?, category = ?, coefficient = ?, maxScore = ?, isActive = ? WHERE id = ?',
            [name, category, coefficient, maxScore, isActive, existing[0].id]
          );
          
          // Récupérer la matière mise à jour pour la retourner
          const [updatedSubject] = await pool.execute(
            'SELECT * FROM subjects WHERE id = ?',
            [existing[0].id]
          );
          
          return res.status(200).json(updatedSubject[0]);
        } else {
          // Créer un nouveau sujet
          const [result] = await pool.execute(
            'INSERT INTO subjects (classId, code, name, category, coefficient, maxScore, isActive, schoolYear) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newClassId, code, name, category, coefficient, maxScore, isActive, newSchoolYear]
          );
          
          // Récupérer la matière créée pour la retourner
          const [newSubject] = await pool.execute(
            'SELECT * FROM subjects WHERE id = ?',
            [result.insertId]
          );
          
          return res.status(201).json(newSubject[0]);
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ Erreur API subject-coefficients:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
} 