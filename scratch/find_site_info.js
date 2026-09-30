const fs = require('fs');
const js = fs.readFileSync('scratch/main.dart.js', 'utf8');

// Find asset image paths, URLs, team members, about text, vision/mission
const assetMatches = js.match(/assets\/[a-zA-Z0-9_\-\.\/]+/g) || [];
console.log('Unique Assets:', [...new Set(assetMatches)]);

// Find all URLs
const urlMatches = js.match(/https?:\/\/[^\s"']+/g) || [];
console.log('Unique URLs:', [...new Set(urlMatches)]);

// Find text patterns around IEDC
const textBlocks = [];
const lines = js.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('IEDC') || line.includes('BMCE') || line.includes('Nodal') || line.includes('Executive') || line.includes('Eureka') || line.includes('Innovat')) {
    textBlocks.push(`Line ${idx+1}: ${line.slice(0, 300)}`);
  }
});

fs.writeFileSync('scratch/iedc_lines.txt', textBlocks.join('\n'));
console.log('Wrote iedc_lines.txt, line count:', textBlocks.length);
