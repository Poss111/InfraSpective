import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const targets = process.env.INFRASPECTIVE_PKG_TARGETS || 'node20-macos-arm64,node20-linux-x64,node20-win-x64';
const cachePath = resolve(process.env.PKG_CACHE_PATH || '.pkg-cache');
const outPath = resolve(process.env.INFRASPECTIVE_RELEASE_DIR || 'release');
const pkgBin = resolve('node_modules/.bin/pkg');

mkdirSync(cachePath, { recursive: true });
mkdirSync(outPath, { recursive: true });

const result = spawnSync(
  pkgBin,
  ['dist/pkg/infraspective.cjs', '--targets', targets, '--out-path', outPath],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PKG_CACHE_PATH: cachePath,
    },
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);
