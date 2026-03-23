document.addEventListener('DOMContentLoaded', () => {

    // 1. Check Authentication & Role
    if (!api.auth.isAuthenticated() || api.auth.getRole() !== 'CITIZEN') {
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. Setup Action Buttons
    document.getElementById('logoutBtn').addEventListener('click', () => {
        api.auth.logout();
    });

    // 3. Image Preview
    const imageFileInput = document.getElementById('imageFile');
    const imagePreview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('uploadArea');

    imageFileInput.addEventListener('change', () => {
        const file = imageFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.style.display = 'none';
        }
    });

    // Drag and Drop visual feedback
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        imageFileInput.files = e.dataTransfer.files;
        imageFileInput.dispatchEvent(new Event('change'));
    });

    // 4. Form Submission Logic
    const form = document.getElementById('issueReportForm');
    const submitBtn = document.getElementById('submitReportBtn');
    const formAlert = document.getElementById('form-alert');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formAlert.style.display = 'none';

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i> Submitting...';
        submitBtn.disabled = true;

        // Try to get userId from localStorage
        let userId = parseInt(localStorage.getItem('userId') || '0');

        // Build a FormData object (handles multipart/form-data automatically)
        const formData = new FormData();
        formData.append('reporterName', document.getElementById('reporterName').value);
        formData.append('animalType', document.getElementById('animalType').value);
        formData.append('location', document.getElementById('location').value);
        // Combine title + description into the description field
        formData.append('description',
            document.getElementById('title').value + ' — ' + document.getElementById('description').value
        );
        formData.append('reportedByUserId', userId);

        const imageFile = imageFileInput.files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            // Send multipart/form-data directly via fetch (do NOT set Content-Type manually)
            const rawResponse = await fetch(`${api.BASE_URL}/reports`, {
                method: 'POST',
                body: formData   // Browser sets correct Content-Type with boundary automatically
            });

            if (rawResponse.ok) {
                formAlert.style.cssText =
                    'display:block; background: rgba(46,204,113,0.1); border:1px solid rgba(46,204,113,0.3); color: var(--primary-green); padding: 1rem; border-radius: 8px;';
                formAlert.textContent = '✅ Report submitted successfully! Redirecting to dashboard...';
                setTimeout(() => window.location.href = '../citizen-dashboard.html', 2000);
            } else {
                const errorData = await rawResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${rawResponse.status}`);
            }

        } catch (error) {
            console.error('Submission Error:', error);
            formAlert.style.cssText =
                'display:block; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; padding:1rem; border-radius:8px;';
            formAlert.textContent = '❌ ' + error.message;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});
