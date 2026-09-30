const fs = require('fs');
const js = fs.readFileSync('scratch/main.dart.js', 'utf8');

// Find gallery images
const galleryMatches = js.match(/assets\/[a-zA-Z0-9_\-\.\/]+(?:jpg|jpeg|png|webp|mp4)/gi) || [];
console.log('All Image/Video Assets:', [...new Set(galleryMatches)]);
