// Entry hand-in program for the makefun-frontend-01 bounty (Node, standard library only).
// The frontend itself lives in app/ as plain static files with no build step. This program
// publishes it: it mirrors app/ and screenshots/ into the output directory and asks the
// vendored make.fun library to summarise them into dossier.json, the document the judge
// reads. The vendor file must stay untouched — the scorer rebuilds the dossier with its
// own copy and compares byte for byte.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory defaults to /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's gate: dossier text budget, at most 3 screenshots of at most
// 256 KiB each, and app/ held to 993 entries and 16 MiB so /output stays inside its own
// 1,000-entry cap once screenshots/ and dossier.json are counted.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
