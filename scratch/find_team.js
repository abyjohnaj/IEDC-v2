const fs = require('fs');
const js = fs.readFileSync('scratch/main.dart.js', 'utf8');

// Find all student leads / nodal officers / team members constructed in code
const lines = js.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Student Lead') || line.includes('Operations Lead') || line.includes('Nodal Officer') || line.includes('Co-ordinator') || line.includes('Lead')) {
    if (line.length < 500) {
      console.log(`Line ${idx+1}:`, line);
    } else {
      // Find matches in long lines
      const parts = line.match(/(.{0,40}(?:Lead|Officer|Officer|Co-ordinator).{0,60})/g) || [];
      parts.forEach(p => console.log('Snippet:', p));
    }
  }
});
