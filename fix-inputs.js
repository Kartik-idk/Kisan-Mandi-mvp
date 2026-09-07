const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Make inputs bolder and placeholders readable
  content = content.replace(/className="(.*?)(border-gray-300)(.*?)"/g, (match, p1, p2, p3) => {
    if (match.includes('<input') || match.includes('<select')) {
      return `className="${p1}border-gray-400 text-gray-900 placeholder-gray-500 focus:border-green-600 focus:ring-green-600${p3}"`;
    }
    return match;
  });
  
  fs.writeFileSync(file, content);
});
console.log("Input Refactor Complete");
