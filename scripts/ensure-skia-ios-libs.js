#!/usr/bin/env node
/**
 * Copies Skia xcframeworks into @shopify/react-native-skia/libs/{ios,macos}
 * (same logic as react-native-skia.podspec prepare_command).
 * Run from repo root after yarn install if pod prepare did not populate libs/.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const skiaRoot = path.dirname(
  require.resolve('@shopify/react-native-skia/package.json'),
);
process.chdir(skiaRoot);

const iosLibs = 'libs/ios';
const macosLibs = 'libs/macos';

const hasIos =
  fs.existsSync(iosLibs) &&
  fs.readdirSync(iosLibs).some(f => f.endsWith('.xcframework'));
const hasMacos =
  fs.existsSync(macosLibs) &&
  fs.readdirSync(macosLibs).some(f => f.endsWith('.xcframework'));

if (hasIos && hasMacos) {
  console.log('[ensure-skia-ios-libs] Skia libs already present.');
  process.exit(0);
}

const useGraphite =
  process.env.SK_GRAPHITE === '1' ||
  String(process.env.SK_GRAPHITE || '').toLowerCase() === 'true';
const prefix = useGraphite ? 'react-native-skia-graphite' : 'react-native-skia';

let iosPackage;
let macosPackage;
try {
  iosPackage = path.dirname(
    require.resolve(`${prefix}-apple-ios/package.json`),
  );
  macosPackage = path.dirname(
    require.resolve(`${prefix}-apple-macos/package.json`),
  );
} catch (e) {
  console.error(
    `[ensure-skia-ios-libs] Missing ${prefix}-apple-ios or ${prefix}-apple-macos. Run yarn install from the project root.`,
  );
  process.exit(1);
}

const iosXcf = path.join(iosPackage, 'libs');
if (
  !fs.existsSync(iosXcf) ||
  !fs.readdirSync(iosXcf).some(f => f.endsWith('.xcframework'))
) {
  console.error(
    `[ensure-skia-ios-libs] No xcframeworks in ${prefix}-apple-ios.`,
  );
  process.exit(1);
}

console.log('[ensure-skia-ios-libs] Copying Skia xcframeworks...');
execSync('rm -rf libs/ios libs/macos libs/tvos', { stdio: 'inherit' });
execSync('mkdir -p libs/ios libs/macos', { stdio: 'inherit' });
execSync(`cp -R "${iosPackage}/libs/"*.xcframework libs/ios/`, {
  stdio: 'inherit',
});
execSync(`cp -R "${macosPackage}/libs/"*.xcframework libs/macos/`, {
  stdio: 'inherit',
});

if (!useGraphite) {
  try {
    const tvosPackage = path.dirname(
      require.resolve(`${prefix}-apple-tvos/package.json`),
    );
    execSync('mkdir -p libs/tvos', { stdio: 'inherit' });
    execSync(`cp -R "${tvosPackage}/libs/"*.xcframework libs/tvos/`, {
      stdio: 'inherit',
    });
  } catch {
    console.log('[ensure-skia-ios-libs] tvOS package not found, skipping.');
  }
}

console.log('[ensure-skia-ios-libs] Done.');
