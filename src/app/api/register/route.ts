import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { registerSchool, isSlugAvailable, getSchoolByEmail } from '@/db/registry';
import { ORANGE_MONEY_PAYMENT, PLAN_LIMITS } from '@/services/masterAdminService';

// Générer un slug depuis le nom de l'école
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // supprimer accents
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}

// Générer un nom de DB depuis le slug
function generateDbName(slug: string): string {
    return `scolapp_${slug.replace(/-/g, '_').substring(0, 40)}`;
}

function generateDomain(slug: string): string | null {
    const rootDomain = process.env.PUBLIC_ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (!rootDomain) return null;
    return `${slug}.${rootDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`.toLowerCase();
}

// Générer un UUID
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            schoolName,
            slogan,
            address,
            phone,
            email,
            bp,
            currency = 'XAF',
            adminName,
            adminEmail,
            adminPassword,
            logoUrl,
            plan = 'starter',
            paymentProofUrl,
            schoolType = 'Lycée',
            country = 'Cameroun',
        } = body;

        // Validation
        if (!schoolName || !adminEmail || !adminPassword || !adminName) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants : nom, email admin, mot de passe, nom admin' },
                { status: 400 }
            );
        }

        const selectedPlan = PLAN_LIMITS[plan] ? plan : 'starter';
        if (!paymentProofUrl) {
            return NextResponse.json(
                { error: 'Veuillez joindre la capture d’écran du paiement Orange Money.' },
                { status: 400 }
            );
        }

        // Vérifier si l'email admin est déjà utilisé
        const existingSchool = await getSchoolByEmail(adminEmail);
        if (existingSchool) {
            return NextResponse.json(
                { error: 'Cet email est déjà associé à un compte FosilaMaster.' },
                { status: 409 }
            );
        }

        // Générer slug et dbName
        let slug = generateSlug(schoolName);
        let dbName = generateDbName(slug);

        // Si le slug est pris, ajouter un suffixe
        let slugAvailable = await isSlugAvailable(slug);
        let attempt = 0;
        while (!slugAvailable && attempt < 10) {
            attempt++;
            const uniqueSlug = `${slug}-${attempt}`;
            slugAvailable = await isSlugAvailable(uniqueSlug);
            if (slugAvailable) {
                slug = uniqueSlug;
                dbName = generateDbName(slug);
            }
        }

        if (!slugAvailable) {
            return NextResponse.json(
                { error: 'Impossible de créer un identifiant unique pour cette école.' },
                { status: 500 }
            );
        }

        // Connexion MySQL sans DB pour créer la nouvelle base
        const adminConn = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            port: Number(process.env.MYSQL_PORT) || 3306,
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
            multipleStatements: true,
        });

        try {
            // 1. Créer la base de données
            await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
            await adminConn.query(`USE \`${dbName}\``);

            // 2. Exécuter le script de création des tables
            const schemaPath = path.join(process.cwd(), 'src', 'db', 'init_school_schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await adminConn.query(schemaSql);

            // 3. Insérer les infos de l'école
            const schoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            await adminConn.query(
                `INSERT INTO school_info (name, slogan, address, phone, email, bp, logoUrl, currentSchoolYear, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [schoolName, slogan || "L'excellence à votre portée", address || country,
                    phone || '', email || adminEmail, bp || '', logoUrl || null, schoolYear, currency]
            );

            // 4. Insérer les données de base : types d'évaluation
            await adminConn.query(`
        INSERT IGNORE INTO evaluation_types (id, name, description, weight, maxScore, isActive) VALUES
        ('eval-ds', 'Devoir Surveillé', 'Évaluation formelle en classe', 1.00, 20, 1),
        ('eval-dvc', 'Devoir à la Maison', 'Travail à faire à la maison', 0.50, 20, 1),
        ('eval-examen', 'Examen', 'Évaluation sommative de fin de période', 2.00, 20, 1),
        ('eval-oral', 'Oral', 'Interrogation orale', 0.50, 20, 1),
        ('eval-tp', 'Travaux Pratiques', 'Travaux pratiques en laboratoire', 1.00, 20, 1)
      `);

            // 5. Paramètres de notation
            await adminConn.query(`
        INSERT IGNORE INTO grading_settings (settingKey, settingValue, description, category) VALUES
        ('passingGrade', '10', 'Note minimale pour passer', 'notation'),
        ('maxGrade', '20', 'Note maximale', 'notation'),
        ('roundingDecimals', '2', 'Nombre de décimales', 'notation'),
        ('honorMention', '16', 'Note pour mention Très Bien', 'notation'),
        ('goodMention', '14', 'Note pour mention Bien', 'notation'),
        ('fairMention', '12', 'Note pour mention Assez Bien', 'notation'),
        ('satisfactoryMention', '10', 'Note pour mention Passable', 'notation'),
        ('gradeSystem', 'numeric', 'Système de notation (numeric/letter)', 'notation'),
        ('showRank', 'true', 'Afficher le classement', 'affichage'),
        ('showAverage', 'true', 'Afficher la moyenne', 'affichage')
      `);

            // 6. Paramètres de sécurité par défaut
            await adminConn.query(`INSERT INTO security_settings (sessionTimeout, maxLoginAttempts, lockoutDuration) VALUES (30, 5, 15)`);
            await adminConn.query(`INSERT INTO password_policies (minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars) VALUES (8, 1, 1, 1, 0)`);

            // 7. Créer le compte administrateur
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            const adminId = `ADMIN_001`;
            const adminUsername = `ADMIN_001`;

            await adminConn.query(
                `INSERT INTO users (id, username, fullName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?, 'Admin')`,
                [adminId, adminUsername, adminName, adminEmail, passwordHash]
            );

            // 8. Séquences pour l'année scolaire courante
            const year = schoolYear;
            const yearStart = new Date().getFullYear();
            const sequences = [
                { id: `seq1-${year}`, name: 'Séquence 1', order: 1, start: `${yearStart}-09-01`, end: `${yearStart}-10-31` },
                { id: `seq2-${year}`, name: 'Séquence 2', order: 2, start: `${yearStart}-11-01`, end: `${yearStart}-12-15` },
                { id: `seq3-${year}`, name: 'Séquence 3', order: 3, start: `${yearStart + 1}-01-10`, end: `${yearStart + 1}-02-28` },
                { id: `seq4-${year}`, name: 'Séquence 4', order: 4, start: `${yearStart + 1}-03-01`, end: `${yearStart + 1}-04-15` },
                { id: `seq5-${year}`, name: 'Séquence 5', order: 5, start: `${yearStart + 1}-04-20`, end: `${yearStart + 1}-05-31` },
                { id: `seq6-${year}`, name: 'Séquence 6', order: 6, start: `${yearStart + 1}-06-01`, end: `${yearStart + 1}-06-30` },
            ];

            for (const seq of sequences) {
                await adminConn.query(
                    `INSERT IGNORE INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, \`order\`, isActive)
           VALUES (?, ?, 'sequence', ?, ?, ?, ?, 1)`,
                    [seq.id, seq.name, seq.start, seq.end, year, seq.order]
                );
            }

            // Trimestres
            const trimesters = [
                { id: `trim1-${year}`, name: 'Trimestre 1', order: 1, start: `${yearStart}-09-01`, end: `${yearStart}-12-15` },
                { id: `trim2-${year}`, name: 'Trimestre 2', order: 2, start: `${yearStart + 1}-01-10`, end: `${yearStart + 1}-04-15` },
                { id: `trim3-${year}`, name: 'Trimestre 3', order: 3, start: `${yearStart + 1}-04-20`, end: `${yearStart + 1}-06-30` },
            ];

            for (const trim of trimesters) {
                await adminConn.query(
                    `INSERT IGNORE INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, \`order\`, isActive)
           VALUES (?, ?, 'trimestre', ?, ?, ?, ?, 1)`,
                    [trim.id, trim.name, trim.start, trim.end, year, trim.order]
                );
            }

        } finally {
            await adminConn.end();
        }

        // 9. Enregistrer dans le registry
        const school = await registerSchool({
            slug,
            name: schoolName,
            db_name: dbName,
            domain: generateDomain(slug),
            admin_email: adminEmail,
            admin_name: adminName,
            phone,
            address,
            logo_url: logoUrl || null,
            plan: selectedPlan,
            approval_status: 'pending',
            subscription_expires_at: null,
            max_students: PLAN_LIMITS[selectedPlan].maxStudents,
            payment_proof_url: paymentProofUrl,
            payment_phone: ORANGE_MONEY_PAYMENT.phone,
            payment_account_name: ORANGE_MONEY_PAYMENT.accountName,
            is_active: false,
        });

        return NextResponse.json({
            success: true,
            message: 'Demande envoyée avec succès. Votre accès sera activé après validation du paiement par le super administrateur.',
            school: {
                slug,
                name: schoolName,
                adminUsername: 'ADMIN_001',
            },
        });

    } catch (error: any) {
        console.error('Erreur création école:', error);
        return NextResponse.json(
            { error: `Erreur lors de la création : ${error.message}` },
            { status: 500 }
        );
    }
}

// Vérifier disponibilité d'un slug
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const email = searchParams.get('email');

    if (slug) {
        const available = await isSlugAvailable(slug);
        return NextResponse.json({ available, slug });
    }

    if (email) {
        const school = await getSchoolByEmail(email);
        return NextResponse.json({ available: !school });
    }

    return NextResponse.json({ error: 'Paramètre manquant' }, { status: 400 });
}
