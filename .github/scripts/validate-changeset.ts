import { readdirSync, readFileSync } from 'node:fs';

const allowed: Set<string> = new Set(['@next/extension']);
const invalid: string[] = [];

for (const file of readdirSync('.changeset')) {
  if (!file.endsWith('.md') || file === 'README.md') continue;

  const content: string = readFileSync(`.changeset/${file}`, 'utf8');
  const match: RegExpMatchArray | null = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    invalid.push(`${file} (no frontmatter)`);
    continue;
  }

  for (const line of match[1].split('\n')) {
    const rawKey: string = line.split(':')[0].trim();
    if (!rawKey) continue;
    const key: string = rawKey.replace(/^["']|["']$/g, '');
    if (!allowed.has(key)) {
      invalid.push(`${file} (touches disallowed package ${key})`);
    }
  }
}

if (invalid.length > 0) {
  console.error('Invalid changesets:\n  - ' + invalid.join('\n  - '));
  console.error('\nOnly @next/extension is auto-released.');
  process.exit(1);
}

console.log('All changesets valid.');
