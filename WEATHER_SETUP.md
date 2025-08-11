# Weather System Setup for Bellevue, WA

This project displays live weather data for **Bellevue, WA** in the GitHub profile chat SVG. The system uses a dual API approach with automatic fallback.

## 🌤️ How It Works

### Dual Weather API System
1. **AccuWeather API** (Primary - More Accurate)
   - Provides detailed weather descriptions
   - Better accuracy and more weather codes
   - Requires free API key

2. **Open-Meteo API** (Fallback - Always Available)  
   - No API key required
   - Free and reliable
   - Used automatically when AccuWeather fails

### Location Configuration
The weather is pre-configured for **Bellevue, WA**:
- **Coordinates**: 47.6101, -122.2015
- **AccuWeather Location Key**: 41333_PC
- **Configuration file**: `weather.config.json`

## 🚀 Quick Setup

### 1. Get AccuWeather API Key (Optional but Recommended)
```bash
# Visit: https://developer.accuweather.com/
# Sign up for free account
# Create new app to get API key
```

### 2. Add to GitHub Repository Secrets
```bash
# Go to: Repository Settings → Secrets and Variables → Actions
# Add new repository secret:
Name: ACCUWEATHER_API_KEY
Value: your_api_key_here
```

### 3. Local Development Setup
```bash
# Copy environment template
cp env-template.txt .env

# Edit .env file and add your API key:
ACCUWEATHER_API_KEY=your_api_key_here
```

## 🔄 Automatic Updates

The GitHub Actions workflow (`.github/workflows/build-chat.yml`) automatically:
- **Runs every 30 minutes**
- Fetches live weather data for Bellevue, WA
- Updates the chat SVG with current conditions
- Commits changes to your repository

## 🧪 Testing Locally

```bash
# Install dependencies
npm install

# Run the weather update script
node build-svg.js
```

Expected output:
```
Fetching live weather data for Bellevue, WA...
Weather retrieved from: AccuWeather (or Open-Meteo)
Temperature: 72°F (22°C)
Conditions: Partly Cloudy 🌤
Location: Bellevue, WA
✅ chat.svg updated successfully!
```

## 📊 Weather Data Retrieved

The system fetches and displays:
- **Temperature** (°F and °C)
- **Weather emoji** (☀️🌤🌧⛈❄️ etc.)
- **Weather description** (Sunny, Partly Cloudy, etc.)
- **Location**: Bellevue, WA

## 🔧 Customization

### Change Location
Edit `weather.config.json`:
```json
{
  "latitude": 47.6101,
  "longitude": -122.2015,
  "locationName": "Bellevue, WA",
  "accuweatherLocationKey": "41333_PC"
}
```

### Adjust Update Frequency
Edit `.github/workflows/build-chat.yml`:
```yaml
schedule:
  # Change from every 30 minutes to every hour
  - cron: '0 * * * *'
```

## 🛠️ Troubleshooting

### Weather Not Updating
1. Check GitHub Actions logs in repository
2. Verify ACCUWEATHER_API_KEY secret is set
3. Ensure workflow has write permissions

### API Errors
- AccuWeather errors → Automatically falls back to Open-Meteo
- Both APIs fail → Uses default weather display
- Check console logs for specific error messages

### Manual Trigger
Go to Actions tab → "Update Chat SVG with Live Weather" → "Run workflow"

## 📁 Files Overview

- `weather.js` - Main weather module with dual API support
- `weather.config.json` - Bellevue location configuration  
- `build-svg.js` - SVG generator script
- `.github/workflows/build-chat.yml` - Auto-update workflow
- `template.svg` - SVG template with weather placeholders
- `chat.svg` - Generated SVG with live weather data

The weather system is fully automated and will keep your GitHub profile updated with live Bellevue weather conditions! 🌤️