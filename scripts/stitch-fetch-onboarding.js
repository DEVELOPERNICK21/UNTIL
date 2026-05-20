#!/usr/bin/env node
/**
 * Fetch a single Stitch screen (code + image) for Until Onboarding Experience.
 * Requires: gcloud auth + GOOGLE_CLOUD_PROJECT (or STITCH_ACCESS_TOKEN + GOOGLE_CLOUD_PROJECT)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PROJECT_ID = process.env.STITCH_PROJECT_ID || '9043125905380080859';
const SCREEN_ID = process.env.STITCH_SCREEN_ID || '14e43fa8a94f43f49d30ff6fce0627e5';
const SCREEN_NAME = process.env.STITCH_SCREEN_NAME || 'YourJourney';

const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'stitch-output', 'onboarding');
const codeDir = path.join(outDir, 'code');
const imagesDir = path.join(outDir, 'images');

function getAccessToken() {
  if (process.env.STITCH_ACCESS_TOKEN) return process.env.STITCH_ACCESS_TOKEN;
  const r = spawnSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Run: gcloud auth login');
  return r.stdout.trim();
}

function downloadUrl(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    lib
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          return downloadUrl(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', reject);
  });
}

async function resolveMcpSdk() {
  const { execSync } = require('child_process');
  const indexPath = execSync(
    'find /var/folders -path "*/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js" 2>/dev/null | head -1',
    { encoding: 'utf8' }
  ).trim();
  if (!indexPath) {
    throw new Error('MCP SDK not found. Run: npx @_davideast/stitch-mcp doctor');
  }
  const base = indexPath.replace(/\/dist\/esm\/client\/index\.js$/, '');
  const { Client } = await import(path.join(base, 'dist/esm/client/index.js'));
  const { StreamableHTTPClientTransport } = await import(
    path.join(base, 'dist/esm/client/streamableHttp.js')
  );
  return { Client, StreamableHTTPClientTransport };
}

async function mcpCallTool(name, args) {
  const { Client, StreamableHTTPClientTransport } = await resolveMcpSdk();

  const accessToken = getAccessToken();
  const gcpProject = process.env.GOOGLE_CLOUD_PROJECT || 'until-play-api';
  const transport = new StreamableHTTPClientTransport(
    new URL('https://stitch.googleapis.com/mcp'),
    {
      requestInit: {
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${accessToken}`,
          'X-Goog-User-Project': gcpProject,
        },
      },
    }
  );
  const client = new Client({ name: 'until-fetch', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 300000 });
  await transport.close();

  if (result.isError) {
    const text = (result.content || [])
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('');
    throw new Error(`Tool ${name} failed: ${text}`);
  }
  if (result.structuredContent) return result.structuredContent;
  const text = (result.content || []).find((c) => c.type === 'text');
  if (text?.text) {
    try {
      return JSON.parse(text.text);
    } catch {
      return text.text;
    }
  }
  return result;
}

async function fetchOneScreen(projectId, screenId, screenName) {
  console.log(`Fetching screen ${screenName} (${screenId}) from project ${projectId}...`);

  const screen = await mcpCallTool('get_screen', {
    projectId,
    screenId,
    name: `projects/${projectId}/screens/${screenId}`,
  });

  const htmlUrl = screen?.htmlCode?.downloadUrl;
  const imageUrl = screen?.screenshot?.downloadUrl;

  console.log('Screen title:', screen?.title || screen?.name || '(unknown)');
  if (htmlUrl) console.log('HTML URL:', htmlUrl);
  if (imageUrl) console.log('Image URL:', imageUrl);

  if (!htmlUrl && !imageUrl) {
    console.error('No download URLs in response. Keys:', Object.keys(screen || {}));
    return false;
  }

  if (htmlUrl) {
    const htmlPath = path.join(codeDir, `${screenName}.html`);
    await downloadUrl(htmlUrl, htmlPath);
    console.log(`  ✓ HTML saved to ${path.relative(projectRoot, htmlPath)}`);
  }

  if (imageUrl) {
    const imgPath = path.join(imagesDir, `${screenName}.png`);
    await downloadUrl(imageUrl, imgPath);
    console.log(`  ✓ Image saved to ${path.relative(projectRoot, imgPath)}`);
  }

  return true;
}

async function main() {
  fs.mkdirSync(codeDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });

  if (process.argv.includes('--list-projects')) {
    const projects = await mcpCallTool('list_projects', {});
    console.log(JSON.stringify(projects, null, 2));
    return;
  }

  if (process.argv.includes('--fetch-all')) {
    const manifest = require('./stitch-onboarding-screens.json');
    for (const screen of manifest.screens) {
      console.log(`\n--- ${screen.stitchTitle} ---`);
      await fetchOneScreen(manifest.projectId, screen.id, screen.name);
    }
    console.log('\nDone.');
    return;
  }

  const listProjectId = process.argv.find((a) => a.startsWith('--list-screens='))?.split('=')[1];
  if (listProjectId) {
    const screens = await mcpCallTool('list_screens', { projectId: listProjectId });
    for (const s of screens.screens || []) {
      console.log(s.screenId || s.name, '-', s.title || s.displayName || '');
    }
    return;
  }

  const ok = await fetchOneScreen(PROJECT_ID, SCREEN_ID, SCREEN_NAME);
  if (!ok) process.exit(1);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
