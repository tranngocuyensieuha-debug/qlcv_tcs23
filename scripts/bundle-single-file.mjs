import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const htmlPath = join(distDir, 'index.html');
if (!existsSync(htmlPath)) {
  console.error("HTML file not found in dist/. Please run npm run build first.");
  process.exit(1);
}

let html = readFileSync(htmlPath, 'utf8');

// Inline CSS
// Find link tags like: <link rel="stylesheet" crossorigin href="/assets/index-DJc5ZJWu.css"> or similar
const cssRegex = /<link\s+rel="stylesheet"[^>]*href="\/assets\/([^"]+)"[^>]*>/g;
html = html.replace(cssRegex, (match, filename) => {
  const cssPath = join(distDir, 'assets', filename);
  if (existsSync(cssPath)) {
    const cssContent = readFileSync(cssPath, 'utf8');
    return `<style>${cssContent}</style>`;
  }
  return match;
});

// Inline JS
// Find script tags like: <script type="module" crossorigin src="/assets/index-CxfrbsK7.js"></script>
const jsRegex = /<script\s+type="module"[^>]*src="\/assets\/([^"]+)"[^>]*><\/script>/g;
html = html.replace(jsRegex, (match, filename) => {
  const jsPath = join(distDir, 'assets', filename);
  if (existsSync(jsPath)) {
    const jsContent = readFileSync(jsPath, 'utf8');
    return `<script type="module">${jsContent}</script>`;
  }
  return match;
});

// Save to dist/Demo_website_quan_ly_cong_viec_TCS23_25082026.html
const targetPath = join(distDir, 'Demo_website_quan_ly_cong_viec_TCS23_25082026.html');
writeFileSync(targetPath, html, 'utf8');
console.log(`Successfully generated single HTML file at: dist/Demo_website_quan_ly_cong_viec_TCS23_25082026.html`);
