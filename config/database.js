const mysql = require('mysql2');

// ========================================
// DATABASE CONNECTION CONFIGURATION
// ========================================
// Uses Railway's auto-generated MySQL env vars when present (production),
// and falls back to local defaults for development on your own machine.
const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'umt_aqas',
    port: process.env.MYSQLPORT || 3306
});

// ========================================
// CONNECT TO DATABASE
// ========================================
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Please check your MySQL credentials / environment variables');
        process.exit(1);
    }
    console.log(`✅ Connected to MySQL Database: ${process.env.MYSQLDATABASE || 'umt_aqas'}`);
});

// ========================================
// PROMISIFY FOR ASYNC/AWAIT
// ========================================
const promiseConnection = connection.promise();

module.exports = promiseConnection;