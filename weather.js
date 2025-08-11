import got from 'got'
import fs from 'fs'

// Load weather configuration
const weatherConfig = JSON.parse(fs.readFileSync('weather.config.json', 'utf-8'))

const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY
const ACCUWEATHER_DOMAIN = 'http://dataservice.accuweather.com'
const OPENMETEO_DOMAIN = 'https://api.open-meteo.com'

// Weather code to emoji mapping (compatible with both APIs)
const weatherEmojis = {
  // AccuWeather codes
  1: '☀️',   // Sunny
  2: '☀️',   // Mostly Sunny
  3: '🌤',   // Partly Sunny
  4: '🌤',   // Intermittent Clouds
  5: '🌤',   // Hazy Sunshine
  6: '🌥',   // Mostly Cloudy
  7: '☁️',   // Cloudy
  8: '☁️',   // Dreary (Overcast)
  11: '🌫',  // Fog
  12: '🌧',  // Showers
  13: '🌦',  // Mostly Cloudy w/ Showers
  14: '🌦',  // Partly Sunny w/ Showers
  15: '⛈',   // T-Storms
  16: '⛈',   // Mostly Cloudy w/ T-Storms
  17: '🌦',  // Partly Sunny w/ T-Storms
  18: '🌧',  // Rain
  19: '🌨',  // Flurries
  20: '🌨',  // Mostly Cloudy w/ Flurries
  21: '🌨',  // Partly Sunny w/ Flurries
  22: '❄️',  // Snow
  23: '❄️',  // Mostly Cloudy w/ Snow
  24: '🌧',  // Ice
  25: '🌧',  // Sleet
  26: '🌧',  // Freezing Rain
  29: '🌧',  // Rain and Snow
  30: '🥵',  // Hot
  31: '🥶',  // Cold
  32: '💨',  // Windy
  
  // Open-Meteo WMO Weather codes
  0: '☀️',   // Clear sky
  1: '🌤',   // Mainly clear
  2: '🌥',   // Partly cloudy
  3: '☁️',   // Overcast
  45: '🌫',  // Fog
  48: '🌫',  // Depositing rime fog
  51: '🌦',  // Drizzle: Light
  53: '🌦',  // Drizzle: Moderate
  55: '🌧',  // Drizzle: Dense
  56: '🌧',  // Freezing Drizzle: Light
  57: '🌧',  // Freezing Drizzle: Dense
  61: '🌧',  // Rain: Slight
  63: '🌧',  // Rain: Moderate
  65: '🌧',  // Rain: Heavy
  66: '🌧',  // Freezing Rain: Light
  67: '🌧',  // Freezing Rain: Heavy
  71: '🌨',  // Snow fall: Slight
  73: '🌨',  // Snow fall: Moderate
  75: '❄️',  // Snow fall: Heavy
  77: '❄️',  // Snow grains
  80: '🌦',  // Rain showers: Slight
  81: '🌧',  // Rain showers: Moderate
  82: '🌧',  // Rain showers: Violent
  85: '🌨',  // Snow showers: Slight
  86: '❄️',  // Snow showers: Heavy
  95: '⛈',   // Thunderstorm: Slight or moderate
  96: '⛈',   // Thunderstorm with slight hail
  99: '⛈'   // Thunderstorm with heavy hail
}

/**
 * Get weather data from AccuWeather API
 * @returns {Promise<Object>} Weather data object
 */
async function getAccuWeatherData() {
  if (!ACCUWEATHER_API_KEY) {
    throw new Error('AccuWeather API key not provided')
  }

  const url = `forecasts/v1/daily/1day/${weatherConfig.accuweatherLocationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`
  
  try {
    const response = await got(url, { prefixUrl: ACCUWEATHER_DOMAIN })
    const json = JSON.parse(response.body)
    const forecast = json.DailyForecasts[0]
    
    return {
      temperature: {
        fahrenheit: Math.round(forecast.Temperature.Maximum.Value),
        celsius: Math.round(forecast.Temperature.Minimum.Value)
      },
      weatherCode: forecast.Day.Icon,
      description: forecast.Day.IconPhrase,
      humidity: forecast.Day.RelativeHumidity?.Average || null,
      windSpeed: forecast.Day.Wind?.Speed?.Value || null,
      windUnit: forecast.Day.Wind?.Speed?.Unit || null,
      precipitation: forecast.Day.HasPrecipitation,
      source: 'AccuWeather'
    }
  } catch (error) {
    throw new Error(`AccuWeather API error: ${error.message}`)
  }
}

/**
 * Get weather data from Open-Meteo API (fallback)
 * @returns {Promise<Object>} Weather data object
 */
async function getOpenMeteoData() {
  const url = `v1/forecast?latitude=${weatherConfig.latitude}&longitude=${weatherConfig.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&current_weather=true&timezone=auto`
  
  try {
    const response = await got(url, { prefixUrl: OPENMETEO_DOMAIN })
    const json = JSON.parse(response.body)
    const current = json.current_weather
    const daily = json.daily
    
    // Convert Celsius to Fahrenheit
    const celsiusMax = Math.round(daily.temperature_2m_max[0])
    const fahrenheit = Math.round((celsiusMax * 9/5) + 32)
    
    return {
      temperature: {
        fahrenheit: fahrenheit,
        celsius: celsiusMax
      },
      weatherCode: current.weathercode,
      description: getWeatherDescription(current.weathercode),
      humidity: null, // Not available in free tier
      windSpeed: Math.round(current.windspeed),
      windUnit: 'km/h',
      precipitation: daily.precipitation_sum[0] > 0,
      source: 'Open-Meteo'
    }
  } catch (error) {
    throw new Error(`Open-Meteo API error: ${error.message}`)
  }
}

/**
 * Get weather description from WMO weather code
 * @param {number} code - WMO weather code
 * @returns {string} Weather description
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  }
  
  return descriptions[code] || 'Unknown'
}

/**
 * Get live weather summary with fallback mechanism
 * @returns {Promise<Object>} Weather summary object
 */
export async function getLiveWeatherSummary() {
  let weatherData
  
  try {
    // Try AccuWeather first
    console.log('Attempting to fetch weather from AccuWeather...')
    weatherData = await getAccuWeatherData()
    console.log(`Weather data retrieved from ${weatherData.source}`)
  } catch (accuweatherError) {
    console.log(`AccuWeather failed: ${accuweatherError.message}`)
    
    try {
      // Fallback to Open-Meteo
      console.log('Falling back to Open-Meteo API...')
      weatherData = await getOpenMeteoData()
      console.log(`Weather data retrieved from ${weatherData.source}`)
    } catch (openMeteoError) {
      console.error(`Both weather APIs failed:`)
      console.error(`- AccuWeather: ${accuweatherError.message}`)
      console.error(`- Open-Meteo: ${openMeteoError.message}`)
      
      // Return default values if both APIs fail
      return {
        degF: 72,
        degC: 22,
        weatherEmoji: '🌤',
        description: 'Partly Cloudy',
        location: weatherConfig.locationName,
        source: 'Default (APIs unavailable)'
      }
    }
  }
  
  return {
    degF: weatherData.temperature.fahrenheit,
    degC: weatherData.temperature.celsius,
    weatherEmoji: weatherEmojis[weatherData.weatherCode] || '🌤',
    description: weatherData.description,
    humidity: weatherData.humidity,
    windSpeed: weatherData.windSpeed,
    windUnit: weatherData.windUnit,
    precipitation: weatherData.precipitation,
    location: weatherConfig.locationName,
    source: weatherData.source
  }
}