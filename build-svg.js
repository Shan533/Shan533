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
  Friday: 235,
  Saturday: 260,
  Sunday: 235,
};

// Time working at current company (you can adjust this date)
const today = new Date()
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
  today
)

async function fetchGitHubStatsSVG(url) {
  try {
    console.log(`Fetching GitHub stats from: ${url}`);
    const response = await axios.get(url, { responseType: 'text' });
    let svgContent = response.data;
    
    // Extract only the inner SVG content, removing the outer <svg> wrapper
    const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (svgMatch) {
      let innerContent = svgMatch[1].trim();
      
      // Extract style content and add unique prefix to avoid conflicts
      let extractedStyles = '';
      const styleMatches = innerContent.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
      if (styleMatches) {
        styleMatches.forEach((styleMatch, index) => {
          const styleContent = styleMatch.match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
          // Add unique prefix to CSS selectors only (not properties, values, or keywords)
          let prefixedStyle = styleContent
            .replace(/(\.|#)([a-zA-Z][\w-]*)/g, (match, prefix, selector) => {
              return prefix + 'gh-' + selector;
            })
            .replace(/^(\s*)([a-zA-Z][\w-]+)\s*{/gm, (match, spaces, selector) => {
              // Don't prefix CSS keywords like 'from', 'to', etc.
              if (['from', 'to', '0%', '25%', '50%', '75%', '100%'].includes(selector.trim())) {
                return match;
              }
              return spaces + 'gh-' + selector + ' {';
            });
          
          // Remove or scope the global animation disabling rule to prevent conflicts
          prefixedStyle = prefixedStyle.replace(
            /\*\s*{\s*animation-duration:\s*0s\s*!important;\s*animation-delay:\s*0s\s*!important;\s*}/g,
            '.gh-stats * { animation-duration: 0s !important; animation-delay: 0s !important; }'
          );
          
          // Make language names and percentages smaller
          prefixedStyle = prefixedStyle.replace(
            /\.gh-lang-name\s*{\s*font:\s*400\s+11px/g,
            '.gh-lang-name { font: 400 9px'
          );
          extractedStyles += prefixedStyle;
        });
      }
      
      // Remove original style tags
      innerContent = innerContent.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
      
      // Update class names in the content to match prefixed styles
      innerContent = innerContent.replace(/class="([^"]*)"/g, (match, classes) => {
        const prefixedClasses = classes.split(' ').map(cls => 'gh-' + cls).join(' ');
        return `class="${prefixedClasses}"`;
      });
      
      // Also update single-quoted class attributes
      innerContent = innerContent.replace(/class='([^']*)'/g, (match, classes) => {
        const prefixedClasses = classes.split(' ').map(cls => 'gh-' + cls).join(' ');
        return `class="${prefixedClasses}"`;
      });
      
      // Return content with embedded style
      if (extractedStyles) {
        return `<style>${extractedStyles}</style>${innerContent}`;
      }
      
      return innerContent;
    }
    
    return svgContent.trim();
  } catch (error) {
    console.error(`Error fetching GitHub stats SVG ${url}:`, error.message);
    return null;
  }
}

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

    // Replace the language stats placeholder with native SVG
    const languageStatsSVG = await fetchGitHubStatsSVG('https://github-readme-stats.vercel.app/api/top-langs?username=shan533&show_icons=true&locale=en&layout=compact&theme=transparent&disable_animations=true&hide_border=true&langs_count=6');

    if (languageStatsSVG) {
      data = data.replace(
        '<!-- GitHub language stats will be embedded here -->',
        `<g transform="translate(0,192)" class="gh-stats">
           <g transform="translate(0, 18)">
             ${languageStatsSVG}
           </g>
         </g>`
      );
    }

    // Process any remaining images (icons, etc.) to base64
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    const matches = [...data.matchAll(imgRegex)];

    for (const match of matches) {
        const originalUrl = match[1].replace(/&amp;/g, '&');
        console.log(`Processing ${originalUrl}...`);
        const base64Url = await imageToBase64(originalUrl);
        if (base64Url) {
            data = data.replace(match[0], match[0].replace(match[1], base64Url));
        }
    }

    // Replace placeholders with actual values (including default fallbacks)
    data = data.replace(/\{degF\|.*?\}/g, weather.degF);
    data = data.replace(/\{degC\|.*?\}/g, weather.degC);
    data = data.replace(/\{weatherEmoji\|.*?\}/g, weather.weatherEmoji);
    data = data.replace(/\{todayDay\|.*?\}/g, todayDay);
    data = data.replace(/\{dayBubbleWidth\|.*?\}/g, dayBubbleWidths[todayDay]);
    
    // Fallback: replace any remaining simple placeholders without defaults
    data = data.replace('{degF}', weather.degF);
    data = data.replace('{degC}', weather.degC);
    data = data.replace('{weatherEmoji}', weather.weatherEmoji);
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
