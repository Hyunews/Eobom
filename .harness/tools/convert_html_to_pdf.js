const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Target HTML file
const htmlCandidate1 = path.resolve(__dirname, '../../reports/00_핵심플랫폼/00-14_이어봄_사장님_논의_안건_정리.html');
const htmlCandidate2 = path.resolve(__dirname, '../../reports/00_핵심플랫폼/00-14_이어봄_대표_사장님_논의_안건_정리.html');
const htmlPath = fs.existsSync(htmlCandidate1) ? htmlCandidate1 : htmlCandidate2;
const pdfPath = path.resolve(__dirname, '../../reports/00_핵심플랫폼/00-14_이어봄_대표_사장님_논의_안건_정리.pdf');

console.log(`Converting HTML to PDF:`);
console.log(`Input: ${htmlPath}`);
console.log(`Output: ${pdfPath}`);

// Browser executable paths
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let browserExe = null;
if (fs.existsSync(edgePath)) {
  browserExe = edgePath;
} else if (fs.existsSync(chromePath)) {
  browserExe = chromePath;
} else {
  console.error('Neither Edge nor Chrome executable was found.');
  process.exit(1);
}

// Ensure output directory exists
const outDir = path.dirname(pdfPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Convert HTML file URL
const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

// Run browser print-to-pdf command
const cmd = `"${browserExe}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" "${fileUrl}"`;

try {
  console.log(`Executing: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
  
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`Successfully generated PDF! File size: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('PDF file was not created.');
  }
} catch (err) {
  console.error('Error generating PDF:', err.message);
}
