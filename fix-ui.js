const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
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
  
  // Text Contrast
  content = content.replace(/text-gray-400/g, 'text-gray-600');
  content = content.replace(/text-gray-500/g, 'text-gray-700');
  content = content.replace(/text-gray-600/g, 'text-gray-800');
  
  // Status Badges - Make them more legible with borders
  // Green
  content = content.replace(/bg-green-50/g, 'bg-green-100 border border-green-300');
  content = content.replace(/text-green-600/g, 'text-green-800');
  // Amber
  content = content.replace(/bg-amber-50/g, 'bg-amber-100 border border-amber-300');
  content = content.replace(/text-amber-600/g, 'text-amber-900');
  // Blue
  content = content.replace(/bg-blue-50/g, 'bg-blue-100 border border-blue-300');
  content = content.replace(/text-blue-600/g, 'text-blue-800');
  // Red
  content = content.replace(/bg-red-50/g, 'bg-red-100 border border-red-300');
  content = content.replace(/text-red-600/g, 'text-red-800');
  
  // Make borders slightly more visible
  content = content.replace(/border-gray-50/g, 'border-gray-200');
  content = content.replace(/border-gray-100/g, 'border-gray-300');
  
  fs.writeFileSync(file, content);
});

console.log("UI Refactor Complete");
