const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/extracted_strings.json', 'utf8'));

// Filter out code symbols / internal flutter strings
const cleanStrings = data.filter(s => {
  if (s.length < 3) return false;
  if (s.includes('http://') || s.includes('https://')) return true;
  if (s.startsWith('dart:') || s.startsWith('package:') || s.startsWith('Symbol(')) return false;
  if (/^[a-z0-9_\-\.\$]+$/i.test(s) && !s.includes(' ') && !s.includes('@')) return false;
  return true;
});

fs.writeFileSync('scratch/clean_strings.txt', cleanStrings.join('\n'));
console.log('Clean strings written to scratch/clean_strings.txt, count:', cleanStrings.length);
