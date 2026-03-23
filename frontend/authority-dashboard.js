// Top-level global functions for sidebar navigation
window.currentSection = 'dashboard';

window.showSection = function (sectionId, element) {
    if (!sectionId) return;
    window.currentSection = sectionId;

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');

    // Show appropriate container
    if (sectionId === 'dashboard') {
        const dashboard = document.getElementById('dashboard-section');
        if (dashboard) dashboard.style.display = 'block';
    } else if (sectionId === 'nearby') {
        const nearby = document.getElementById('nearby-section');
        if (nearby) nearby.style.display = 'block';
    } else if (sectionId === 'messages') {
        const messages = document.getElementById('messages-section');
        if (messages) messages.style.display = 'block';
        loadContactsForMessaging();
    } else {
        const table = document.getElementById('table-section');
        if (table) table.style.display = 'block';
    }

    // Update active class on sidebar
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    // Update header text based on section
    const titles = {
        'dashboard': 'Authority Dashboard',
        'tasks': 'My Tasks',
        'resolved': 'Resolved Reports',
        'messages': 'Command Center Communication',
        'nearby': 'Reports Nearby'
    };
    const desc = {
        'dashboard': 'Review and update the status of wildlife grievance reports.',
        'tasks': 'Reports specifically assigned to you for investigation.',
        'resolved': 'A history of successfully resolved wildlife incidents.',
        'messages': 'Instant messaging with system administrators and HQ.',
        'nearby': 'Discover wildlife incidents occurring near your current post.'
    };

    const greeting = document.getElementById('greetingMsg');
    const description = document.getElementById('sectionDescription');
    if (greeting) greeting.textContent = titles[sectionId] || 'Authority Portal';
    if (description) description.textContent = desc[sectionId] || 'Review reports.';

    // Load data for the selected section
    loadAuthorityData(sectionId);
}

// Global update status function
window.updateReportStatus = async function (reportId, newStatus) {
    try {
        const response = await api.request(`/reports/${reportId}/status`, 'PUT', { status: newStatus });
        if (response.success) {
            alert('Status updated successfully');
            loadAuthorityData(window.currentSection);
        } else {
            alert(`Failed: ${response.message}`);
        }
    } catch (err) {
        console.error('Update status error:', err);
        alert("Error occurred while updating status.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication Check
    if (!api.auth.isAuthenticated() || api.auth.getRole() !== 'AUTHORITY') {
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. Setup Profile Info (Safe fallback)
    try {
        const userId = api.auth.getUserId();
        const userNameHeader = document.getElementById('userNameHeader');
        if (userNameHeader) {
            // We don't have the full user object, so we use fallback or ID
            userNameHeader.textContent = `Officer #${userId || 'User'}`;
        }
    } catch (e) {
        console.warn('Profile setup failed:', e);
    }

    // 3. Setup global listeners
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            api.auth.logout();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAuthorityData(window.currentSection);
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadAuthorityData(window.currentSection);
        });
    }

    // 4. Initial Load
    window.currentSection = 'dashboard';
    await loadAuthorityData('dashboard');
});

// Messaging Implementation
let selectedContactId = null;
let messagePollInterval = null;

async function loadContactsForMessaging() {
    const list = document.getElementById('contactList');
    if (!list) return;

    try {
        const response = await api.request('/users', 'GET');
        if (response.success && Array.isArray(response.data)) {
            const admins = response.data.filter(u => u.role === 'ADMIN');
            list.innerHTML = '';
            
            if (admins.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No administrators online.</p>';
                return;
            }

            admins.forEach(admin => {
                const item = document.createElement('div');
                item.style.padding = '1rem';
                item.style.borderRadius = '12px';
                item.style.cursor = 'pointer';
                item.style.marginBottom = '0.75rem';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '12px';
                item.style.transition = 'all 0.2s';
                
                if (selectedContactId === admin.id) {
                    item.style.background = 'rgba(46, 125, 50, 0.08)';
                    item.style.border = '1px solid var(--primary-green)';
                } else {
                    item.style.background = '#f8fafc';
                    item.style.border = '1px solid transparent';
                }

                item.onclick = () => selectContactForChat(admin);

                item.innerHTML = `
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #34495e; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold;">
                        AD
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-dark);">${admin.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">System Administrator</div>
                    </div>
                `;
                list.appendChild(item);
            });
        }
    } catch (e) {
        console.error("Contact Load Error:", e);
    }
}

function selectContactForChat(contact) {
    selectedContactId = contact.id;
    const header = document.getElementById('currentRecipientName');
    if (header) header.textContent = `Direct Line to ${contact.name}`;
    
    const inputArea = document.getElementById('messageInputArea');
    if (inputArea) inputArea.style.display = 'block';
    
    loadContactsForMessaging();
    loadMessagesForChat();
    
    if (messagePollInterval) clearInterval(messagePollInterval);
    messagePollInterval = setInterval(loadMessagesForChat, 3000);
}

async function loadMessagesForChat() {
    if (!selectedContactId || window.currentSection !== 'messages') return;

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
                ...inboxList.filter(m => m.senderId === selectedContactId),
                ...sentList.filter(m  => m.receiverId === selectedContactId)
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
        display.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 2rem;">No correspondence found. Send a message to HQ.</div>`;
        return;
    }

    const currentUserId = parseInt(api.auth.getUserId());

    messages.forEach(msg => {
        const isMe = msg.senderId === currentUserId;
        const msgDiv = document.createElement('div');
        msgDiv.style.maxWidth = '75%';
        msgDiv.style.padding = '0.85rem 1.1rem';
        msgDiv.style.borderRadius = isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
        msgDiv.style.fontSize = '0.92rem';
        msgDiv.style.lineHeight = '1.4';
        msgDiv.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
        msgDiv.style.background = isMe ? 'var(--primary-green)' : 'white';
        msgDiv.style.color = isMe ? 'white' : 'var(--text-dark)';
        msgDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        msgDiv.style.border = isMe ? 'none' : '1px solid #edf2f7';

        msgDiv.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px; font-size: 0.72rem; opacity: 0.8;">${isMe ? 'You' : msg.senderName}</div>
            <div>${msg.content}</div>
            <div style="font-size: 0.65rem; margin-top: 6px; opacity: 0.6; text-align: right;">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
    if (!content || !selectedContactId) return;

    input.value = '';
    const res = await api.request('/messages/send', 'POST', {
        receiverId: selectedContactId,
        content: content
    });

    if (res.success) {
        loadMessagesForChat();
    } else {
        alert("Transmission failed: " + res.message);
    }
}

// Global Event Listeners for Messages (Delegation)
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

async function loadAuthorityData(sectionId = 'dashboard') {
    const tableBody = document.getElementById('authorityTableBody');
    const filterValue = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'ALL';
    const userId = api.auth.getUserId();

    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">Refreshing records...</td></tr>';
    }

    try {
        const response = await api.request('/reports', 'GET');

        if (response.success && Array.isArray(response.data)) {
            const allReports = response.data;

            // Update stats regardless of view
            updateStatsCounters(allReports);

            let filteredReports = [...allReports];

            // Filter by section logic
            if (sectionId === 'tasks') {
                filteredReports = allReports.filter(r => String(r.assignedReporterId) === String(userId));
            } else if (sectionId === 'resolved') {
                filteredReports = allReports.filter(r => r.status === 'RESOLVED' && String(r.assignedReporterId) === String(userId));
            } else if (sectionId === 'nearby') {
                renderNearbyCards(allReports.slice(0, 4));
                return; // Early return for nearby as it uses card layout
            }

            // Secondary Filter: Status Dropdown (only for table views)
            if (filterValue !== 'ALL') {
                filteredReports = filteredReports.filter(r => r.status === filterValue);
            }

            // Layout updates
            if (sectionId === 'dashboard') {
                // Also render table at the bottom of dashboard
                renderReportsTable(filteredReports);
            } else {
                renderReportsTable(filteredReports);
            }

        } else {
            console.error('Fetch error:', response.message);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e74c3c;">${response.message || 'Error fetching data'}</td></tr>`;
        }

    } catch (error) {
        console.error('Data loading crash:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Critical error loading data. Check console.</td></tr>`;
        }
    }
}

function updateStatsCounters(reports) {
    const userId = api.auth.getUserId();
    const myReports = reports.filter(r => String(r.assignedReporterId) === String(userId));
    
    let pending = 0, inProgress = 0, resolved = 0;
    myReports.forEach(r => {
        if (r.status === 'PENDING') pending++;
        else if (r.status === 'IN_PROGRESS') inProgress++;
        else if (r.status === 'RESOLVED') resolved++;
    });
    
    const elements = {
        'statTotal': myReports.length,
        'statPending': pending,
        'statInProgress': inProgress,
        'statResolved': resolved
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

function renderReportsTable(reports) {
    const tableBody = document.getElementById('authorityTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (reports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">No reports found in this section.</td></tr>`;
        return;
    }

    reports.forEach(report => {
        const row = document.createElement('tr');
        const shortDesc = report.description.length > 50
            ? report.description.substring(0, 50) + '...'
            : report.description;

        let badgeClass = 'pending';
        let displayStatus = 'Pending';
        if (report.status === 'IN_PROGRESS') {
            badgeClass = 'in_progress';
            displayStatus = 'Investigating';
        } else if (report.status === 'RESOLVED') {
            badgeClass = 'resolved';
            displayStatus = 'Resolved';
        }

        let satisfactionHtml = '<span style="color: #e2e8f0;">—</span>';
        if (report.status === 'RESOLVED') {
            if (report.rating && report.rating > 0) {
                const goldStars = "★".repeat(report.rating);
                const slateStars = "☆".repeat(5 - report.rating);
                satisfactionHtml = `<span style="color: #f1c40f; font-size: 1.1rem; letter-spacing: 1px;" title="Rating: ${report.rating}/5">${goldStars}</span><span style="color: #cbd5e1; font-size: 1.1rem; letter-spacing: 1px;">${slateStars}</span>`;
            } else {
                satisfactionHtml = '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Not rated</span>';
            }
        }

        row.innerHTML = `
            <td>#${report.id}</td>
            <td>${report.location}</td>
            <td class="description-cell" title="${report.description}">${shortDesc}</td>
            <td><span class="status-badge ${badgeClass}">${displayStatus}</span></td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${report.assignedReporterName || '<i>Not Assigned</i>'}</td>
            <td>${satisfactionHtml}</td>
            <td>
                <button class="action-icon-btn" onclick="openUpdateModal(${report.id}, ${report.reporterId}, '${report.status}')" title="Update Status & Notify">
                    <span class="material-icons-round" style="font-size: 1.2rem;">edit_note</span>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Modal Control Functions
window.openUpdateModal = function(reportId, citizenId, currentStatus) {
    document.getElementById('modalReportId').value = reportId;
    document.getElementById('modalCitizenId').value = citizenId;
    document.getElementById('modalStatus').value = currentStatus;
    document.getElementById('modalMessage').value = '';
    document.getElementById('statusModal').style.display = 'flex';
}

window.closeStatusModal = function() {
    document.getElementById('statusModal').style.display = 'none';
}

window.useSuggestion = function(text) {
    document.getElementById('modalMessage').value = text;
}

window.submitStatusUpdate = async function() {
    const reportId = document.getElementById('modalReportId').value;
    const citizenId = document.getElementById('modalCitizenId').value;
    const status = document.getElementById('modalStatus').value;
    const message = document.getElementById('modalMessage').value.trim();

    try {
        // 1. Update Status
        const statusRes = await api.request(`/reports/${reportId}/status`, 'PUT', { status });
        
        if (statusRes.success) {
            // 2. Send Message if provided
            if (message) {
                await api.request('/messages/send', 'POST', {
                    receiverId: parseInt(citizenId),
                    content: `[Report #${reportId} Update]: ${message}`
                });
            }
            
            alert(`Report #${reportId} updated to ${status}. Notification sent to citizen.`);
            closeStatusModal();
            loadAuthorityData(window.currentSection);
        } else {
            alert("Error updating status: " + statusRes.message);
        }
    } catch (err) {
        console.error("Submission error:", err);
        alert("A critical error occurred while updating the report.");
    }
}

function renderNearbyCards(reports) {
    const grid = document.getElementById('nearbyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (reports.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">No nearby incidents detected.</p>';
        return;
    }

    reports.forEach(item => {
        const card = document.createElement('div');
        card.className = 'report-card';
        card.innerHTML = `
            <img src="https://images.unsplash.com/photo-1549366021-9f761d450616?auto=format&fit=crop&q=80&w=400" class="report-card-img" onerror="this.src='assets/images/placeholder.jpg'">
            <div class="report-card-body">
                <h4 class="report-card-title">${item.animalType || 'Wildlife sighting'}</h4>
                <div class="report-card-location"><span class="material-icons-round" style="font-size: 1rem;">location_on</span> ${item.location} (Nearby)</div>
                <div class="report-card-actions">
                    <button class="action-btn" onclick="window.location.href='report-details.html?id=${item.id}'"><span class="material-icons-round">visibility</span></button>
                    <button class="btn btn-primary btn-sm" style="font-size: 0.7rem; padding: 4px 8px;">Respond</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
