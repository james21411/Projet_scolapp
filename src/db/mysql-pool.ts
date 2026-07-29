/**
 * Alias de compatibilité vers le pool multi-tenant dynamique.
 * Tous les fichiers qui importaient '@/db/mysql-pool' ou '../db/mysql-pool'
 * utiliseront maintenant automatiquement le bon tenant selon la session.
 */
export { default, getPoolForDb, getCurrentDbName, testConnection } from './mysql';
