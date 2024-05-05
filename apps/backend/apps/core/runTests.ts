import { dirname, resolve } from 'node:path';
// @ts-expect-error missing types
import { glob, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { run } from 'node:test';
import { spec as Spec } from 'node:test/reporters';
// TODO: add coverage

const spec = new Spec();
const isCI = !!process.env.CI;
const [watch, parallel] = process.argv.slice(2);
const defaultTimeout = isCI ? 30_000 : 60_000;

const files: string[] = [];
for await (const testFile of glob('tests/**/*.spec.ts')) {
  files.push(testFile as string);
}

if (!parallel) {
  // If not parallel, we create a temporary file that imports all the test files
  // so that it all runs in a single process.
  const tmpTestFile = resolve('./tmp/tests.ts');
  await mkdir(dirname(tmpTestFile), { recursive: true });
  await writeFile(
    tmpTestFile,
    files
      .map((f) => `import ${JSON.stringify(pathToFileURL(f).toString())};`)
      .join('\n'),
  );

  files.length = 0;
  files.push(tmpTestFile);
}

run({
  files,
  timeout: defaultTimeout,
  concurrency: !!parallel,
  watch: !!watch,
})
  .on('test:fail', () => {
    // For some reason, a test fail using the JS API does not set an exit code of 1,
    // so we set it here manually
    process.exitCode = 1;
  })
  .pipe(spec)
  .pipe(process.stdout);
