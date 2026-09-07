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
  
  content = content.replace(/bg-indigo-50/g, 'bg-indigo-100 border border-indigo-300');
  content = content.replace(/text-indigo-600/g, 'text-indigo-800');
  
  content = content.replace(/bg-emerald-50/g, 'bg-emerald-100 border border-emerald-300');
  content = content.replace(/text-emerald-600/g, 'text-emerald-800');
  
  // Make buttons slightly more tactile
  content = content.replace(/px-3 py-1 rounded/g, 'px-4 py-2 rounded-md font-bold shadow-sm hover:shadow');
  
  fs.writeFileSync(file, content);
});

console.log("Secondary Colors and Buttons Refactored");
