 "use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Building,
  GraduationCap,
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticsData {
  totalStudents: number;
  totalClasses: number;
  totalLevels: number;
  studentsByLevel: Array<{
    level_name: string;
    student_count: number;
  }>;
  studentsByClass: Array<{
    class_name: string;
    student_count: number;
  }>;
  genderDistribution: Array<{
    sexe: string;
    count: number;
  }>;
  totalPayments: number;
  totalPaymentsAmount: number;
  totalPersonnel: number;
  totalGrades: number;
  totalPresences: number;
  presentToday: number;
  absentToday: number;
  recentGrowth?: number;
  averageClassSize?: number;
  topPerformingClass?: string;
}

export function StatisticsDashboard({ role }: { role: string }) {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'details'>('overview');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
          setStatistics(data.data);
        } else {
          setError(data.error || 'Erreur lors du chargement des statistiques');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const colors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
    "#84CC16", "#F97316", "#EC4899", "#6366F1", "#14B8A6", "#F43F5E"
  ];

  if (loading) {
    return (
      <div className="h-screen p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          <div className="col-span-3 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="col-span-5">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="col-span-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen p-6 flex items-center justify-center">
        <Card className="border-red-200 bg-red-50 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Erreur de chargement
            </CardTitle>
            <CardDescription className="text-red-600">
              Impossible de charger les statistiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!statistics) return null;

  const totalStudents = statistics.totalStudents || 0;
  const studentsByLevel = statistics.studentsByLevel || [];
  const studentsByClass = statistics.studentsByClass || [];
  const genderDistribution = statistics.genderDistribution || [];

  // Calculer les métriques supplémentaires
  const averageClassSize = totalStudents > 0 ? Math.round(totalStudents / statistics.totalClasses) : 0;
  const topClass = studentsByClass.reduce((max, current) => 
    current.student_count > max.student_count ? current : max, 
    { class_name: '', student_count: 0 }
  );

  // Préparer les données pour les graphiques
  const levelChartData = studentsByLevel.map((item, index) => ({
    name: item.level_name,
    value: item.student_count,
    fill: colors[index % colors.length],
    percentage: totalStudents > 0 ? ((item.student_count / totalStudents) * 100).toFixed(1) : '0'
  }));

  const classChartData = studentsByClass.slice(0, 3).map((item, index) => ({
    name: item.class_name,
    value: item.student_count,
    fill: colors[index % colors.length]
  }));

  return (
    <div className="h-screen p-6 space-y-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de Bord Statistiques
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d'ensemble des performances de l'établissement
          </p>
        </div>
                 <div className="flex items-center space-x-3">
           <Badge variant="secondary" className="bg-green-100 text-green-800">
             <TrendingUp className="h-3 w-3 mr-1" />
             En temps réel
           </Badge>
         </div>
      </div>

             {/* Layout principal optimisé */}
       <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
         {/* Colonne gauche - Métriques principales */}
         <div className="col-span-3 space-y-4">
           {/* Cartes de statistiques avec animations */}
           <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
             <div className="flex items-center space-x-3">
               <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                 <Users className="h-6 w-6 text-white" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground font-medium">Total Élèves</p>
                 <p className="text-2xl font-bold text-blue-600">{totalStudents.toLocaleString()}</p>
                 <p className="text-xs text-green-600 flex items-center">
                   <TrendingUp className="h-3 w-3 mr-1" />
                   +12% ce mois
                 </p>
               </div>
             </div>
           </Card>
           
           <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
             <div className="flex items-center space-x-3">
               <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                 <Building className="h-6 w-6 text-white" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground font-medium">Classes Actives</p>
                 <p className="text-2xl font-bold text-green-600">{statistics.totalClasses}</p>
                 <p className="text-xs text-blue-600">
                   Moyenne: {averageClassSize} élèves/classe
                 </p>
               </div>
             </div>
           </Card>
           
           <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
             <div className="flex items-center space-x-3">
               <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                 <GraduationCap className="h-6 w-6 text-white" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground font-medium">Niveaux</p>
                 <p className="text-2xl font-bold text-purple-600">{statistics.totalLevels}</p>
                 <p className="text-xs text-purple-600">
                   Répartition équilibrée
                 </p>
               </div>
             </div>
           </Card>

                       {/* Graphique circulaire moderne */}
            <Card className="flex-1 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <PieChart className="h-4 w-4 mr-2 text-blue-600" />
                  Répartition par Niveau
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-[calc(100%-60px)] overflow-y-auto">
               {levelChartData.length > 0 ? (
                 <div className="flex items-center space-x-4">
                   <div className="relative w-32 h-32 flex-shrink-0">
                     {levelChartData.map((item, index) => {
                       const percentage = parseFloat(item.percentage);
                       const startAngle = levelChartData
                         .slice(0, index)
                         .reduce((sum, d) => sum + parseFloat(d.percentage), 0) * 3.6;
                       const endAngle = startAngle + percentage * 3.6;
                       
                       return (
                         <div
                           key={index}
                           className="absolute inset-0 rounded-full"
                           style={{
                             background: `conic-gradient(from ${startAngle}deg, ${item.fill} 0deg, ${item.fill} ${endAngle}deg, transparent ${endAngle}deg)`
                           }}
                         />
                       );
                     })}
                     <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                       <div className="text-center">
                         <div className="text-lg font-bold text-gray-800">{totalStudents}</div>
                         <div className="text-xs text-gray-500">Total</div>
                       </div>
                     </div>
                   </div>
                   <div className="flex-1 space-y-2">
                     {levelChartData.map((item, index) => (
                       <div key={index} className="flex items-center justify-between text-xs">
                         <div className="flex items-center space-x-2">
                           <div 
                             className="w-3 h-3 rounded-full shadow-sm"
                             style={{ backgroundColor: item.fill }}
                           />
                           <span className="font-medium text-gray-700">{item.name}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <span className="font-semibold text-gray-900">{item.value}</span>
                           <span className="text-gray-500">({item.percentage}%)</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="text-center text-muted-foreground text-sm py-8">
                   <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                   Aucune donnée disponible
                 </div>
               )}
             </CardContent>
           </Card>
         </div>

                   {/* Colonne centrale - Informations sur l'établissement */}
          <div className="col-span-5">
            <Card className="h-full hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Building className="h-4 w-4 mr-2 text-indigo-600" />
                  Informations Établissement
                </CardTitle>
                <CardDescription>
                  Détails et métriques de l'établissement
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-[calc(100%-80px)] overflow-y-auto">
                <div className="space-y-4">
                  {/* Taux de remplissage */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-900">Taux de Remplissage</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {averageClassSize > 0 ? Math.round((totalStudents / (statistics.totalClasses * 30)) * 100) : 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((totalStudents / (statistics.totalClasses * 30)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-700">
                        {totalStudents} / {statistics.totalClasses * 30} places
                      </span>
                    </div>
                  </div>

                                     {/* Répartition par genre (données réelles) */}
                   <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border">
                     <h3 className="font-semibold text-pink-900 mb-3">Répartition par Genre</h3>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="text-center">
                         <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                           <Users className="h-8 w-8 text-white" />
                         </div>
                         <p className="text-sm font-medium text-pink-700">Garçons</p>
                         <p className="text-lg font-bold text-pink-900">
                           {genderDistribution.find(g => g.sexe === 'Masculin')?.count || 0}
                         </p>
                       </div>
                       <div className="text-center">
                         <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                           <Users className="h-8 w-8 text-white" />
                         </div>
                         <p className="text-sm font-medium text-rose-700">Filles</p>
                         <p className="text-lg font-bold text-rose-900">
                           {genderDistribution.find(g => g.sexe === 'Féminin')?.count || 0}
                         </p>
                       </div>
                     </div>
                   </div>

                                     {/* Statistiques supplémentaires */}
                   <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
                     <h3 className="font-semibold text-green-900 mb-3">Statistiques Supplémentaires</h3>
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-green-700">Classes avec plus de 20 élèves</span>
                         <span className="font-semibold text-green-900">
                           {studentsByClass.filter(c => c.student_count > 20).length}
                         </span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-green-700">Classes avec moins de 10 élèves</span>
                         <span className="font-semibold text-green-900">
                           {studentsByClass.filter(c => c.student_count < 10).length}
                         </span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-green-700">Niveaux les plus populaires</span>
                         <span className="font-semibold text-green-900">
                           {studentsByLevel.length > 0 ? studentsByLevel[0].level_name : 'N/A'}
                         </span>
                       </div>
                     </div>
                   </div>

                  
                </div>
              </CardContent>
            </Card>
          </div>

         {/* Colonne droite - Détails et insights */}
         <div className="col-span-4 space-y-4">
           {/* Carte des insights */}
           <Card className="hover:shadow-lg transition-all duration-300">
             <CardHeader className="pb-3">
               <CardTitle className="text-sm flex items-center">
                 <Target className="h-4 w-4 mr-2 text-purple-600" />
                 Insights Rapides
               </CardTitle>
             </CardHeader>
             <CardContent className="p-4">
                               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Personnel Actif</p>
                        <p className="text-xs text-blue-700">Enseignants & Staff</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{statistics.totalPersonnel}</p>
                      <p className="text-xs text-blue-500">personnes</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">Présences Aujourd'hui</p>
                        <p className="text-xs text-green-700">Élèves présents</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{statistics.presentToday}</p>
                      <p className="text-xs text-green-500">sur {statistics.totalPresences}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">Notes Enregistrées</p>
                        <p className="text-xs text-purple-700">Cette année</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">{statistics.totalGrades}</p>
                      <p className="text-xs text-purple-500">notes</p>
                    </div>
                  </div>
                </div>
             </CardContent>
           </Card>

                       {/* Détails compacts par classe - Top 3 seulement */}
                         <Card className="h-56 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-orange-600" />
                    Top Classes
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Top 3
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 h-[calc(100%-50px)]">
               <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
                 <div className="h-full overflow-y-auto">
                   <div className="space-y-1 p-2">
                                           {studentsByClass
                        .sort((a, b) => b.student_count - a.student_count)
                        .slice(0, 3)
                        .map((item, index) => {
                       const percentage = totalStudents > 0 ? ((item.student_count / totalStudents) * 100).toFixed(1) : '0';
                       const color = colors[index % colors.length];
                       const isTopClass = item.class_name === topClass.class_name;
                       const rank = index + 1;
                       
                       return (
                         <div key={index} className="flex items-center space-x-2 p-2 rounded border bg-white hover:bg-gray-50 transition-colors group">
                           <div className="flex items-center space-x-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                               {rank}
                             </div>
                             <div 
                               className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                               style={{ backgroundColor: color }}
                             />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center">
                               <span className="font-medium text-sm text-gray-900 group-hover:text-gray-700 truncate">
                                 {item.class_name}
                                 {isTopClass && (
                                   <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                                     #1
                                   </Badge>
                                 )}
                               </span>
                               <span className="text-sm font-semibold text-gray-900">
                                 {item.student_count}
                               </span>
                             </div>
                             <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                               <div 
                                 className="h-2 rounded-full transition-all duration-300 shadow-sm"
                                 style={{ 
                                   width: `${percentage}%`,
                                   backgroundColor: color,
                                   backgroundImage: `linear-gradient(90deg, ${color}, ${color}dd)`
                                 }}
                               />
                             </div>
                             <div className="flex justify-between items-center mt-1">
                               <span className="text-xs text-gray-500">{percentage}%</span>
                               <span className="text-xs font-medium" style={{ color }}>
                                 {item.student_count} élèves
                               </span>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   
                                       {/* Indicateur du nombre total de classes */}
                    {studentsByClass.length > 3 && (
                      <div className="p-3 border-t bg-gray-50">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">
                            Affichage des 3 meilleures classes sur {studentsByClass.length} au total
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Triées par nombre d'élèves décroissant
                          </p>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </div>
   );
 }