#!/usr/bin/env node
/**
 * Fetch Stitch project screens (images + HTML code) for UNTIL
 * Run: node scripts/stitch-fetch.js
 * Prerequisites: npx @_davideast/stitch-mcp init (one-time auth)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = '1707733117784992041';
const SCREENS = [
  { id: '2ad5e8a97377474baa3f1bcbec4aba42', name: 'CountdownTimers' },
  { id: '2b5cba9aff6b4a01ac1ac022d33c9b9e', name: 'HourCalculation' },
  { id: '307e23b60a9549769100aa1930168a38', name: 'HomeTimeProgress' },
  { id: '7972a8c5b83c4c3e9b9a8612e29cc2dc', name: 'Settings' },
  { id: '8b737491c2024314afc5a978e616027e', name: 'CustomCounters' },
  { id: 'ac6960cce00d49eb8bb14d2f422e3088', name: 'LifeVisualization' },
  { id: 'bf4a7cd0b0e14670b3fd0a4903d7b8f1', name: 'MonthlyGoals' },
  { id: 'e474da70-094e-4231-a619-b4c5aa52cc5b', name: 'Screenshot' },
];

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'stitch-output');
const codeDir = path.join(outputDir, 'code');
const imagesDir = path.join(outputDir, 'images');

fs.mkdirSync(codeDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

function runTool(toolName, args) {
  const input = JSON.stringify(args);
  try {
    const r = spawnSync('npx', ['@_davideast/stitch-mcp', 'tool', toolName, '-d', input], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return r.status === 0 ? r.stdout : null;
  } catch (e) {
    return null;
  }
}

console.log(`Fetching Stitch screens for project ${PROJECT_ID}...`);
console.log(`Output: ${outputDir}\n`);

for (const screen of SCREENS) {
  console.log(`--- ${screen.name} (${screen.id}) ---`);

  // Fetch code
  const codeResult = runTool('get_screen_code', {
    projectId: PROJECT_ID,
    screenId: screen.id,
  });
  if (codeResult) {
    const html = typeof codeResult === 'object' && codeResult.content ? codeResult.content : codeResult;
    fs.writeFileSync(path.join(codeDir, `${screen.name}.html`), html, 'utf8');
    console.log(`  ✓ Code saved to code/${screen.name}.html`);
  } else {
    console.log('  ✗ Failed to fetch code (run: npx @_davideast/stitch-mcp init)');
  }

  // Fetch image
  const imgResult = runTool('get_screen_image', {
    projectId: PROJECT_ID,
    screenId: screen.id,
  });
  if (imgResult && imgResult.trim()) {
    let base64 = imgResult.trim();
    try {
      // Handle JSON response: {"content":"base64..."} or {"base64":"..."}
      if (base64.startsWith('{')) {
        const j = JSON.parse(base64);
        base64 = j.content || j.base64 || j.data || j.image || '';
      }
      base64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      if (buf.length > 0) {
        fs.writeFileSync(path.join(imagesDir, `${screen.name}.png`), buf);
        console.log(`  ✓ Image saved to images/${screen.name}.png`);
      } else {
        console.log('  ✗ Image empty');
      }
    } catch (e) {
      console.log('  ✗ Image decode failed:', e.message);
    }
  } else {
    console.log('  ✗ Failed to fetch image');
  }
  console.log('');
}

console.log('Done. Check stitch-output/');
