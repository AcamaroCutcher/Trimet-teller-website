# TriMet MAX Arrival Display

A clean, iPad-optimized web application for displaying real-time TriMet MAX train arrivals. Perfect for wall-mounted displays.

## Features

- Real-time MAX train arrival times
- Auto-refresh every 30 seconds
- Large, readable text optimized for wall-mounted iPads
- Dark theme for better visibility
- Wake lock to prevent iPad from sleeping
- Shows next 5 upcoming MAX trains
- Color-coded arrival times (red for NOW, yellow for <5 min)

## Setup Instructions

### 1. Get a TriMet API App ID

1. Visit [https://developer.trimet.org/](https://developer.trimet.org/)
2. Register for a free account
3. Create a new application to get your App ID

### 2. Find Your Stop ID

You can find your stop ID in several ways:
- Check the TriMet website at your stop location
- Look at the stop's sign or pole (often printed there)
- Use the TriMet trip planner and note the stop number
- Example: Stop ID `8371` is SW 5th & Oak St

### 3. Run Locally

Simply open `index.html` in your web browser:

```bash
# Option 1: Open directly (may have CORS issues with some browsers)
open index.html

# Option 2: Use Python's built-in server (recommended)
python3 -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Use Node.js http-server
npx http-server -p 8000
# Then visit http://localhost:8000
```

### 4. Configure on iPad

1. Open the website on your iPad
2. Enter your Stop ID and TriMet App ID
3. Tap "Save & Start"
4. The app will remember your settings

### 5. iPad Wall-Mount Setup

For best results on a wall-mounted iPad:

1. **Enable Guided Access** (prevents accidental exits):
   - Go to Settings > Accessibility > Guided Access
   - Turn it on and set a passcode
   - Open your website in Safari
   - Triple-click the home/power button
   - Tap "Start" to lock into the app

2. **Prevent Auto-Lock**:
   - Go to Settings > Display & Brightness > Auto-Lock
   - Set to "Never"

3. **Keep iPad Charged**:
   - Keep the iPad plugged in continuously
   - Consider using a long charging cable for cleaner installation

## How It Works

- Fetches data from TriMet's real-time arrivals API
- Filters for MAX trains only
- Displays next 5 arrivals sorted by time
- Auto-refreshes every 30 seconds
- Uses browser's Wake Lock API to prevent screen sleep
- Stores your settings in browser localStorage

## Troubleshooting

**No arrivals showing?**
- Verify your Stop ID is correct
- Check that your App ID is valid
- Make sure the stop serves MAX trains

**Display going to sleep?**
- Check iPad's Auto-Lock settings
- Some older iPads may not support Wake Lock API

**API errors?**
- Ensure you have an active internet connection
- Verify your TriMet App ID is still valid
- Check TriMet's service status

## Browser Compatibility

- Safari (recommended for iPad)
- Chrome
- Firefox
- Edge

## Privacy

All settings are stored locally in your browser. No data is sent anywhere except to TriMet's public API for arrival information.

## License

MIT License - feel free to modify and use as needed!
