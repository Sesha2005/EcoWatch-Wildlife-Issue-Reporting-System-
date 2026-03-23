// register.js
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');
    const registerBtn = document.getElementById('registerBtn');

    // Add API logic for registration if not already in api.js
    if (!api.auth.register) {
        api.auth.register = async (name, email, password, role) => {
            return await api.request('/auth/signup', 'POST', { name, email, password, role });
        };
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset UI
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';
        registerBtn.textContent = 'Creating Account...';
        registerBtn.disabled = true;

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        // Front-end Validation
        if (password !== confirmPassword) {
            showError("Passwords do not match!");
            resetBtn();
            return;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters long.");
            resetBtn();
            return;
        }

        try {
            const result = await api.auth.register(name, email, password, role);

            if (result.success) {
                // Show success and redirect to login after a short delay
                successAlert.textContent = "Account created successfully! Redirecting to login...";
                successAlert.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showError(result.message || "Registration failed. Try a different email.");
                resetBtn();
            }
        } catch (err) {
            showError("A network error occurred. Is the server running?");
            resetBtn();
        }
    });

    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    }

    function resetBtn() {
        registerBtn.textContent = 'Create Account';
        registerBtn.disabled = false;
    }
});
