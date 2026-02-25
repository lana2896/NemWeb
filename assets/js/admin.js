import API from './api.js';

class AdminPanel {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.loginSection = document.getElementById('login-section');
        this.dashboardSection = document.getElementById('dashboard-section');
        this.logoutBtn = document.getElementById('logout-btn');
        this.exportBtn = document.getElementById('export-btn');

        this.checkAuth();
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.handleExport());
        }
    }

    async handleExport() {
        // Get all data
        const reservations = await API.get('reservations');

        // Create a Blob
        const dataStr = JSON.stringify(reservations, null, 4);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Create fake link to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = "reservations.json";
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Data downloaded! Now replace "assets/data/reservations.json" with this file.');
    }

    checkAuth() {
        const isAuth = sessionStorage.getItem('admin_auth');
        if (isAuth === 'true') {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        // "Small Admin Page" - Hardcoded credentials for demo
        if (user === 'admin' && pass === 'admin123') {
            sessionStorage.setItem('admin_auth', 'true');

            // Log to Discord
            API.sendDiscord('admin_login', {
                user: user,
                status: 'Success',
                time: new Date().toLocaleTimeString()
            });

            this.showDashboard();
        } else {
            alert('Invalid credentials!');
            // Log failed attempt
            API.sendDiscord('admin_login', {
                user: user,
                status: 'Failed Attempt',
                pass_attempt: '******'
            });
        }
    }

    handleLogout() {
        sessionStorage.removeItem('admin_auth');
        this.showLogin();
    }

    showLogin() {
        this.loginSection.style.display = 'block';
        this.dashboardSection.style.display = 'none';
    }

    async showDashboard() {
        this.loginSection.style.display = 'none';
        this.dashboardSection.style.display = 'block';

        // Load Data
        this.loadReservations();
        this.loadReviews();
    }

    async loadReservations() {
        const container = document.getElementById('reservations-list');
        // Use API to get local reservations (ADMIN MODE)
        const data = await API.get('reservations', 'admin');

        if (data.length === 0) {
            container.innerHTML = '<p>No reservations yet.</p>';
            return;
        }

        container.innerHTML = data.reverse().map(item => `
            <div class="data-card">
                <h4>${item.name} <small>(${item.phone})</small></h4>
                <p><strong>Date:</strong> ${item.date} at ${item.time}</p>
                <p><strong>Guests:</strong> ${item.guests}</p>
                <small style="color: #888;">Submitted: ${new Date(item.timestamp).toLocaleString()} | IP: ${item.ip || 'N/A'}</small>
            </div>
        `).join('');
    }

    async loadReviews() {
        const container = document.getElementById('reviews-list');
        const data = await API.get('reviews', 'admin');

        // Filter only local reviews (typically those have 'Website Local' or timestamps)
        // or just show all. Let's show all latest first.

        container.innerHTML = data.reverse().map(item => `
            <div class="data-card" style="border-left-color: var(--color-accent);">
                <h4>${item.name} - ${item.rating}/5 Stars</h4>
                <p>"${item.comment || item.comment_vi || item.comment_en}"</p>
                <small style="color: #888;">Source: ${item.source || 'Imported'}</small>
            </div>
        `).join('');
    }
}

// Init
new AdminPanel();
