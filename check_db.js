const mysql = require('mysql2/promise');
async function run() {
    const pool = await mysql.createPool({
        host: 'localhost',
        user: 'james',
        password: 'password',
        database: 'scolapp'
    });
    const [rows] = await pool.execute('SELECT * FROM evaluation_periods');
    console.log(JSON.stringify(rows));
    await pool.end();
}
run();
