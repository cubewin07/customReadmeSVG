#!/usr/bin/env node

/**
 * Standalone Generator Script for Looping Animated Fox Banner
 * Usage:
 *   node scripts/generate-banner.js [--user=USERNAME] [--out=PATH] [--token=TOKEN]
 *
 * Designed to run in scheduled GitHub Actions workflows or locally.
 * Fetches live repo data from GitHub GraphQL API, renders pure SMIL SVG,
 * and outputs banner.svg and dist/banner.svg.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import bannerCard from '../src/cards/banner/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse CLI flags (--user=xyz, --out=path, --token=xyz)
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, ...valParts] = arg.slice(2).split('=');
      flags[key] = valParts.join('=') || true;
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs();

  // Resolve target username
  const username =
    flags.user ||
    process.env.TARGET_USER ||
    process.env.GITHUB_REPOSITORY_OWNER ||
    'cubewin07';

  // Resolve GitHub token
  const token =
    flags.token ||
    process.env.GITHUB_TOKEN ||
    process.env.VITE_GITHUB_TOKEN ||
    '';

  console.log(`[Banner Generator] Fetching live repositories for user: "${username}"...`);

  try {
    const data = await bannerCard.fetchData(username, { token });
    console.log(`[Banner Generator] Retrieved ${data.repos?.length || 0} repositories:`);
    for (const repo of data.repos || []) {
      console.log(`  - ${repo.name} (★ ${repo.stargazerCount}, ${repo.primaryLanguage?.name || 'Unknown'})`);
    }

    const svg = bannerCard.renderSvg(data, null, { username });

    // Output target files
    const targets = [];
    if (flags.out) {
      targets.push(path.resolve(projectRoot, flags.out));
    } else {
      // Default: write root banner.svg and dist/banner.svg (if dist exists or create it)
      targets.push(path.resolve(projectRoot, 'banner.svg'));
      const distDir = path.resolve(projectRoot, 'dist');
      if (fs.existsSync(distDir)) {
        targets.push(path.resolve(distDir, 'banner.svg'));
      }
    }

    for (const targetPath of targets) {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, svg, 'utf8');
      const stat = fs.statSync(targetPath);
      console.log(`[Banner Generator] Wrote ${stat.size} bytes to ${path.relative(projectRoot, targetPath)}`);
    }

    console.log('[Banner Generator] Successfully generated animated SVG banner!');
  } catch (err) {
    console.error(`[Banner Generator] Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main();
