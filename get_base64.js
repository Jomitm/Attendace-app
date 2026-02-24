const fs = require('fs');
const path = 'D:/CRWI ONLINE RECIPT/assets/crwi-logo.png';
const buffer = fs.readFileSync(path);
const base64 = buffer.toString('base64');
console.log('data:image/png;base64,' + base64);
