let refreshInterval;
let countdownInterval;
let currentArrivals = [];
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
            console.log('✅ Loaded saved settings:', settings);
            document.getElementById('configSection').style.display = 'none';
            document.getElementById('arrivalsSection').style.display = 'block';
            startTracking();
        }
    } else {
        console.log('ℹ️ No saved settings found');
    }
}

function saveSettings() {
    const stopId = document.getElementById('stopId').value.trim();
    const appId = document.getElementById('appId').value.trim();

    if (!stopId || !appId) {
        showError('Please select direction and enter App ID');
        return;
    }

    settings = { stopId, appId };
    localStorage.setItem('trimetSettings', JSON.stringify(settings));

    console.log('✅ Settings saved:', settings);

    document.getElementById('configSection').style.display = 'none';
    document.getElementById('arrivalsSection').style.display = 'block';

    startTracking();
}

function showSettings() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    document.getElementById('stopId').value = settings.stopId;
    document.getElementById('appId').value = settings.appId;

    document.getElementById('arrivalsSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'block';
}

function startTracking() {
    console.log('🚀 Starting arrival tracking...');
    fetchArrivals();
    // Refresh data every 30 seconds
    refreshInterval = setInterval(fetchArrivals, 30000);
    // Update countdown every second
    countdownInterval = setInterval(updateCountdowns, 1000);
}

async function fetchArrivals() {
    try {
        const url = `https://developer.trimet.org/ws/V1/arrivals?locIDs=${settings.stopId}&appID=${settings.appId}&json=true`;

        console.log('📡 Fetching arrivals from:', url);

        const response = await fetch(url);

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`API returned status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Received data:', data);

        if (data.resultSet) {
            if (data.resultSet.errorMessage) {
                console.error('❌ TriMet API Error:', data.resultSet.errorMessage);
                throw new Error(data.resultSet.errorMessage.content || 'TriMet API error');
            }
            displayArrivals(data.resultSet);
            hideError();
        } else {
            console.error('❌ Invalid response structure:', data);
            throw new Error('Invalid response from TriMet API');
        }
    } catch (error) {
        console.error('❌ Error fetching arrivals:', error);
        showError(`Failed to load arrivals: ${error.message}. Check console for details.`);

        // Show example in arrivals area
        const arrivalsDiv = document.getElementById('arrivals');
        arrivalsDiv.innerHTML = `
            <div class="loading">
                <p>⚠️ Unable to fetch arrivals</p>
                <p style="font-size: 1.2rem; margin-top: 10px;">Error: ${error.message}</p>
                <p style="font-size: 1rem; margin-top: 10px;">Check browser console (F12) for details</p>
            </div>
        `;
    }
}

function displayArrivals(resultSet) {
    const arrivalsDiv = document.getElementById('arrivals');
    const stopNameEl = document.getElementById('stopName');

    console.log('🚏 Processing arrivals for stop:', resultSet.location);

    // Update stop name
    if (resultSet.location && resultSet.location.length > 0) {
        stopNameEl.textContent = resultSet.location[0].desc || 'Stop ' + settings.stopId;
        console.log('📍 Stop name:', stopNameEl.textContent);
    }

    // Check if there are arrivals
    if (!resultSet.arrival || resultSet.arrival.length === 0) {
        console.log('⚠️ No arrivals in response');
        arrivalsDiv.innerHTML = '<div class="loading">No upcoming arrivals</div>';
        updateLastUpdateTime();
        return;
    }

    console.log(`📊 Total arrivals received: ${resultSet.arrival.length}`);
    console.log('🔍 All arrivals:', resultSet.arrival);

    // Filter for MAX trains only and sort by estimated time
    currentArrivals = resultSet.arrival
        .filter(a => {
            const isMax = a.route && a.route.toString().includes('MAX');
            console.log(`Route ${a.route}: ${isMax ? '✅ MAX' : '❌ Not MAX'}`);
            return isMax;
        })
        .sort((a, b) => {
            const timeA = a.estimated || a.scheduled;
            const timeB = b.estimated || b.scheduled;
            return timeA - timeB;
        })
        .slice(0, 5); // Show next 5 arrivals

    console.log(`🚊 MAX arrivals found: ${currentArrivals.length}`, currentArrivals);

    if (currentArrivals.length === 0) {
        arrivalsDiv.innerHTML = '<div class="loading">No MAX trains scheduled</div>';
        updateLastUpdateTime();
        return;
    }

    // Display arrivals with countdown
    updateArrivalsDisplay();
    updateLastUpdateTime();
}

function updateArrivalsDisplay() {
    const arrivalsDiv = document.getElementById('arrivals');

    if (currentArrivals.length === 0) {
        return;
    }

    arrivalsDiv.innerHTML = currentArrivals.map((arrival, index) => {
        const arrivalTime = arrival.estimated || arrival.scheduled;
        const seconds = calculateSeconds(arrivalTime);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const timeClass = minutes <= 1 ? 'now' : (minutes <= 5 ? 'soon' : '');
        let timeText;

        if (seconds <= 0) {
            timeText = 'ARRIVING';
        } else if (minutes <= 1) {
            timeText = `${seconds}s`;
        } else if (minutes < 10) {
            timeText = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            timeText = `${minutes} min`;
        }

        return `
            <div class="arrival-item">
                <div class="arrival-info">
                    <span class="route-number">${arrival.shortSign || arrival.route}</span>
                    <div class="route-name">${arrival.fullSign || arrival.desc || 'MAX Train'}</div>
                </div>
                <div class="arrival-time ${timeClass}" data-index="${index}">${timeText}</div>
            </div>
        `;
    }).join('');
}

function updateCountdowns() {
    currentArrivals.forEach((arrival, index) => {
        const timeElement = document.querySelector(`[data-index="${index}"]`);
        if (!timeElement) return;

        const arrivalTime = arrival.estimated || arrival.scheduled;
        const seconds = calculateSeconds(arrivalTime);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const timeClass = minutes <= 1 ? 'now' : (minutes <= 5 ? 'soon' : '');
        let timeText;

        if (seconds <= 0) {
            timeText = 'ARRIVING';
        } else if (minutes <= 1) {
            timeText = `${seconds}s`;
        } else if (minutes < 10) {
            timeText = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            timeText = `${minutes} min`;
        }

        timeElement.textContent = timeText;
        timeElement.className = `arrival-time ${timeClass}`;
    });
}

function calculateSeconds(timestamp) {
    const now = Date.now();
    const diff = timestamp - now;
    return Math.max(0, Math.floor(diff / 1000));
}

function calculateMinutes(timestamp) {
    return Math.floor(calculateSeconds(timestamp) / 60);
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
            console.log('✅ Wake Lock activated');
        } catch (err) {
            console.error('❌ Wake Lock error:', err);
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
