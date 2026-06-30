const express = require("express");
const db = require("../config/database");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const app = express();

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========================================
// FILE UPLOAD CONFIGURATION
// ========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX files are allowed'));
        }
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// CREATE TABLES
// ========================================
const createTables = async () => {
    try {
        const ensureColumn = async (tableName, columnName, definition) => {
            const [columns] = await db.query(`
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
            `, [tableName, columnName]);

            if (columns.length === 0) {
                await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
            }
        };

        const evaluationsTableSQL = `
            CREATE TABLE IF NOT EXISTS evaluations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL DEFAULT 1,
                program_name VARCHAR(255) NOT NULL,
                department VARCHAR(100) NOT NULL,
                evaluator_name VARCHAR(255) NOT NULL,
                evaluation_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'Completed',
                score INT,
                comments_area1 TEXT,
                comments_area2 TEXT,
                comments_area3 TEXT,
                comments_area4 TEXT,
                comments_area5 TEXT,
                comments_area6 TEXT,
                comments_area7 TEXT,
                rating_area1 INT,
                rating_area2 INT,
                rating_area3 INT,
                rating_area4 INT,
                rating_area5 INT,
                rating_area6 INT,
                rating_area7 INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        
        const programSubmissionsTableSQL = `
            CREATE TABLE IF NOT EXISTS program_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL DEFAULT 1,
                program_code VARCHAR(50) NOT NULL,
                program_name VARCHAR(255) NOT NULL,
                mqf_level VARCHAR(20),
                field_of_study VARCHAR(100),
                mode_of_study VARCHAR(50),
                duration_years DECIMAL(3,1),
                credit_hours INT,
                medium_of_instruction VARCHAR(50),
                faculty VARCHAR(255),
                peo_1 TEXT,
                peo_2 TEXT,
                peo_3 TEXT,
                plo1_desc TEXT,
                plo1_outcome_domain VARCHAR(100),
                plo1_learning_domain VARCHAR(50),
                plo2_desc TEXT,
                plo2_outcome_domain VARCHAR(100),
                plo2_learning_domain VARCHAR(50),
                plo3_desc TEXT,
                plo3_outcome_domain VARCHAR(100),
                plo3_learning_domain VARCHAR(50),
                plo4_desc TEXT,
                plo4_outcome_domain VARCHAR(100),
                plo4_learning_domain VARCHAR(50),
                plo5_desc TEXT,
                plo5_outcome_domain VARCHAR(100),
                plo5_learning_domain VARCHAR(50),
                plo6_desc TEXT,
                plo6_outcome_domain VARCHAR(100),
                plo6_learning_domain VARCHAR(50),
                plo7_desc TEXT,
                plo7_outcome_domain VARCHAR(100),
                plo7_learning_domain VARCHAR(50),
                plo8_desc TEXT,
                plo8_outcome_domain VARCHAR(100),
                plo8_learning_domain VARCHAR(50),
                plo9_desc TEXT,
                plo9_outcome_domain VARCHAR(100),
                plo9_learning_domain VARCHAR(50),
                plo10_desc TEXT,
                plo10_outcome_domain VARCHAR(100),
                plo10_learning_domain VARCHAR(50),
                plo11_desc TEXT,
                plo11_outcome_domain VARCHAR(100),
                plo11_learning_domain VARCHAR(50),
                compulsory_courses INT,
                core_computing_courses INT,
                discipline_core_courses INT,
                industrial_training INT,
                free_electives INT,
                project_credits INT,
                subtotal_credits INT,
                curriculum_structure TEXT,
                tl_lecture INT,
                tl_tutorial INT,
                tl_lab INT,
                tl_project INT,
                assessment_strategy TEXT,
                assessment_continuous INT,
                assessment_final INT,
                head_program_name VARCHAR(255),
                submission_date DATE,
                status VARCHAR(50) DEFAULT 'Pending Review',
                review_notes TEXT,
                uploaded_files TEXT,
                assigned_evaluator_id INT NULL,
                assigned_evaluator_name VARCHAR(255) NULL,
                assigned_date DATE NULL,
                expected_completion_date DATE NULL,
                assignment_notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        
        const accreditationTableSQL = `
            CREATE TABLE IF NOT EXISTS accreditation (
                id INT AUTO_INCREMENT PRIMARY KEY,
                program_id INT,
                program_code VARCHAR(50),
                program_name VARCHAR(255),
                accreditation_type VARCHAR(20) NOT NULL,
                cert_number VARCHAR(100) NOT NULL,
                issue_date DATE NOT NULL,
                expiry_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        const paymentTableSQL = `
            CREATE TABLE IF NOT EXISTS payment (
                id INT AUTO_INCREMENT PRIMARY KEY,
                accreditation_id INT NOT NULL,
                payment_date DATE,
                payment_amount DECIMAL(12,2),
                payment_reference VARCHAR(255),
                payment_notes TEXT,
                receipt_file VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Verified',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (accreditation_id) REFERENCES accreditation(id) ON DELETE CASCADE
            )
        `;

        await db.execute(evaluationsTableSQL);
        console.log("✅ Evaluations table ready");
        
        await db.execute(programSubmissionsTableSQL);
        console.log("✅ Program submissions table ready");

        await db.execute(accreditationTableSQL);
        console.log("✅ Accreditation table ready");

        await db.execute(paymentTableSQL);
        await ensureColumn('payment', 'receipt_file', 'receipt_file VARCHAR(255)');
        console.log("✅ Payment table ready");
    } catch (err) {
        console.error("❌ Error creating tables:", err.message);
    }
};

createTables();

// ========================================
// LOGIN ROUTE
// ========================================
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        res.redirect("/dashboard.html");
    } else {
        res.send("Login failed");
    }
});

// ========================================
// EVALUATIONS ROUTES
// ========================================
app.post("/submit-evaluation", async (req, res) => {
    try {
        const { 
            program_name, department, evaluator_name, evaluation_date, status,
            comments_area1, comments_area2, comments_area3, comments_area4, 
            comments_area5, comments_area6, comments_area7,
            rating_area1, rating_area2, rating_area3, rating_area4,
            rating_area5, rating_area6, rating_area7
        } = req.body;

        const totalRating = Number(rating_area1) + Number(rating_area2) + Number(rating_area3) + 
            Number(rating_area4) + Number(rating_area5) + Number(rating_area6) + Number(rating_area7);
        const averageScore = Math.round((totalRating / 35) * 100);

        await db.execute(`
            INSERT INTO evaluations 
            (user_id, program_name, department, evaluator_name, evaluation_date, status, score,
             comments_area1, comments_area2, comments_area3, comments_area4,
             comments_area5, comments_area6, comments_area7,
             rating_area1, rating_area2, rating_area3, rating_area4,
             rating_area5, rating_area6, rating_area7)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            program_name, department, evaluator_name, evaluation_date, status, averageScore,
            comments_area1 || "", comments_area2 || "", comments_area3 || "", comments_area4 || "",
            comments_area5 || "", comments_area6 || "", comments_area7 || "",
            Number(rating_area1), Number(rating_area2), Number(rating_area3), Number(rating_area4),
            Number(rating_area5), Number(rating_area6), Number(rating_area7)
        ]);

        res.redirect("/internal-evaluation.html");
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).send("Error saving evaluation");
    }
});

app.get("/api/evaluations", async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM evaluations ORDER BY created_at DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/api/evaluations/:id", async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM evaluations WHERE id = ?`, [req.params.id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

app.put("/api/evaluations/:id", async (req, res) => {
    try {
        const { 
            program_name, department, evaluator_name, evaluation_date, status,
            comments_area1, comments_area2, comments_area3, comments_area4,
            comments_area5, comments_area6, comments_area7,
            rating_area1, rating_area2, rating_area3, rating_area4,
            rating_area5, rating_area6, rating_area7
        } = req.body;
        
        const totalRating = Number(rating_area1) + Number(rating_area2) + Number(rating_area3) + 
            Number(rating_area4) + Number(rating_area5) + Number(rating_area6) + Number(rating_area7);
        const averageScore = Math.round((totalRating / 35) * 100);
        
        await db.execute(`
            UPDATE evaluations 
            SET program_name = ?, department = ?, evaluator_name = ?, evaluation_date = ?, status = ?, score = ?,
                comments_area1 = ?, comments_area2 = ?, comments_area3 = ?, comments_area4 = ?,
                comments_area5 = ?, comments_area6 = ?, comments_area7 = ?,
                rating_area1 = ?, rating_area2 = ?, rating_area3 = ?, rating_area4 = ?,
                rating_area5 = ?, rating_area6 = ?, rating_area7 = ?
            WHERE id = ?
        `, [
            program_name, department, evaluator_name, evaluation_date, status, averageScore,
            comments_area1 || "", comments_area2 || "", comments_area3 || "", comments_area4 || "",
            comments_area5 || "", comments_area6 || "", comments_area7 || "",
            Number(rating_area1), Number(rating_area2), Number(rating_area3), Number(rating_area4),
            Number(rating_area5), Number(rating_area6), Number(rating_area7),
            req.params.id
        ]);
        
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send("Database error");
    }
});

app.delete("/api/evaluations/:id", async (req, res) => {
    try {
        await db.execute(`DELETE FROM evaluations WHERE id = ?`, [req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send("Database error");
    }
});

// ========================================
// PROGRAM SUBMISSIONS ROUTES
// ========================================
app.get('/api/program-submissions', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM program_submissions ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/program-submissions/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM program_submissions WHERE id = ?', [req.params.id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/submit-program', upload.array('documents', 10), async (req, res) => {
    try {
        const data = req.body;
        const files = req.files || [];
        const filePaths = files.map(f => f.filename);
        
        const fields = [
            'program_code', 'program_name', 'mqf_level', 'field_of_study', 'mode_of_study',
            'duration_years', 'credit_hours', 'medium_of_instruction', 'faculty',
            'head_program_name', 'submission_date', 'status',
            'peo_1', 'peo_2', 'peo_3',
            'plo1_desc', 'plo1_outcome_domain', 'plo1_learning_domain',
            'plo2_desc', 'plo2_outcome_domain', 'plo2_learning_domain',
            'plo3_desc', 'plo3_outcome_domain', 'plo3_learning_domain',
            'plo4_desc', 'plo4_outcome_domain', 'plo4_learning_domain',
            'plo5_desc', 'plo5_outcome_domain', 'plo5_learning_domain',
            'plo6_desc', 'plo6_outcome_domain', 'plo6_learning_domain',
            'plo7_desc', 'plo7_outcome_domain', 'plo7_learning_domain',
            'plo8_desc', 'plo8_outcome_domain', 'plo8_learning_domain',
            'plo9_desc', 'plo9_outcome_domain', 'plo9_learning_domain',
            'plo10_desc', 'plo10_outcome_domain', 'plo10_learning_domain',
            'plo11_desc', 'plo11_outcome_domain', 'plo11_learning_domain',
            'compulsory_courses', 'core_computing_courses', 'discipline_core_courses',
            'industrial_training', 'free_electives', 'project_credits', 'subtotal_credits',
            'curriculum_structure', 'tl_lecture', 'tl_tutorial', 'tl_lab', 'tl_project',
            'assessment_strategy', 'assessment_continuous', 'assessment_final',
            'uploaded_files'
        ];
        
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(field => {
            if (field === 'uploaded_files') return JSON.stringify(filePaths);
            if (field.includes('plo') && field.includes('domain')) return data[field] || '';
            if (field.includes('desc') || field === 'curriculum_structure' || field === 'assessment_strategy') return data[field] || '';
            if (['duration_years', 'credit_hours', 'compulsory_courses', 'core_computing_courses', 
                'discipline_core_courses', 'industrial_training', 'free_electives', 'project_credits', 
                'subtotal_credits', 'tl_lecture', 'tl_tutorial', 'tl_lab', 'tl_project',
                'assessment_continuous', 'assessment_final'].includes(field)) return parseInt(data[field]) || 0;
            return data[field] || '';
        });
        
        values[11] = 'Pending Review';
        if (!values[10]) values[10] = new Date().toISOString().split('T')[0];
        
        await db.query(`INSERT INTO program_submissions (${fields.join(', ')}) VALUES (${placeholders})`, values);
        res.redirect('/view-submissions.html');
        
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Error: ' + err.message);
    }
});

app.put('/api/program-submissions/:id', upload.array('documents', 10), async (req, res) => {
    try {
        const data = req.body;
        const id = req.params.id;
        const newFiles = req.files || [];
        
        const [existing] = await db.query('SELECT uploaded_files FROM program_submissions WHERE id = ?', [id]);
        let existingFiles = [];
        if (existing[0] && existing[0].uploaded_files) {
            existingFiles = JSON.parse(existing[0].uploaded_files);
        }
        
        let filesToKeep = existingFiles;
        if (data.remove_files) {
            const toRemove = JSON.parse(data.remove_files);
            filesToKeep = existingFiles.filter(f => !toRemove.includes(f));
        }
        
        const newFilePaths = newFiles.map(f => f.filename);
        const allFiles = [...filesToKeep, ...newFilePaths];
        
        await db.query(`
            UPDATE program_submissions SET
                program_code = ?, program_name = ?, mqf_level = ?, field_of_study = ?, mode_of_study = ?,
                duration_years = ?, credit_hours = ?, medium_of_instruction = ?, faculty = ?,
                head_program_name = ?, submission_date = ?,
                peo_1 = ?, peo_2 = ?, peo_3 = ?,
                plo1_desc = ?, plo1_outcome_domain = ?, plo1_learning_domain = ?,
                plo2_desc = ?, plo2_outcome_domain = ?, plo2_learning_domain = ?,
                plo3_desc = ?, plo3_outcome_domain = ?, plo3_learning_domain = ?,
                plo4_desc = ?, plo4_outcome_domain = ?, plo4_learning_domain = ?,
                plo5_desc = ?, plo5_outcome_domain = ?, plo5_learning_domain = ?,
                plo6_desc = ?, plo6_outcome_domain = ?, plo6_learning_domain = ?,
                plo7_desc = ?, plo7_outcome_domain = ?, plo7_learning_domain = ?,
                plo8_desc = ?, plo8_outcome_domain = ?, plo8_learning_domain = ?,
                plo9_desc = ?, plo9_outcome_domain = ?, plo9_learning_domain = ?,
                plo10_desc = ?, plo10_outcome_domain = ?, plo10_learning_domain = ?,
                plo11_desc = ?, plo11_outcome_domain = ?, plo11_learning_domain = ?,
                compulsory_courses = ?, core_computing_courses = ?, discipline_core_courses = ?,
                industrial_training = ?, free_electives = ?, project_credits = ?, subtotal_credits = ?,
                curriculum_structure = ?, tl_lecture = ?, tl_tutorial = ?, tl_lab = ?, tl_project = ?,
                assessment_strategy = ?, assessment_continuous = ?, assessment_final = ?,
                uploaded_files = ?
            WHERE id = ?
        `, [
            data.program_code || '', data.program_name || '', data.mqf_level || '', data.field_of_study || '', data.mode_of_study || '',
            data.duration_years || 0, data.credit_hours || 0, data.medium_of_instruction || '', data.faculty || '',
            data.head_program_name || '', data.submission_date || '',
            data.peo_1 || '', data.peo_2 || '', data.peo_3 || '',
            data.plo1_desc || '', data.plo1_outcome_domain || '', data.plo1_learning_domain || '',
            data.plo2_desc || '', data.plo2_outcome_domain || '', data.plo2_learning_domain || '',
            data.plo3_desc || '', data.plo3_outcome_domain || '', data.plo3_learning_domain || '',
            data.plo4_desc || '', data.plo4_outcome_domain || '', data.plo4_learning_domain || '',
            data.plo5_desc || '', data.plo5_outcome_domain || '', data.plo5_learning_domain || '',
            data.plo6_desc || '', data.plo6_outcome_domain || '', data.plo6_learning_domain || '',
            data.plo7_desc || '', data.plo7_outcome_domain || '', data.plo7_learning_domain || '',
            data.plo8_desc || '', data.plo8_outcome_domain || '', data.plo8_learning_domain || '',
            data.plo9_desc || '', data.plo9_outcome_domain || '', data.plo9_learning_domain || '',
            data.plo10_desc || '', data.plo10_outcome_domain || '', data.plo10_learning_domain || '',
            data.plo11_desc || '', data.plo11_outcome_domain || '', data.plo11_learning_domain || '',
            data.compulsory_courses || 0, data.core_computing_courses || 0, data.discipline_core_courses || 0,
            data.industrial_training || 0, data.free_electives || 0, data.project_credits || 0, data.subtotal_credits || 0,
            data.curriculum_structure || '', data.tl_lecture || 0, data.tl_tutorial || 0, data.tl_lab || 0, data.tl_project || 0,
            data.assessment_strategy || '', data.assessment_continuous || 0, data.assessment_final || 0,
            JSON.stringify(allFiles),
            id
        ]);
        
        res.json({ success: true });
        
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/program-submissions/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM program_submissions WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// EVALUATORS API (GET list of evaluators)
// ========================================
app.get('/api/evaluators', async (req, res) => {
    try {
        const evaluators = [
            { id: 1, name: "Prof. Dr. Ahmad Tarmizi", expertise: "Computer Science", faculty: "FSKM", email: "ahmad@umt.edu.my" },
            { id: 2, name: "Prof. Madya Dr. Siti Norain", expertise: "Marine Science", faculty: "FSM", email: "siti@umt.edu.my" },
            { id: 3, name: "Dr. Mohd Fadzli", expertise: "Fisheries", faculty: "FPSA", email: "fadzli@umt.edu.my" },
            { id: 4, name: "Prof. Dr. Rahimah Abdul", expertise: "Food Technology", faculty: "FSSA", email: "rahimah@umt.edu.my" },
            { id: 5, name: "Dr. Nurul Huda Ismail", expertise: "Business Management", faculty: "FPEPS", email: "nurul@umt.edu.my" },
            { id: 6, name: "Prof. Madya Dr. Kamarulzaman", expertise: "Ocean Engineering", faculty: "FTKL", email: "kamarul@umt.edu.my" }
        ];
        res.json(evaluators);
    } catch (err) {
        console.error('Error fetching evaluators:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ASSIGN EVALUATOR API - FIXED 100%
// ========================================
app.put('/api/program-submissions/:id/assign', async (req, res) => {
    try {
        const id = req.params.id;
        const { evaluator_id, evaluator_name, expected_completion_date, assignment_notes } = req.body;
        
        console.log('========================================');
        console.log('📝 ASSIGNING EVALUATOR');
        console.log('Program ID:', id);
        console.log('Evaluator Name:', evaluator_name);
        console.log('========================================');
        
        // UPDATE status to 'Assigned'
        const [result] = await db.query(`
            UPDATE program_submissions 
            SET assigned_evaluator_id = ?,
                assigned_evaluator_name = ?,
                assigned_date = CURDATE(),
                expected_completion_date = ?,
                assignment_notes = ?,
                status = 'Assigned'
            WHERE id = ?
        `, [evaluator_id, evaluator_name, expected_completion_date || null, assignment_notes || null, id]);
        
        console.log('✅ Affected rows:', result.affectedRows);
        
        if (result.affectedRows > 0) {
            // Get updated record
            const [updated] = await db.query(`
                SELECT id, status, assigned_evaluator_name 
                FROM program_submissions 
                WHERE id = ?
            `, [id]);
            
            console.log('📊 Updated:', updated[0]);
            console.log('========================================');
            
            res.json({ 
                success: true, 
                data: updated[0]
            });
        } else {
            res.status(404).json({ error: 'Program not found' });
        }
    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({ error: err.message });
    }
}); 

// ========================================
// GET ASSIGNMENT DETAILS API
// ========================================
app.get('/api/program-submissions/:id/assignment', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT assigned_evaluator_id, assigned_evaluator_name, assigned_date, 
                   expected_completion_date, assignment_notes, status
            FROM program_submissions 
            WHERE id = ?
        `, [req.params.id]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({});
        }
    } catch (err) {
        console.error('Error fetching assignment:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// DASHBOARD STATISTICS
// ========================================
app.get("/api/stats", async (req, res) => {
    try {
        const [[{ totalEvaluations }]] = await db.query(`SELECT COUNT(*) as totalEvaluations FROM evaluations`);
        const [[{ avgScore }]] = await db.query(`SELECT AVG(score) as avgScore FROM evaluations`);
        const [[{ totalSubmissions }]] = await db.query(`SELECT COUNT(*) as totalSubmissions FROM program_submissions`);
        
        res.json({
            totalEvaluations: totalEvaluations || 0,
            avgScore: avgScore ? Math.round(avgScore) : 0,
            totalSubmissions: totalSubmissions || 0
        });
    } catch (err) {
        res.status(500).json({ totalEvaluations: 0, avgScore: 0, totalSubmissions: 0 });
    }
});

// ========================================
// SERVE HTML FILES
// ========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// PAYMENT & CERTIFICATE TRACKING API (Tanpa Transaction)
// ========================================

const getReceiptFilename = (req, existingReceipt = null) => {
    if (req.file) {
        return req.file.filename;
    }

    if (req.body.remove_receipt === 'true') {
        return null;
    }

    return req.body.existing_receipt || existingReceipt || null;
};

const resolveProgramInfo = async (programId, programCode, programName) => {
    if (programCode && programName) {
        return { programCode, programName };
    }

    const [programRows] = await db.query(
        'SELECT program_code, program_name FROM program_submissions WHERE id = ?',
        [programId]
    );

    return {
        programCode: programCode || programRows[0]?.program_code || '',
        programName: programName || programRows[0]?.program_name || ''
    };
};

// GET all accreditation records with payment info
app.get('/api/accreditation', async (req, res) => {
    try {
        const sql = `
            SELECT 
                a.*,
                p.id as payment_id,
                p.payment_date,
                p.payment_amount,
                p.payment_reference,
                p.payment_notes,
                p.receipt_file,
                p.status as payment_status
            FROM accreditation a
            LEFT JOIN payment p ON a.id = p.accreditation_id
            ORDER BY a.created_at DESC
        `;
        const [rows] = await db.query(sql);
        
        const results = rows.map(row => ({
            id: row.id,
            program_id: row.program_id,
            program_code: row.program_code,
            program_name: row.program_name,
            accreditation_type: row.accreditation_type,
            type: row.accreditation_type,
            cert_number: row.cert_number,
            issue_date: row.issue_date,
            expiry_date: row.expiry_date,
            status: row.status || row.accreditation_status,
            payment_id: row.payment_id,
            payment_date: row.payment_date,
            payment_amount: parseFloat(row.payment_amount) || 0,
            payment_reference: row.payment_reference,
            payment_ref: row.payment_reference,
            payment_notes: row.payment_notes,
            receipt_file: row.receipt_file,
            payment_status: row.payment_status
        }));
        
        res.json(results);
    } catch (err) {
        console.error('Error fetching accreditation:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET single accreditation record
app.get('/api/accreditation/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, p.* 
            FROM accreditation a
            LEFT JOIN payment p ON a.id = p.accreditation_id
            WHERE a.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching accreditation:', err);
        res.status(500).json({ error: err.message });
    }
});

// CREATE new accreditation record with payment
app.post('/api/accreditation', upload.single('receipt_file'), async (req, res) => {
    try {
        const {
            program_id, program_code, program_name,
            accreditation_type, cert_number, issue_date, expiry_date,
            payment_date, payment_amount, payment_reference, payment_ref, payment_notes
        } = req.body;

        if (req.file && req.file.mimetype !== 'application/pdf') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Only PDF receipt files are allowed' });
        }

        const paymentReference = payment_reference || payment_ref || '';
        const receiptFile = getReceiptFilename(req);
        const programInfo = await resolveProgramInfo(program_id, program_code, program_name);
        
        // Calculate initial status based on expiry date
        const status = new Date(expiry_date) < new Date() ? 'Expired' : 'Active';
        
        // Insert into accreditation table
        const [accResult] = await db.query(`
            INSERT INTO accreditation 
            (program_id, program_code, program_name, accreditation_type, cert_number, issue_date, expiry_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [program_id, programInfo.programCode, programInfo.programName, accreditation_type, cert_number, issue_date, expiry_date, status]);
        
        const accreditationId = accResult.insertId;
        
        // Insert into payment table
        if (payment_date && payment_amount) {
            await db.query(`
                INSERT INTO payment 
                (accreditation_id, payment_date, payment_amount, payment_reference, payment_notes, receipt_file, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Verified')
            `, [accreditationId, payment_date, payment_amount, paymentReference, payment_notes, receiptFile]);
        }
        
        res.json({ success: true, id: accreditationId });
        
    } catch (err) {
        console.error('Error creating accreditation:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE accreditation record
app.put('/api/accreditation/:id', upload.single('receipt_file'), async (req, res) => {
    try {
        const id = req.params.id;
        const {
            program_id, program_code, program_name,
            accreditation_type, cert_number, issue_date, expiry_date,
            payment_id, payment_date, payment_amount, payment_reference, payment_ref, payment_notes
        } = req.body;

        if (req.file && req.file.mimetype !== 'application/pdf') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Only PDF receipt files are allowed' });
        }

        const [existingPaymentRows] = await db.query(
            'SELECT id, receipt_file FROM payment WHERE accreditation_id = ? LIMIT 1',
            [id]
        );
        const existingPayment = existingPaymentRows[0] || {};
        const effectivePaymentId = payment_id || existingPayment.id;
        const paymentReference = payment_reference || payment_ref || '';
        const receiptFile = getReceiptFilename(req, existingPayment.receipt_file);
        const programInfo = await resolveProgramInfo(program_id, program_code, program_name);
        
        // Update accreditation
        const status = new Date(expiry_date) < new Date() ? 'Expired' : 'Active';
        await db.query(`
            UPDATE accreditation 
            SET program_id = ?, program_code = ?, program_name = ?,
                accreditation_type = ?, cert_number = ?, issue_date = ?, expiry_date = ?, status = ?
            WHERE id = ?
        `, [program_id, programInfo.programCode, programInfo.programName, accreditation_type, cert_number, issue_date, expiry_date, status, id]);
        
        // Update or insert payment
        if (effectivePaymentId) {
            await db.query(`
                UPDATE payment 
                SET payment_date = ?, payment_amount = ?, payment_reference = ?, payment_notes = ?, receipt_file = ?
                WHERE id = ?
            `, [payment_date, payment_amount, paymentReference, payment_notes, receiptFile, effectivePaymentId]);
        } else if (payment_date && payment_amount) {
            await db.query(`
                INSERT INTO payment 
                (accreditation_id, payment_date, payment_amount, payment_reference, payment_notes, receipt_file, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Verified')
            `, [id, payment_date, payment_amount, paymentReference, payment_notes, receiptFile]);
        }
        
        res.json({ success: true });
        
    } catch (err) {
        console.error('Error updating accreditation:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE accreditation record
app.delete('/api/accreditation/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Payment will be deleted automatically due to CASCADE
        await db.query('DELETE FROM accreditation WHERE id = ?', [id]);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting accreditation:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET accreditation statistics for dashboard
app.get('/api/accreditation/stats', async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as total FROM accreditation');
        const [pa] = await db.query('SELECT COUNT(*) as pa_count FROM accreditation WHERE accreditation_type = "PA"');
        const [fa] = await db.query('SELECT COUNT(*) as fa_count FROM accreditation WHERE accreditation_type = "FA"');
        const [expiring] = await db.query(`
            SELECT COUNT(*) as expiring FROM accreditation 
            WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        `);
        const [totalPayment] = await db.query('SELECT SUM(payment_amount) as total FROM payment WHERE status = "Verified"');
        
        res.json({
            total: total[0].total || 0,
            pa: pa[0].pa_count || 0,
            fa: fa[0].fa_count || 0,
            expiringWithin90Days: expiring[0].expiring || 0,
            totalPayment: totalPayment[0].total || 0
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET programs eligible for accreditation (completed internal evaluation)
app.get('/api/eligible-programs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ps.id, ps.program_code, ps.program_name, ps.faculty, ps.status
            FROM program_submissions ps
            WHERE ps.status = 'Completed' 
               OR ps.status = 'Approved'
               OR ps.status NOT IN ('Pending Review', 'Under Review')
            ORDER BY ps.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching eligible programs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET expiring accreditations (for notification)
app.get('/api/accreditation/expiring', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, DATEDIFF(a.expiry_date, CURDATE()) as days_left
            FROM accreditation a
            WHERE a.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            AND a.status = 'Active'
            ORDER BY a.expiry_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching expiring:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// LOGOUT ROUTE
// ========================================
app.get('/logout', (req, res) => {
    // Just redirect to login page
    // (Since no session, just redirect)
    res.redirect('/login.html');
});

// Also handle /api/logout for compatibility
app.get('/api/logout', (req, res) => {
    res.redirect('/login.html');
});


// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  🎓 UMT AQAS SERVER RUNNING                                ║");
    console.log("║      (Module 1: Program Submissions Complete!)             ║");
    console.log("║                                                            ║");
    console.log(`║  🌐 http://localhost:${PORT}                                ║`);
    console.log("║                                                            ║");
    console.log("║  Pages available:                                          ║");
    console.log("║  • http://localhost:3000/                                  ║");
    console.log("║  • http://localhost:3000/login.html                        ║");
    console.log("║  • http://localhost:3000/dashboard.html                    ║");
    console.log("║  • http://localhost:3000/submit-program.html               ║");
    console.log("║  • http://localhost:3000/view-submissions.html             ║");
    console.log("║  • http://localhost:3000/internal-evaluation.html          ║");
    console.log("║  • http://localhost:3000/payment-certificate.html          ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
});
