const fs = require('fs');
const js = fs.readFileSync('scratch/main.dart.js', 'utf8');

// Search for all event objects
const eventPosterRegex = /assets\/eventposters\/[a-zA-Z0-9_\-\.]+/g;
console.log('Event Posters:', [...new Set(js.match(eventPosterRegex))]);

// Search for event titles and descriptions
const lines = js.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('title') && line.includes('description') && line.includes('date')) {
    console.log(`Line ${idx+1}:`, line);
  }
});
