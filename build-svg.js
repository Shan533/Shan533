import fs from 'fs'
import { formatDistance } from 'date-fns'
import { getLiveWeatherSummary } from './weather.js'

// Cheap, janky way to have variable bubble width
const dayBubbleWidths = {
  Monday: 235,
  Tuesday: 235,
  Wednesday: 260,
  Thursday: 245,
  Friday: 220,
  Saturday: 245,
  Sunday: 230,
}

// Time working at current company (you can adjust this date)
const today = new Date()
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
  today
)

// Calculate work time - adjust this date to when Shanshan started working
const workStartDate = new Date(2020, 12, 14) // December 14, 2020 - adjust as needed
const workTime = formatDistance(workStartDate, today, {
  addSuffix: false,
})

// Generate SVG with live weather data
async function generateChatSVG() {
  try {
    console.log('Fetching live weather data for Bellevue, WA...')
    const weather = await getLiveWeatherSummary()
    
    console.log(`Weather retrieved from: ${weather.source}`)
    console.log(`Temperature: ${weather.degF}°F (${weather.degC}°C)`)
    console.log(`Conditions: ${weather.description} ${weather.weatherEmoji}`)
    console.log(`Location: ${weather.location}`)

    fs.readFile('template.svg', 'utf-8', (error, data) => {
      if (error) {
        console.error('Error reading template.svg:', error)
        return
      }

      // Replace template placeholders with actual data
      data = data.replace('{degF}', weather.degF)
      data = data.replace('{degC}', weather.degC)
      data = data.replace('{weatherEmoji}', weather.weatherEmoji)
      data = data.replace('{psTime}', workTime)
      data = data.replace('{todayDay}', todayDay)
      data = data.replace('{dayBubbleWidth}', dayBubbleWidths[todayDay])

      fs.writeFile('chat.svg', data, (err) => {
        if (err) {
          console.error('Error writing chat.svg:', err)
          return
        }
        console.log('✅ chat.svg updated successfully!')
        console.log(`📍 Weather for ${weather.location}`)
        console.log(`🌡️  ${weather.degF}°F (${weather.degC}°C)`)
        console.log(`${weather.weatherEmoji} ${weather.description}`)
      })
    })
  } catch (error) {
    console.error('Error generating chat SVG:', error)
  }
}

// Run the generator
generateChatSVG()
