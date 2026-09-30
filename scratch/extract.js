const fs = require('fs');
const path = require('path');

async function extractContent() {
  if (!fs.existsSync('scratch')) {
    fs.mkdirSync('scratch', { recursive: true });
  }

  console.log('Fetching main.dart.js...');
  const res = await fetch('https://iedcwebsite.web.app/main.dart.js');
  const text = await res.text();
  console.log('Downloaded main.dart.js, size:', (text.length / 1024 / 1024).toFixed(2), 'MB');
  
  fs.writeFileSync('scratch/main.dart.js', text);

  // Search for interesting text blocks, URLs, emails, phone numbers, team names, events
  const lines = text.split('\n');
  console.log('Total lines in main.dart.js:', lines.length);

  // Regex to find printable strings
  const stringRegex = /"([^"\r\n]{4,150})"/g;
  let matches = new Set();
  let m;
  while ((m = stringRegex.exec(text)) !== null) {
    const s = m[1];
    if (s && /[A-Z][a-z]+/.test(s) && !s.includes('Object.') && !s.includes('prototype')) {
      matches.add(s);
    }
  }

  const resultList = Array.from(matches);
  console.log('Total matches found:', resultList.length);

  // Filter for potential UI text, titles, headings, sections, descriptions
  const uiTexts = resultList.filter(s => 
    s.includes('IEDC') || 
    s.includes('BMCE') || 
    s.includes('Innovation') || 
    s.includes('Entrepreneurship') ||
    s.includes('Executive') ||
    s.includes('Committee') ||
    s.includes('Nodal') ||
    s.includes('Officer') ||
    s.includes('Lead') ||
    s.includes('Event') ||
    s.includes('Workshop') ||
    s.includes('Vision') ||
    s.includes('Mission') ||
    s.includes('Gallery') ||
    s.includes('Contact') ||
    s.includes('About') ||
    s.includes('Baselios') ||
    s.includes('Sasthamcotta') ||
    s.includes('Kollam') ||
    s.includes('@') ||
    s.includes('+91')
  );

  console.log('=== Filtered UI Texts ===');
  console.log(uiTexts);

  // Save all matches to a scratch log
  fs.writeFileSync('scratch/extracted_strings.json', JSON.stringify(resultList, null, 2));
}

extractContent().catch(err => console.error(err));
