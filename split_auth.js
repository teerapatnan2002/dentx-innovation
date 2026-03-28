const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

const startIdx = lines.findIndex(l => l.includes('// --- AUTHENTICATION FUNCTIONS ---'));
const endIdx = lines.findIndex(l => l.includes('// --- AUTO-DELETE EXPIRED PENDING PAYMENTS ---'));

if (startIdx !== -1 && endIdx !== -1) {
    const authCode = lines.slice(startIdx, endIdx).join('\n');
    fs.writeFileSync('js/auth.js', authCode);
    
    // Replace the block in HTML
    lines.splice(startIdx, endIdx - startIdx, '        <script src="js/auth.js"></script>');
    fs.writeFileSync('index.html', lines.join('\n'));
    console.log(`Successfully extracted ${endIdx - startIdx} lines to js/auth.js`);
} else {
    console.log("Could not find delimiters", startIdx, endIdx);
}
