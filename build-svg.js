import fs from 'fs/promises';
import axios from 'axios';
import { formatDistance } from 'date-fns';
import { getLiveWeatherSummary } from './weather.js';

// Cheap, janky way to have variable bubble width
const dayBubbleWidths = {
  Monday: 235,
  Tuesday: 235,
  Wednesday: 260,
  Thursday: 245,
  Friday: 220,
  Saturday: 245,
  Sunday: 230,
};

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

async function imageToBase64(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching image ${url}:`, error.message);
    return null;
  }
}

// Generate SVG with live weather data
async function generateChatSVG() {
  try {
    console.log('Fetching live weather data for Bellevue, WA...');
    const weather = await getLiveWeatherSummary();

    console.log(`Weather retrieved from: ${weather.source}`);
    console.log(`Temperature: ${weather.degF}°F (${weather.degC}°C)`);
    console.log(`Conditions: ${weather.description} ${weather.weatherEmoji}`);
    console.log(`Location: ${weather.location}`);

    let data = await fs.readFile('template.svg', 'utf-8');

    // Replace template placeholders with actual data
    data = data.replace(
      '<rect width="456" height="92" rx="18" class="bubble" />',
      '<rect width="456" height="230" rx="18" class="bubble" />'
    );

    data = data.replace(
      '<!-- Add a dynamic update of my github status-->',
      `<foreignObject x="15" y="40" width="426" height="200">
          <body xmlns="http://www.w3.org/1999/xhtml">
            <img src="https://github-readme-stats.vercel.app/api?username=Shan533&amp;show_icons=true&amp;theme=radical&amp;disable_animations=true" alt="Shan533's GitHub stats"/>
          </body>
        </foreignObject>`
    );
    
    const imgRegex = /<img src="([^"]+)"/g;
    const matches = [...data.matchAll(imgRegex)];

    for (const match of matches) {
        const originalUrl = match[1].replace(/&amp;/g, '&');
        console.log(`Processing ${originalUrl}...`);
        const base64Url = await imageToBase64(originalUrl);
        if (base64Url) {
            data = data.replace(match[0], `<img src="${base64Url}"`);
        }
    }

    data = data.replace('{degF}', weather.degF);
    data = data.replace('{degC}', weather.degC);
    data = data.replace('{weatherEmoji}', weather.weatherEmoji);
    data = data.replace('{psTime}', workTime);
    data = data.replace('{todayDay}', todayDay);
    data = data.replace('{dayBubbleWidth}', dayBubbleWidths[todayDay]);

    await fs.writeFile('chat.svg', data);
    
    console.log('✅ chat.svg updated successfully!');
    console.log(`📍 Weather for ${weather.location}`);
    console.log(`🌡️  ${weather.degF}°F (${weather.degC}°C)`);
    console.log(`${weather.weatherEmoji} ${weather.description}`);

  } catch (error) {
    console.error('Error generating chat SVG:', error);
  }
}

// Run the generator
generateChatSVG();
