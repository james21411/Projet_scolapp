import { cacheInvalidate } from './cache';
import pool from '../db/mysql';

async function clear() {
    cacheInvalidate('fosilamaster_lycee_bilingue_de_foumban');
    cacheInvalidate('fosilamaster_lycee_classique');
    console.log('Cache vidé !');
    process.exit(0);
}

clear();
