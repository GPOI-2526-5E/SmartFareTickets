// Global state
let currentView = 'dashboard';
let apiUrl = localStorage.getItem('smartfare_api_url') || 'http://localhost:3000';
let dbStats = null;
let routesChart = null;

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SmartFare Dashboard inizializzata');
    console.log('📡 API URL:', apiUrl);
    
    // Load API URL from settings
    const apiUrlInput = document.getElementById('apiUrlInput');
    if (apiUrlInput) {
        apiUrlInput.value = apiUrl;
    }
    
    // Check server status
    checkServerStatus();
    setInterval(checkServerStatus, 30000); // Check every 30s
    
    // Load initial data
    loadDashboardData();
    
    // Setup search input listener
    const searchInput = document.getElementById('dbSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterDatabaseTable);
    }
    
    // Setup sidebar AI query
    const sidebarInput = document.getElementById('sidebarAIQuery');
    if (sidebarInput) {
        sidebarInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitSidebarAI();
            }
        });
    }
});

// Switch between views
function switchView(viewName) {
    currentView = viewName;
    
    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => {
        view.style.display = 'none';
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.style.display = 'block';
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
    
    // Update header
    const headerIcons = {
        'dashboard': 'bi-speedometer2',
        'database': 'bi-database',
        'api-docs': 'bi-code-square',
        'settings': 'bi-gear'
    };
    
    const headerTitles = {
        'dashboard': 'Dashboard',
        'database': 'Database',
        'api-docs': 'API Docs',
        'settings': 'Settings'
    };
    
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="bi ${headerIcons[viewName]} text-primary me-2"></i>${headerTitles[viewName]}`;
    }
    
    // Load view-specific data
    if (viewName === 'dashboard') {
        loadDashboardData();
    } else if (viewName === 'database') {
        loadDatabaseData();
    } else if (viewName === 'api-docs') {
        loadApiDocs();
    }
}

// Check server status
async function checkServerStatus() {
    const statusBadge = document.getElementById('serverStatus');
    
    try {
        const response = await fetch(`${apiUrl}/api/health/db-stats`, {
            signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
            statusBadge.className = 'badge bg-success';
            statusBadge.innerHTML = '<i class="bi bi-circle-fill pulse"></i> Server Online';
            console.log('✅ Server online');
        } else {
            statusBadge.className = 'badge bg-danger';
            statusBadge.innerHTML = '<i class="bi bi-circle-fill"></i> Server Error';
            console.warn('⚠️ Server returned:', response.status);
        }
    } catch (error) {
        statusBadge.className = 'badge bg-danger';
        statusBadge.innerHTML = '<i class="bi bi-circle-fill"></i> Server Offline';
        console.error('❌ Server offline:', error.message);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('📊 Caricamento dati dashboard...');
        const response = await fetch(`${apiUrl}/api/health/db-stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        dbStats = data.stats || data;
        
        console.log('✅ Dati ricevuti:', dbStats);
        
        // Update stat cards
        const totalTrainsEl = document.getElementById('totalTrains');
        const activeRoutesEl = document.getElementById('activeRoutes');
        
        if (totalTrainsEl) {
            totalTrainsEl.textContent = (dbStats.totalTrains || 0).toLocaleString();
        }
        if (activeRoutesEl) {
            activeRoutesEl.textContent = (dbStats.topRoutes?.length || 0).toString();
        }
        
        // Load chart
        loadRoutesChart(dbStats.topRoutes || []);
        
        // Load recent trains
        loadRecentTrains(dbStats.sampleTrains || []);
        
    } catch (error) {
        console.error('❌ Errore caricamento dashboard:', error);
        document.getElementById('totalTrains').textContent = 'Errore';
        document.getElementById('activeRoutes').textContent = 'Errore';
        
        // Show error message
        const recentTrainsEl = document.getElementById('recentTrains');
        if (recentTrainsEl) {
            recentTrainsEl.innerHTML = `
                <div class="alert alert-danger alert-sm" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Errore di connessione:</strong> ${error.message}
                    <br><small class="mt-2 d-block">Assicurati che il server sia in esecuzione su ${apiUrl}</small>
                </div>
            `;
        }
    }
}

// Load routes chart
function loadRoutesChart(routes) {
    const canvas = document.getElementById('routesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (routesChart) {
        routesChart.destroy();
    }
    
    const labels = routes.map(r => {
        const from = r.from?.split(' ')[0] || 'N/A';
        const to = r.to?.split(' ')[0] || 'N/A';
        return `${from} → ${to}`;
    });
    
    const data = routes.map(r => r.count || 0);
    
    // Generate colors
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
        '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'
    ];
    
    routesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Numero di treni',
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Load recent trains
function loadRecentTrains(trains) {
    const container = document.getElementById('recentTrains');
    if (!container) return;
    
    if (!trains || trains.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Nessun treno disponibile</p>';
        return;
    }
    
    container.innerHTML = trains.map((train, idx) => `
        <div class="train-item ${idx < trains.length - 1 ? 'border-bottom' : ''} pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-primary">${train.company || 'N/A'}</span>
                <span class="fw-bold text-success">${formatPrice(train.price)}€</span>
            </div>
            <div class="fw-bold text-dark mb-1">
                ${train.departure || 'N/A'} → ${train.arrival || 'N/A'}
            </div>
            <small class="text-muted">
                <i class="bi bi-clock me-1"></i>
                ${formatDateTime(train.departureTime)}
            </small>
        </div>
    `).join('');
}

// Load database data
async function loadDatabaseData() {
    const tableBody = document.getElementById('databaseTableBody');
    if (!tableBody) return;
    
    try {
        console.log('📋 Caricamento dati tabella database...');
        const response = await fetch(`${apiUrl}/api/health/db-stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const stats = data.stats || data;
        const trains = stats.sampleTrains || [];
        
        console.log(`✅ Ricevuti ${trains.length} treni`);
        
        if (trains.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                        Nessun dato disponibile
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = trains.map(train => `
            <tr>
                <td>
                    <span class="badge bg-primary">${train.company || 'N/A'}</span>
                </td>
                <td>
                    <strong>${train.departure || 'N/A'}</strong>
                    <i class="bi bi-arrow-right mx-2 text-muted"></i>
                    <strong>${train.arrival || 'N/A'}</strong>
                </td>
                <td>
                    <i class="bi bi-clock me-1 text-muted"></i>
                    ${formatDateTime(train.departureTime)}
                </td>
                <td>
                    <span class="fw-bold text-success">${formatPrice(train.price)}€</span>
                </td>
                <td>
                    <span class="badge bg-success">Disponibile</span>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Errore caricamento database:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <div class="alert alert-danger alert-sm mb-0" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Errore di connessione:</strong> ${error.message}
                        <br><small class="mt-2 d-block">Assicurati che il server sia in esecuzione su ${apiUrl}</small>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Filter database table
function filterDatabaseTable() {
    const searchInput = document.getElementById('dbSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const tableBody = document.getElementById('databaseTableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Load API documentation
function loadApiDocs() {
    const container = document.getElementById('apiEndpoints');
    if (!container) return;
    
    const endpoints = [
        {
            method: 'GET',
            path: '/api/health',
            description: 'Check server health and test database connectivity with sample search.',
            params: [
                { name: 'from', type: 'string', required: false, desc: 'Starting city (default: Torino)' },
                { name: 'to', type: 'string', required: false, desc: 'arrival city (default: Milano)' },
                { name: 'date', type: 'string', required: false, desc: 'Travel date YYYY-MM-DD (default: 2026-03-01)' }
            ],
            response: 'JSON object with train offers and AI recommendations'
        },
        {
            method: 'GET',
            path: '/api/health/db-stats',
            description: 'Get comprehensive statistics about the MongoDB Trains collection.',
            params: [],
            response: 'JSON containing total counts, top routes, and sample train records'
        },
        {
            method: 'POST',
            path: '/api/search',
            description: 'Search for train tickets using specific criteria.',
            params: [],
            body: {
                from: 'string - departure city',
                to: 'string - arrival city',
                date: 'string - Travel date (YYYY-MM-DD)',
                passengers: 'number - Number of passengers'
            },
            response: 'Array of TrainOffer objects matching the search criteria'
        }
    ];
    
    container.innerHTML = endpoints.map((ep, idx) => `
        <div class="card border-0 shadow-sm mb-3">
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                    <span class="badge ${ep.method === 'GET' ? 'bg-info' : 'bg-primary'} fs-6">
                        ${ep.method}
                    </span>
                    <code class="text-dark fw-bold">${ep.path}</code>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard('${apiUrl}${ep.path}')">
                    <i class="bi bi-clipboard"></i>
                </button>
            </div>
            <div class="card-body">
                <p class="text-muted mb-3">${ep.description}</p>
                
                ${ep.params && ep.params.length > 0 ? `
                    <h6 class="fw-bold mb-2">Query Parameters:</h6>
                    <div class="table-responsive mb-3">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Parameter</th>
                                    <th>Type</th>
                                    <th>Required</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ep.params.map(p => `
                                    <tr>
                                        <td><code>${p.name}</code></td>
                                        <td><span class="badge bg-secondary">${p.type}</span></td>
                                        <td>${p.required ? '<span class="badge bg-danger">Yes</span>' : '<span class="badge bg-success">No</span>'}</td>
                                        <td>${p.desc}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                ${ep.body ? `
                    <h6 class="fw-bold mb-2">Request Body:</h6>
                    <pre class="bg-light p-3 rounded border"><code>${JSON.stringify(ep.body, null, 2)}</code></pre>
                ` : ''}
                
                <h6 class="fw-bold mb-2">Response:</h6>
                <p class="text-muted small">${ep.response}</p>
                
                <button class="btn btn-primary btn-sm" onclick="testEndpoint('${ep.method}', '${ep.path}')">
                    <i class="bi bi-play-fill me-1"></i>
                    Test Endpoint
                </button>
            </div>
        </div>
    `).join('');
}

// Test API endpoint
async function testEndpoint(method, path) {
    const fullUrl = `${apiUrl}${path}`;
    
    try {
        const response = await fetch(fullUrl, {
            method: method
        });
        const data = await response.json();
        
        alert(`✅ Success!\n\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
    } catch (error) {
        alert(`❌ Error!\n\n${error.message}`);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 m-3 alert alert-success';
        toast.innerHTML = '<i class="bi bi-check-circle me-2"></i>Copiato negli appunti!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    });
}

// Save settings
function saveSettings() {
    const input = document.getElementById('apiUrlInput');
    const newUrl = input.value.trim();
    
    if (!newUrl) {
        alert('❌ Inserisci un URL valido');
        return;
    }
    
    // Validate URL format
    try {
        new URL(newUrl);
    } catch {
        alert('❌ URL non valido. Usa il formato completo: http://localhost:3000');
        return;
    }
    
    apiUrl = newUrl;
    localStorage.setItem('smartfare_api_url', apiUrl);
    
    console.log('💾 URL salvato:', apiUrl);
    
    // Show success message
    const successDiv = document.getElementById('saveSuccess');
    if (successDiv) {
        successDiv.classList.remove('d-none');
        
        setTimeout(() => {
            successDiv.classList.add('d-none');
        }, 3000);
    }
    
    // Test connection and reload data
    checkServerStatus();
    if (currentView === 'dashboard') {
        loadDashboardData();
    } else if (currentView === 'database') {
        loadDatabaseData();
    }
}

// Submit sidebar AI query
async function submitSidebarAI() {
    const input = document.getElementById('sidebarAIQuery');
    const responseDiv = document.getElementById('sidebarAIResponse');
    const query = input.value.trim();
    
    if (!query) return;
    
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Analizzando...';
    
    try {
        // Fetch stats for context
        const statsResponse = await fetch(`${apiUrl}/api/health/db-stats`);
        const stats = await statsResponse.json();
        
        // Simple AI-like response based on query keywords
        let response = generateSmartResponse(query, stats.stats || stats);
        
        responseDiv.innerHTML = `
            <div class="bg-white bg-opacity-25 rounded p-2 mt-2">
                <small><strong>AI:</strong> ${response}</small>
            </div>
        `;
        
    } catch (error) {
        responseDiv.innerHTML = `
            <div class="alert alert-danger alert-sm mt-2 mb-0 p-2">
                <small>Errore: ${error.message}</small>
            </div>
        `;
    }
}

// Generate smart response (simplified AI simulation)
function generateSmartResponse(query, stats) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('quant') && (lowerQuery.includes('treni') || lowerQuery.includes('train'))) {
        return `Nel database ci sono ${stats.totalTrains?.toLocaleString() || 'N/A'} treni totali.`;
    }
    
    if (lowerQuery.includes('popolar') || lowerQuery.includes('frequen')) {
        const topRoute = stats.topRoutes?.[0];
        if (topRoute) {
            return `La tratta più popolare è ${topRoute.from} → ${topRoute.to} con ${topRoute.count} treni.`;
        }
    }
    
    if (lowerQuery.includes('tratte') || lowerQuery.includes('rotte')) {
        return `Ci sono ${stats.topRoutes?.length || 0} tratte principali monitorate nel sistema.`;
    }
    
    if (lowerQuery.includes('prezzo') || lowerQuery.includes('economico')) {
        const samples = stats.sampleTrains || [];
        if (samples.length > 0) {
            const prices = samples.map(t => t.price).filter(p => p);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            return `Il prezzo medio dei treni nel campione è di circa ${avgPrice.toFixed(2)}€.`;
        }
    }
    
    return `Ho analizzato i dati per "${query}". Il database contiene ${stats.totalTrains?.toLocaleString() || 'N/A'} treni su ${stats.topRoutes?.length || 0} tratte principali.`;
}

// Utility functions
function formatPrice(price) {
    if (typeof price === 'number') {
        return price.toFixed(2);
    }
    return '0.00';
}

function formatDateTime(dateTime) {
    if (!dateTime) return 'N/A';
    
    try {
        const date = new Date(dateTime);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        // If it's already a formatted string, try to extract date
        const match = dateTime.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        if (match) {
            const [, date, time] = match;
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year} ${time}`;
        }
        return dateTime;
    }
}

// Make functions globally available
window.switchView = switchView;
window.loadDatabaseData = loadDatabaseData;
window.saveSettings = saveSettings;
window.submitSidebarAI = submitSidebarAI;
window.testEndpoint = testEndpoint;
window.copyToClipboard = copyToClipboard;
