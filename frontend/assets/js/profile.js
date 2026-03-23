// profile.js - Handles routing to the dedicated Profile Edit page

document.addEventListener('DOMContentLoaded', () => {
    if (api.auth.isAuthenticated()) {
        const role = api.auth.getRole();
        const userId = api.auth.getUserId();
        
        // Find sidebar footer and add Edit Profile button
        const footers = document.querySelectorAll('.sidebar-footer');
        footers.forEach(footer => {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-outline';
            editBtn.style.width = '100%';
            editBtn.style.marginBottom = '10px';
            editBtn.innerHTML = '<span class="material-icons-round">manage_accounts</span> Edit Profile';
            editBtn.onclick = () => window.location.href = 'profile.html';
            
            // Insert before logout
            footer.insertBefore(editBtn, footer.firstChild);
        });
        
        // Make the top right user profile avatar area clickable
        const userProfiles = document.querySelectorAll('.user-profile');
        userProfiles.forEach(profile => {
            profile.style.cursor = 'pointer';
            profile.title = 'Click to edit profile';
            profile.onclick = () => window.location.href = 'profile.html';
        });

        // Globally sync the header text with actual DB user data
        api.request('/users', 'GET').then(res => {
            if (res.success && Array.isArray(res.data)) {
                const currentUser = res.data.find(u => String(u.id) === String(userId));
                if (currentUser) {
                    const nameHeader = document.getElementById('userNameHeader');
                    const deptHeader = document.getElementById('userDeptHeader');
                    const avatarImg = document.getElementById('userAvatar');

                    if (nameHeader) nameHeader.textContent = currentUser.name;
                    if (deptHeader) deptHeader.textContent = currentUser.role === 'ADMIN' ? 'Administrator' : (currentUser.role === 'AUTHORITY' ? 'System Authority' : 'Eco Citizen');
                    if (avatarImg) {
                        avatarImg.src = `https://ui-avatars.com/api/?name=${(currentUser.name || 'U').replace(/ /g, '+')}&background=2E7D32&color=fff`;
                    }
                }
            }
        }).catch(err => console.error("Could not sync global profile header", err));
    }
});
