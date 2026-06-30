const mysql = require('mysql2');

// ========================================
// DATABASE CONNECTION CONFIGURATION
// ========================================
const connection = mysql.createConnection({
    host: 'localhost',       // MySQL host
    user: 'root',            // MySQL username (change if different)
    password: '',            // MySQL password (change to your password)
    database: 'umt_aqas',    // Database name
    port: 3306               // MySQL port (default is 3306)
});

// ========================================
// CONNECT TO DATABASE
// ========================================
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Please check your MySQL credentials in config/database.js');
        process.exit(1);
    }
    console.log('✅ Connected to MySQL Database: umt_aqas');
});

// ========================================
// PROMISIFY FOR ASYNC/AWAIT
// ========================================
const promiseConnection = connection.promise();

module.exports = promiseConnection;