const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist')) {
      search(filePath);
    } else if (stat.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html') || filePath.endsWith('.json'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('TrueHire') || content.includes('truehire')) {
        console.log(`Found in: ${filePath}`);
      }
    }
  });
}

search('./');
