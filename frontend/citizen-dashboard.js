document.addEventListener('DOMContentLoaded', async () => {

    // 1. Check Authentication & Role
    if (!api.auth.isAuthenticated() || api.auth.getRole() !== 'CITIZEN') {
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. Setup Action Buttons
    document.getElementById('logoutBtn').addEventListener('click', () => {
        api.auth.logout();
    });

    // 3. Update Greeting based on time
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    document.getElementById('greetingMsg').textContent = `${greeting}, Citizen!`;

    // 4. Fetch and render reports
    await loadDashboardData();

});

async function loadDashboardData() {
    const tableBody = document.getElementById('reportsTableBody');

    try {
        // Fetch reports for the logged in user using our backend API
        const userId = api.auth.getUserId();
        if (!userId) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #e74c3c;">User ID missing. Try logging in again.</td></tr>';
            return;
        }

        const response = await api.request(`/reports/user/${userId}`, 'GET');

        if (response.success && Array.isArray(response.data)) {
            const reports = response.data;

            // Calculate Statistics
            let pendingCount = 0;
            let resolvedCount = 0;

            tableBody.innerHTML = ''; // clear loading text

            if (reports.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No reports found. You haven\'t submitted any grievances yet.</td></tr>';
            } else {
                reports.forEach(report => {
                    // Update stats counters
                    if (report.status === 'PENDING') pendingCount++;
                    if (report.status === 'RESOLVED') resolvedCount++;

                    // Add to table
                    const row = document.createElement('tr');

                    // Format Date nicely
                    const submitDate = new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });

                    // Set styling based on status
                    let badgeClass = 'pending';
                    let displayStatus = 'Pending';
                    if (report.status === 'IN_PROGRESS') {
                        badgeClass = 'in_progress';
                        displayStatus = 'Investigating';
                    } else if (report.status === 'RESOLVED') {
                        badgeClass = 'resolved';
                        displayStatus = 'Resolved';
                    }

                    row.innerHTML = `
                        <td>#${report.id}</td>
                        <td style="font-weight: 500;">${report.title || report.description.substring(0, 30) + '...'}</td>
                        <td>${report.location}</td>
                        <td style="color: var(--text-muted);">${submitDate}</td>
                        <td><span class="status-badge ${badgeClass}">${displayStatus}</span></td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Update UI Counters
            document.getElementById('statTotal').textContent = reports.length;
            document.getElementById('statPending').textContent = pendingCount;
            document.getElementById('statResolved').textContent = resolvedCount;

            // Render Activity Cards
            renderActivityCards(reports);

        } else {
            throw new Error(response.message || 'Failed to parse reports');
        }

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #e74c3c;">Error loading reports: ${error.message}. Please try again later.</td></tr>`;
    }
}

function renderActivityCards(reports) {
    const grid = document.getElementById('activityGrid');
    if (!grid) return;

    // Get latest 5 and recently resolved 5
    const latest = [...reports].sort((a, b) => b.id - a.id).slice(0, 5);
    const resolved = reports.filter(r => r.status === 'RESOLVED').sort((a, b) => b.id - a.id).slice(0, 5);

    // Combine and unique by ID
    const combined = [...latest, ...resolved];
    const uniqueMap = new Map();
    combined.forEach(r => uniqueMap.set(r.id, r));
    const activityItems = Array.from(uniqueMap.values()).sort((a, b) => b.id - a.id);

    if (activityItems.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recent activity to show.</p>';
        return;
    }

    grid.innerHTML = '';
    activityItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'activity-report-card';

        const submitDate = new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Determine animal type from title or description
        let animalType = 'Wildlife';
        const text = (item.title + ' ' + item.description).toLowerCase();
        if (text.includes('elephant')) animalType = 'Elephant';
        else if (text.includes('tiger')) animalType = 'Tiger';
        else if (text.includes('leopard')) animalType = 'Leopard';
        else if (text.includes('deer')) animalType = 'Deer';
        else if (text.includes('snake')) animalType = 'Snake';
        else if (text.includes('monkey')) animalType = 'Monkey';

        let badgeClass = 'pending';
        let displayStatus = 'Pending';
        if (item.status === 'IN_PROGRESS') {
            badgeClass = 'in_progress';
            displayStatus = 'Investigating';
        } else if (item.status === 'RESOLVED') {
            badgeClass = 'resolved';
            displayStatus = 'Resolved';
        }

        card.innerHTML = `
            <div class="activity-card-header">
                <div class="animal-tag">
                    <span class="material-icons-round">pets</span>
                    ${animalType}
                </div>
                <span class="activity-date">${submitDate}</span>
            </div>
            <div class="activity-card-body">
                <h4>${item.title || (item.description.substring(0, 30) + '...')}</h4>
                <div class="activity-loc">
                    <span class="material-icons-round" style="font-size: 1rem;">location_on</span>
                    ${item.location}
                </div>
            </div>
            <div class="activity-card-footer">
                <div class="reporter-info">
                    <div class="reporter-avatar">${(item.reporterName || 'C')[0]}</div>
                    <span class="reporter-name">${item.reporterName || 'Citizen'}</span>
                </div>
                <span class="status-badge ${badgeClass}">${displayStatus}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}
