const fs = require('fs');
const path = 'D:/CRWI ONLINE RECIPT/assets/crwi-logo.png';
const buffer = fs.readFileSync(path);
const base64 = 'data:image/png;base64,' + buffer.toString('base64');
fs.writeFileSync('logo_base64.txt', base64);
console.log('Base64 saved to logo_base64.txt');
