let refreshInterval;
let countdownInterval;
let clockInterval;
let currentArrivals = [];
let settings = {
    stopId: CONFIG.STOP_ID, // Hard-coded to 9758 (Eastbound)
    appId: ''
};

// Load settings and start on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    initializeWeather();
    loadSettings();
});

function initializeClock() {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();

    // Update time
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('currentTime').textContent = timeString;

    // Update date
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('currentDate').textContent = dateString;
}

async function initializeWeather() {
    try {
        // Portland, OR coordinates
        const lat = 45.5152;
        const lon = -122.6784;

        // Try OpenWeatherMap if API key is configured
        if (CONFIG.WEATHER_API_KEY && CONFIG.WEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${CONFIG.WEATHER_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.main && data.weather) {
                const temp = Math.round(data.main.temp);
                const desc = data.weather[0].description;
                updateWeather(temp, desc);
                console.log('✅ Weather loaded from OpenWeatherMap');
                return;
            }
        }

        // Fallback: use free weather API (no key required)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Los_Angeles`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.current) {
            const temp = Math.round(data.current.temperature_2m);
            const weatherCode = data.current.weather_code;
            const desc = getWeatherDescription(weatherCode);
            updateWeather(temp, desc);
            console.log('✅ Weather loaded from Open-Meteo');
        }
    } catch (error) {
        console.error('⚠️ Weather fetch failed:', error);
        updateWeather('--', 'Portland, OR');
    }
}

function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light Drizzle',
        53: 'Drizzle',
        55: 'Heavy Drizzle',
        61: 'Light Rain',
        63: 'Rain',
        65: 'Heavy Rain',
        71: 'Light Snow',
        73: 'Snow',
        75: 'Heavy Snow',
        80: 'Light Showers',
        81: 'Showers',
        82: 'Heavy Showers',
        95: 'Thunderstorm'
    };
    return weatherCodes[code] || 'Portland';
}

function updateWeather(temp, description) {
    document.querySelector('.weather-temp').textContent = `${temp}°`;
    document.querySelector('.weather-desc').textContent = description;
}

function loadSettings() {
    // Check if API key is configured in config.js
    if (CONFIG.TRIMET_API_KEY && CONFIG.TRIMET_API_KEY !== 'YOUR_API_KEY_HERE') {
        console.log('✅ Using API key from config.js');
        settings.appId = CONFIG.TRIMET_API_KEY;
        settings.stopId = CONFIG.STOP_ID;

        // Auto-start the app
        document.getElementById('configSection').style.display = 'none';
        document.getElementById('arrivalsSection').style.display = 'block';
        startTracking();
        return;
    }

    // Otherwise check localStorage
    const savedSettings = localStorage.getItem('trimetSettings');
    if (savedSettings) {
        const saved = JSON.parse(savedSettings);
        if (saved.appId) {
            settings.appId = saved.appId;
            settings.stopId = CONFIG.STOP_ID; // Always use hard-coded stop ID
            console.log('✅ Loaded API key from localStorage');

            document.getElementById('configSection').style.display = 'none';
            document.getElementById('arrivalsSection').style.display = 'block';
            startTracking();
            return;
        }
    }

    // No API key found - show config screen
    console.log('ℹ️ No API key found. Please configure in config.js or enter manually.');
    document.getElementById('configSection').style.display = 'block';
    document.getElementById('arrivalsSection').style.display = 'none';
}

function saveSettings() {
    const appId = document.getElementById('appId').value.trim();

    if (!appId) {
        showError('Please enter your TriMet App ID');
        return;
    }

    settings.appId = appId;
    settings.stopId = CONFIG.STOP_ID; // Always use hard-coded stop ID
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

    document.getElementById('appId').value = settings.appId || '';

    document.getElementById('arrivalsSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'block';
}

function startTracking() {
    console.log('🚀 Starting arrival tracking for Stop ID:', settings.stopId);
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

    console.log('🚏 Processing arrivals for stop:', resultSet.location);

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
