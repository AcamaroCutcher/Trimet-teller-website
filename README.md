# TriMet MAX Arrival Display

A beautiful, iPad-optimized web application for displaying real-time TriMet MAX train arrivals at **1615 SW Morrison St, Portland, OR 97205** (Providence Park Station - Eastbound).

Perfect for wall-mounted displays with live countdown timers, current time, and Portland weather!

## ✨ Features

- 🚊 Real-time MAX train arrivals with live countdown
- ⏰ Current time display (updates every second)
- 🌤️ Portland weather (temperature and conditions)
- 🎨 Beautiful train-themed background
- 📱 iPad-optimized interface
- 🔒 Wake lock to prevent screen sleep
- 🎯 Hard-coded for Providence Park Station Eastbound (Stop ID 9758)
- 🔄 Auto-refresh every 30 seconds
- 💾 Config file for API key (no manual entry needed)

## 🚀 Quick Setup

### 1. Get Your TriMet API Key

1. Visit [https://developer.trimet.org/](https://developer.trimet.org/)
2. Register for a free account
3. Create a new application to get your App ID

### 2. Configure Your API Key

**Option A: Edit config.js (Recommended for Always-On Display)**

Open `config.js` and replace `YOUR_API_KEY_HERE` with your actual TriMet API key:

```javascript
const CONFIG = {
    TRIMET_API_KEY: 'YOUR_TRIMET_API_KEY_HERE',  // ← Put your key here
    STOP_ID: '9758', // Providence Park MAX Station - Eastbound
    WEATHER_API_KEY: 'YOUR_OPENWEATHER_API_KEY_HERE' // Optional
};
```

The app will auto-start when you open it!

**Option B: Enter Manually (One-Time Setup)**

If you don't edit config.js, you'll see a configuration screen where you can enter your API key. It will be saved in your browser.

### 3. Run the Website

**Using Python (Simplest):**
```bash
cd Trimet-teller-website
python3 -m http.server 8080
```

**Using Docker (Best for Always-On):**
```bash
docker-compose up -d
```

### 4. Access on Your iPad

- **On same computer**: Open `http://localhost:8080`
- **On iPad**: Find your computer's IP address and open `http://YOUR_IP:8080`

To find your IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 🌤️ Optional: Add Weather (Free)

The app uses a free weather API by default (Open-Meteo - no key needed). For more detailed weather, you can optionally add an OpenWeatherMap API key:

1. Get a free API key from [https://openweathermap.org/api](https://openweathermap.org/api)
2. Add it to `config.js`:
   ```javascript
   WEATHER_API_KEY: 'your_openweather_key_here'
   ```

Without this, weather still works using the free Open-Meteo API!

## 📱 iPad Wall-Mount Setup

For the best wall-mounted iPad experience:

### 1. Enable Guided Access (Lock to This App)
- Go to Settings > Accessibility > Guided Access
- Turn it on and set a passcode
- Open your website in Safari
- Triple-click the home/power button
- Tap "Start" to lock into the app

### 2. Prevent Auto-Lock
- Go to Settings > Display & Brightness > Auto-Lock
- Set to "Never"

### 3. Keep iPad Charged
- Keep the iPad plugged in continuously
- The app includes wake lock to prevent sleep

## 🎨 What You'll See

- **Top Left**: Current time and date
- **Top Right**: Portland weather
- **Center**: TriMet MAX Arrivals header with your address
- **Main Area**: Next 5 MAX trains with live countdown timers
  - Green: Trains arriving in 5+ minutes
  - Yellow: Trains arriving in 2-5 minutes (⚠️ Soon!)
  - Red (pulsing): Trains arriving in <2 minutes or at station

## 🔧 Technical Details

- **Stop ID**: 9758 (Providence Park Station - Eastbound to City Center/Gresham)
- **Refresh Rate**: Train data updates every 30 seconds
- **Countdown**: Updates every second for live countdown
- **Weather**: Updates on page load (manual refresh to update)
- **Clock**: Updates every second

## 🐳 Docker Deployment

For always-on deployment:

```bash
# Start container
docker-compose up -d

# Stop container
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build
```

The container:
- Runs on port 8080
- Auto-restarts on failure
- Starts on system boot
- Uses lightweight nginx server

## 🐛 Troubleshooting

**No trains showing?**
- Check browser console (F12) for detailed error messages
- Verify your TriMet API key is correct in `config.js`
- Make sure you're connected to the internet

**Weather not loading?**
- Weather uses a free API by default - should work without configuration
- Check browser console for errors

**Time/Date wrong?**
- Uses your device's timezone automatically
- Check your iPad's time settings

## 📁 Project Structure

```
├── index.html       # Main webpage
├── style.css        # Beautiful styling with train theme
├── app.js          # All functionality (trains, time, weather)
├── config.js       # Your API keys (edit this!)
├── Dockerfile      # Docker container setup
├── docker-compose.yml
└── README.md       # This file
```

## 💡 Tips

- The app automatically filters for MAX trains only
- Countdown shows MM:SS format for trains <10 minutes away
- Countdown shows seconds only for trains <2 minutes away
- The display works great on iPads 9.7" and larger
- For best results, use landscape orientation

## 🔒 Privacy

- All settings stored locally in your browser
- No data sent anywhere except:
  - TriMet API (for train arrivals)
  - Weather API (for Portland weather)
- Your API keys never leave your device

## 📝 License

MIT License - feel free to modify and use as needed!

## 🎉 Enjoy Your Display!

Once configured, your iPad will show live train arrivals with a beautiful interface. Perfect for knowing exactly when to leave your apartment to catch the MAX!
