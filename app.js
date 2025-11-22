let refreshInterval;
let settings = {
    stopId: '',
    appId: ''
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});

function loadSettings() {
    const savedSettings = localStorage.getItem('trimetSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        if (settings.stopId && settings.appId) {
            document.getElementById('configSection').style.display = 'none';
            document.getElementById('arrivalsSection').style.display = 'block';
            startTracking();
        }
    }
}

function saveSettings() {
    const stopId = document.getElementById('stopId').value.trim();
    const appId = document.getElementById('appId').value.trim();

    if (!stopId || !appId) {
        showError('Please enter both Stop ID and App ID');
        return;
    }

    settings = { stopId, appId };
    localStorage.setItem('trimetSettings', JSON.stringify(settings));

    document.getElementById('configSection').style.display = 'none';
    document.getElementById('arrivalsSection').style.display = 'block';

    startTracking();
}

function showSettings() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    document.getElementById('stopId').value = settings.stopId;
    document.getElementById('appId').value = settings.appId;

    document.getElementById('arrivalsSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'block';
}

function startTracking() {
    fetchArrivals();
    // Refresh every 30 seconds
    refreshInterval = setInterval(fetchArrivals, 30000);
}

async function fetchArrivals() {
    try {
        const url = `https://developer.trimet.org/ws/V1/arrivals?locIDs=${settings.stopId}&appID=${settings.appId}&json=true`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch arrivals');
        }

        const data = await response.json();

        if (data.resultSet) {
            displayArrivals(data.resultSet);
            hideError();
        } else {
            throw new Error('Invalid response from TriMet API');
        }
    } catch (error) {
        console.error('Error fetching arrivals:', error);
        showError('Failed to load arrivals. Please check your Stop ID and App ID.');
    }
}

function displayArrivals(resultSet) {
    const arrivalsDiv = document.getElementById('arrivals');
    const stopNameEl = document.getElementById('stopName');

    // Update stop name
    if (resultSet.location && resultSet.location.length > 0) {
        stopNameEl.textContent = resultSet.location[0].desc || 'Stop ' + settings.stopId;
    }

    // Check if there are arrivals
    if (!resultSet.arrival || resultSet.arrival.length === 0) {
        arrivalsDiv.innerHTML = '<div class="loading">No upcoming arrivals</div>';
        updateLastUpdateTime();
        return;
    }

    // Filter for MAX trains only and sort by estimated time
    const maxArrivals = resultSet.arrival
        .filter(a => a.route && a.route.toString().includes('MAX'))
        .sort((a, b) => {
            const timeA = a.estimated || a.scheduled;
            const timeB = b.estimated || b.scheduled;
            return timeA - timeB;
        })
        .slice(0, 5); // Show next 5 arrivals

    if (maxArrivals.length === 0) {
        arrivalsDiv.innerHTML = '<div class="loading">No MAX trains scheduled</div>';
        updateLastUpdateTime();
        return;
    }

    // Display arrivals
    arrivalsDiv.innerHTML = maxArrivals.map(arrival => {
        const minutes = calculateMinutes(arrival.estimated || arrival.scheduled);
        const timeClass = minutes <= 1 ? 'now' : (minutes <= 5 ? 'soon' : '');
        const timeText = minutes <= 1 ? 'NOW' : `${minutes} min`;

        return `
            <div class="arrival-item">
                <div class="arrival-info">
                    <span class="route-number">${arrival.shortSign || arrival.route}</span>
                    <div class="route-name">${arrival.fullSign || arrival.desc || 'MAX Train'}</div>
                </div>
                <div class="arrival-time ${timeClass}">${timeText}</div>
            </div>
        `;
    }).join('');

    updateLastUpdateTime();
}

function calculateMinutes(timestamp) {
    const now = Date.now();
    const diff = timestamp - now;
    return Math.max(0, Math.round(diff / 60000));
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Prevent iPad from sleeping
if ('wakeLock' in navigator) {
    let wakeLock = null;

    const requestWakeLock = async () => {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock activated');
        } catch (err) {
            console.error('Wake Lock error:', err);
        }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }
    });
}
