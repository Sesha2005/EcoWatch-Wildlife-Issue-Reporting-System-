// login.js - Specific logic for the login page
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('error-alert');
    const loginBtn = document.getElementById('loginBtn');

    // If already logged in, redirect them
    if (api.auth.isAuthenticated()) {
        redirectBasedOnRole(api.auth.getRole());
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset UI
        errorAlert.style.display = 'none';
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const result = await api.auth.login(email, password);

            if (result.success) {
                // Redirect user based on role from payload
                const role = result.data.role;
                redirectBasedOnRole(role);
            } else {
                showError(result.message);
            }
        } catch (err) {
            showError("A network error occurred.");
        } finally {
            loginBtn.textContent = 'Log In';
            loginBtn.disabled = false;
        }
    });

    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    }

    function redirectBasedOnRole(role) {
        switch (role) {
            case 'CITIZEN':
                window.location.href = '../citizen-dashboard.html';
                break;
            case 'AUTHORITY':
                window.location.href = '../authority-dashboard.html';
                break;
            case 'ADMIN':
                window.location.href = '../admin-dashboard.html';
                break;
            default:
                window.location.href = '../index.html'; // Fallback
        }
    }
});

// Forgot Password Logic
function openResetModal() {
    document.getElementById('resetModal').style.display = 'flex';
    resetModalState();
}

function closeResetModal() {
    document.getElementById('resetModal').style.display = 'none';
}

function resetModalState() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('resetErrorMessage').style.display = 'none';
    document.getElementById('resetSuccessMessage').style.display = 'none';
    document.getElementById('resetEmail').value = '';
    document.getElementById('resetOtp').value = '';
    document.getElementById('resetNewPassword').value = '';
    document.getElementById('resetConfirmPassword').value = '';
}

async function sendOtp() {
    const email = document.getElementById('resetEmail').value;
    if (!email) {
        showResetError("Please enter your email address.");
        return;
    }

    const btn = document.getElementById('sendOtpBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    hideResetError();

    try {
        const response = await api.request('/api/auth/forgot-password', 'POST', { email });
        if (response.success) {
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            showResetSuccess("OTP sent successfully to your email.");
        } else {
            showResetError(response.message || "Failed to send OTP.");
        }
    } catch (e) {
        showResetError("Network error. Please try again.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Code';
    }
}

async function verifyOtp() {
    const email = document.getElementById('resetEmail').value;
    const otp = document.getElementById('resetOtp').value;
    
    if (otp.length !== 6) {
        showResetError("Please enter the 6-digit code.");
        return;
    }

    const btn = document.getElementById('verifyOtpBtn');
    btn.disabled = true;
    btn.textContent = 'Verifying...';
    hideResetError();

    try {
        const response = await api.request('/api/auth/verify-otp', 'POST', { email, otp });
        if (response.success) {
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            hideResetSuccess();
        } else {
            showResetError(response.message || "Invalid or expired OTP.");
        }
    } catch (e) {
        showResetError("Network error. Please try again.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Verify & Continue';
    }
}

async function resetPasswordNow() {
    const email = document.getElementById('resetEmail').value;
    const otp = document.getElementById('resetOtp').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;

    if (newPassword.length < 6) {
        showResetError("Password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        showResetError("Passwords do not match.");
        return;
    }

    const btn = document.getElementById('resetBtn');
    btn.disabled = true;
    btn.textContent = 'Updating...';
    hideResetError();

    try {
        const response = await api.request('/api/auth/reset-password', 'POST', { 
            email, otp, newPassword 
        });
        
        if (response.success) {
            document.getElementById('step3').style.display = 'none';
            showResetSuccess("Password updated successfully! You can now log in.");
            setTimeout(() => {
                closeResetModal();
            }, 3000);
        } else {
            showResetError(response.message || "Failed to reset password.");
        }
    } catch (e) {
        showResetError("Network error. Please try again.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Update Password';
    }
}

function showResetError(msg) {
    const el = document.getElementById('resetErrorMessage');
    el.innerHTML = msg;
    el.style.display = 'block';
    document.getElementById('resetSuccessMessage').style.display = 'none';
}

function hideResetError() {
    document.getElementById('resetErrorMessage').style.display = 'none';
}

function showResetSuccess(msg) {
    const el = document.getElementById('resetSuccessMessage');
    el.innerHTML = msg;
    el.style.display = 'block';
    document.getElementById('resetErrorMessage').style.display = 'none';
}

function hideResetSuccess() {
    document.getElementById('resetSuccessMessage').style.display = 'none';
}
