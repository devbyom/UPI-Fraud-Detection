// ================================================================
//  UPI Fraud Detection — Om Anand | AKTU B.Tech CSE
//  script.js  v2.0 — Fixed: no double-init, no false error toasts
// ================================================================

class FraudDetectionApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.isAutoRefresh = false;
        this.chart = null;
        this._initialized = false;
        this.init();
    }

    init() {
        if (this._initialized) return;   // prevent double-init guard
        this._initialized = true;

        this.setupEventListeners();
        this.loadDashboard();
        this.startRealTimeUpdates();
        this.initializeChart();
        this.loadAlerts();
    }

    // ── Navigation ───────────────────────────────────────────────
    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
                this.updateActiveNav(item);
            });
        });

        // Threshold sliders
        document.getElementById('highRiskThreshold')?.addEventListener('input', (e) => {
            document.querySelectorAll('.threshold-value')[0].textContent = e.target.value;
        });
        document.getElementById('mediumRiskThreshold')?.addEventListener('input', (e) => {
            document.querySelectorAll('.threshold-value')[1].textContent = e.target.value;
        });

        // Fraud check buttons
        document.getElementById('checkForFraudBtn')?.addEventListener('click', () => {
            this.submitTransaction();
        });
        document.getElementById('analyzeTransactionBtn')?.addEventListener('click', () => {
            this.analyzeCurrentTransaction();
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
            switch (sectionId) {
                case 'dashboard':   this.loadDashboard();   break;
                case 'transactions': this.loadTransactions(); break;
                case 'analytics':   this.loadAnalytics();   break;
                case 'models':      this.loadModels();       break;
                case 'alerts':      this.loadAlerts();       break;
            }
        }
    }

    updateActiveNav(activeItem) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        activeItem.classList.add('active');
    }

    // ── Dashboard ─────────────────────────────────────────────────
    async loadDashboard() {
        try {
            this.showLoading();
            const data = await this.fetchDashboardData();
            this.updateDashboardMetrics(data);
            this.updateTransactionsList(data.transactions);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            this.hideLoading();
        }
    }

    async fetchDashboardData() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/dashboard/metrics`);
            if (res.ok) {
                const metrics = await res.json();
                const txRes = await fetch(`${this.apiBaseUrl}/api/transactions?limit=10`);
                const transactions = txRes.ok ? await txRes.json() : this.generateMockTransactions(10);
                return {
                    transactionVolume: metrics.transaction_volume,
                    fraudRate: metrics.fraud_rate,
                    modelAccuracy: metrics.model_accuracy,
                    responseTime: metrics.response_time,
                    activeTransactions: metrics.active_transactions,
                    fraudDetected: metrics.fraud_detected,
                    transactions
                };
            }
        } catch (_) {
            // backend offline — use demo data silently
        }
        return {
            transactionVolume: Math.floor(Math.random() * 10000) + 5000,
            fraudRate: (Math.random() * 0.1).toFixed(3) + '%',
            modelAccuracy: (95 + Math.random() * 4).toFixed(1) + '%',
            responseTime: Math.floor(Math.random() * 50) + 30 + 'ms',
            activeTransactions: Math.floor(Math.random() * 100) + 50,
            fraudDetected: Math.floor(Math.random() * 10),
            transactions: this.generateMockTransactions(10)
        };
    }

    updateDashboardMetrics(data) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('transactionVolume', typeof data.transactionVolume === 'number'
            ? data.transactionVolume.toLocaleString() : data.transactionVolume);
        set('fraudRate',         data.fraudRate);
        set('modelAccuracy',     data.modelAccuracy);
        set('responseTime',      data.responseTime);
        set('activeTransactions',data.activeTransactions);
        set('fraudDetected',     data.fraudDetected);
    }

    generateMockTransactions(count) {
        const merchants  = ['Amazon','Flipkart','Swiggy','Zomato','Uber','Ola','Paytm','PhonePe'];
        const locations  = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Pune','Ahmedabad'];
        const statuses   = ['safe','risky','fraud'];
        return Array.from({ length: count }, (_, i) => ({
            id:        'TXN' + (1000000 + i),
            amount:    Math.floor(Math.random() * 50000) + 100,
            merchant:  merchants[Math.floor(Math.random() * merchants.length)],
            location:  locations[Math.floor(Math.random() * locations.length)],
            status:    statuses[Math.floor(Math.random() * statuses.length)],
            timestamp: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString()
        }));
    }

    updateTransactionsList(transactions) {
        const el = document.getElementById('transactionsList');
        if (!el) return;
        el.innerHTML = transactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-id">${t.id}</div>
                    <div class="transaction-details">${t.merchant} &bull; ${t.location} &bull; ${t.timestamp}</div>
                </div>
                <div class="transaction-amount">&#8377;${t.amount.toLocaleString()}</div>
                <div class="transaction-status ${t.status}">${t.status}</div>
            </div>
        `).join('');
    }

    // ── Transaction Analysis ──────────────────────────────────────
    async submitTransaction() {
        const transactionId = document.getElementById('transactionId')?.value;
        const amount        = document.getElementById('amount')?.value;
        const merchant      = document.getElementById('merchant')?.value;
        const location      = document.getElementById('location')?.value;

        if (!transactionId || !amount || !merchant || !location) {
            this.showToast('Please fill in all fields', 'warning');
            return;
        }
        try {
            this.showLoading();
            const txData = { transaction_id: transactionId, amount: parseFloat(amount), merchant, location, timestamp: new Date().toISOString() };
            const result = await this.analyzeTransaction(txData);
            this.displayAnalysisResult(result);
        } catch (err) {
            this.showToast('Analysis failed. Please try again.', 'error');
            console.error(err);
        } finally {
            this.hideLoading();
        }
    }

    async analyzeTransaction(txData) {
        try {
            const apiData = {
                transaction_id: txData.transaction_id,
                upi_id: 'user@upi',
                merchant_id: txData.merchant,
                amount: parseFloat(txData.amount),
                hour: new Date().getHours(),
                device_risk_score: 0.3,
                location_risk_score: 0.2,
                user_behavior_score: 0.5
            };
            const res = await fetch(`${this.apiBaseUrl}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            });
            if (res.ok) return await res.json();
            // backend responded with error — fall back silently
            return this.generateMockAnalysis(txData);
        } catch (_) {
            // backend offline — use demo mode silently (no red toast)
            return this.generateMockAnalysis(txData);
        }
    }

    generateMockAnalysis(txData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const riskScore = Math.random();
                const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';
                resolve({
                    transaction_id:  txData.transaction_id,
                    risk_score:      riskScore,
                    risk_level:      riskLevel,
                    factors:         this.generateRiskFactors(riskLevel),
                    recommendation:  this.getRecommendation(riskLevel),
                    model_confidence:(85 + Math.random() * 15).toFixed(1) + '%',
                    explanation:     'Demo mode — connect backend for live predictions',
                    decision:        riskLevel === 'high' ? 'BLOCK' : riskLevel === 'medium' ? 'CHALLENGE' : 'ALLOW',
                    processing_time: Math.floor(Math.random() * 30) + 10
                });
            }, 1200);
        });
    }

    generateRiskFactors(riskLevel) {
        const map = {
            low:    [{ name:'Amount', score:.2, status:'safe' },{ name:'Location', score:.1, status:'safe' },{ name:'Merchant', score:.3, status:'safe' }],
            medium: [{ name:'Amount', score:.6, status:'medium' },{ name:'Location', score:.4, status:'medium' },{ name:'Merchant', score:.5, status:'medium' }],
            high:   [{ name:'Amount', score:.9, status:'high' },{ name:'Location', score:.8, status:'high' },{ name:'Merchant', score:.7, status:'high' }]
        };
        return map[riskLevel] || map.low;
    }

    getRecommendation(riskLevel) {
        return {
            low:    'Transaction appears safe. Proceed with normal processing.',
            medium: 'Transaction shows some risk indicators. Consider additional verification.',
            high:   'High risk transaction detected. Recommend blocking or manual review.'
        }[riskLevel];
    }

    displayAnalysisResult(result) {
        const el = document.getElementById('analysisResult');
        if (!el) return;

        const riskScore = result.risk_score ?? (result.risk_factors?.overall_score ?? 0);
        const riskLevel = result.risk_level || this.getRiskLevelFromScore(riskScore);
        const decision  = result.decision   || (riskLevel === 'high' ? 'BLOCK' : riskLevel === 'medium' ? 'CHALLENGE' : 'ALLOW');

        el.innerHTML = `
            <div class="result-header ${riskLevel}">
                <h3>Transaction Analysis Result</h3>
                <div class="risk-badge ${riskLevel}">${riskLevel.toUpperCase()} RISK</div>
            </div>
            <div class="result-content">
                <div class="result-summary">
                    <div class="result-item">
                        <span class="label">Risk Score</span>
                        <span class="value">${(riskScore * 100).toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Decision</span>
                        <span class="value decision ${decision.toLowerCase()}">${decision}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Confidence</span>
                        <span class="value">${result.model_confidence || '90%'}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Processing</span>
                        <span class="value">${result.processing_time || 15}ms</span>
                    </div>
                </div>
                <div class="risk-factors">
                    <h4>Risk Factors</h4>
                    <div class="factors-list">
                        ${this.renderRiskFactors(result.factors || [])}
                    </div>
                </div>
                <div class="recommendation">
                    <h4>Recommendation</h4>
                    <p>${result.recommendation || 'No recommendation available.'}</p>
                </div>
                ${result.explanation ? `<div class="explanation"><p><i class="fas fa-info-circle"></i>&nbsp;${result.explanation}</p></div>` : ''}
            </div>`;

        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const badge = riskLevel === 'high' ? 'error' : riskLevel === 'medium' ? 'warning' : 'success';
        this.showToast(`Risk level: ${riskLevel.toUpperCase()} — Decision: ${decision}`, badge);
    }

    renderRiskFactors(factors) {
        if (!factors?.length) return '<p style="color:var(--text-sub);font-size:.8rem">No risk factors available.</p>';
        return factors.map(f => `
            <div class="factor-item ${f.status}">
                <div class="factor-name">${f.name}</div>
                <div class="factor-score">${(f.score * 100).toFixed(1)}%</div>
            </div>`).join('');
    }

    getRiskLevelFromScore(s) {
        return s >= 0.7 ? 'high' : s >= 0.4 ? 'medium' : 'low';
    }

    analyzeCurrentTransaction() { this.submitTransaction(); }

    // ── Chart ─────────────────────────────────────────────────────
    initializeChart() {
        const canvas = document.getElementById('fraudChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        this.drawChart(ctx, canvas.offsetWidth || 400, 200);
    }

    drawChart(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        const data    = [8, 22, 15, 38, 27, 45, 32, 58, 41, 52, 36, 60];
        const padL = 10, padB = 10, padT = 10;
        const w = width - padL - 20;
        const h = height - padB - padT;
        const max = Math.max(...data);

        // Area fill
        const grad = ctx.createLinearGradient(0, padT, 0, padT + h);
        grad.addColorStop(0, 'rgba(0,212,255,0.25)');
        grad.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.beginPath();
        data.forEach((v, i) => {
            const x = padL + i * w / (data.length - 1);
            const y = padT + h - (v / max) * h;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        const lastX = padL + w;
        const lastY = padT + h;
        ctx.lineTo(lastX, lastY);
        ctx.lineTo(padL, lastY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        data.forEach((v, i) => {
            const x = padL + i * w / (data.length - 1);
            const y = padT + h - (v / max) * h;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Dots
        data.forEach((v, i) => {
            const x = padL + i * w / (data.length - 1);
            const y = padT + h - (v / max) * h;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00d4ff';
            ctx.fill();
            ctx.strokeStyle = '#04091a';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    // ── Alerts ────────────────────────────────────────────────────
    loadAlerts() {
        const alerts = [
            { id:1, title:'High Risk Transaction Detected', description:'Transaction TXN1234567 flagged — unusual amount & location combination.', level:'high', timestamp:'2 min ago' },
            { id:2, title:'Model Performance Degradation', description:'XGBoost accuracy dropped below 95% threshold. Retraining recommended.', level:'medium', timestamp:'15 min ago' },
            { id:3, title:'Threat Intelligence Updated', description:'Feed updated with 23 new high-risk IPs across 4 ISPs.', level:'low', timestamp:'1 hr ago' }
        ];
        const el = document.getElementById('alertsList');
        if (!el) return;
        el.innerHTML = alerts.map(a => `
            <div class="alert-item ${a.level}" id="alert-${a.id}">
                <div class="alert-header">
                    <div class="alert-title">${a.title}</div>
                    <div class="alert-time">${a.timestamp}</div>
                </div>
                <div class="alert-description">${a.description}</div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.fraudApp.showToast('Alert details opened', 'info')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('alert-${a.id}').remove(); window.fraudApp.showToast('Alert dismissed', 'success')">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                </div>
            </div>`).join('');
    }

    // ── Real-time Updates ─────────────────────────────────────────
    startRealTimeUpdates() {
        setInterval(() => this.updateHeaderStats(), 5000);
        setInterval(() => { if (this.isAutoRefresh) this.loadDashboard(); }, 10000);
    }

    updateHeaderStats() {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('activeTransactions', Math.floor(Math.random() * 100) + 50);
        set('fraudDetected',      Math.floor(Math.random() * 10));
    }

    toggleAutoRefresh() {
        this.isAutoRefresh = !this.isAutoRefresh;
        const icon = document.getElementById('autoRefreshIcon');
        const text = document.getElementById('autoRefreshText');
        if (icon) icon.className = this.isAutoRefresh ? 'fas fa-pause' : 'fas fa-play';
        if (text) text.textContent = 'Auto Refresh';
        this.showToast(`Auto refresh ${this.isAutoRefresh ? 'enabled' : 'disabled'}`, 'info');
    }

    refreshDashboard() {
        this.loadDashboard();
        this.showToast('Dashboard refreshed', 'success');
    }

    loadTransactions() { /* placeholder */ }
    loadAnalytics()    { /* placeholder */ }
    loadModels()       { /* placeholder */ }

    // ── UI Helpers ────────────────────────────────────────────────
    showLoading() { document.getElementById('loadingOverlay')?.classList.add('active'); }
    hideLoading() { document.getElementById('loadingOverlay')?.classList.remove('active'); }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:.75rem">
                <span>${message}</span>
                <button onclick="this.closest('.toast').remove()"
                    style="background:none;border:none;color:inherit;cursor:pointer;font-size:1rem;line-height:1;padding:0">
                    &times;
                </button>
            </div>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
    }
}

// ── Global helpers (for onclick= attributes in HTML) ──────────────
function refreshDashboard()   { window.fraudApp?.refreshDashboard(); }
function toggleAutoRefresh()  { window.fraudApp?.toggleAutoRefresh(); }
function navigateToTransactions() { window.fraudApp?.showSection('transactions'); }
function submitTransaction()  { window.fraudApp?.submitTransaction(); }

// ── Single initialization ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Guard: only ever create one instance
    if (window.fraudApp) return;
    window.fraudApp = new FraudDetectionApp();
    window.app      = window.fraudApp;   // backward-compat alias

    // Staggered card entrance
    document.querySelectorAll('.metric-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.08}s`;
    });
});

// Handle canvas resize
window.addEventListener('resize', () => {
    if (!window.fraudApp) return;
    const canvas = document.getElementById('fraudChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    setTimeout(() => window.fraudApp.drawChart(ctx, canvas.offsetWidth, 200), 100);
});

// Module export shim
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FraudDetectionApp;
}
