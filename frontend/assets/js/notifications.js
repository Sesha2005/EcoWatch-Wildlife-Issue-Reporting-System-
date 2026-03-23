// notifications.js - Handles unified notification logic across dashboards

let notificationsData = [];
let unreadCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Only load if the user is authenticated
    if (api.auth.isAuthenticated()) {
        fetchNotifications();
        // Option to poll every 30 seconds
        setInterval(fetchNotifications, 30000);
    }
});

// Click outside to close dropdown
window.onclick = function(event) {
    if (!event.target.matches('.icon-btn') && !event.target.closest('#notificationBtn') && !event.target.closest('#notificationDropdown')) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.style.display === 'flex') {
            dropdown.style.display = 'none';
        }
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    const badge = document.getElementById('notificationBadge');
    
    if (dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'flex';
        // When opening, we can simulate marking them as seen
        markAllNotificationsRead();
        renderNotificationList();
    }
}

function markAllNotificationsRead() {
    // Store the current timestamp as the last read time
    localStorage.setItem('lastReadNotifications', Date.now());
    unreadCount = 0;
    updateBadge();
    
    // Update UI styling for existing items
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
}

async function fetchNotifications() {
    const role = api.auth.getRole();
    const userId = parseInt(api.auth.getUserId());
    let rawItems = [];

    try {
        // 1. Fetch Inbox Messages (Applies to all roles)
        const msgsRes = await api.request('/messages/inbox', 'GET');
        if (msgsRes.success && Array.isArray(msgsRes.data)) {
            const msgList = msgsRes.data.data || msgsRes.data;
            if (Array.isArray(msgList)) {
                msgList.forEach(m => {
                    let title = '';
                    let contentPrefix = '';
                    if (role === 'CITIZEN') {
                        title = 'Case Update Message';
                        contentPrefix = 'Authority: ';
                    } else if (role === 'AUTHORITY') {
                        title = 'Message from Admin';
                        contentPrefix = '';
                    } else if (role === 'ADMIN') {
                        title = 'Authority Message';
                        contentPrefix = '';
                    }
                    
                    const mContent = m.content.length > 40 ? m.content.substring(0, 40) + '...' : m.content;
                    
                    rawItems.push({
                        id: 'msg_' + m.id,
                        type: 'MESSAGE',
                        title: title,
                        content: contentPrefix + mContent,
                        time: new Date(m.createdAt).getTime() || Date.now(),
                        icon: 'mail'
                    });
                });
            }
        }

        // 2. Fetch Role-Specific Updates
        if (role === 'CITIZEN') {
            const reportsRes = await api.request(`/reports/user/${userId}`, 'GET');
            if (reportsRes.success && Array.isArray(reportsRes.data)) {
                reportsRes.data.forEach(r => {
                    const rTime = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();
                    
                    // 1. Report Submitted
                    rawItems.push({
                        id: 'rep_sub_' + r.id,
                        type: 'REPORT_SUBMITTED',
                        title: 'Report Submitted',
                        content: 'Your report has been submitted successfully.',
                        time: rTime,
                        icon: 'check_circle_outline'
                    });

                    // 2. Case Assigned
                    if (r.assignedReporterName || (r.assignedReporterId && r.assignedReporterId !== 0)) {
                        rawItems.push({
                            id: 'rep_asn_' + r.id,
                            type: 'CASE_ASSIGNED',
                            title: 'Case Assigned',
                            content: 'Your report has been assigned to an authority.',
                            time: rTime + 10000,
                            icon: 'assignment_ind'
                        });
                    }

                    // 3. Status Updated
                    if (r.status === 'IN_PROGRESS' || r.status === 'RESOLVED') {
                        rawItems.push({
                            id: 'rep_prog_' + r.id,
                            type: 'STATUS_UPDATED',
                            title: 'Status Updated',
                            content: 'Your report is now In Progress.',
                            time: rTime + 20000,
                            icon: 'autorenew'
                        });
                    }

                    // 5. Report Resolved
                    if (r.status === 'RESOLVED') {
                        rawItems.push({
                            id: 'rep_res_' + r.id,
                            type: 'REPORT_RESOLVED',
                            title: 'Report Resolved',
                            content: 'Your report has been resolved.',
                            time: rTime + 30000,
                            icon: 'task_alt'
                        });
                    }
                });
            }
        } 
        else if (role === 'AUTHORITY') {
            const reportsRes = await api.request('/reports', 'GET');
            let pendingCount = 0;
            if (reportsRes.success && Array.isArray(reportsRes.data)) {
                reportsRes.data.filter(r => r.assignedReporterId === userId).forEach(r => {
                    const rTime = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();
                    
                    // 1. New Case Assigned
                    rawItems.push({
                        id: 'assignment_' + r.id,
                        type: 'ASSIGNMENT',
                        title: 'New Case Assigned',
                        content: 'A new report has been assigned to you.',
                        time: rTime,
                        icon: 'assignment'
                    });
                    
                    // Count pending/ongoing cases for reminder
                    if (r.status === 'PENDING' || r.status === 'IN_PROGRESS') {
                        pendingCount++;
                    }

                    // 5. Feedback Received
                    if (r.status === 'RESOLVED' && r.rating > 0) {
                        rawItems.push({
                            id: 'feedback_' + r.id,
                            type: 'FEEDBACK',
                            title: 'Feedback Received',
                            content: 'A user has given feedback on your resolved case.',
                            time: rTime + 50000,
                            icon: 'star'
                        });
                    }
                });
                
                // 3. Reminder
                if (pendingCount > 0) {
                    rawItems.push({
                        id: 'pending_reminder',
                        type: 'REMINDER',
                        title: 'Reminder',
                        content: 'You have pending cases to review.',
                        time: Date.now() - 5000, // Show at top
                        icon: 'access_time'
                    });
                }
            }
        }
        else if (role === 'ADMIN') {
            const reportsRes = await api.request('/reports', 'GET');
            if (reportsRes.success && Array.isArray(reportsRes.data)) {
                let unassignedCount = 0;
                let resolvedCount = 0;
                
                reportsRes.data.forEach(r => {
                    const rTime = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();
                    
                    // 1. New Report Submitted
                    if (r.status === 'PENDING') {
                        rawItems.push({
                            id: 'newrep_' + r.id,
                            type: 'NEW_REPORT',
                            title: 'New Report Submitted',
                            content: 'A new wildlife report has been submitted.',
                            time: rTime,
                            icon: 'fiber_new'
                        });
                    }
                    
                    // Unassigned counts
                    if (!r.assignedReporterId || r.assignedReporterId === 0) {
                        unassignedCount++;
                    }
                    
                    // 3. Low Feedback Alert
                    if (r.status === 'RESOLVED' && r.rating > 0 && r.rating <= 2) {
                        rawItems.push({
                            id: 'low_rating_' + r.id,
                            type: 'LOW_FEEDBACK',
                            title: 'Low Feedback Alert',
                            content: 'A report received low rating.',
                            time: rTime + 50000,
                            icon: 'warning'
                        });
                    }
                    
                    if (r.status === 'RESOLVED') {
                        resolvedCount++;
                    }
                });
                
                // 2. Unassigned Reports
                if (unassignedCount > 0) {
                    rawItems.push({
                        id: 'unassigned_alert',
                        type: 'UNASSIGNED',
                        title: 'Unassigned Reports',
                        content: `There are ${unassignedCount} unassigned reports.`,
                        time: Date.now() - 10000, // Near top
                        icon: 'person_off'
                    });
                }
                
                // 5. System Activity
                if (resolvedCount > 0) {
                    rawItems.push({
                        id: 'system_activity',
                        type: 'ACTIVITY',
                        title: 'System Activity',
                        content: `${resolvedCount} reports resolved today.`,
                        time: Date.now() - 60000,
                        icon: 'analytics'
                    });
                }
            }
        }

        // Sort by most recent
        rawItems.sort((a, b) => b.time - a.time);
        
        // Keep top 15
        notificationsData = rawItems.slice(0, 15);
        
        // Calculate unread
        const lastRead = parseInt(localStorage.getItem('lastReadNotifications') || '0');
        unreadCount = notificationsData.filter(n => n.time > lastRead).length;
        
        // If there are unread items but it's the very first time, default to showing some badge
        if (lastRead === 0 && notificationsData.length > 0) {
            unreadCount = Math.min(notificationsData.length, 3);
        }

        updateBadge();
        
        // Only re-render list if dropdown is currently open to avoid jitter, 
        // OR we can quietly render in background
        renderNotificationList();

    } catch (e) {
        console.error("Failed to fetch notifications:", e);
    }
}

function updateBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotificationList() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (notificationsData.length === 0) {
        list.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">You're all caught up!</div>`;
        return;
    }
    
    const lastRead = parseInt(localStorage.getItem('lastReadNotifications') || '0');

    notificationsData.forEach(item => {
        const isUnread = item.time > lastRead || (lastRead === 0);
        
        const el = document.createElement('div');
        el.className = `notification-item ${isUnread ? 'unread' : ''}`;
        
        // Format time dynamically
        const dateObj = new Date(item.time);
        let timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        if (Date.now() - item.time > 86400000) {
            timeStr = dateObj.toLocaleDateString() + ' ' + timeStr;
        }

        el.innerHTML = `
            <div class="notification-icon">
                <span class="material-icons-round" style="font-size: 1.1rem;">${item.icon}</span>
            </div>
            <div class="notification-content">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <p style="font-weight: ${isUnread ? '600' : '500'}; color: var(--text-dark);">${item.title}</p>
                    <span class="notification-time">${timeStr}</span>
                </div>
                <p style="color: var(--text-muted);">${item.content}</p>
            </div>
        `;
        list.appendChild(el);
    });
}
