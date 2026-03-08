const fs = require('node:fs');
const path = require('node:path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

const srcDocs = path.join(process.cwd(), 'src', 'docs');
const destDocs = path.join(process.cwd(), 'dist', 'docs');
copyDir(srcDocs, destDocs);

