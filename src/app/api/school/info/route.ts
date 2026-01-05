import { NextRequest, NextResponse } from 'next/server';
import { getSchoolInfo, updateSchoolInfo } from '@/services/schoolInfoService';
import { createSequencesForYear } from '@/db/services/evaluationDb';
import { copySchoolDataToNewYear, checkDataExistsForYear } from '@/db/services/copySchoolDataService';

export async function GET(request: NextRequest) {
  try {
    const schoolInfo = await getSchoolInfo();
    return NextResponse.json(schoolInfo);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'école:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentSchoolYear, ...otherData } = body;
    
    // Récupérer l'année scolaire actuelle avant la mise à jour
    const currentInfo = await getSchoolInfo();
    const oldSchoolYear = currentInfo?.currentSchoolYear;
    
    // Mettre à jour les informations de l'école
    await updateSchoolInfo(body);
    
    // Si l'année scolaire a changé, créer automatiquement les séquences ET copier les données
    if (currentSchoolYear && currentSchoolYear !== oldSchoolYear) {
      try {
        console.log(`🔄 Année scolaire changée de ${oldSchoolYear} vers ${currentSchoolYear}`);
        
        // 1. Créer les 6 séquences pour la nouvelle année
        console.log(`🚀 Création automatique des séquences pour ${currentSchoolYear}`);
        await createSequencesForYear(currentSchoolYear);
        console.log(`✅ Séquences créées avec succès pour ${currentSchoolYear}`);
        
        // 2. Vérifier si des données existent déjà pour la nouvelle année
        const existingData = await checkDataExistsForYear(currentSchoolYear);
        console.log(`📊 Données existantes pour ${currentSchoolYear}: ${existingData.classes} classes, ${existingData.subjects} matières`);
        
        // 3. Copier automatiquement les matières et classes si aucune donnée n'existe
        if (existingData.classes === 0 && existingData.subjects === 0) {
          console.log(`🚀 Copie automatique des données scolaires de ${oldSchoolYear} vers ${currentSchoolYear}`);
          await copySchoolDataToNewYear(oldSchoolYear, currentSchoolYear);
          console.log(`✅ Données scolaires copiées avec succès vers ${currentSchoolYear}`);
        } else {
          console.log(`⚠️ Des données existent déjà pour ${currentSchoolYear}, pas de copie nécessaire`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la configuration de la nouvelle année ${currentSchoolYear}:`, error);
        // Ne pas faire échouer la mise à jour des infos de l'école
        // Les séquences et données pourront être créées manuellement plus tard
      }
    }
    
    // Préparer le message de retour
    let message = 'Informations de l\'école mises à jour avec succès';
    let details = [];
    
    if (currentSchoolYear && currentSchoolYear !== oldSchoolYear) {
      details.push('Séquences créées automatiquement');
      
      const existingData = await checkDataExistsForYear(currentSchoolYear);
      if (existingData.classes === 0 && existingData.subjects === 0) {
        details.push('Données scolaires copiées automatiquement');
      }
    }
    
    if (details.length > 0) {
      message += ` (${details.join(', ')})`;
    }
    
    return NextResponse.json({ 
      success: true, 
      message,
      sequencesCreated: currentSchoolYear && currentSchoolYear !== oldSchoolYear,
      dataCopied: currentSchoolYear && currentSchoolYear !== oldSchoolYear && details.includes('Données scolaires copiées automatiquement')
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations de l\'école:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 