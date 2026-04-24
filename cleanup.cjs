const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace wobbly and tangled classes
  content = content.replace(/tangled-border/g, 'rounded-2xl');
  content = content.replace(/tangled-img/g, 'rounded-2xl');
  content = content.replace(/tangled-btn/g, 'rounded-full');
  
  // Remove extreme borders
  content = content.replace(/border-\[3px\]/g, 'border');
  content = content.replace(/border-\[4px\]/g, 'border');
  content = content.replace(/border-transparent/g, '');
  content = content.replace(/border-theme-border/g, 'border-gray-100');
  
  // Remove rotations and weird transforms
  content = content.replace(/transform/g, '');
  content = content.replace(/hover:-rotate-\d+/g, '');
  content = content.replace(/hover:rotate-\[\d+deg\]/g, '');
  content = content.replace(/hover:rotate-\d+/g, '');
  content = content.replace(/rotate-\[-\d+deg\]/g, '');
  content = content.replace(/-rotate-\d+/g, '');
  content = content.replace(/rotate-\d+/g, '');
  content = content.replace(/origin-\w+(-\w+)?/g, '');
  
  // Replace heavy font blacks with something more elegant
  content = content.replace(/font-black/g, 'font-medium');
  content = content.replace(/font-bold/g, 'font-normal');
  
  // Clean up multiple spaces
  content = content.replace(/ +/g, ' ');

  fs.writeFileSync(file, content);
});

console.log('Cleanup complete.');
