import pool from '../mysql';

export interface ExpenseItem {
  id?: string;
  description: string; // Intitulé de la dépense
  quantity?: number;
  supplier1?: string;
  price1?: number;
  supplier2?: string;
  price2?: number;
  supplier3?: string;
  price3?: number;
  selectedPrice?: number;
}

export interface ExpenseRequest {
  id: string;
  requestNumber: string;
  authorizationNumber?: string | null;
  schoolYear: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  subjectCategory: string;
  subjectOther?: string | null;
  justificationDocs: string[]; // JSON array
  justificationOther?: string | null;
  amountRequested: number;
  amountApproved?: number | null;
  desiredDate: string;
  justificationText?: string | null;
  items: ExpenseItem[]; // JSON array
  status: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
  directorAvisStatus?: 'EN_ATTENTE' | 'FAVORABLE' | 'DEFAVORABLE';
  directorAvisName?: string | null;
  directorAvisDate?: string | null;
  directorAvisComments?: string | null;
  foundationAvisStatus?: 'EN_ATTENTE' | 'FAVORABLE' | 'DEFAVORABLE';
  foundationAvisName?: string | null;
  foundationAvisDate?: string | null;
  foundationAvisComments?: string | null;
  rejectionReason?: string | null;
  location?: string;
  requestDate: string;
  createdAt?: string;
  updatedAt?: string;
}

let isTableInitialized = false;

export async function initExpenseTable() {
  if (isTableInitialized) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS \`expense_requests\` (
      \`id\` varchar(64) NOT NULL,
      \`requestNumber\` varchar(64) NOT NULL,
      \`authorizationNumber\` varchar(100) DEFAULT NULL,
      \`schoolYear\` varchar(20) NOT NULL,
      \`applicantId\` varchar(255) NOT NULL,
      \`applicantName\` varchar(255) NOT NULL,
      \`applicantRole\` varchar(100) NOT NULL,
      \`subjectCategory\` varchar(255) NOT NULL,
      \`subjectOther\` varchar(255) DEFAULT NULL,
      \`justificationDocs\` json DEFAULT NULL,
      \`justificationOther\` varchar(255) DEFAULT NULL,
      \`amountRequested\` decimal(12,2) NOT NULL,
      \`amountApproved\` decimal(12,2) DEFAULT NULL,
      \`desiredDate\` date NOT NULL,
      \`justificationText\` text,
      \`items\` json DEFAULT NULL,
      \`status\` enum('EN_ATTENTE','VALIDE','REFUSE') NOT NULL DEFAULT 'EN_ATTENTE',
      \`directorAvisStatus\` enum('EN_ATTENTE','FAVORABLE','DEFAVORABLE') DEFAULT 'EN_ATTENTE',
      \`directorAvisName\` varchar(255) DEFAULT NULL,
      \`directorAvisDate\` date DEFAULT NULL,
      \`directorAvisComments\` text,
      \`foundationAvisStatus\` enum('EN_ATTENTE','FAVORABLE','DEFAVORABLE') DEFAULT 'EN_ATTENTE',
      \`foundationAvisName\` varchar(255) DEFAULT NULL,
      \`foundationAvisDate\` date DEFAULT NULL,
      \`foundationAvisComments\` text,
      \`rejectionReason\` text,
      \`location\` varchar(255) DEFAULT 'Yaoundé',
      \`requestDate\` date NOT NULL,
      \`createdAt\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`requestNumber\` (\`requestNumber\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  try {
    await pool.query(sql);
    isTableInitialized = true;
  } catch (err) {
    console.error('Erreur initialisation de la table expense_requests:', err);
  }
}

function parseJsonField(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
}

export async function getAllExpenseRequests(filters?: {
  applicantId?: string;
  schoolYear?: string;
  status?: string;
  category?: string;
  search?: string;
}) {
  await initExpenseTable();
  let sql = 'SELECT * FROM expense_requests WHERE 1=1';
  const params: any[] = [];

  if (filters?.applicantId) {
    sql += ' AND applicantId = ?';
    params.push(filters.applicantId);
  }

  if (filters?.schoolYear && filters.schoolYear !== 'all') {
    sql += ' AND schoolYear = ?';
    params.push(filters.schoolYear);
  }

  if (filters?.status && filters.status !== 'all') {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.category && filters.category !== 'all') {
    sql += ' AND subjectCategory = ?';
    params.push(filters.category);
  }

  if (filters?.search) {
    sql += ' AND (requestNumber LIKE ? OR authorizationNumber LIKE ? OR applicantName LIKE ? OR subjectCategory LIKE ? OR justificationText LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  sql += ' ORDER BY createdAt DESC';

  const [rows] = await pool.query(sql, params);
  const results = (rows as any[]).map(row => ({
    ...row,
    justificationDocs: parseJsonField(row.justificationDocs, []),
    items: parseJsonField(row.items, []),
  }));

  return results as ExpenseRequest[];
}

export async function getExpenseRequestById(id: string) {
  await initExpenseTable();
  const [rows] = await pool.query('SELECT * FROM expense_requests WHERE id = ? OR requestNumber = ?', [id, id]);
  const arr = rows as any[];
  if (arr.length === 0) return null;
  const row = arr[0];
  return {
    ...row,
    justificationDocs: parseJsonField(row.justificationDocs, []),
    items: parseJsonField(row.items, []),
  } as ExpenseRequest;
}

export async function createExpenseRequest(req: Omit<ExpenseRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'> & { id?: string; requestNumber?: string }) {
  await initExpenseTable();

  const id = req.id || `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Genere un numéro de demande incrémental lisible si pas fourni
  let requestNumber = req.requestNumber;
  if (!requestNumber) {
    const yearPrefix = req.schoolYear ? req.schoolYear.split('-')[0] : new Date().getFullYear().toString();
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM expense_requests');
    const cnt = ((countRows as any[])[0]?.cnt || 0) + 1;
    requestNumber = `DEM-${yearPrefix}-${String(cnt).padStart(4, '0')}`;
  }

  const sql = `
    INSERT INTO expense_requests (
      id, requestNumber, authorizationNumber, schoolYear, applicantId, applicantName, applicantRole,
      subjectCategory, subjectOther, justificationDocs, justificationOther, amountRequested, amountApproved,
      desiredDate, justificationText, items, status, directorAvisStatus, directorAvisName, directorAvisDate,
      directorAvisComments, foundationAvisStatus, foundationAvisName, foundationAvisDate, foundationAvisComments,
      rejectionReason, location, requestDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id,
    requestNumber,
    req.authorizationNumber || null,
    req.schoolYear,
    req.applicantId,
    req.applicantName,
    req.applicantRole,
    req.subjectCategory,
    req.subjectOther || null,
    JSON.stringify(req.justificationDocs || []),
    req.justificationOther || null,
    req.amountRequested,
    req.amountApproved || null,
    req.desiredDate,
    req.justificationText || null,
    JSON.stringify(req.items || []),
    req.status || 'EN_ATTENTE',
    req.directorAvisStatus || 'EN_ATTENTE',
    req.directorAvisName || null,
    req.directorAvisDate || null,
    req.directorAvisComments || null,
    req.foundationAvisStatus || 'EN_ATTENTE',
    req.foundationAvisName || null,
    req.foundationAvisDate || null,
    req.foundationAvisComments || null,
    req.rejectionReason || null,
    req.location || 'Yaoundé',
    req.requestDate || new Date().toISOString().split('T')[0]
  ];

  await pool.query(sql, params);
  return getExpenseRequestById(id);
}

export async function updateExpenseRequest(id: string, updates: Partial<ExpenseRequest>) {
  await initExpenseTable();

  // Generer N° d'autorisation si la demande devient VALIDE et qu'elle n'en a pas encore
  if (updates.status === 'VALIDE' && !updates.authorizationNumber) {
    const existing = await getExpenseRequestById(id);
    if (existing && !existing.authorizationNumber) {
      const year = new Date().getFullYear();
      const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM expense_requests WHERE status = 'VALIDE'");
      const count = ((rows as any[])[0]?.cnt || 0) + 1;
      updates.authorizationNumber = `AUTH-${year}-${String(count).padStart(4, '0')}`;
    }
  }

  const keys = Object.keys(updates).filter(k => k !== 'id');
  if (keys.length === 0) return getExpenseRequestById(id);

  const setClauses: string[] = [];
  const params: any[] = [];

  keys.forEach(key => {
    setClauses.push(`\`${key}\` = ?`);
    const val = (updates as any)[key];
    if (key === 'justificationDocs' || key === 'items') {
      params.push(JSON.stringify(val || []));
    } else {
      params.push(val === undefined ? null : val);
    }
  });

  params.push(id);
  const sql = `UPDATE expense_requests SET ${setClauses.join(', ')} WHERE id = ?`;
  await pool.query(sql, params);

  return getExpenseRequestById(id);
}

export async function deleteExpenseRequest(id: string) {
  await initExpenseTable();
  await pool.query('DELETE FROM expense_requests WHERE id = ?', [id]);
  return true;
}

export async function getExpenseStats(schoolYear?: string) {
  await initExpenseTable();
  let sql = 'SELECT * FROM expense_requests WHERE 1=1';
  const params: any[] = [];
  if (schoolYear && schoolYear !== 'all') {
    sql += ' AND schoolYear = ?';
    params.push(schoolYear);
  }

  const [rows] = await pool.query(sql, params);
  const requests = (rows as any[]) || [];

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'EN_ATTENTE').length;
  const approvedCount = requests.filter(r => r.status === 'VALIDE').length;
  const rejectedCount = requests.filter(r => r.status === 'REFUSE').length;

  const totalRequested = requests.reduce((sum, r) => sum + Number(r.amountRequested || 0), 0);
  const totalApproved = requests
    .filter(r => r.status === 'VALIDE')
    .reduce((sum, r) => sum + Number(r.amountApproved || r.amountRequested || 0), 0);
  const totalPending = requests
    .filter(r => r.status === 'EN_ATTENTE')
    .reduce((sum, r) => sum + Number(r.amountRequested || 0), 0);

  // Stats par rubrique
  const categoryStats: Record<string, { requested: number; approved: number; count: number }> = {};
  requests.forEach(r => {
    const cat = r.subjectCategory || 'Autre';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { requested: 0, approved: 0, count: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].requested += Number(r.amountRequested || 0);
    if (r.status === 'VALIDE') {
      categoryStats[cat].approved += Number(r.amountApproved || r.amountRequested || 0);
    }
  });

  return {
    totalCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalRequested,
    totalApproved,
    totalPending,
    categoryStats
  };
}
