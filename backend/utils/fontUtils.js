const fs = require('fs');
const path = require('path');

// Load the Sinhala font
const SINHALA_FONT = fs.readFileSync(
  path.join(__dirname, '../assets/fonts/NotoSansSinhala-Regular.ttf')
);

// Function to check if text contains Sinhala characters
const containsSinhala = (text) => {
  return /[\u0D80-\u0DFF]/.test(text);
};

module.exports = {
  SINHALA_FONT,
  containsSinhala
};