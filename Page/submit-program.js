// Global variable for edit mode
let editMode = false;
let editId = null;

// Set default date and auto-fill data
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    editId = urlParams.get('edit');
    
    if (editId) {
        editMode = true;
        loadSubmissionForEdit(editId);
    } else {
        // Normal mode - set defaults
        const today = new Date().toISOString().split('T')[0];
        document.querySelector('[name="submission_date"]').value = today;
        document.querySelector('[name="head_program_name"]').value = "Dr. Ahmad Bin Hassan";
        document.querySelector('[name="mqf_level"]').value = "6";
    }
    
    // Generate PLO table rows
    generatePLOTable();
});

// Load submission data for editing
async function loadSubmissionForEdit(id) {
    try {
        const res = await fetch(`/api/program-submissions/${id}`);
        if (!res.ok) throw new Error('Submission not found');
        const data = await res.json();
        
        // Update page title
        document.querySelector('h1').innerHTML = '<i class="fas fa-edit me-2"></i>Edit Program Submission';
        
        // Update form action for PUT
        const form = document.getElementById('programSubmissionForm');
        form.action = `/submit-program/${id}?_method=PUT`;
        form.dataset.editId = id;
        
        // Populate Program Identification
        setFieldValue('program_code', data.program_code);
        setFieldValue('program_name', data.program_name);
        setFieldValue('mqf_level', data.mqf_level);
        setFieldValue('field_of_study', data.field_of_study);
        setFieldValue('mode_of_study', data.mode_of_study);
        setFieldValue('duration_years', data.duration_years);
        setFieldValue('credit_hours', data.credit_hours);
        setFieldValue('medium_of_instruction', data.medium_of_instruction);
        setFieldValue('faculty', data.faculty);
        
        // Populate PEOs
        setFieldValue('peo_1', data.peo_1);
        setFieldValue('peo_2', data.peo_2);
        setFieldValue('peo_3', data.peo_3);
        
        // Populate PLOs
        for (let i = 1; i <= 11; i++) {
            setFieldValue(`plo${i}_desc`, data[`plo${i}_desc`]);
            setFieldValue(`plo${i}_outcome_domain`, data[`plo${i}_outcome_domain`]);
            setFieldValue(`plo${i}_learning_domain`, data[`plo${i}_learning_domain`]);
        }
        
        // Populate Curriculum Structure
        setFieldValue('compulsory_courses', data.compulsory_courses);
        setFieldValue('core_computing_courses', data.core_computing_courses);
        setFieldValue('discipline_core_courses', data.discipline_core_courses);
        setFieldValue('industrial_training', data.industrial_training);
        setFieldValue('free_electives', data.free_electives);
        setFieldValue('project_credits', data.project_credits);
        setFieldValue('subtotal_credits', data.subtotal_credits);
        setFieldValue('curriculum_structure', data.curriculum_structure);
        setFieldValue('tl_lecture', data.tl_lecture);
        setFieldValue('tl_tutorial', data.tl_tutorial);
        setFieldValue('tl_lab', data.tl_lab);
        setFieldValue('tl_project', data.tl_project);
        
        // Populate Assessment Methods
        setFieldValue('assessment_strategy', data.assessment_strategy);
        setFieldValue('assessment_continuous', data.assessment_continuous);
        setFieldValue('assessment_final', data.assessment_final);
        
        // Populate Compliance
        setFieldValue('head_program_name', data.head_program_name);
        setFieldValue('submission_date', data.submission_date);
        
        // Update submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update Submission';
        
        // Add cancel edit button
        const btnContainer = submitBtn.parentElement;
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-outline-secondary';
        cancelBtn.innerHTML = '<i class="fas fa-times me-2"></i>Cancel Edit';
        cancelBtn.onclick = () => window.location.href = 'view-submissions.html';
        btnContainer.insertBefore(cancelBtn, submitBtn);
        
    } catch (e) {
        console.error('Error loading submission:', e);
        alert('Error loading submission data. Redirecting...');
        window.location.href = 'view-submissions.html';
    }
}

// Helper function to set field value
function setFieldValue(name, value) {
    if (!value) return;
    const field = document.querySelector(`[name="${name}"]`);
    if (field) {
        if (field.tagName === 'SELECT') {
            field.value = value;
        } else {
            field.value = value;
        }
    }
}

// Handle form submission (POST for new, PUT for edit)
document.getElementById('programSubmissionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    try {
        let url = '/submit-program';
        let method = 'POST';
        
        // If in edit mode, use PUT
        if (editMode && editId) {
            url = `/api/program-submissions/${editId}`;
            method = 'PUT';
        }
        
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Failed to save');
        
        alert(editMode ? 'Submission updated successfully!' : 'Submission saved successfully!');
        window.location.href = 'view-submissions.html';
        
    } catch (err) {
        console.error('Error saving:', err);
        alert('Error saving submission. Please try again.');
    }
});

// Generate PLO Table (PLO1 to PLO11)
function generatePLOTable() {
    const tbody = document.getElementById('ploTableBody');
    const outcomeOptions = [
        'Knowledge',
        'Practical Skills',
        'Critical Thinking',
        'Problem Solving',
        'Communication',
        'Teamwork',
        'Leadership',
        'Professional Ethics',
        'Entrepreneurship',
        'Lifelong Learning'
    ];
    
    const domainOptions = [
        'Cognitive (Knowledge)',
        'Psychomotor (Practical)',
        'Affective (Social/Values)'
    ];
    
    for (let i = 1; i <= 11; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="align-middle">
                <span class="plo-number">PLO${i}</span>
            </td>
            <td>
                <textarea class="form-control form-control-sm" name="plo${i}_desc" rows="3" placeholder="Describe PLO${i}..." required></textarea>
            </td>
            <td>
                <select class="form-select form-select-sm" name="plo${i}_outcome_domain" required>
                    <option value="">Select Outcome</option>
                    ${outcomeOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm" name="plo${i}_learning_domain" required>
                    <option value="">Select Domain</option>
                    ${domainOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Add PEO
let peoCount = 3;
function addPEO() {
    const container = document.querySelector('.plo-container');
    const newPEO = document.createElement('div');
    newPEO.className = 'plo-item';
    newPEO.innerHTML = `
        <div class="plo-number">${peoCount + 1}</div>
        <textarea class="form-control" name="peo_${peoCount + 1}" rows="2" placeholder="PEO ${peoCount + 1}: [Enter program educational objective...]" required></textarea>
    `;
    container.insertBefore(newPEO, container.lastElementChild);
    peoCount++;
}

// Handle file upload
function handleFileUpload() {
    const files = document.getElementById('fileUpload').files;
    const fileList = document.getElementById('uploadedFiles');
    
    fileList.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        let icon = 'fa-file';
        if (file.type.includes('pdf')) icon = 'fa-file-pdf text-danger';
        if (file.type.includes('word')) icon = 'fa-file-word text-primary';
        
        fileItem.innerHTML = `
            <div>
                <i class="fas ${icon} me-2"></i>
                <strong>${file.name}</strong>
                <span class="text-muted ms-2">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    });
}

// Save as draft
function saveAsDraft() {
    alert('Program details saved as draft. You can continue editing later.');
    // In real implementation, save to localStorage or send to backend
}

// Form validation and submission
document.getElementById('programSubmissionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show success modal
    const modalHTML = `
        <div class="modal fade" id="successModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>Submission Successful
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                            <h4>Program Submitted Successfully!</h4>
                        </div>
                        
                        <div class="alert alert-info">
                            <strong>Submission Reference:</strong> EVAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
                        </div>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Quality Assurance Senior Executive will review your submission</li>
                            <li>An Internal Evaluator will be assigned within 3 working days</li>
                            <li>You will receive notifications about evaluation progress</li>
                            <li>If revisions are needed, you'll be asked to resubmit</li>
                        </ol>
                        
                        <p class="text-muted mt-3">You can track the evaluation status in your dashboard.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-arrow-left me-2"></i>Return to Form
                        </button>
                        <button type="button" class="btn btn-umt" onclick="window.location.href='dashboard.html'">
                            <i class="fas fa-tachometer-alt me-2"></i>Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();
});