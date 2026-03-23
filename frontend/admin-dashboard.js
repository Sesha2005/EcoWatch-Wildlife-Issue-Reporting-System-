// Global functions for Admin Navigation
window.currentSection = 'overview';

window.showSection = function (sectionId, element) {
    if (!sectionId) return;
    window.currentSection = sectionId;

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');

    // Show appropriate container
    const titles = {
        'overview': 'System Overview',
        'users': 'User Management',
        'messages': 'Admin-Authority Messaging',
        'feedback': 'User Satisfaction Feedback',
        'reports': 'System Reports',
        'audit': 'Audit Logs',
        'settings': 'App Settings'
    };
    const desc = {
        'overview': 'Global statistics and management.',
        'users': 'Manage system users and authority roles.',
        'messages': 'Direct communication with field staff.',
        'feedback': 'Review citizen ratings and comments on resolved cases.',
        'reports': 'Detailed view of all wildlife reports.',
        'audit': 'System-wide activity and security logs.',
        'settings': 'Platform configuration and preferences.'
    };

    if (sectionId === 'overview') {
        document.getElementById('overview-section').style.display = 'block';
    } else if (sectionId === 'users') {
        document.getElementById('users-section').style.display = 'block';
    } else if (sectionId === 'reports') {
        document.getElementById('reports-section').style.display = 'block';
    } else if (sectionId === 'messages') {
        document.getElementById('messages-section').style.display = 'block';
        renderAuthorityListForMessaging();
    } else if (sectionId === 'feedback') {
        document.getElementById('feedback-section').style.display = 'block';
        fetchAndRenderFeedback();
    } else {
        const placeholder = document.getElementById('placeholder-section');
        placeholder.style.display = 'block';
        document.getElementById('placeholderTitle').textContent = titles[sectionId];
    }

    // Update Headers
    document.getElementById('greetingMsg').textContent = titles[sectionId] || 'Admin Portal';
    document.getElementById('sectionDescription').textContent = desc[sectionId] || 'Manage EcoWatch';

    // Sidebar active state
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (element) element.classList.add('active');

    // Fetch refresh
    loadAdminData();
}

let selectedAuthorityId = null;
let messagePollInterval = null;

// Chart Instances for management
let statusChartInst = null;
let typeChartInst = null;
let trendsChartInst = null;

function renderCharts(reports) {
    if (!reports || !reports.length) return;

    // 1. Reports by Status (Pie/Donut)
    const statusCounts = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    reports.forEach(r => statusCounts[r.status] = (statusCounts[r.status] || 0) + 1);

    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        if (statusChartInst) statusChartInst.destroy();
        statusChartInst = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Resolved'],
                datasets: [{
                    data: [statusCounts.PENDING, statusCounts.IN_PROGRESS, statusCounts.RESOLVED],
                    backgroundColor: ['#e74c3c', '#3498db', '#2ecc71'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                },
                cutout: '70%'
            }
        });
    }

    // 2. Wildlife Category (Bar)
    const typeCounts = {};
    reports.forEach(r => {
        const type = r.animalType || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const typeCtx = document.getElementById('typeChart');
    if (typeCtx) {
        if (typeChartInst) typeChartInst.destroy();
        typeChartInst = new Chart(typeCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(typeCounts),
                datasets: [{
                    label: 'Sightings',
                    data: Object.values(typeCounts),
                    backgroundColor: 'rgba(46, 125, 50, 0.7)',
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Reports Over Time (Line)
    // Group by date
    const dateCounts = {};
    reports.forEach(r => {
        const date = new Date(r.createdAt).toLocaleDateString();
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    // Sort dates
    const sortedDates = Object.keys(dateCounts).sort((a,b) => new Date(a) - new Date(b));

    const timeCtx = document.getElementById('timeChart');
    if (timeCtx) {
        if (trendsChartInst) trendsChartInst.destroy();
        trendsChartInst = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Daily Reports',
                    data: sortedDates.map(d => dateCounts[d]),
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2e7d32',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

function renderAuthorityListForMessaging() {
    const list = document.getElementById('authList');
    if (!list || !allAuthorities.length) return;

    list.innerHTML = '';
    allAuthorities.forEach(auth => {
        const item = document.createElement('div');
        item.style.padding = '0.75rem 1rem';
        item.style.borderRadius = '8px';
        item.style.cursor = 'pointer';
        item.style.marginBottom = '0.5rem';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.transition = 'background 0.2s';
        
        if (selectedAuthorityId === auth.id) {
            item.style.background = 'rgba(46, 125, 50, 0.1)';
            item.style.borderLeft = '4px solid var(--primary-green)';
        } else {
            item.style.background = 'white';
            item.style.border = '1px solid #f1f3f5';
        }

        item.onclick = () => selectAuthorityForChat(auth);

        item.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #3498db; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">
                ${auth.name[0]}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark);">${auth.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Forest Authority</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function selectAuthorityForChat(auth) {
    selectedAuthorityId = auth.id;
    document.getElementById('currentRecipientName').textContent = `Chatting with ${auth.name}`;
    document.getElementById('messageInputArea').style.display = 'block';
    renderAuthorityListForMessaging();
    
    // Initial load and start polling
    loadMessagesForChat();
    if (messagePollInterval) clearInterval(messagePollInterval);
    messagePollInterval = setInterval(loadMessagesForChat, 3000);
}

async function loadMessagesForChat() {
    if (!selectedAuthorityId || window.currentSection !== 'messages') return;

    try {
        const [inboxRes, sentRes] = await Promise.all([
            api.request('/messages/inbox', 'GET'),
            api.request('/messages/sent', 'GET')
        ]);

        if (inboxRes.success && sentRes.success) {
            // Backend returns { success, data: [...] }, api.request wraps it as { success, data: backendBody }
            const inboxList = Array.isArray(inboxRes.data) ? inboxRes.data : (inboxRes.data?.data || []);
            const sentList  = Array.isArray(sentRes.data)  ? sentRes.data  : (sentRes.data?.data  || []);

            const allMsgs = [
                ...inboxList.filter(m => m.senderId === selectedAuthorityId),
                ...sentList.filter(m  => m.receiverId === selectedAuthorityId)
            ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            renderMessagesUI(allMsgs);
        }
    } catch (e) {
        console.error("Message Load Error:", e);
    }
}

function renderMessagesUI(messages) {
    const display = document.getElementById('messageDisplay');
    if (!display) return;

    const atBottom = display.scrollHeight - display.scrollTop <= display.clientHeight + 100;

    display.innerHTML = '';
    if (messages.length === 0) {
        display.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No messages yet. Start the conversation!</p>`;
        return;
    }

    const currentUserId = parseInt(api.auth.getUserId());

    messages.forEach(msg => {
        const isMe = msg.senderId === currentUserId;
        const msgDiv = document.createElement('div');
        msgDiv.style.maxWidth = '80%';
        msgDiv.style.padding = '0.8rem 1rem';
        msgDiv.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
        msgDiv.style.borderRadius = '12px';
        msgDiv.style.fontSize = '0.9rem';
        msgDiv.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
        msgDiv.style.background = isMe ? 'var(--primary-green)' : 'white';
        msgDiv.style.color = isMe ? 'white' : 'var(--text-dark)';
        msgDiv.style.boxShadow = isMe ? '0 4px 10px rgba(46,125,50,0.2)' : '0 2px 5px rgba(0,0,0,0.05)';

        msgDiv.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px; font-size: 0.75rem; opacity: 0.8;">${isMe ? 'You' : msg.senderName}</div>
            <div>${msg.content}</div>
            <div style="font-size: 0.7rem; margin-top: 4px; opacity: 0.6; text-align: right;">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        display.appendChild(msgDiv);
    });

    if (atBottom) {
        display.scrollTop = display.scrollHeight;
    }
}

async function sendNewMessage() {
    const input = document.getElementById('msgInput');
    const content = input.value.trim();
    if (!content || !selectedAuthorityId) return;

    input.value = '';
    const res = await api.request('/messages/send', 'POST', {
        receiverId: selectedAuthorityId,
        content: content
    });

    if (res.success) {
        loadMessagesForChat();
    } else {
        alert("Failed to send: " + res.message);
    }
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'sendMsgBtn' || e.target.closest('#sendMsgBtn')) {
        sendNewMessage();
    }
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.id === 'msgInput') {
        sendNewMessage();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    if (!api.auth.isAuthenticated() || api.auth.getRole() !== 'ADMIN') {
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. Profile Setup
    const adminId = api.auth.getUserId();
    if (adminId) {
        document.getElementById('userNameHeader').textContent = 'System Admin';
        document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=Admin&background=2E7D32&color=fff`;
    }

    // 3. Listeners
    document.getElementById('logoutBtn').addEventListener('click', () => api.auth.logout());
    document.getElementById('refreshBtn').addEventListener('click', () => loadAdminData());

    // 4. Initial Load
    await loadAdminData();
});

let allAuthorities = [];

async function loadAdminData() {
    await fetchAndRenderUsers();
    await fetchAndRenderReports();
    await fetchAndRenderFeedback();
}

async function fetchAndRenderFeedback() {
    const tableBody = document.getElementById('feedbackTableBody');
    if (!tableBody) return;

    try {
        const response = await api.request('/reports', 'GET');
        if (response.success && Array.isArray(response.data)) {
            const reports = response.data.filter(r => r.rating > 0);
            
            // Calc stats
            const total = reports.length;
            const avg = total > 0 ? (reports.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "0.0";
            
            const avgEl = document.getElementById('avgRating');
            const totalEl = document.getElementById('totalFeedback');
            if (avgEl) avgEl.textContent = avg;
            if (totalEl) totalEl.textContent = total;

            tableBody.innerHTML = '';
            if (total === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">No feedback found yet.</td></tr>';
                return;
            }

            reports.forEach(r => {
                const row = document.createElement('tr');
                const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
                const isLow = r.rating < 3;
                
                row.innerHTML = `
                    <td>#${r.id}</td>
                    <td>${r.reporterName || 'Citizen'}</td>
                    <td style="color: ${isLow ? '#e74c3c' : '#f1c40f'}; font-size: 1.1rem; letter-spacing: 2px;">
                        ${stars}
                    </td>
                    <td style="font-size: 0.85rem; max-width: 300px;">
                        ${r.feedback || '<span style="color: #ccc; font-style: italic;">No comment</span>'}
                    </td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">
                        ${new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                        <button class="action-btn" onclick="window.location.href='report-details.html?id=${r.id}'">
                            <span class="material-icons-round">visibility</span>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (e) {
        console.error("Feedback Load Error:", e);
    }
}

async function fetchAndRenderUsers() {
    const tableBody = document.getElementById('usersTableBody');
    const usersCountEl = document.getElementById('statUsers');
    if (!tableBody) return;

    try {
        const response = await api.request('/users', 'GET');
        if (response.success && Array.isArray(response.data)) {
            const users = response.data;
            usersCountEl.textContent = users.length;
            allAuthorities = users.filter(u => u.role === 'AUTHORITY');

            tableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                const roleColor = user.role === 'ADMIN' ? '#e74c3c' : (user.role === 'AUTHORITY' ? '#3498db' : '#7f8c8d');
                const isActive = user.active !== false; // handle null as true

                row.innerHTML = `
                    <td>#${user.id}</td>
                    <td>
                        <div style="font-weight: 600;">${user.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email}</div>
                    </td>
                    <td><span class="status-badge" style="background: ${roleColor}15; color: ${roleColor};">${user.role}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <label class="switch">
                                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleUserStatus(${user.id}, this.checked)">
                                <span class="slider"></span>
                            </label>
                            <span id="status-label-${user.id}" style="font-size: 0.8rem; font-weight: 700; color: ${isActive ? 'var(--primary-green)' : '#e74c3c'}; min-width: 60px;">
                                ${isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (e) { console.error(e); }
}

window.toggleUserStatus = async function (userId, active) {
    const label = document.getElementById(`status-label-${userId}`);
    if (label) {
        label.textContent = active ? 'ACTIVE' : 'INACTIVE';
        label.style.color = active ? 'var(--primary-green)' : '#e74c3c';
    }
    try {
        const res = await api.request(`/users/${userId}/status`, 'PUT', { active });
        if (!res.success) {
            alert('Failed to update status: ' + res.message);
            fetchAndRenderUsers();
        }
    } catch (e) {
        alert('An error occurred while updating status.');
        fetchAndRenderUsers();
    }
}

async function fetchAndRenderReports() {
    const tableBody = document.getElementById('reportsTableBody');
    if (!tableBody) return;

    try {
        const response = await api.request('/reports', 'GET');
        if (response.success && Array.isArray(response.data)) {
            const reports = response.data;
            updateStats(reports);
            renderActivityCards(reports);
            renderCharts(reports);

            tableBody.innerHTML = '';
            reports.forEach(report => {
                const row = document.createElement('tr');
                let badgeClass = report.status.toLowerCase();

                let authorityOptions = `<option value="">-- Unassigned --</option>`;
                allAuthorities.forEach(auth => {
                    const isSelected = report.assignedReporterId === auth.id ? 'selected' : '';
                    authorityOptions += `<option value="${auth.id}" ${isSelected}>${auth.name}</option>`;
                });

                row.innerHTML = `
                    <td>#${report.id}</td>
                    <td>
                        <div style="font-weight: 600;">${report.location}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${report.description}</div>
                    </td>
                    <td><span class="status-badge ${badgeClass}">${report.status}</span></td>
                    <td>${report.reporterName || 'Citizen'}</td>
                    <td>
                        <select class="assignment-dropdown" onchange="assignAuthority(${report.id}, this)">
                            ${authorityOptions}
                        </select>
                    </td>
                    <td>
                        <button class="action-btn" onclick="window.location.href='report-details.html?id=${report.id}'"><span class="material-icons-round">visibility</span></button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (e) { console.error(e); }
}

function updateStats(reports) {
    const counts = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    reports.forEach(r => counts[r.status]++);
    
    document.getElementById('statTotalReports').textContent = reports.length;
    document.getElementById('statPendingReports').textContent = counts.PENDING;
    document.getElementById('statInProgressReports').textContent = counts.IN_PROGRESS;
    document.getElementById('statResolvedReports').textContent = counts.RESOLVED;
}

function renderActivityCards(reports) {
    const activityGrid = document.getElementById('activityGrid');
    const featuredGrid = document.getElementById('featuredReportsGrid');
    
    // 1. Activity Feed (List/Small Cards)
    if (activityGrid) {
        activityGrid.innerHTML = '';
        reports.slice(0, 4).forEach(item => {
            const card = document.createElement('div');
            card.className = 'activity-report-card';
            card.innerHTML = `
                <div class="activity-card-header">
                    <div class="animal-tag"><span class="material-icons-round">pets</span> ${item.animalType || 'Wildlife'}</div>
                    <span class="activity-date">${new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="activity-card-body">
                    <h4>${item.description.substring(0, 40)}...</h4>
                    <div class="activity-loc"><span class="material-icons-round" style="font-size: 1rem;">location_on</span> ${item.location}</div>
                </div>
                <div class="activity-card-footer">
                    <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
                </div>
            `;
            activityGrid.appendChild(card);
        });
    }

    // 2. Featured Reports (Large Cards with Actions)
    if (featuredGrid) {
        featuredGrid.innerHTML = '';
        reports.slice(0, 4).forEach(item => {
            const card = document.createElement('div');
            card.className = 'report-card';
            
            // Map types to local images
            const typeLower = (item.animalType || '').toLowerCase();
            let imgSrc = 'https://images.unsplash.com/photo-1549366021-9f761d450616?auto=format&fit=crop&q=80&w=400'; // Generic forest
            if (typeLower.includes('elephant')) imgSrc = 'assets/images/elephant.jpeg';
            else if (typeLower.includes('tiger')) imgSrc = 'assets/images/tiger.jpeg';
            else if (typeLower.includes('flamingo')) imgSrc = 'assets/images/flamingo.jpeg';
            else if (typeLower.includes('turtle')) imgSrc = 'assets/images/turtle.jpeg';
            else if (typeLower.includes('panda')) imgSrc = 'assets/images/panda.jpeg';

            card.innerHTML = `
                <img src="${imgSrc}" class="report-card-img" onerror="this.src='https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400'">
                <div class="report-card-body">
                    <div class="report-card-header">
                        <h4 class="report-card-title">${item.animalType || 'Wildlife Sighting'}</h4>
                        <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
                    </div>
                    <div class="report-card-location">
                        <span class="material-icons-round" style="font-size: 1rem;">location_on</span>
                        ${item.location}
                    </div>
                    <div class="report-card-actions">
                        <button class="action-btn" onclick="window.location.href='report-details.html?id=${item.id}'" title="View Details"><span class="material-icons-round" style="font-size: 1.2rem;">visibility</span></button>
                        <button class="action-btn" onclick="window.location.href='report-details.html?id=${item.id}'" title="Modify/Update"><span class="material-icons-round" style="font-size: 1.2rem;">edit</span></button>
                    </div>
                </div>
            `;
            featuredGrid.appendChild(card);
        });
    }
}

window.assignAuthority = async function (reportId, selectEl) {
    const selectedId = selectEl.value;
    const selectedName = selectEl.options[selectEl.selectedIndex].text;
    if (!selectedId) return;

    try {
        const res = await api.request(`/reports/${reportId}/assign`, 'PUT', {
            reporterId: parseInt(selectedId),
            reporterName: selectedName
        });
        if (res.success) alert('Authority assigned successfully');
        else alert('Failed: ' + res.message);
    } catch (e) { alert('Error occurred'); }
}
