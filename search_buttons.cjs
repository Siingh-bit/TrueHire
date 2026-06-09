const fs = require('fs');
const path = require('path');

const patterns = [
  /onClick=\{[^{]*\{\}\}/,
  /onClick=\{[^{]*alert/,
  /onClick=\{[^{]*console\.log/,
  /to=\"#\"/,
  /href=\"#\"/,
  /TODO:/
];

function search(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      search(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        patterns.forEach(p => {
          if (p.test(line)) {
            console.log(`${filePath}:${i + 1}: ${line.trim()}`);
          }
        });
      });
    }
  });
}

search('./src');
